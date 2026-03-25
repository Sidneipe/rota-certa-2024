import * as XLSX from 'xlsx';
import { Delivery } from '@/types/delivery';

// Common column name mappings for Mercado Livre spreadsheets
const COLUMN_MAP: Record<string, string[]> = {
  trackingCode: ['codigo', 'código', 'tracking', 'rastreio', 'cod', 'id do envio', 'id_envio', 'shipment', 'id', 'nº', 'numero', 'número', 'pacote', 'package', 'id do pacote', 'id pacote'],
  recipientName: ['destinatario', 'destinatário', 'nome', 'name', 'comprador', 'receiver', 'cliente', 'destinatario nome', 'cliente nome', 'cliente', 'nome do cliente'],
  address: ['endereco', 'endereço', 'rua', 'logradouro', 'street', 'address', 'end'],
  // CORRIGIDO: "N.º2" vem antes para evitar conflito com "N.º"
  number: ['n.º2', 'n.º 2', 'nº2', 'numero2', 'nº 2', 'numero 2', 'numero', 'número', 'num', 'nro', 'number', 'n°', 'no', 'casa', 'apto', 'apartamento', 'nº da casa', 'numero da casa', 'nº pacote', 'numero pacote'],
  complement: ['complemento', 'comp', 'complement', 'apto', 'apartamento', 'bloco', 'casa', 'compl'],
  neighborhood: ['bairro', 'neighborhood', 'district', 'setor'],
  city: ['cidade', 'city', 'municipio', 'município', 'localidade'],
  state: ['estado', 'uf', 'state', 'sigla'],
  zipCode: ['cep', 'zip', 'zipcode', 'zip_code', 'codigo_postal', 'código postal', 'cod postal'],
  routeCode: ['rota', 'rotas', 'route', 'routes', 'codigo_rota', 'codigo rota', 'route_code'],
  notes: ['observacao', 'observação', 'obs', 'notes', 'nota', 'instrucoes', 'instruções'],
  // CORRIGIDO: "N.º" vem antes para evitar conflito
  packageNumber: ['n.º', 'nº', 'numero', 'número', 'pacote numero', 'pacote número', 'package number', 'package num'],
};

function findColumnIndex(headers: string[], fieldAliases: string[]): number {
  const normalizedHeaders = headers.map(h => 
    String(h || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );
  
  for (const alias of fieldAliases) {
    const normalizedAlias = alias.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    
    // Busca exata primeiro
    const exactIdx = normalizedHeaders.findIndex(h => h === normalizedAlias);
    if (exactIdx !== -1) return exactIdx;
    
    // Busca por contains
    const containsIdx = normalizedHeaders.findIndex(h => h.includes(normalizedAlias) || normalizedAlias.includes(h));
    if (containsIdx !== -1) return containsIdx;
  }
  
  return -1;
}

export function parseSpreadsheet(data: ArrayBuffer): Delivery[] {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (rows.length < 2) return [];

  // Find the header row (first row with multiple non-empty cells)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const nonEmpty = (rows[i] as unknown[]).filter(c => c != null && String(c).trim() !== '').length;
    if (nonEmpty >= 3) {
      headerIdx = i;
      break;
    }
  }

  const headers = (rows[headerIdx] as unknown[]).map(h => String(h || ''));
  
  const colIndices: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
    colIndices[field] = findColumnIndex(headers, aliases);
  }

  const deliveries: Delivery[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    if (!row || row.every(c => c == null || String(c).trim() === '')) continue;

    const getValue = (field: string): string => {
      const idx = colIndices[field];
      if (idx === -1 || idx >= row.length) return '';
      return String(row[idx] || '').trim();
    };

    const address = getValue('address');
    const neighborhood = getValue('neighborhood');
    const city = getValue('city');
    
    // Skip rows without essential address info
    if (!address && !neighborhood && !city) continue;

    const rawData: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      if (h && idx < row.length) rawData[h] = row[idx];
    });

    deliveries.push({
      id: crypto.randomUUID(),
      trackingCode: getValue('trackingCode'),
      recipientName: getValue('recipientName') || 'Sem nome',
      address: address,
      number: getValue('number'),
      complement: getValue('complement'),
      neighborhood: neighborhood || 'Sem bairro',
      city: city || 'Sem cidade',
      state: getValue('state'),
      zipCode: getValue('zipCode'),
      routeCode: getValue('routeCode'), // Nova coluna
      status: 'pending',
      notes: getValue('notes'),
      rawData: {
        ...rawData,
        packageNumber: getValue('packageNumber') // Salva o número do pacote
      },
    });
  }

  return deliveries;
}
