import { DriverService } from '@/services/driverService';

/**
 * Função para debugar e mostrar as coverageAreas de todos os motoristas
 */
export async function debugDriverAreas() {
  console.log('🔍 DEBUG DAS COVERAGEAREAS DOS MOTORISTAS');
  
  try {
    // Busca todos os motoristas
    const drivers = await DriverService.findAll();
    
    console.log(`📋 Encontrados ${drivers.length} motoristas no sistema\n`);
    
    for (const driver of drivers) {
      console.log(`👤 MOTORISTA: ${(driver as any).nome}`);
      console.log(`   📱 ID: ${driver.id}`);
      console.log(`   ✅ Ativo: ${(driver as any).ativo ? 'Sim' : 'Não'}`);
      
      // Busca as coverageAreas deste motorista
      try {
        const coverageAreas = await DriverService.getCoverageAreas(driver.id);
        console.log(`   📍 Áreas de cobertura: ${coverageAreas.length}`);
        
        if (coverageAreas.length > 0) {
          coverageAreas.forEach((area, index) => {
            console.log(`      ${index + 1}. "${(area as any).cidade}/${(area as any).bairro}"`);
          });
        } else {
          console.log('      ❌ Nenhuma área de cobertura configurada');
        }
      } catch (error) {
        console.log(`      🚨 Erro ao buscar áreas: ${error}`);
      }
      
      console.log('---');
    }
    
    // Mostra um resumo
    console.log('\n📊 RESUMO:');
    const totalAreas = await Promise.all(
      drivers.map(async (driver) => {
        try {
          const areas = await DriverService.getCoverageAreas(driver.id);
          return {
            nome: (driver as any).nome,
            areas: areas.length,
            ativo: (driver as any).ativo
          };
        } catch {
          return {
            nome: (driver as any).nome,
            areas: 0,
            ativo: (driver as any).ativo
          };
        }
      })
    );
    
    totalAreas.forEach(driver => {
      console.log(`   👤 ${driver.nome}: ${driver.areas} áreas (${driver.ativo ? 'ativo' : 'inativo'})`);
    });
    
  } catch (error) {
    console.error('🚨 Erro ao buscar motoristas:', error);
  }
}

/**
 * Função específica para debugar o motorista "Roça"
 */
export async function debugRocaDriver() {
  console.log('🔍 DEBUG ESPECÍFICO DO MOTORISTA "ROÇA"');
  
  try {
    // Busca todos os motoristas
    const drivers = await DriverService.findAll();
    
    // Encontra o motorista "Roça"
    const rocaDriver = drivers.find(d => 
      ((d as any).nome || '').toLowerCase().includes('roça') || 
      ((d as any).nome || '').toLowerCase().includes('roca')
    );
    
    if (!rocaDriver) {
      console.log('🚨 Motorista "Roça" não encontrado!');
      console.log('📋 Motoristas disponíveis:');
      drivers.forEach(d => console.log(`   - ${(d as any).nome}`));
      return;
    }
    
    console.log(`👤 MOTORISTA ENCONTRADO: ${(rocaDriver as any).nome}`);
    console.log(`   📱 ID: ${rocaDriver.id}`);
    console.log(`   ✅ Ativo: ${(rocaDriver as any).ativo ? 'Sim' : 'Não'}`);
    
    // Busca as coverageAreas do motorista Roça
    const coverageAreas = await DriverService.getCoverageAreas(rocaDriver.id);
    
    console.log(`   📍 Áreas de cobertura: ${coverageAreas.length}`);
    
    if (coverageAreas.length > 0) {
      console.log('   📍 Áreas configuradas:');
      coverageAreas.forEach((area, index) => {
        console.log(`      ${index + 1}. "${(area as any).cidade}/${(area as any).bairro}"`);
      });
    } else {
      console.log('      ❌ Nenhuma área de cobertura configurada');
    }
    
    // Sugestão de áreas que deveriam estar configuradas
    console.log('\n💡 SUGESTÃO DE ÁREAS PARA O MOTORISTA "ROÇA":');
    console.log('   📍 Áreas comuns para motorista "Roça":');
    console.log('      1. "paraiba sul/alto limoeiro"');
    console.log('      2. "paraiba sul/alvorada"');
    console.log('      3. "paraiba sul/brocotó"');
    console.log('      4. "paraiba sul/bela vista"');
    console.log('      5. "werneck/alvorada"');
    console.log('      6. "werneck/bela vista"');
    
  } catch (error) {
    console.error('🚨 Erro ao buscar motorista "Roça":', error);
  }
}
