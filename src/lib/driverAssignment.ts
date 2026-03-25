import { Driver, RouteGroup } from '@/types/delivery';

/**
 * Normaliza strings removendo acentos e espaços
 */
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ') // Normaliza espaços
    .replace(/\b(dos|das|de|do)\b/g, '') // Remove preposições comuns
    .trim();
};

/**
 * Auto-assigns drivers to route groups based on coverageAreas matching.
 * Uses the same logic as PlanningMatrix for consistency.
 */
export function autoAssignDrivers(
  groups: RouteGroup[],
  drivers: Driver[]
): RouteGroup[] {
  const activeDrivers = drivers.filter(d => d.active);
  if (activeDrivers.length === 0) return groups;

  const assigned = new Map<number, string>();
  const driverLoad = new Map<string, number>();
  activeDrivers.forEach(d => driverLoad.set(d.id, 0));

  // Priority order (same as PlanningMatrix)
  const priorityOrder = ['Rota1', 'Rota2', 'Rota3', 'Rota4', 'Roça'];

  // Helper: check if driver covers a specific delivery location
  const driverCoversDelivery = (driver: Driver, deliveryCity: string, deliveryNeighborhood: string): boolean => {
    if (!driver.coverageAreas || driver.coverageAreas.length === 0) {
      console.log(`      📍 ${driver.name}: sem coverageAreas configuradas`);
      return false;
    }

    const normalizedDeliveryCity = normalizeString(deliveryCity || '');
    const normalizedDeliveryNeighborhood = normalizeString(deliveryNeighborhood || '');

    console.log(`      🔍 ${driver.name}: procurando "${normalizedDeliveryCity}/${normalizedDeliveryNeighborhood}"`);

    return driver.coverageAreas.some((area: any) => {
      const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
      const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
      
      const match = areaCity === normalizedDeliveryCity && areaNeighborhood === normalizedDeliveryNeighborhood;
      
      console.log(`         📍 "${areaCity}/${areaNeighborhood}" vs "${normalizedDeliveryCity}/${normalizedDeliveryNeighborhood}" = ${match}`);
      
      return match;
    });
  };

  // Assign each group based on coverageAreas
  for (const group of groups) {
    if (assigned.has(group.id)) continue;

    // Get a sample delivery from this group to determine location
    const sampleDelivery = group.deliveries[0];
    if (!sampleDelivery) continue;

    const deliveryCity = sampleDelivery.city || '';
    const deliveryNeighborhood = sampleDelivery.neighborhood || '';

    console.log(`🔍 DEBUG ROTAS - Analisando grupo: ${group.name}`);
    console.log(`   📍 Localização: ${deliveryCity}/${deliveryNeighborhood}`);
    console.log(`   📦 Total de entregas no grupo: ${group.deliveries.length}`);

    // Find all drivers that can cover this delivery
    const matchingDrivers = activeDrivers.filter(driver => {
      if (isOverloaded(driver.id, driverLoad, groups.length, activeDrivers.length)) {
        console.log(`   ❌ ${driver.name}: sobrecarregado`);
        return false;
      }
      
      const canCover = driverCoversDelivery(driver, deliveryCity, deliveryNeighborhood);
      console.log(`   👤 ${driver.name}: ${canCover ? '✅ PODE COBRIR' : '❌ NÃO COBRE'}`);
      return canCover;
    });

    console.log(`   🏆 Drivers que podem cobrir: ${matchingDrivers.map(d => d.name).join(', ')}`);

    if (matchingDrivers.length > 0) {
      // Sort by priority order
      matchingDrivers.sort((a, b) => {
        const priorityA = priorityOrder.indexOf(a.name);
        const priorityB = priorityOrder.indexOf(b.name);
        return priorityA - priorityB;
      });

      // Assign to highest priority driver
      const selectedDriver = matchingDrivers[0];
      assigned.set(group.id, selectedDriver.id);
      driverLoad.set(selectedDriver.id, (driverLoad.get(selectedDriver.id) || 0) + 1);
      
      console.log(`   ✅ ATRIBUÍDO: ${group.name} -> ${selectedDriver.name} (prioridade mais alta)`);
    } else {
      console.log(`   🚨 NENHUM MOTORISTA ENCONTRADO para ${group.name}`);
    }
    console.log('---');
  }

  return groups.map(g => ({
    ...g,
    assignedDriver: assigned.get(g.id),
  }));
}

function isOverloaded(driverId: string, load: Map<string, number>, totalGroups: number, totalDrivers: number): boolean {
  const maxPerDriver = Math.ceil(totalGroups / totalDrivers) + 1;
  return (load.get(driverId) || 0) >= maxPerDriver;
}

function extractGroupKey(name: string): string {
  const match = name.match(/^(.+?)\s*\(\d+\)$/);
  return match ? match[1].trim() : name;
}
