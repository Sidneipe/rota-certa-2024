import { Delivery, RouteGroup } from '../types/delivery';

export type GroupingMode = 'neighborhood' | 'zipCode' | 'city';

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

  // Sort groups by size (largest first) for better route distribution
  const sortedEntries = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  return sortedEntries.map(([key, dels], index) => {
    // Sort deliveries within group by ZIP code for proximity ordering
    const sortedDeliveries = dels.sort((a, b) => {
      const zipA = a.zipCode?.replace(/\D/g, '') || '';
      const zipB = b.zipCode?.replace(/\D/g, '') || '';
      return zipA.localeCompare(zipB);
    });

    return {
      id: index + 1,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      color: ROUTE_COLORS[index % ROUTE_COLORS.length],
      deliveries: sortedDeliveries,
    };
  });
}
