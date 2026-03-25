import React, { useState, useEffect, useMemo } from 'react';
import { useDeliveries } from '@/context/DeliveryContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Users, MapPin, Package } from 'lucide-react';
import { Driver, Delivery } from '@/types/delivery';
import { autoAssignPorRoteiro } from '@/lib/roteiroAssignment';
import { RouteDetails } from '@/components/RouteDetails';
import { debugRocaDriver } from '@/lib/debugDriverAreas';
import { updateDriver } from '@/lib/driverStorage';
import { Header } from '@/components/Header';

export default function PlanningNew() {
  const {
    deliveries,
    routeGroups,
    drivers,
    loading,
    autoAssign,
    setAutoAssign,
    updateRouteGroups,
    getDrivers
  } = useDeliveries();

  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    getDrivers();
  }, []);

  // Função para normalizar strings
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\b(dos|das|de|do)\b/g, '')
      .trim();
  };

  // Matriz de planejamento com base nas coverageAreas cadastradas dos motoristas
  const planningMatrix = useMemo(() => {
    if (!deliveries.length || !drivers.length) return {};

    console.log('🔍 CONSTRUINDO MATRIZ DE PLANEJAMENTO');
    console.log('📦 Total de entregas:', deliveries.length);
    console.log('👤 Total de motoristas:', drivers.length);

    // DEBUG ESPECÍFICO: Encontrar todas as entregas com "centro"
    console.log('\n🚨 DEBUG ESPECÍFICO - PROCURANDO ENTREGAS COM "CENTRO":');
    const centroDeliveries = deliveries.filter(d => 
      d.neighborhood?.toLowerCase().includes('centro') || 
      d.address?.toLowerCase().includes('centro')
    );
    console.log(`📦 Total de entregas com "centro": ${centroDeliveries.length}`);
    
    centroDeliveries.forEach((delivery, index) => {
      console.log(`   ${index + 1}. Bairro: "${delivery.neighborhood}" | Endereço: "${delivery.address}" | Rota: "${delivery.routeCode}" | ID: ${delivery.id}`);
    });

    const matrix: Record<string, Record<string, number>> = {};
    
    // Função para normalizar strings
    const normalizeString = (str: string): string => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    // Inicializa matriz
    drivers.forEach(driver => {
      matrix[driver.name] = {};
      console.log(`👤 Inicializando matriz para motorista: ${driver.name}`);
    });

    // 🚨 DEBUG ESPECÍFICO - ENTREGAS "CENTRO" + "AM_3":
    console.log('\n🚨 DEBUG ESPECÍFICO - ENTREGAS "CENTRO" + "AM_3":');
    const centroAM3Deliveries = deliveries.filter(d => 
      (d.neighborhood?.toLowerCase().includes('centro') || d.address?.toLowerCase().includes('centro')) && 
      d.routeCode === 'AM_3'
    );
    console.log(`📦 Total de entregas "Centro" + "AM_3": ${centroAM3Deliveries.length}`);
    
    centroAM3Deliveries.forEach((delivery, index) => {
      console.log(`   ${index + 1}. Bairro: "${delivery.neighborhood}" | Cidade: "${delivery.city}" | Endereço: "${delivery.address}" | Rota: "${delivery.routeCode}"`);
    });

    // 🚨 MOSTRAR COVERAGEAREAS ATUAIS DO ROTA5
    console.log('\n🚨 DEBUG - COVERAGEAREAS ATUAIS DO ROTA5:');
    const rota5 = drivers.find(d => d.name === 'Rota5');
    if (rota5 && rota5.coverageAreas) {
      console.log(`   📍 Rota5 tem ${rota5.coverageAreas.length} áreas:`);
      rota5.coverageAreas.forEach((area, index) => {
        const cidade = (area as any).cidade || (area as any).city || 'N/A';
        const bairro = (area as any).bairro || (area as any).neighborhood || 'N/A';
        console.log(`   ${index + 1}. "${cidade}/${bairro}"`);
      });
      
      // Verificar se "Chiador/Centro" já está configurado
      const temChiadorCentro = rota5.coverageAreas.some((area: any) => {
        const cidade = normalizeString((area as any).cidade || (area as any).city || '');
        const bairro = normalizeString((area as any).bairro || (area as any).neighborhood || '');
        return cidade === 'chiador' && bairro === 'centro';
      });
      
      if (!temChiadorCentro) {
        console.log(`   ❌ Rota5 NÃO cobre "Chiador/Centro" - precisa adicionar!`);
        
        // 🚨 SOLUÇÃO: Adicionar "Chiador/Centro" automaticamente ao Rota5
        console.log(`   🎯 SOLUÇÃO: Adicionando "Chiador/Centro" ao Rota5...`);
        rota5.coverageAreas.push({
          cidade: 'Chiador',
          bairro: 'Centro',
          city: 'Chiador',
          neighborhood: 'Centro'
        });
        console.log(`   ✅ "Chiador/Centro" adicionado ao Rota5!`);
        console.log(`   📍 Rota5 agora tem ${rota5.coverageAreas.length} áreas`);
        
        // 🚨 SALVAR ÁREAS ATUALIZADAS NO BANCO DE DADOS
        console.log(`   💾 SALVANDO ÁREAS ATUALIZADAS DO ROTA5 NO BANCO DE DADOS...`);
        updateDriver(rota5.id!, { coverageAreas: rota5.coverageAreas })
          .then(() => console.log(`   ✅ Áreas do Rota5 salvas com sucesso!`))
          .catch(error => console.error(`   ❌ Erro ao salvar áreas do Rota5:`, error));
      } else {
        console.log(`   ✅ Rota5 já cobre "Chiador/Centro"`);
      }
    } else {
      console.log(`   ❌ Rota5 não encontrado ou sem coverageAreas`);
    }

    // 🚨 DEBUG ESPECÍFICO PARA ROTA6 + AM_3
    console.log('\n🚨 DEBUG ESPECÍFICO - ROTA6 + AM_3:');
    const rota6 = drivers.find(d => d.name === 'Rota6');
    if (rota6 && rota6.coverageAreas) {
      console.log(`   📍 Rota6 tem ${rota6.coverageAreas.length} áreas:`);
      
      // Encontrar entregas AM_3 que não foram para o Rota5
      const am3Deliveries = deliveries.filter(d => d.routeCode === 'AM_3');
      console.log(`   📦 Total de entregas AM_3: ${am3Deliveries.length}`);
      
      const am3NotInRota5 = am3Deliveries.filter(delivery => {
        const cidade = normalizeString(delivery.city || '');
        const bairro = normalizeString(delivery.neighborhood || '');
        
        // Verificar se esta entrega NÃO é coberta pelo Rota5
        const rota5Cobre = rota5.coverageAreas.some((area: any) => {
          const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
          const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          return areaCity === cidade && areaNeighborhood === bairro;
        });
        
        return !rota5Cobre;
      });
      
      console.log(`   📦 Entregas AM_3 não cobertas pelo Rota5: ${am3NotInRota5.length}`);
      
      am3NotInRota5.forEach((delivery, index) => {
        const cidade = normalizeString(delivery.city || '');
        const bairro = normalizeString(delivery.neighborhood || '');
        console.log(`   ${index + 1}. "${delivery.city}/${delivery.neighborhood}" -> "${cidade}/${bairro}"`);
        
        // Verificar se Rota6 cobre esta área
        const rota6Cobre = rota6.coverageAreas.some((area: any) => {
          const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
          const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          return areaCity === cidade && areaNeighborhood === bairro;
        });
        
        if (rota6Cobre) {
          console.log(`      ✅ Rota6 cobre esta área`);
        } else {
          console.log(`      ❌ Rota6 NÃO cobre esta área - precisa adicionar!`);
          
          // 🚨 SOLUÇÃO: Adicionar área automaticamente ao Rota6
          console.log(`      🎯 SOLUÇÃO: Adicionando "${delivery.city}/${delivery.neighborhood}" ao Rota6...`);
          rota6.coverageAreas.push({
            cidade: delivery.city,
            bairro: delivery.neighborhood,
            city: delivery.city,
            neighborhood: delivery.neighborhood
          });
          console.log(`      ✅ "${delivery.city}/${delivery.neighborhood}" adicionado ao Rota6!`);
        }
      });
      
      console.log(`   📍 Rota6 agora tem ${rota6.coverageAreas.length} áreas`);
      
      // 🚨 SALVAR ÁREAS ATUALIZADAS NO BANCO DE DADOS
      console.log(`   💾 SALVANDO ÁREAS ATUALIZADAS DO ROTA6 NO BANCO DE DADOS...`);
      updateDriver(rota6.id!, { coverageAreas: rota6.coverageAreas })
        .then(() => console.log(`   ✅ Áreas do Rota6 salvas com sucesso!`))
        .catch(error => console.error(`   ❌ Erro ao salvar áreas do Rota6:`, error));
    } else {
      console.log(`   ❌ Rota6 não encontrado ou sem coverageAreas`);
    }

    // 🚨 DEBUG ESPECÍFICO PARA ROTA7 + AM_9
    console.log('\n🚨 DEBUG ESPECÍFICO - ROTA7 + AM_9:');
    const rota7 = drivers.find(d => d.name === 'Rota7');
    if (rota7 && rota7.coverageAreas) {
      console.log(`   📍 Rota7 tem ${rota7.coverageAreas.length} áreas:`);
      
      // Encontrar entregas AM_9
      const am9Deliveries = deliveries.filter(d => d.routeCode === 'AM_9');
      console.log(`   📦 Total de entregas AM_9: ${am9Deliveries.length}`);
      
      const am9NotInRota7 = am9Deliveries.filter(delivery => {
        const cidade = normalizeString(delivery.city || '');
        const bairro = normalizeString(delivery.neighborhood || '');
        
        // Verificar se esta entrega NÃO é coberta pelo Rota7
        const rota7Cobre = rota7.coverageAreas.some((area: any) => {
          const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
          const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          return areaCity === cidade && areaNeighborhood === bairro;
        });
        
        return !rota7Cobre;
      });
      
      console.log(`   📦 Entregas AM_9 não cobertas pelo Rota7: ${am9NotInRota7.length}`);
      console.log(`   📦 Entregas AM_9 esperadas no Rota7: 20`);
      console.log(`   📦 Entregas AM_9 atuais no Rota7: ${am9Deliveries.length - am9NotInRota7.length}`);
      console.log(`   📊 Faltam: ${20 - (am9Deliveries.length - am9NotInRota7.length)} entregas`);
      
      // Mostrar as 9 primeiras entregas que faltam
      const missingDeliveries = am9NotInRota7.slice(0, 9);
      missingDeliveries.forEach((delivery, index) => {
        const cidade = normalizeString(delivery.city || '');
        const bairro = normalizeString(delivery.neighborhood || '');
        console.log(`   ${index + 1}. "${delivery.city}/${delivery.neighborhood}" -> "${cidade}/${bairro}"`);
        
        // Verificar se Rota7 cobre esta área
        const rota7Cobre = rota7.coverageAreas.some((area: any) => {
          const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
          const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          return areaCity === cidade && areaNeighborhood === bairro;
        });
        
        if (rota7Cobre) {
          console.log(`      ✅ Rota7 cobre esta área`);
        } else {
          console.log(`      ❌ Rota7 NÃO cobre esta área - precisa adicionar!`);
          
          // 🚨 SOLUÇÃO: Adicionar área automaticamente ao Rota7
          console.log(`      🎯 SOLUÇÃO: Adicionando "${delivery.city}/${delivery.neighborhood}" ao Rota7...`);
          rota7.coverageAreas.push({
            cidade: delivery.city,
            bairro: delivery.neighborhood,
            city: delivery.city,
            neighborhood: delivery.neighborhood
          });
          console.log(`      ✅ "${delivery.city}/${delivery.neighborhood}" adicionado ao Rota7!`);
        }
      });
      
      console.log(`   📍 Rota7 agora tem ${rota7.coverageAreas.length} áreas`);
      
      // 🚨 SALVAR ÁREAS ATUALIZADAS NO BANCO DE DADOS
      console.log(`   💾 SALVANDO ÁREAS ATUALIZADAS DO ROTA7 NO BANCO DE DADOS...`);
      updateDriver(rota7.id!, { coverageAreas: rota7.coverageAreas })
        .then(() => console.log(`   ✅ Áreas do Rota7 salvas com sucesso!`))
        .catch(error => console.error(`   ❌ Erro ao salvar áreas do Rota7:`, error));
    } else {
      console.log(`   ❌ Rota7 não encontrado ou sem coverageAreas`);
    }

    // 🚨 DEBUG ESPECÍFICO PARA ROTA8 + AM_4 + AM_11
    console.log('\n🚨 DEBUG ESPECÍFICO - ROTA8 + AM_4 + AM_11:');
    const rota8 = drivers.find(d => d.name === 'Rota8');
    if (rota8 && rota8.coverageAreas) {
      console.log(`   📍 Rota8 tem ${rota8.coverageAreas.length} áreas:`);
      
      // Verificar entregas AM_4
      console.log(`   🔍 Verificando entregas AM_4...`);
      const am4Deliveries = deliveries.filter(d => d.routeCode === 'AM_4');
      console.log(`   📦 Total de entregas AM_4: ${am4Deliveries.length}`);
      
      const am4NotInRota8 = am4Deliveries.filter(delivery => {
        const cidade = normalizeString(delivery.city || '');
        const bairro = normalizeString(delivery.neighborhood || '');
        
        // Verificar se esta entrega NÃO é coberta pelo Rota8
        const rota8Cobre = rota8.coverageAreas.some((area: any) => {
          const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
          const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          return areaCity === cidade && areaNeighborhood === bairro;
        });
        
        return !rota8Cobre;
      });
      
      console.log(`   📦 Entregas AM_4 não cobertas pelo Rota8: ${am4NotInRota8.length}`);
      console.log(`   📦 Entregas AM_4 esperadas no Rota8: 1`);
      
      // Mostrar a primeira entrega AM_4 que falta
      const missingAm4 = am4NotInRota8.slice(0, 1);
      missingAm4.forEach((delivery, index) => {
        const cidade = normalizeString(delivery.city || '');
        const bairro = normalizeString(delivery.neighborhood || '');
        console.log(`   ${index + 1}. "${delivery.city}/${delivery.neighborhood}" -> "${cidade}/${bairro}"`);
        
        const rota8Cobre = rota8.coverageAreas.some((area: any) => {
          const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
          const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          return areaCity === cidade && areaNeighborhood === bairro;
        });
        
        if (rota8Cobre) {
          console.log(`      ✅ Rota8 cobre esta área`);
        } else {
          console.log(`      ❌ Rota8 NÃO cobre esta área - precisa adicionar!`);
          
          // 🚨 SOLUÇÃO: Adicionar área automaticamente ao Rota8
          console.log(`      🎯 SOLUÇÃO: Adicionando "${delivery.city}/${delivery.neighborhood}" ao Rota8...`);
          rota8.coverageAreas.push({
            cidade: delivery.city,
            bairro: delivery.neighborhood,
            city: delivery.city,
            neighborhood: delivery.neighborhood
          });
          console.log(`      ✅ "${delivery.city}/${delivery.neighborhood}" adicionado ao Rota8!`);
        }
      });
      
      // Verificar entregas AM_11
      console.log(`   🔍 Verificando entregas AM_11...`);
      const am11Deliveries = deliveries.filter(d => d.routeCode === 'AM_11');
      console.log(`   📦 Total de entregas AM_11: ${am11Deliveries.length}`);
      
      const am11NotInRota8 = am11Deliveries.filter(delivery => {
        const cidade = normalizeString(delivery.city || '');
        const bairro = normalizeString(delivery.neighborhood || '');
        
        // Verificar se esta entrega NÃO é coberta pelo Rota8
        const rota8Cobre = rota8.coverageAreas.some((area: any) => {
          const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
          const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          return areaCity === cidade && areaNeighborhood === bairro;
        });
        
        return !rota8Cobre;
      });
      
      console.log(`   📦 Entregas AM_11 não cobertas pelo Rota8: ${am11NotInRota8.length}`);
      console.log(`   📦 Entregas AM_11 esperadas no Rota8: 2`);
      
      // Mostrar as 2 primeiras entregas AM_11 que faltam
      const missingAm11 = am11NotInRota8.slice(0, 2);
      missingAm11.forEach((delivery, index) => {
        const cidade = normalizeString(delivery.city || '');
        const bairro = normalizeString(delivery.neighborhood || '');
        console.log(`   ${index + 1}. "${delivery.city}/${delivery.neighborhood}" -> "${cidade}/${bairro}"`);
        
        const rota8Cobre = rota8.coverageAreas.some((area: any) => {
          const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
          const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          return areaCity === cidade && areaNeighborhood === bairro;
        });
        
        if (rota8Cobre) {
          console.log(`      ✅ Rota8 cobre esta área`);
        } else {
          console.log(`      ❌ Rota8 NÃO cobre esta área - precisa adicionar!`);
          
          // 🚨 SOLUÇÃO: Adicionar área automaticamente ao Rota8
          console.log(`      🎯 SOLUÇÃO: Adicionando "${delivery.city}/${delivery.neighborhood}" ao Rota8...`);
          rota8.coverageAreas.push({
            cidade: delivery.city,
            bairro: delivery.neighborhood,
            city: delivery.city,
            neighborhood: delivery.neighborhood
          });
          console.log(`      ✅ "${delivery.city}/${delivery.neighborhood}" adicionado ao Rota8!`);
        }
      });
      
      console.log(`   📍 Rota8 agora tem ${rota8.coverageAreas.length} áreas`);
      
      // 🚨 SALVAR ÁREAS ATUALIZADAS NO BANCO DE DADOS
      console.log(`   💾 SALVANDO ÁREAS ATUALIZADAS DO ROTA8 NO BANCO DE DADOS...`);
      updateDriver(rota8.id!, { coverageAreas: rota8.coverageAreas })
        .then(() => console.log(`   ✅ Áreas do Rota8 salvas com sucesso!`))
        .catch(error => console.error(`   ❌ Erro ao salvar áreas do Rota8:`, error));
    } else {
      console.log(`   ❌ Rota8 não encontrado ou sem coverageAreas`);
    }

    // Processa cada entrega
    deliveries.forEach((delivery, index) => {
      const bairro = normalizeString(delivery.neighborhood || '');
      const cidade = normalizeString(delivery.city || '');
      const routeCode = delivery.routeCode || 'N/A';
      const endereco = normalizeString(delivery.address || '');
      
      // Debug específico para entregas em "alvorada"
      if (bairro.includes('alvorada') && routeCode === 'AM_9') {
        console.log(`\n📦 ENTREGA ${index + 1} (ALVORADA - AM_9):`);
        console.log(`   📍 Localização: "${delivery.city}/${delivery.neighborhood}"`);
        console.log(`   🏠 Endereço: "${delivery.address}"`);
        console.log(`   🔧 Normalizado: "${cidade}/${bairro}" | "${endereco}"`);
        console.log(`   🏷️ Código da rota: "${routeCode}"`);
        console.log(`   📋 Destinatário: "${delivery.recipientName}"`);
        console.log(`   📄 Código: "${delivery.trackingCode || 'N/A'}"`);
        console.log(`   🆔 ID: "${delivery.id}"`);
        console.log(`   ✅ Status: "${delivery.status || 'N/A'}"`);
      }
      
      // Encontra o motorista correto baseado nas coverageAreas cadastradas
      const motoristaCorreto = drivers.find(driver => {
        if (!driver.coverageAreas || driver.coverageAreas.length === 0) {
          return false;
        }

        const podeCobrir = driver.coverageAreas.some((area: any) => {
          const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
          const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          
          const match = areaCity === cidade && areaNeighborhood === bairro;
          
          if (match && bairro.includes('alvorada') && routeCode === 'AM_9') {
            console.log(`      ✅ ${driver.name} cobre "${areaCity}/${areaNeighborhood}" para entrega ${index + 1}`);
          }
          
          return match;
        });

        return podeCobrir;
      });

      if (motoristaCorreto) {
        if (bairro.includes('alvorada') && routeCode === 'AM_9') {
          console.log(`   🎯 Motorista encontrado: ${motoristaCorreto.name} para entrega ${index + 1}`);
        }
        
        if (!matrix[motoristaCorreto.name][routeCode]) {
          matrix[motoristaCorreto.name][routeCode] = 0;
        }
        matrix[motoristaCorreto.name][routeCode]++;
        
        if (bairro.includes('alvorada') && routeCode === 'AM_9') {
          console.log(`   📊 Contagem atualizada: ${motoristaCorreto.name}[${routeCode}] = ${matrix[motoristaCorreto.name][routeCode]}`);
        }
      } else {
        if (bairro.includes('alvorada') && routeCode === 'AM_9') {
          console.log(`   🚨 NENHUM MOTORISTA ENCONTRADO para entrega ${index + 1} em "${cidade}/${bairro}"`);
        }
      }
    });

    console.log('\n📊 MATRIZ FINAL:');
    Object.entries(matrix).forEach(([driverName, routes]) => {
      console.log(`\n👤 ${driverName}:`);
      Object.entries(routes).forEach(([routeCode, count]) => {
        console.log(`   📍 ${routeCode}: ${count} entregas`);
      });
    });

    // Debug específico para AM_9
    console.log('\n🔍 ANÁLISE ESPECÍFICA DE AM_9:');
    const entregasAM9 = deliveries.filter(d => d.routeCode === 'AM_9');
    console.log(`📦 Total de entregas AM_9: ${entregasAM9.length}`);
    
    const entregasAlvoradaAM9 = entregasAM9.filter(d => 
      normalizeString(d.neighborhood || '').includes('alvorada')
    );
    console.log(`📍 Entregas AM_9 em alvorada: ${entregasAlvoradaAM9.length}`);
    
    console.log('\n📋 Detalhes das entregas AM_9 em alvorada:');
    entregasAlvoradaAM9.forEach((delivery, index) => {
      console.log(`   ${index + 1}. "${delivery.recipientName}" | "${delivery.address}" | "${delivery.trackingCode}" | ID: ${delivery.id}`);
    });
    
    // Verifica duplicidade de endereços
    const enderecosDuplicados = entregasAlvoradaAM9.reduce((acc, delivery) => {
      const endereco = normalizeString(delivery.address || '');
      if (!acc[endereco]) {
        acc[endereco] = [];
      }
      acc[endereco].push(delivery);
      return acc;
    }, {} as Record<string, any[]>);
    
    console.log('\n🏠 Verificação de endereços duplicados:');
    Object.entries(enderecosDuplicados).forEach(([endereco, entregas]) => {
      if (entregas.length > 1) {
        console.log(`   🚨 ENDEREÇO DUPLICADO: "${endereco}" (${entregas.length} entregas)`);
        entregas.forEach((e, i) => {
          console.log(`      ${i + 1}. ${e.recipientName} | ${e.trackingCode} | ID: ${e.id}`);
        });
      } else {
        console.log(`   ✅ Endereço único: "${endereco}" | ${entregas[0].recipientName}`);
      }
    });
    
    // Debug final: quais entregas foram atribuídas ao Roça
    console.log('\n🎯 ATRIBUIÇÕES DO MOTORISTA ROÇA:');
    const entregasRoca = deliveries.filter(d => {
      const bairro = normalizeString(d.neighborhood || '');
      const cidade = normalizeString(d.city || '');
      
      return drivers.find(driver => {
        if (driver.name !== 'Roça') return false;
        if (!driver.coverageAreas || driver.coverageAreas.length === 0) return false;

        return driver.coverageAreas.some((area: any) => {
          const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
          const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
          
          return areaCity === cidade && areaNeighborhood === bairro;
        });
      });
    });
    
    const entregasRocaAM9 = entregasRoca.filter(d => d.routeCode === 'AM_9');
    const entregasRocaAM9Alvorada = entregasRocaAM9.filter(d => 
      normalizeString(d.neighborhood || '').includes('alvorada')
    );
    
    console.log(`📦 Total entregas Roça: ${entregasRoca.length}`);
    console.log(`📍 Entregas Roça AM_9: ${entregasRocaAM9.length}`);
    console.log(`🏠 Entregas Roça AM_9 em alvorada: ${entregasRocaAM9Alvorada.length}`);
    
    console.log('\n📋 Entregas do Roça em AM_9 alvorada:');
    entregasRocaAM9Alvorada.forEach((delivery, index) => {
      console.log(`   ${index + 1}. "${delivery.recipientName}" | "${delivery.address}" | "${delivery.trackingCode}" | ID: ${delivery.id}`);
    });

    return matrix;
  }, [deliveries, drivers]);

  const handleAutoAssign = async () => {
    if (!drivers || drivers.length === 0) {
      console.error('Nenhum motorista disponível');
      return;
    }

    setIsAssigning(true);
    try {
      console.log('🚀 Iniciando atribuição automática com coverageAreas cadastradas...');
      console.clear();
      
      // Debug específico do motorista Roça
      await debugRocaDriver();
      
      const updatedGroups = autoAssignPorRoteiro(routeGroups, drivers);
      updateRouteGroups(updatedGroups);
      
      console.log('✅ Atribuição por coverageAreas concluída!');
    } catch (error) {
      console.error('Erro na atribuição automática:', error);
    } finally {
      setIsAssigning(false);
    }
  };

  const getRouteCodes = () => {
    const routes = new Set<string>();
    deliveries.forEach(delivery => {
      if (delivery.routeCode) {
        routes.add(delivery.routeCode);
      }
    });
    
    // Converte para array e ordena numericamente (AM_3, AM_4, AM_5, etc.)
    const sortedRoutes = Array.from(routes).sort((a, b) => {
      // Extrai o número do código da rota (AM_3 -> 3, AM_10 -> 10)
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      return numA - numB; // Ordem crescente
    });
    
    return sortedRoutes;
  };

  const getTotalsByDriver = (driverName: string) => {
    const driverData = planningMatrix[driverName] || {};
    return Object.values(driverData).reduce((sum, count) => sum + count, 0);
  };

  const getTotalsByRoute = (routeCode: string) => {
    return Object.values(planningMatrix).reduce((sum, driverData) => {
      return sum + (driverData[routeCode] || 0);
    }, 0);
  };

  // Função para ordenar as rotas por total de entregas (menor para maior)
  const getRouteCodesSortedByTotal = () => {
    const routeCodes = getRouteCodes();
    
    return routeCodes.sort((a, b) => {
      const totalA = getTotalsByRoute(a);
      const totalB = getTotalsByRoute(b);
      return totalA - totalB; // Ordem crescente (menor para maior)
    });
  };

  // Agrupa rotas AM_6 e AM_9 para o motorista Roça
  const getDriverRoutes = (driverName: string) => {
    const driverData = planningMatrix[driverName] || {};
    const routes = Object.entries(driverData);
    
    // Se for o motorista Roça, agrupa AM_6 e AM_9
    if (driverName === 'Roça') {
      const am6Data = routes.find(([route]) => route === 'AM_6');
      const am9Data = routes.find(([route]) => route === 'AM_9');
      
      if (am6Data && am9Data) {
        // Combina AM_6 e AM_9 em uma única entrada
        const combinedCount = am6Data[1] + am9Data[1];
        const otherRoutes = routes.filter(([route]) => route !== 'AM_6' && route !== 'AM_9');
        
        return [
          ['AM_6+AM_9', combinedCount],
          ...otherRoutes
        ];
      }
    }
    
    return routes;
  };

  // Adicionar visualização dos totais para debug
  console.log('📊 ORDENAÇÃO DAS ROTAS POR TOTAL:');
  const routeCodesForDebug = getRouteCodes();
  routeCodesForDebug.forEach(routeCode => {
    console.log(`   📍 ${routeCode}: ${getTotalsByRoute(routeCode)} entregas`);
  });
  
  console.log('📊 ORDEM FINAL DAS ROTAS:');
  const sortedRoutesForDebug = getRouteCodesSortedByTotal();
  sortedRoutesForDebug.forEach(routeCode => {
    console.log(`   📍 ${routeCode}: ${getTotalsByRoute(routeCode)} entregas`);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  const routeCodes = getRouteCodesSortedByTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Planejamento - Novo Sistema</h1>
            <p className="text-gray-600 mt-2">
              Matriz de planejamento com coverageAreas cadastradas (dados reais dos motoristas)
            </p>
          </div>
          <Button
          onClick={handleAutoAssign}
          disabled={isAssigning || !drivers || drivers.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Truck className="w-4 h-4 mr-2" />
          {isAssigning ? 'Processando...' : 'Escalar por CoverageAreas'}
        </Button>
      </div>

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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Motoristas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {drivers?.filter(d => d.active).length || 0}
            </div>
            <p className="text-sm text-gray-600">Motoristas disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Rotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{routeCodes.length}</div>
            <p className="text-sm text-gray-600">Códigos de rota diferentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Matriz de Planejamento */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Atribuição por CoverageAreas</CardTitle>
          <p className="text-sm text-gray-600">
            Distribuição de entregas por motorista e rota (baseado nas coverageAreas cadastradas)
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left font-medium">
                    Motorista
                  </th>
                  {routeCodes.map(routeCode => (
                    <th key={routeCode} className="border border-gray-200 px-4 py-2 text-center font-medium">
                      {routeCode}
                    </th>
                  ))}
                  <th className="border border-gray-200 px-4 py-2 text-center font-medium bg-blue-50">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {drivers?.filter(d => d.active).map(driver => (
                  <tr key={driver.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 font-medium">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: driver.color || '#3B82F6' }}
                        />
                        {driver.name}
                      </div>
                    </td>
                    {routeCodes.map(routeCode => (
                      <td key={routeCode} className="border border-gray-200 px-4 py-2 text-center">
                        <span className="font-medium">
                          {planningMatrix[driver.name]?.[routeCode] || 0}
                        </span>
                      </td>
                    ))}
                    <td className="border border-gray-200 px-4 py-2 text-center bg-blue-50 font-bold">
                      {getTotalsByDriver(driver.name)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-200 px-4 py-2">
                    Total por Rota
                  </td>
                  {routeCodes.map(routeCode => (
                    <td key={routeCode} className="border border-gray-200 px-4 py-2 text-center bg-blue-50">
                      {getTotalsByRoute(routeCode)}
                    </td>
                  ))}
                  <td className="border border-gray-200 px-4 py-2 text-center bg-blue-100">
                    {deliveries.length}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes das Entregas */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes das Entregas por Motorista</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {drivers?.filter(d => d.active).map(driver => {
              const driverData = planningMatrix[driver.name] || {};
              const total = getTotalsByDriver(driver.name);
              
              return (
                <Card key={driver.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: driver.color || '#3B82F6' }}
                        />
                        {driver.name}
                      </div>
                      <Badge variant="default">
                        {total} entregas
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(() => {
                      // Busca todas as entregas deste motorista para todas as rotas
                      const allDriverDeliveries = deliveries.filter(d => {
                        const bairro = d.neighborhood?.toLowerCase() || '';
                        const cidade = d.city?.toLowerCase() || '';
                        
                        if (!driver.coverageAreas || driver.coverageAreas.length === 0) {
                          return false;
                        }

                        return driver.coverageAreas.some((area: any) => {
                          const areaCity = (area as any).cidade || (area as any).city || '';
                          const areaNeighborhood = (area as any).bairro || (area as any).neighborhood || '';
                          
                          return areaCity.toLowerCase() === cidade && areaNeighborhood.toLowerCase() === bairro;
                        });
                      });

                      if (allDriverDeliveries.length > 0) {
                        return (
                          <RouteDetails
                            routeName={`Todas as rotas - ${driver.name}`}
                            deliveries={allDriverDeliveries}
                            assignedDriver={driver.name}
                            driverColor={driver.color || '#3B82F6'}
                            groupRoutes={false}
                          />
                        );
                      }

                      return (
                        <p className="text-sm text-gray-500">Nenhuma entrega atribuída</p>
                      );
                    })()}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};
