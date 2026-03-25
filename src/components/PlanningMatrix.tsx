import { useMemo } from 'react';
import { Delivery } from '@/types/delivery';
import { Users, Package, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlanningMatrixProps {
  deliveries: Delivery[];
  drivers: any[];
  // Nova prop para receber dados de grupos atribuídos
  assignedGroups?: Array<{
    id: string;
    name: string;
    deliveries: Delivery[];
    assignedDriver: string;
  }>;
}

interface MatrixData {
  [driverName: string]: {
    [routeCode: string]: number;
    total: number;
  };
}

export function PlanningMatrix({ deliveries, drivers, assignedGroups = [] }: PlanningMatrixProps) {
  // Processar dados para formato de matriz (motoristas x rotas)
  const matrixData = useMemo((): { data: MatrixData; routes: string[]; driverNames: string[] } => {
    console.log('🚀 Iniciando processamento da matriz...');
    console.log('📋 Entregas recebidas:', deliveries.length);
    console.log('👥 Motoristas recebidos:', drivers.length);
    console.log('📦 Grupos atribuídos:', assignedGroups.length);
    
    // Se houver grupos atribuídos, usar esses dados
    if (assignedGroups.length > 0) {
      console.log('🎯 Usando dados dos grupos atribuídos...');
      
      const data: MatrixData = {};
      const routeSet = new Set<string>();
      const driverSet = new Set<string>();
      
      // Primeiro, coletar todas as rotas possíveis das entregas
      deliveries.forEach(delivery => {
        if (delivery.routeCode) {
          routeSet.add(delivery.routeCode);
        }
      });
      
      // Coletar todos os motoristas ativos
      drivers.filter(d => d.active).forEach(driver => {
        driverSet.add(driver.name);
      });
      
      // Inicializar matriz com zeros para todos os motoristas e rotas
      driverSet.forEach(driverName => {
        data[driverName] = { total: 0 };
        routeSet.forEach(routeCode => {
          data[driverName][routeCode] = 0;
        });
      });
      
      // Preencher apenas com grupos que têm motorista atribuído
      assignedGroups.forEach(group => {
        if (group.assignedDriver) { // Apenas se tiver motorista atribuído
          const driverName = drivers.find(d => d.id === group.assignedDriver)?.name || 'Não atribuído';
          const routeCode = group.name;
          
          // Adicionar contagem de entregas para esta rota
          if (data[driverName] && data[driverName][routeCode] !== undefined) {
            data[driverName][routeCode] = group.deliveries.length;
            data[driverName].total += group.deliveries.length;
          }
        }
      });
      
      return {
        data,
        routes: Array.from(routeSet).sort(),
        driverNames: Array.from(driverSet).sort()
      };
    }
    
    // Função auxiliar para normalizar strings removendo acentos e espaços
    const normalizeString = (str: string): string => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, ' ') // Normaliza espaços
        .replace(/\b(dos|das|de|do)\b/g, '') // Remove preposições comuns
        .trim();
    };
    
    // Filtrar entregas que têm código de rota
    console.log('🔍 DEBUG TOTAL - Todas as entregas antes do filtro:');
    deliveries.forEach((delivery, index) => {
      if (delivery.routeCode === 'AM_9') {
        console.log(`   ${index + 1}. "${delivery.neighborhood}" - routeCode: "${delivery.routeCode}" - trackingCode: ${delivery.trackingCode || 'N/A'}`);
      }
    });
    
    const validDeliveries = deliveries.filter(d => d.routeCode);
    console.log('✅ Entregas válidas (com routeCode):', validDeliveries.length);
    
    // Debug específico para AM_9
    console.log('🔍 DEBUG AM_9 - Verificando entregas antes do filtro:');
    const am9DeliveriesBeforeFilter = deliveries.filter(d => d.routeCode === 'AM_9');
    console.log(`   📦 Entregas AM_9 antes do filtro: ${am9DeliveriesBeforeFilter.length}`);
    am9DeliveriesBeforeFilter.forEach((delivery, index) => {
      console.log(`      ${index + 1}. "${delivery.neighborhood}" - routeCode: "${delivery.routeCode}" - trackingCode: ${delivery.trackingCode || 'N/A'}`);
    });
    
    const am9DeliveriesAfterFilter = validDeliveries.filter(d => d.routeCode === 'AM_9');
    console.log(`   📦 Entregas AM_9 depois do filtro: ${am9DeliveriesAfterFilter.length}`);
    am9DeliveriesAfterFilter.forEach((delivery, index) => {
      console.log(`      ${index + 1}. "${delivery.neighborhood}" - routeCode: "${delivery.routeCode}" - trackingCode: ${delivery.trackingCode || 'N/A'}`);
    });
    
    if (am9DeliveriesBeforeFilter.length !== am9DeliveriesAfterFilter.length) {
      console.log(`   🚨 PROBLEMA: ${am9DeliveriesBeforeFilter.length - am9DeliveriesAfterFilter.length} entregas de AM_9 foram filtradas!`);
    }
    
    console.log('---');
    
    // Debug específico para Roça
    console.log('🔍 DEBUG ROÇA - Verificando todas as atribuições:');
    const roçaAssignments = [];
    validDeliveries.forEach((delivery, index) => {
      // Simular a lógica de atribuição para Roça
      const deliveryCity = normalizeString(delivery.city || '');
      const deliveryNeighborhood = normalizeString(delivery.neighborhood || '');
      
      // Verificar se Roça cobre esta entrega
      const roçaDriver = drivers.find(d => d.name === 'Roça');
      if (roçaDriver && roçaDriver.coverageAreas) {
        const wouldAssign = roçaDriver.coverageAreas.some((area: any) => {
          const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
          const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          return areaCity === deliveryCity && areaNeighborhood === deliveryNeighborhood;
        });
        
        if (wouldAssign) {
          roçaAssignments.push({
            routeCode: delivery.routeCode,
            neighborhood: delivery.neighborhood,
            city: delivery.city,
            trackingCode: delivery.trackingCode
          });
        }
      }
    });
    
    console.log(`   📦 Entregas que Roça pode atender: ${roçaAssignments.length}`);
    const roçaByRoute = new Map<string, number>();
    roçaAssignments.forEach(assignment => {
      const route = assignment.routeCode!;
      roçaByRoute.set(route, (roçaByRoute.get(route) || 0) + 1);
    });
    
    console.log(`   📍 Distribuição por rota para Roça:`);
    roçaByRoute.forEach((count, route) => {
      console.log(`      ${route}: ${count} entregas`);
    });
    
    console.log('---');

    // Agrupar por motorista e rota
    const data: MatrixData = {};
    const routes = new Set<string>();
    
    // Inicializar dados para todos os motoristas
    console.log('🗺️ MAPEAMENTO DE ÁREAS DE COBERTURA:');
    drivers.forEach(driver => {
      data[driver.name] = { total: 0 };
      console.log(`👤 Motorista ${driver.name}:`);
      console.log(`   🏙️ Cidade principal: "${driver.city?.trim()}"`);
      console.log(`   📍 Bairro principal: "${driver.neighborhood?.trim()}"`);
      
      if (driver.coverageAreas && driver.coverageAreas.length > 0) {
        const areas = driver.coverageAreas.map((area: any) => {
          const city = (area as any).cidade || (area as any).city || '';
          const neighborhood = (area as any).bairro || (area as any).neighborhood || '';
          return `${city}/${neighborhood}`;
        }).filter(Boolean);
        console.log(`   🗺️ Áreas de cobertura: [${areas.join(', ')}]`);
        
        // Mostrar áreas normalizadas para debug
        console.log(`   🔤 Áreas normalizadas:`);
        driver.coverageAreas.forEach((area: any, index: number) => {
          const city = normalizeString((area as any).cidade || (area as any).city || '');
          const neighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          console.log(`      ${index + 1}: "${city}/${neighborhood}"`);
        });
      } else {
        console.log(`   ⚠️ Sem coverageAreas configurado - usando apenas cidade/bairro principal`);
        console.log(`   💡 DICA: Configure coverageAreas para distribuir melhor as entregas!`);
      }
    });
    
    console.log('---');
    
    // Verificar duplicação de bairros entre motoristas
    console.log('🔍 VERIFICANDO DUPLICAÇÃO DE BAIRROS:');
    const neighborhoodMap = new Map<string, string[]>();
    
    drivers.forEach(driver => {
      if (driver.coverageAreas && driver.coverageAreas.length > 0) {
        driver.coverageAreas.forEach((area: any) => {
          const city = normalizeString((area as any).cidade || (area as any).city || '');
          const neighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          const key = `${city}/${neighborhood}`;
          
          if (!neighborhoodMap.has(key)) {
            neighborhoodMap.set(key, []);
          }
          neighborhoodMap.get(key)!.push(driver.name);
        });
      }
      
      // Verificar também bairro principal
      if (driver.city && driver.neighborhood) {
        const city = normalizeString(driver.city);
        const neighborhood = normalizeString(driver.neighborhood);
        const key = `${city}/${neighborhood}`;
        
        if (!neighborhoodMap.has(key)) {
          neighborhoodMap.set(key, []);
        }
        neighborhoodMap.get(key)!.push(driver.name);
      }
    });
    
    // Mostrar duplicações
    neighborhoodMap.forEach((driverNames, area) => {
      if (driverNames.length > 1) {
        console.log(`🚨 DUPLICAÇÃO ENCONTRADA: "${area}" está em [${driverNames.join(', ')}]`);
      }
    });
    
    console.log('---');
    
    // Mostrar todas as entregas de AM_9 antes de processar
    console.log('🔍 ENTREGAS DE AM_9 NA PLANILHA:');
    const am9Deliveries = validDeliveries.filter(d => d.routeCode === 'AM_9');
    am9Deliveries.forEach((delivery, index) => {
      console.log(`   ${index + 1}. 📦 ${delivery.trackingCode || 'N/A'} - ${delivery.neighborhood} (${delivery.recipientName})`);
    });
    console.log(`   📊 Total: ${am9Deliveries.length} entregas em AM_9`);
    
    // Contador por bairro para AM_9
    const am9NeighborhoodCount = new Map<string, number>();
    am9Deliveries.forEach(delivery => {
      const neighborhood = delivery.neighborhood?.trim() || 'Sem bairro';
      am9NeighborhoodCount.set(neighborhood, (am9NeighborhoodCount.get(neighborhood) || 0) + 1);
    });
    
    console.log(`   📍 Distribuição por bairro em AM_9:`);
    am9NeighborhoodCount.forEach((count, neighborhood) => {
      console.log(`      ${neighborhood}: ${count} entregas`);
    });
    
    console.log('---');
    
    // Contador simples por rota (para verificação)
    const routeCount = new Map<string, number>();
    let unassignedCount = 0; // Contador de entregas não atribuídas
    
    // Contador de atribuições por bairro para AM_9
    const am9AssignedCount = new Map<string, number>();
    
    validDeliveries.forEach((delivery, index) => {
      const routeCode = delivery.routeCode!;
      routes.add(routeCode);
      
      // Contagem simples por rota
      routeCount.set(routeCode, (routeCount.get(routeCode) || 0) + 1);
      
      // Log especial para entregas de AM_9
      const isAM9 = routeCode === 'AM_9';
      const logPrefix = isAM9 ? '🔍🔍🔍' : '📦';
      
      console.log(`${logPrefix} Entrega ${index + 1}:`, {
        routeCode,
        neighborhood: delivery.neighborhood?.trim(),
        recipientName: delivery.recipientName,
        trackingCode: delivery.trackingCode || 'N/A',
        totalPorRota: routeCount.get(routeCode)
      });
      
      // Debug específico para AM_9
      if (isAM9) {
        console.log(`   🎯 DEBUG AM_9: Entrega ${index + 1} de ${validDeliveries.length} no loop total`);
        console.log(`   🎯 DEBUG AM_9: Bairro "${delivery.neighborhood?.trim()}" em rota "${routeCode}"`);
        
        // Debug extra para Alvorada
        if (isAM9 && delivery.neighborhood?.trim() === 'Alvorada') {
          console.log(`   🚨 DEBUG ALVORADA: Processando entrega de Alvorada em AM_9`);
          console.log(`   🚨 DEBUG ALVORADA: trackingCode: ${delivery.trackingCode || 'N/A'}`);
          console.log(`   🚨 DEBUG ALVORADA: Cidade: "${delivery.city?.trim()}"`);
          console.log(`   🚨 DEBUG ALVORADA: Normalização: "${normalizeString(delivery.city?.trim() || '')}/${normalizeString('Alvorada')}"`);
        }
      }
      
      // Encontrar motorista específico baseado nas áreas de cobertura
      let assignedDriver = null;
      
      // Lista de motoristas em ordem de prioridade
      const priorityOrder = ['Rota1', 'Rota2', 'Rota3', 'Rota4', 'Roça'];
      
      const searchPrefix = isAM9 ? '🔍🔍🔍' : '🔍';
      console.log(`${searchPrefix} Procurando motorista para entrega em "${delivery.neighborhood?.trim()}" (${routeCode})`);
      
      // 1. Tentar encontrar por coverageAreas (bairro exato) com prioridade
      if (delivery.neighborhood && delivery.city) {
        console.log(`   📋 Verificando coverageAreas...`);
        
        const deliveryCity = normalizeString(delivery.city || '');
        const deliveryNeighborhood = normalizeString(delivery.neighborhood || '');
        
        // Debug extra para Alvorada
        if (deliveryNeighborhood === normalizeString('Alvorada') && routeCode === 'AM_9') {
          console.log(`   🚨 DEBUG ALVORADA: Cidade normalizada: "${deliveryCity}"`);
          console.log(`   🚨 DEBUG ALVORADA: Bairro normalizado: "${deliveryNeighborhood}"`);
        }
        
        const matchingDrivers = [];
        
        for (const driver of drivers) {
          console.log(`   👤 Verificando motorista: ${driver.name}`);
          
          if (driver.coverageAreas && driver.coverageAreas.length > 0) {
            console.log(`      📍 Tem ${driver.coverageAreas.length} áreas de cobertura:`);
            
            for (let i = 0; i < driver.coverageAreas.length; i++) {
              const area = driver.coverageAreas[i];
              const normalizedCity = normalizeString((area as any).cidade || (area as any).city || '');
              const normalizedNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
              
              const match = normalizedCity === deliveryCity && normalizedNeighborhood === deliveryNeighborhood;
              
              // Debug extra para Alvorada
              if (deliveryNeighborhood === normalizeString('Alvorada') && routeCode === 'AM_9') {
                console.log(`      🚨 DEBUG ALVORADA COMPARAÇÃO: "${normalizedCity}/${normalizedNeighborhood}" vs "${deliveryCity}/${deliveryNeighborhood}" = ${match}`);
              }
              
              console.log(`         Área ${i + 1}: "${normalizedCity}/${normalizedNeighborhood}" vs "${deliveryCity}/${deliveryNeighborhood}" = ${match}`);
            
              if (match) {
                matchingDrivers.push(driver);
                console.log(`   ✅ MOTORISTA ENCONTRADO! ${driver.name} cobre "${delivery.neighborhood}" via coverageArea`);
                
                // Debug extra para Alvorada
                if (deliveryNeighborhood === normalizeString('Alvorada') && routeCode === 'AM_9') {
                  console.log(`      🚨 DEBUG ALVORADA: Motorista ${driver.name} adicionado aos matchingDrivers`);
                  console.log(`      🚨 DEBUG ALVORADA: Total matchingDrivers: ${matchingDrivers.length}`);
                }
                
                break;
              }
            }
          } else {
            console.log(`      ❌ Sem coverageAreas configuradas`);
          }
        }
        
        // Se encontrou motoristas, escolher com base na prioridade
        if (matchingDrivers.length > 0) {
          // Debug extra para Alvorada
          if (deliveryNeighborhood === normalizeString('Alvorada') && routeCode === 'AM_9') {
            console.log(`   🚨 DEBUG ALVORADA: Encontrados ${matchingDrivers.length} motoristas para Alvorada`);
            matchingDrivers.forEach((driver, index) => {
              console.log(`      🚨 DEBUG ALVORADA: ${index + 1}. ${driver.name}`);
            });
          }
          
          // Ordenar por prioridade
          matchingDrivers.sort((a, b) => {
            const priorityA = priorityOrder.indexOf(a.name);
            const priorityB = priorityOrder.indexOf(b.name);
            return priorityA - priorityB;
          });
          
          assignedDriver = matchingDrivers[0];
          console.log(`   🏆 ESCOLHIDO POR PRIORIDADE: ${assignedDriver.name} (entre ${matchingDrivers.map(d => d.name).join(', ')})`);
          
          // Debug extra para Alvorada
          if (deliveryNeighborhood === normalizeString('Alvorada') && routeCode === 'AM_9') {
            console.log(`      🚨 DEBUG ALVORADA: Motorista escolhido: ${assignedDriver.name}`);
            console.log(`      🚨 DEBUG ALVORADA: assignedDriver definido como: ${assignedDriver ? assignedDriver.name : 'NULL'}`);
          }
        }
      }
      
      // 2. Se não encontrar por coverageAreas, tentar por bairro principal do motorista
      if (!assignedDriver && delivery.neighborhood && delivery.city) {
        console.log(`   📋 Verificando bairros principais...`);
        
        // Primeiro, buscar motoristas que correspondem exatamente
        const matchingDrivers = [];
        
        for (const driver of drivers) {
          console.log(`   👤 Verificando motorista: ${driver.name}`);
          
          if (driver.city && driver.neighborhood) {
            const driverCity = normalizeString(driver.city);
            const driverNeighborhood = normalizeString(driver.neighborhood);
            const deliveryCity = normalizeString(delivery.city);
            const deliveryNeighborhood = normalizeString(delivery.neighborhood);
            
            const cityMatches = driverCity === deliveryCity;
            const neighborhoodMatches = driverNeighborhood === deliveryNeighborhood;
            const exactMatch = cityMatches && neighborhoodMatches;
            
            console.log(`      Principal: "${driverCity}/${driverNeighborhood}" vs "${deliveryCity}/${deliveryNeighborhood}" = ${exactMatch}`);
            
            if (exactMatch) {
              matchingDrivers.push(driver);
              console.log(`   ✅ MOTORISTA ENCONTRADO! ${driver.name} cobre "${delivery.neighborhood}" via bairro principal`);
            }
          }
        }
        
        // Se encontrou motoristas, escolher com base na prioridade
        if (matchingDrivers.length > 0) {
          // Ordenar por prioridade
          matchingDrivers.sort((a, b) => {
            const priorityA = priorityOrder.indexOf(a.name);
            const priorityB = priorityOrder.indexOf(b.name);
            return priorityA - priorityB;
          });
          
          assignedDriver = matchingDrivers[0];
          console.log(`   🏆 ESCOLHIDO POR PRIORIDADE: ${assignedDriver.name} (entre ${matchingDrivers.map(d => d.name).join(', ')})`);
        }
      }
      
      // 3. Se ainda não encontrar, mostrar disponibilidade detalhada
      if (!assignedDriver) {
        unassignedCount++; // Incrementa contador de entregas não atribuídas
        
        // Destacar se for da rota AM_9 (a que está com problema)
        const isAM9 = routeCode === 'AM_9';
        console.log(`🚨🚨🚨 NENHUM MOTORISTA ENCONTRADO para "${delivery.neighborhood?.trim()}" (${routeCode})`);
        
        // Debug extra para Alvorada
        if (normalizeString(delivery.neighborhood || '') === normalizeString('Alvorada') && routeCode === 'AM_9') {
          console.log(`   🚨 DEBUG ALVORADA: Nenhum motorista encontrado para Alvorada!`);
          console.log(`   🚨 DEBUG ALVORADA: Verificando se algum motorista cobre "Alvorada"...`);
          
          drivers.forEach(driver => {
            const hasAlvorada = driver.coverageAreas?.some((area: any) => {
              const neighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
              return neighborhood === normalizeString('Alvorada');
            });
            console.log(`      👤 ${driver.name}: ${hasAlvorada ? '✅ COBRE' : '❌ NÃO COBRE'} "Alvorada"`);
            
            // Mostrar todas as áreas de cobertura deste motorista
            if (hasAlvorada) {
              console.log(`         📍 Áreas de ${driver.name}:`);
              driver.coverageAreas?.forEach((area: any, index: number) => {
                const city = normalizeString((area as any).cidade || (area as any).city || '');
                const neighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
                console.log(`            ${index + 1}. "${city}/${neighborhood}"`);
              });
            }
          });
          
          // Verificar se algum motorista cobre Werneck
          console.log(`   🚨 DEBUG ALVORADA: Verificando se algum motorista cobre "Werneck"...`);
          drivers.forEach(driver => {
            const hasWerneck = driver.coverageAreas?.some((area: any) => {
              const city = normalizeString((area as any).cidade || (area as any).city || '');
              return city === normalizeString('Werneck');
            });
            console.log(`      👤 ${driver.name}: ${hasWerneck ? '✅ COBRE' : '❌ NÃO COBRE'} "Werneck"`);
          });
        }
        
        console.log(`   🚨 NENHUM MOTORISTA ENCONTRADO para "${delivery.neighborhood?.trim()}" em "${delivery.city?.trim()}"`);
        console.log(`   🚨 ENTREGA NÃO ATRIBUÍDA: ${delivery.trackingCode} - ${delivery.neighborhood} (${routeCode})`);
        
        if (isAM9) {
          console.log(`   💡 ESTA É A ENTREGA FALTANTE DE AM_9!`);
        }
        
        console.log(`   📋 Todos os motoristas e suas configurações:`);
        
        drivers.forEach(driver => {
          console.log(`      👤 ${driver.name}:`);
          console.log(`         Principal: "${normalizeString(driver.city || '')}/${normalizeString(driver.neighborhood || '')}"`);
          
          if (driver.coverageAreas && driver.coverageAreas.length > 0) {
            console.log(`         CoverageAreas:`);
            driver.coverageAreas.forEach((area: any, index: number) => {
              const city = normalizeString((area as any).cidade || (area as any).city || '');
              const neighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
              console.log(`            ${index + 1}: "${city}/${neighborhood}"`);
            });
          } else {
            console.log(`         CoverageAreas: Nenhuma`);
          }
        });
      } else {
        // Log de sucesso para verificar se está atribuindo corretamente
        console.log(`✅ ATRIBUÍDO: ${delivery.neighborhood?.trim()} (${routeCode}) -> ${assignedDriver.name} [${data[assignedDriver.name][routeCode]}]`);
      }
      
      if (assignedDriver) {
        // Inicializar rota para este motorista se não existir
        if (!data[assignedDriver.name][routeCode]) {
          data[assignedDriver.name][routeCode] = 0;
        }
        
        data[assignedDriver.name][routeCode]++;
        data[assignedDriver.name].total++;
        
        // Log especial para entregas de AM_9
        const successPrefix = isAM9 ? '✅✅✅' : '✅';
        console.log(`${successPrefix} ATRIBUÍDO: ${delivery.neighborhood?.trim()} (${routeCode}) -> ${assignedDriver.name} [${data[assignedDriver.name][routeCode]}]`);
        
        // Contador específico para AM_9
        if (isAM9) {
          // Obter nomes dos motoristas aqui dentro do loop
          const currentDriverNames = drivers.map(driver => driver.name);
          const am9Count = currentDriverNames.reduce((sum, driverName) => sum + (data[driverName]['AM_9'] || 0), 0);
          console.log(`📊 AM_9 Status: ${am9Count} de 8 entregas atribuídas até agora`);
          
          // Contar por bairro
          const neighborhood = delivery.neighborhood?.trim() || 'Sem bairro';
          am9AssignedCount.set(neighborhood, (am9AssignedCount.get(neighborhood) || 0) + 1);
          console.log(`   📍 ${neighborhood}: ${am9AssignedCount.get(neighborhood)} de ${am9NeighborhoodCount.get(neighborhood)} entregas atribuídas`);
        }
      }
    });
    
    // Obter nomes dos motoristas e rotas
    const driverNames = drivers.map(driver => driver.name).sort();
    const routeList = Array.from(routes).sort((a, b) => {
      // Ordenação numérica: AM_10, AM_11, AM_12, etc.
      const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
      const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
      return numA - numB;
    });
    
    console.log('📊 Resumo final:');
    console.log('🔢 Contagem por rota (baseado na planilha):', Object.fromEntries(routeCount));
    console.log('👥 Motoristas disponíveis:', driverNames);
    console.log('🛣️ Rotas encontradas:', routeList);
    console.log('📋 Matriz completa (distribuição por motorista):', data);
    
    // Mostrar contador de entregas não atribuídas
    if (unassignedCount > 0) {
      console.log(`🚨 ATENÇÃO: ${unassignedCount} entregas não foram atribuídas a nenhum motorista!`);
    }
    
    // Resumo detalhado por rota
    console.log(`\n📈 RESUMO DETALHADO POR ROTA:`);
    routeList.forEach(routeCode => {
      const expectedCount = routeCount.get(routeCode) || 0;
      const actualCount = driverNames.reduce((sum, driverName) => sum + (data[driverName][routeCode] || 0), 0);
      const status = expectedCount === actualCount ? '✅' : '❌';
      
      console.log(`   ${routeCode}: ${expectedCount} esperadas → ${actualCount} atribuídas ${status}`);
      
      if (expectedCount !== actualCount) {
        console.log(`      🚨 Faltam ${expectedCount - actualCount} entregas em ${routeCode}`);
        
        // Mostrar quais entregas desta rota não foram atribuídas
        console.log(`      🔍 Entregas não atribuídas em ${routeCode}:`);
        validDeliveries.forEach((delivery, index) => {
          if (delivery.routeCode === routeCode) {
            const assigned = Object.values(data).some(driverData => driverData[routeCode] > 0);
            const deliveryInMatrix = driverNames.some(driverName => {
              const driverData = data[driverName];
              return driverData[routeCode] > 0;
            });
            
            // Verificar se esta entrega específica foi contada
            let foundInMatrix = false;
            for (const driverName of driverNames) {
              if (data[driverName][routeCode] > 0) {
                // Esta é uma aproximação - não sabemos exatamente quais entregas estão na matriz
                foundInMatrix = true;
                break;
              }
            }
            
            console.log(`         📦 ${delivery.trackingCode || 'N/A'} - ${delivery.neighborhood} (${delivery.recipientName})`);
          }
        });
      }
    });
    
    // Verificação final detalhada
    const totalMatrix = Object.values(data).reduce((sum, driver) => sum + driver.total, 0);
    const expectedTotal = validDeliveries.length;
    
    console.log(`✅ Verificação final:`);
    console.log(`   📦 Total de entregas na planilha: ${expectedTotal}`);
    console.log(`   📋 Total na matriz: ${totalMatrix}`);
    console.log(`   🎯 Status: ${totalMatrix === expectedTotal ? '✅ CORRETO' : '❌ ERRO'}`);
    
    // Debug específico para Roça - Comparar com página Rotas
    console.log(`\n🔍 DEBUG ROÇA - COMPARAÇÃO COM PÁGINA ROTAS:`);
    const roçaData = data['Roça'];
    
    // Verificar se o motorista Roça existe
    if (!roçaData) {
      console.log(`   ❌ Motorista 'Roça' não encontrado nos dados!`);
      console.log(`   � Motoristas disponíveis: ${Object.keys(data).join(', ')}`);
    } else {
      console.log(`   �📊 Atribuições reais do Roça (Planejamento):`);
      let roçaTotal = 0;
      Object.entries(roçaData).forEach(([route, count]) => {
        if (route !== 'total' && count > 0) {
          console.log(`      ${route}: ${count} entregas`);
          roçaTotal += count;
        }
      });
      console.log(`   📦 Total do Roça em Planejamento: ${roçaTotal}`);
      
      console.log(`   📊 Comparativo com página Rotas:`);
      console.log(`      AM_10: ${roçaData['AM_10'] || 0} vs 12 (esperado)`);
      console.log(`      AM_12: ${roçaData['AM_12'] || 0} vs 4 (esperado)`);
      console.log(`      AM_4: ${roçaData['AM_4'] || 0} vs 8 (esperado)`);
      const expectedFromRotas = 12 + 4 + 8;
      console.log(`   📦 Total esperado (página Rotas): ${expectedFromRotas}`);
      console.log(`   📦 Total real (página Planejamento): ${roçaTotal}`);
      console.log(`   🚨 Diferença: ${Math.abs(roçaTotal - expectedFromRotas)} entregas`);
      
      // Mostrar distribuição completa das rotas problemáticas
      console.log(`   🔍 ANÁLISE DAS ROTAS PROBLEMÁTICAS:`);
      ['AM_10', 'AM_12', 'AM_4'].forEach(route => {
        console.log(`      📍 ${route}:`);
        driverNames.forEach(driverName => {
          const count = data[driverName][route] || 0;
          if (count > 0) {
            console.log(`         👤 ${driverName}: ${count} entregas`);
          }
        });
      });
      
      // Verificar se Roça cobre as áreas dessas rotas
      console.log(`   🔍 VERIFICANDO COBERTURA DO ROÇA:`);
      const roçaDriver = drivers.find(d => d.name === 'Roça');
      if (roçaDriver && roçaDriver.coverageAreas) {
        console.log(`      📍 Áreas de cobertura do Roça:`);
        roçaDriver.coverageAreas.forEach((area: any, index: number) => {
          const city = normalizeString((area as any).cidade || (area as any).city || '');
          const neighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          console.log(`         ${index + 1}. "${city}/${neighborhood}"`);
        });
        
        // Verificar entregas específicas das rotas problemáticas
        console.log(`      🔍 ENTREGAS ESPECÍFICAS DAS ROTAS PROBLEMÁTICAS:`);
        ['AM_10', 'AM_12', 'AM_4'].forEach(route => {
          console.log(`         📍 ${route}:`);
          const routeDeliveries = validDeliveries.filter(d => d.routeCode === route);
          routeDeliveries.slice(0, 3).forEach((delivery, index) => {
            const deliveryCity = normalizeString(delivery.city || '');
            const deliveryNeighborhood = normalizeString(delivery.neighborhood || '');
            console.log(`            ${index + 1}. "${deliveryCity}/${deliveryNeighborhood}" (${delivery.trackingCode})`);
          });
          if (routeDeliveries.length > 3) {
            console.log(`            ... e mais ${routeDeliveries.length - 3} entregas`);
          }
        });
      }
    }
    
    console.log('---');
    
    // Análise específica de AM_9
    console.log(`\n🔍 ANÁLISE ESPECÍFICA DE AM_9:`);
    const am9Expected = routeCount.get('AM_9') || 0;
    const am9Actual = driverNames.reduce((sum, driverName) => sum + (data[driverName]['AM_9'] || 0), 0);
    const am9Status = am9Expected === am9Actual ? '✅' : '❌';
    
    console.log(`   📊 AM_9: ${am9Expected} esperadas → ${am9Actual} atribuídas ${am9Status}`);
    
    if (am9Expected !== am9Actual) {
      console.log(`   🚨 Faltam ${am9Expected - am9Actual} entregas em AM_9`);
      
      // Mostrar quais foram atribuídas
      console.log(`   ✅ Entregas de AM_9 atribuídas:`);
      driverNames.forEach(driverName => {
        const count = data[driverName]['AM_9'] || 0;
        if (count > 0) {
          console.log(`      👤 ${driverName}: ${count} entregas`);
        }
      });
      
      // Mostrar detalhes por bairro
      console.log(`   📍 Resumo por bairro:`);
      am9NeighborhoodCount.forEach((expected, neighborhood) => {
        const assigned = am9AssignedCount.get(neighborhood) || 0;
        const status = expected === assigned ? '✅' : '❌';
        console.log(`      ${neighborhood}: ${assigned} de ${expected} entregas ${status}`);
        if (expected !== assigned) {
          console.log(`         🚨 Faltam ${expected - assigned} entregas de "${neighborhood}"`);
        }
      });
      
      // Mostrar detalhes das entregas de AM_9 que não foram encontradas nos logs de atribuição
      console.log(`   🔍 Verificando qual entrega está faltando...`);
      const processedAM9 = [];
      
      // Aqui precisaríamos rastrear quais entregas foram processadas, mas por agora vamos mostrar a diferença
      console.log(`   💡 Dica: Verifique os logs acima por entregas de AM_9 sem "✅✅✅ ATRIBUÍDO"`);
    }
    
    // Detalhamento por rota
    console.log(`📈 Detalhamento por rota:`);
    routeList.forEach(route => {
      const routeTotal = routeCount.get(route) || 0;
      const matrixTotal = driverNames.reduce((sum, driver) => sum + (data[driver][route] || 0), 0);
      console.log(`   ${route}: ${routeTotal} entregas → ${matrixTotal} distribuídos ${routeTotal === matrixTotal ? '✅' : '❌'}`);
    });

    // Se não houver grupos atribuídos, criar matriz vazia
    console.log('🎯 Criando matriz vazia...');
    
    const matrixData: MatrixData = {};
    const routeSet = new Set<string>();
    const driverSet = new Set<string>();
    
    // Coletar todas as rotas possíveis das entregas
    deliveries.forEach(delivery => {
      if (delivery.routeCode) {
        routeSet.add(delivery.routeCode);
      }
    });
    
    // Coletar todos os motoristas ativos
    drivers.filter(d => d.active).forEach(driver => {
      driverSet.add(driver.name);
    });
    
    // Inicializar matriz com zeros para todos os motoristas e rotas
    driverSet.forEach(driverName => {
      matrixData[driverName] = { total: 0 };
      routeSet.forEach(routeCode => {
        matrixData[driverName][routeCode] = 0;
      });
    });
    
    // Se houver grupos atribuídos, preencher apenas os que têm motorista
    if (assignedGroups.length > 0) {
      assignedGroups.forEach(group => {
        if (group.assignedDriver) { // Apenas se tiver motorista atribuído
          const driverName = drivers.find(d => d.id === group.assignedDriver)?.name || 'Não atribuído';
          const routeCode = group.name;
          
          // Adicionar contagem de entregas para esta rota
          if (matrixData[driverName] && matrixData[driverName][routeCode] !== undefined) {
            matrixData[driverName][routeCode] = group.deliveries.length;
            matrixData[driverName].total += group.deliveries.length;
          }
        }
      });
    }
    
    return {
      data: matrixData,
      routes: Array.from(routeSet).sort(),
      driverNames: Array.from(driverSet).sort()
    };
  }, [deliveries, drivers, assignedGroups]);

  // Exportar matriz para Excel
  const handleExport = () => {
    // ...
    
    // Criar dados para exportação
    const exportData: any[] = [];
    
    // Header
    const header: any = {};
    routes.forEach(routeCode => {
      header[routeCode] = routeCode;
    });
    header[''] = 'Motorista'; // Primeira coluna vazia para nome do motorista
    exportData.push(header);
    
    // Linhas por motorista
    driverNames.forEach(driverName => {
      const row: any = { '': driverName }; // Primeira coluna com nome do motorista
      const driverData = data[driverName];
      
      // Quantidade por rota
      routes.forEach(routeCode => {
        row[routeCode] = driverData[routeCode] || 0;
      });
      
      // Total do motorista
      row['TOTAL'] = driverData.total;
      
      exportData.push(row);
    });
    
    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matriz de Planejamento');
    XLSX.writeFile(wb, `matriz-planejamento-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const { data, routes, driverNames } = matrixData;

  if (driverNames.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum motorista encontrado.</p>
        <p className="text-sm mt-2">Cadastre motoristas com suas áreas de cobertura.</p>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Nenhuma entrega com código de rota encontrada.</p>
        <p className="text-sm mt-2">Verifique se a planilha contém a coluna "rota".</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Total de Entregas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{deliveries.length}</div>
            <p className="text-sm text-gray-600">Entregas processadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Botão de Exportação */}
      <div className="flex justify-end">
        <button
          onClick={handleExport}
          className="h-9 px-3 rounded-xl border border-border bg-card text-foreground text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar Matriz
        </button>
      </div>

      {/* Tabela Matricial Invertida */}
      <div className="bg-card rounded-xl border border-border overflow-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border min-w-[120px]">
                Motorista
              </th>
              {routes.map(routeCode => (
                <th key={routeCode} className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[80px]">
                  {routeCode}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider border-l border-border min-w-[80px]">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {driverNames.map(driverName => {
              const driverData = data[driverName];
              
              return (
                <tr key={driverName} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground border-r border-border">
                    {driverName}
                  </td>
                  {routes.map(routeCode => {
                    const count = driverData[routeCode] || 0;
                    
                    return (
                      <td key={routeCode} className="px-4 py-3 text-center">
                        {count > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                            {count}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center font-bold text-blue-600 border-l border-border">
                    {driverData.total}
                  </td>
                </tr>
              );
            })}
            
            {/* Linha de Totais por Rota */}
            <tr className="bg-muted/50 font-bold">
              <td className="px-4 py-3 text-foreground border-r border-border">
                TOTAL POR PALETE
              </td>
              {routes.map(routeCode => {
                let routeTotal = 0;
                driverNames.forEach(driverName => {
                  routeTotal += data[driverName][routeCode] || 0;
                });
                return (
                  <td key={routeCode} className="px-4 py-3 text-center text-purple-600">
                    {routeTotal}
                  </td>
                );
              })}
              <td className="px-4 py-3 text-center text-blue-600 border-l border-border">
                {driverNames.reduce((sum, driver) => sum + data[driver].total, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legenda */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h4 className="font-medium text-foreground mb-3">Legenda</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-medium">N</div>
            <span className="text-muted-foreground">Quantidade de pacotes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-600">TOTAL</span>
            <span className="text-muted-foreground">Total por motorista</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-purple-600">TOTAL POR PALETE</span>
            <span className="text-muted-foreground">Total por rota</span>
          </div>
        </div>
      </div>
    </div>
  );
}
