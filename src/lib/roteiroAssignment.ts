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
 * Verifica se um motorista cobre um bairro específico baseado em suas coverageAreas cadastradas
 */
const motoristaCobreBairro = (motorista: Driver, bairro: string, cidade: string): boolean => {
  if (!motorista.coverageAreas || motorista.coverageAreas.length === 0) {
    console.log(`      ❌ ${motorista.name}: sem coverageAreas configuradas`);
    return false;
  }

  const normalizedDeliveryCity = normalizeString(cidade || '');
  const normalizedDeliveryNeighborhood = normalizeString(bairro || '');

  // DEBUG ESPECÍFICO: Verificar se algum motorista cobre "centro"
  if (normalizedDeliveryNeighborhood.includes('centro')) {
    console.log(`      🚨 DEBUG - VERIFICANDO COBERTURA DE "CENTRO":`);
    console.log(`         📍 Procurando: "${normalizedDeliveryCity}/${normalizedDeliveryNeighborhood}"`);
  }

  console.log(`      🔍 ${motorista.name}: procurando "${normalizedDeliveryCity}/${normalizedDeliveryNeighborhood}"`);

  return motorista.coverageAreas.some((area: any) => {
    const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
    const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
    
    const match = areaCity === normalizedDeliveryCity && areaNeighborhood === normalizedDeliveryNeighborhood;
    
    // DEBUG ESPECÍFICO: Mostrar comparação para "centro"
    if (normalizedDeliveryNeighborhood.includes('centro')) {
      console.log(`         🚨 ${motorista.name}: "${areaCity}/${areaNeighborhood}" vs "${normalizedDeliveryCity}/${normalizedDeliveryNeighborhood}" = ${match}`);
    } else {
      console.log(`         📍 "${areaCity}/${areaNeighborhood}" vs "${normalizedDeliveryCity}/${normalizedDeliveryNeighborhood}" = ${match}`);
    }
    
    return match;
  });
};

/**
 * Auto-atribui motoristas baseado nas coverageAreas cadastradas no sistema
 * (Usa a mesma lógica do planejamento antigo, mas com os dados reais dos motoristas)
 */
export function autoAssignPorRoteiro(
  groups: RouteGroup[],
  drivers: Driver[]
): RouteGroup[] {
  const activeDrivers = drivers.filter(d => d.active);
  if (activeDrivers.length === 0) return groups;

  const assigned = new Map<number, string>();
  const driverLoad = new Map<string, number>();
  activeDrivers.forEach(d => driverLoad.set(d.id, 0));

  console.log('🚀 INICIANDO ATRIBUIÇÃO POR COVERAGEAREAS CADASTRADOS');
  console.log('📋 Motoristas ativos encontrados:', activeDrivers.map(d => d.name));
  
  // Mostrar detalhes das coverageAreas de cada motorista
  console.log('\n📍 DETALHES DAS COVERAGEAREAS:');
  activeDrivers.forEach(driver => {
    console.log(`\n👤 ${driver.name}:`);
    console.log(`   📋 Total de áreas: ${driver.coverageAreas?.length || 0}`);
    if (driver.coverageAreas && driver.coverageAreas.length > 0) {
      driver.coverageAreas.forEach((area, index) => {
        const cidade = (area as any).cidade || (area as any).city || 'N/A';
        const bairro = (area as any).bairro || (area as any).neighborhood || 'N/A';
        console.log(`   ${index + 1}. "${cidade}/${bairro}"`);
      });
    } else {
      console.log('   ❌ Nenhuma coverageArea configurada');
    }
  });

  // Atribui cada grupo baseado nas coverageAreas dos motoristas
  for (const group of groups) {
    if (assigned.has(group.id)) continue;

    // Pega uma entrega amostra do grupo para determinar o bairro
    const sampleDelivery = group.deliveries[0];
    if (!sampleDelivery) continue;

    const bairro = sampleDelivery.neighborhood || '';
    const cidade = sampleDelivery.city || '';

    // DEBUG ESPECÍFICO: Verificar entregas com "centro" e "AM_3"
    if (bairro.toLowerCase().includes('centro') && group.name.includes('AM_3')) {
      console.log('\n🚨 DEBUG ESPECÍFICO - ENCONTRADO!');
      console.log(`   📍 Bairro: "${bairro}"`);
      console.log(`   🛣️ Grupo: "${group.name}"`);
      console.log(`   📦 Total de entregas: ${group.deliveries.length}`);
      console.log(`   🏙️ Cidade: "${cidade}"`);
      console.log(`   🔧 Normalizado: "${normalizeString(cidade)}/${normalizeString(bairro)}"`);
    }

    console.log(`\n🔍 ANALISANDO GRUPO: ${group.name}`);
    console.log(`   📍 Localização: "${cidade}/${bairro}"`);
    console.log(`   📦 Total de entregas no grupo: ${group.deliveries.length}`);
    
    // Normaliza para comparação
    const normalizedCidade = normalizeString(cidade);
    const normalizedBairro = normalizeString(bairro);
    console.log(`   🔧 Normalizado: "${normalizedCidade}/${normalizedBairro}"`);

    // Encontra todos os motoristas que podem cobrir este bairro baseado nas coverageAreas
    const matchingDrivers = activeDrivers.filter(driver => {
      const podeCobrir = motoristaCobreBairro(driver, bairro, cidade);
      return podeCobrir;
    });

    console.log(`   🏆 Motoristas que podem cobrir: ${matchingDrivers.map(d => d.name).join(', ')}`);

    if (matchingDrivers.length > 0) {
      // Se múltiplos motoristas podem cobrir, usa ordem alfabética ou pode implementar prioridade
      matchingDrivers.sort((a, b) => a.name.localeCompare(b.name));

      // Atribui ao primeiro motorista que pode cobrir
      const selectedDriver = matchingDrivers[0];
      assigned.set(group.id, selectedDriver.id);
      driverLoad.set(selectedDriver.id, (driverLoad.get(selectedDriver.id) || 0) + 1);
      
      console.log(`   ✅ ATRIBUÍDO: ${group.name} -> ${selectedDriver.name} (coverageAreas cadastradas)`);
    } else {
      console.log(`   🚨 NENHUM MOTORISTA ENCONTRADO para ${group.name} (bairro não está em nenhuma coverageArea)`);
      
      // Mostrar todas as áreas disponíveis para debug
      console.log('   📍 Áreas disponíveis nos motoristas:');
      activeDrivers.forEach(driver => {
        if (driver.coverageAreas && driver.coverageAreas.length > 0) {
          const areas = driver.coverageAreas.map(area => {
            const cidade = normalizeString((area as any).cidade || (area as any).city || '');
            const bairro = normalizeString((area as any).bairro || (area as any).neighborhood || '');
            return `${cidade}/${bairro}`;
          });
          console.log(`      ${driver.name}: [${areas.join(', ')}]`);
        }
      });
    }
    console.log('---');
  }

  console.log('\n📊 RESUMO FINAL DA ATRIBUIÇÃO:');
  driverLoad.forEach((load, driverId) => {
    const driver = activeDrivers.find(d => d.id === driverId);
    if (driver) {
      console.log(`   👤 ${driver.name}: ${load} grupos atribuídos`);
    }
  });

  return groups.map(g => ({
    ...g,
    assignedDriver: assigned.get(g.id),
  }));
}

/**
 * Permite edição manual de atribuições
 */
export function updateManualAssignment(
  groupId: number,
  driverId: string,
  groups: RouteGroup[],
  drivers: Driver[]
): RouteGroup[] {
  console.log(`📝 ATUALIZANDO ATRIBUIÇÃO MANUAL: Grupo ${groupId} -> Motorista ${driverId}`);
  
  return groups.map(group => {
    if (group.id === groupId) {
      const driver = drivers.find(d => d.id === driverId);
      console.log(`   ✅ Grupo "${group.name}" agora atribuído a "${driver?.name}" manualmente`);
      return {
        ...group,
        assignedDriver: driverId,
        manuallyAssigned: true // Marca como atribuição manual
      };
    }
    return group;
  });
}
