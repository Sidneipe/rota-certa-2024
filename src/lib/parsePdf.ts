import { Delivery } from '@/types/delivery';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

interface TextItem {
  text: string;
  x: number;
  y: number;
}

// Header aliases for column detection
const HEADER_ALIASES: Record<string, string[]> = {
  order: ['n.º', 'nº', 'n°', 'seq', 'ordem'],
  trackingCode: ['id do pacote', 'id', 'cliente', 'codigo', 'código', 'rastreio', 'tracking'],
  address: ['endereço', 'endereco', 'rua', 'logradouro'],
  number: ['n.º', 'nº', 'numero', 'número'],  // second occurrence after address
  complement: ['complemento', 'comp'],
  neighborhood: ['bairro', 'neighborhood', 'district'],
  city: ['cidade', 'city', 'municipio', 'município'],
  zipCode: ['cep', 'zip', 'codigo postal'],
  addressType: ['tipo de endereço', 'tipo', 'assinatura'],
};

/**
 * Parse a PDF file and extract delivery data using position-based column detection.
 */
export async function parsePdf(data: ArrayBuffer): Promise<Delivery[]> {
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const allDeliveries: Delivery[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Extract all text items with positions
    const textItems: TextItem[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !(item as any).str.trim()) continue;
      textItems.push({
        text: (item as any).str.trim(),
        x: (item as any).transform[4],
        y: Math.round((item as any).transform[5]),
      });
    }

    // Group by Y position to form rows
    const rowMap = new Map<number, TextItem[]>();
    for (const item of textItems) {
      // Group items within 3px of Y as same row
      let foundY: number | null = null;
      for (const existingY of rowMap.keys()) {
        if (Math.abs(existingY - item.y) <= 3) {
          foundY = existingY;
          break;
        }
      }
      const key = foundY ?? item.y;
      if (!rowMap.has(key)) rowMap.set(key, []);
      rowMap.get(key)!.push(item);
    }

    // Sort rows by Y descending (PDF coords: top = higher Y)
    const sortedRows = [...rowMap.entries()]
      .sort(([a], [b]) => b - a)
      .map(([, items]) => items.sort((a, b) => a.x - b.x));

    // Find header row containing "Bairro" and "Cidade" and "CEP"
    const headerRowIdx = sortedRows.findIndex(row => {
      const combined = row.map(r => r.text.toLowerCase()).join(' ');
      return combined.includes('bairro') && combined.includes('cidade') && combined.includes('cep');
    });

    if (headerRowIdx === -1) continue;

    const headerRow = sortedRows[headerRowIdx];

    // Build column boundaries from header positions
    const columns = detectColumns(headerRow, sortedRows, headerRowIdx);
    if (!columns) continue;

    // Parse data rows after header
    const dataRows = sortedRows.slice(headerRowIdx + 1);
    const pageDeliveries = parseDataRows(dataRows, columns);
    allDeliveries.push(...pageDeliveries);
  }

  // Deduplicate by trackingCode
  const seen = new Set<string>();
  const unique: Delivery[] = [];
  for (const d of allDeliveries) {
    const key = d.trackingCode || d.id;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(d);
    }
  }

  return unique;
}

interface ColumnBounds {
  field: string;
  xStart: number;
  xEnd: number;
}

function detectColumns(headerRow: TextItem[], allRows: TextItem[][], headerRowIdx: number): ColumnBounds[] | null {
  // Also check the row above header for merged headers like "ID do pacote"
  const prevRow = headerRowIdx > 0 ? allRows[headerRowIdx - 1] : [];
  const prevTexts = prevRow.map(r => ({ text: r.text.toLowerCase(), x: r.x }));

  // Identify each header item
  interface HeaderCandidate {
    field: string;
    x: number;
    text: string;
  }

  const candidates: HeaderCandidate[] = [];
  let foundFirstNum = false;

  for (const item of headerRow) {
    const lower = item.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (!foundFirstNum && matchesAny(lower, ['n.', 'n°', 'nº', 'seq'])) {
      candidates.push({ field: 'order', x: item.x, text: item.text });
      foundFirstNum = true;
      continue;
    }

    if (matchesAny(lower, ['cliente'])) {
      candidates.push({ field: 'trackingCode', x: item.x, text: item.text });
      continue;
    }

    if (matchesAny(lower, ['endereco', 'rua', 'logradouro'])) {
      candidates.push({ field: 'address', x: item.x, text: item.text });
      continue;
    }

    // Second N.º after address = number column
    if (foundFirstNum && candidates.some(c => c.field === 'address') && matchesAny(lower, ['n.', 'n°', 'nº'])) {
      candidates.push({ field: 'number', x: item.x, text: item.text });
      continue;
    }

    if (matchesAny(lower, ['complemento', 'comp'])) {
      candidates.push({ field: 'complement', x: item.x, text: item.text });
      continue;
    }

    if (matchesAny(lower, ['bairro'])) {
      candidates.push({ field: 'neighborhood', x: item.x, text: item.text });
      continue;
    }

    if (matchesAny(lower, ['cidade', 'municipio'])) {
      candidates.push({ field: 'city', x: item.x, text: item.text });
      continue;
    }

    if (matchesAny(lower, ['cep', 'zip'])) {
      candidates.push({ field: 'zipCode', x: item.x, text: item.text });
      continue;
    }

    if (matchesAny(lower, ['assinatura', 'tipo'])) {
      candidates.push({ field: 'addressType', x: item.x, text: item.text });
      continue;
    }
  }

  // Check previous row for "ID do" which maps to trackingCode
  for (const pt of prevTexts) {
    if (pt.text.includes('id do') || pt.text.includes('id')) {
      // Find the closest candidate and update to trackingCode if it's near the same X
      if (!candidates.some(c => c.field === 'trackingCode')) {
        candidates.push({ field: 'trackingCode', x: pt.x, text: pt.text });
      }
    }
  }

  if (candidates.length < 3) return null;

  // Sort by X position
  candidates.sort((a, b) => a.x - b.x);

  // Create column bounds
  const columns: ColumnBounds[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const xStart = candidates[i].x - 5;
    const xEnd = i < candidates.length - 1 ? candidates[i + 1].x - 5 : 9999;
    columns.push({ field: candidates[i].field, xStart, xEnd });
  }

  return columns;
}

function matchesAny(text: string, patterns: string[]): boolean {
  return patterns.some(p => text.includes(p));
}

function parseDataRows(rows: TextItem[][], columns: ColumnBounds[]): Delivery[] {
  const deliveries: Delivery[] = [];

  // We need to detect delivery boundaries. Each delivery starts with an order number (e.g. "1A", "2A")
  // and may span multiple rows (address continuation, reference lines)
  const orderPattern = /^\d+[A-Z]?$/i;
  
  // Group rows into delivery blocks
  const blocks: TextItem[][] = [];
  let currentBlock: TextItem[] = [];

  for (const row of rows) {
    // Check if this row starts a new delivery (has an order number in the first column area)
    const orderCol = columns.find(c => c.field === 'order');
    const isNewDelivery = orderCol && row.some(item => 
      item.x >= orderCol.xStart && item.x < orderCol.xEnd && orderPattern.test(item.text)
    );

    // Skip page headers/footers
    const rowText = row.map(r => r.text).join(' ').toLowerCase();
    if (rowText.includes('folha') && rowText.includes('de')) continue;
    if (rowText.includes('rota') && rowText.includes('nº')) continue;
    if (rowText.includes('roteiro')) continue;
    if (rowText.includes('service center')) continue;
    if (rowText.includes('motorista:')) continue;
    if (rowText.includes('transportadora:')) continue;
    if (rowText.includes('placa:')) continue;
    if (rowText.includes('n.º') && rowText.includes('cliente') && rowText.includes('bairro')) continue;
    if (rowText.includes('pacote') && rowText.includes('endereço')) continue;

    if (isNewDelivery) {
      if (currentBlock.length > 0) {
        blocks.push([...currentBlock]);
      }
      currentBlock = [...row];
    } else {
      currentBlock.push(...row);
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);

  // Parse each block into a delivery
  for (const block of blocks) {
    const fieldValues: Record<string, string> = {};

    for (const col of columns) {
      const items = block.filter(item => item.x >= col.xStart && item.x < col.xEnd);
      if (items.length > 0) {
        // Sort by Y descending (higher Y = earlier in reading order for PDF)
        // Then join texts
        const sorted = items.sort((a, b) => b.y - a.y);
        fieldValues[col.field] = sorted.map(i => i.text).join(' ').trim();
      }
    }

    const address = fieldValues['address'] || '';
    const neighborhood = fieldValues['neighborhood'] || '';
    const city = fieldValues['city'] || '';
    const trackingCode = fieldValues['trackingCode'] || '';

    // Skip empty entries
    if (!address && !neighborhood && !city) continue;

    // Clean up complement - remove "Referencia:" prefix content that leaked
    let complement = fieldValues['complement'] || '';
    const refIdx = complement.toLowerCase().indexOf('referencia:');
    let notes = '';
    if (refIdx !== -1) {
      notes = complement.substring(refIdx).trim();
      complement = complement.substring(0, refIdx).trim();
    }

    deliveries.push({
      id: crypto.randomUUID(),
      trackingCode: trackingCode.replace(/\s+/g, ''),
      recipientName: 'Sem nome',
      address: cleanAddress(address),
      number: fieldValues['number'] || '',
      complement,
      neighborhood: neighborhood || 'Sem bairro',
      city: city || 'Sem cidade',
      state: '',
      zipCode: formatCep(fieldValues['zipCode'] || ''),
      status: 'pending',
      notes: notes || undefined,
    });
  }

  return deliveries;
}

function cleanAddress(addr: string): string {
  // Remove "Referencia:" sections that may have leaked into address
  const refIdx = addr.toLowerCase().indexOf('referencia:');
  if (refIdx !== -1) {
    return addr.substring(0, refIdx).trim();
  }
  return addr.trim();
}

function formatCep(cep: string): string {
  const digits = cep.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return cep;
}
