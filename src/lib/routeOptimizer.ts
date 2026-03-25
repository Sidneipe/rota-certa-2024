import { Delivery, RouteGroup } from '@/types/delivery';

const ROUTE_COLORS = [
  'hsl(45, 100%, 51%)',   // Yellow
  'hsl(200, 80%, 50%)',   // Blue
  'hsl(145, 63%, 42%)',   // Green
  'hsl(340, 75%, 55%)',   // Pink
  'hsl(280, 60%, 55%)',   // Purple
  'hsl(20, 90%, 55%)',    // Orange
  'hsl(170, 70%, 45%)',   // Teal
  'hsl(0, 72%, 51%)',     // Red
];

export type GroupingMode = 'neighborhood' | 'zipCode' | 'city' | 'routeCode';

/**
 * Groups deliveries by a given field and creates route groups
 */
export function groupDeliveries(
  deliveries: Delivery[],
  mode: GroupingMode
): RouteGroup[] {
  const groups = new Map<string, Delivery[]>();

  for (const delivery of deliveries) {
    let key: string;
    switch (mode) {
      case 'routeCode':
        // Agrupar por código da rota, ordenando alfabeticamente
        key = delivery.routeCode?.toLowerCase().trim() || 'sem rota';
        break;
      case 'neighborhood':
        key = delivery.neighborhood?.toLowerCase().trim() || 'sem bairro';
        break;
      case 'zipCode':
        // Group by first 5 digits of ZIP (same area)
        key = delivery.zipCode?.replace(/\D/g, '').substring(0, 5) || 'sem cep';
        break;
      case 'city':
        key = delivery.city?.toLowerCase().trim() || 'sem cidade';
        break;
    }
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(delivery);
  }

  // Sort groups: alphabetically for routeCode, by size for others
  const sortedEntries = [...groups.entries()].sort((a, b) => {
    if (mode === 'routeCode') {
      // Ordenar alfabeticamente por código da rota
      return a[0].localeCompare(b[0]);
    } else {
      // Ordenar por tamanho (maior primeiro) para outros modos
      return b[1].length - a[1].length;
    }
  });

  return sortedEntries.map(([key, dels], index) => {
    // Sort deliveries within group by ZIP code for proximity ordering
    const sorted = [...dels].sort((a, b) => {
      const zipA = a.zipCode?.replace(/\D/g, '') || '';
      const zipB = b.zipCode?.replace(/\D/g, '') || '';
      return zipA.localeCompare(zipB);
    });

    sorted.forEach((d, i) => {
      d.routeGroup = index;
      d.order = i + 1;
    });

    // Criar nome do grupo baseado no modo
    let label: string;
    if (mode === 'routeCode') {
      label = key.charAt(0).toUpperCase() + key.slice(1);
    } else {
      label = key.charAt(0).toUpperCase() + key.slice(1);
    }

    return {
      id: index,
      name: `${label} (${sorted.length} pacotes)`,
      color: ROUTE_COLORS[index % ROUTE_COLORS.length],
      deliveries: sorted,
    };
  });
}

export function getStats(deliveries: Delivery[]) {
  const total = deliveries.length;
  const pending = deliveries.filter(d => d.status === 'pending').length;
  const delivered = deliveries.filter(d => d.status === 'delivered').length;
  const inTransit = deliveries.filter(d => d.status === 'in_transit').length;
  const failed = deliveries.filter(d => d.status === 'failed').length;
  const neighborhoods = new Set(deliveries.map(d => d.neighborhood)).size;
  const cities = new Set(deliveries.map(d => d.city)).size;
  
  return { total, pending, delivered, inTransit, failed, neighborhoods, cities };
}
