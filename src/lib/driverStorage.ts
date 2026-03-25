import { Driver } from '@/types/delivery';
import { DriverService } from '@/services/driverService';

// Mantém compatibilidade com o código existente enquanto migra para MySQL
// Este arquivo agora serve como um adaptador para o novo serviço

const STORAGE_KEY = 'rotaflex_drivers';

// Função de migração para mover dados do localStorage para MySQL
async function migrateToMySQL(): Promise<void> {
  try {
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
      const drivers: Driver[] = JSON.parse(localData);
      
      // Migrar apenas se houver dados e se não houver motoristas no MySQL
      const existingDrivers = await DriverService.findAll();
      if (existingDrivers.length === 0 && drivers.length > 0) {
        console.log(`Migrando ${drivers.length} motoristas do localStorage para MySQL...`);
        
        for (const driver of drivers) {
          try {
            const mappedCoverageAreas = driver.coverageAreas ? 
              driver.coverageAreas.map(area => ({
                cidade: (area as any).city || (area as any).cidade || '',
                bairro: (area as any).neighborhood || (area as any).bairro || '',
                estado: (area as any).state || (area as any).estado || undefined
              })) : [];

            await DriverService.create({
              nome: driver.name,
              telefone: driver.phone,
              veiculo: driver.vehicle,
              placa: driver.licensePlate,
              cidade: driver.city,
              bairro: driver.neighborhood,
              estado: driver.state,
              ativo: driver.active,
              coverageAreas: mappedCoverageAreas
            });
          } catch (error) {
            console.error('Erro ao migrar motorista:', driver.name, error);
          }
        }
        
        console.log('Migração concluída. Removendo dados do localStorage...');
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error('Erro durante migração:', error);
  }
}

// Funções adaptadas que usam o novo serviço
export async function getDrivers(): Promise<Driver[]> {
  try {
    // Tentar usar o serviço MySQL primeiro
    const drivers = await DriverService.findAll();
    
    // Para cada motorista, buscar suas áreas de cobertura
    const driversWithCoverage = await Promise.all(
      drivers.map(async (driver) => {
        try {
          const coverageAreas = await DriverService.getCoverageAreas(driver.id);
          console.log(`📍 Carregando áreas para ${driver.nome}:`, coverageAreas);
          
          return {
            id: driver.id,
            name: driver.nome,
            phone: driver.telefone,
            vehicle: driver.veiculo,
            licensePlate: driver.placa,
            city: driver.cidade,
            neighborhood: driver.bairro,
            state: driver.estado,
            active: driver.ativo,
            coverageAreas: coverageAreas || [],
            createdAt: driver.created_at || new Date().toISOString()
          };
        } catch (error) {
          console.warn(`Erro ao carregar áreas para ${driver.nome}:`, error);
          return {
            id: driver.id,
            name: driver.nome,
            phone: driver.telefone,
            vehicle: driver.veiculo,
            licensePlate: driver.placa,
            city: driver.cidade,
            neighborhood: driver.bairro,
            state: driver.estado,
            active: driver.ativo,
            coverageAreas: [],
            createdAt: driver.created_at || new Date().toISOString()
          };
        }
      })
    );
    
    console.log('✅ Motoristas carregados com áreas de cobertura:', driversWithCoverage.length);
    return driversWithCoverage;
  } catch (error) {
    console.warn('Erro ao buscar motoristas do MySQL, usando localStorage como fallback:', error);
    
    // Fallback para localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export async function saveDrivers(drivers: Driver[]): Promise<void> {
  try {
    // Salvar no MySQL (implementação futura para bulk update)
    console.log('Salvando motoristas no MySQL...');
    
    // Por enquanto, manter no localStorage como backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drivers));
  } catch (error) {
    console.error('Erro ao salvar motoristas:', error);
    // Fallback para localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drivers));
  }
}

export async function addDriver(driverData: Omit<Driver, 'id' | 'createdAt'>): Promise<Driver> {
  try {
    // Usar o serviço MySQL
    const mappedCoverageAreas = driverData.coverageAreas ? 
      driverData.coverageAreas.map(area => ({
        cidade: (area as any).city || (area as any).cidade || '',
        bairro: (area as any).neighborhood || (area as any).bairro || '',
        estado: (area as any).state || (area as any).estado || undefined
      })) : [];

    const newDriver = await DriverService.create({
      nome: driverData.name,
      telefone: driverData.phone,
      veiculo: driverData.vehicle,
      placa: driverData.licensePlate,
      cidade: driverData.city,
      bairro: driverData.neighborhood,
      estado: driverData.state,
      ativo: driverData.active,
      coverageAreas: mappedCoverageAreas
    } as any); // Type assertion para evitar erros de TypeScript

    // Se há áreas de cobertura, adicioná-las separadamente
    if (mappedCoverageAreas.length > 0) {
      try {
        await DriverService.addCoverageAreas(newDriver.id, mappedCoverageAreas);
        console.log(`✅ ${mappedCoverageAreas.length} áreas de cobertura adicionadas para ${driverData.name}`);
      } catch (error) {
        console.error('Erro ao adicionar áreas de cobertura:', error);
      }
    }

    // Mapear para o formato esperado pelo frontend
    return {
      id: newDriver.id,
      name: (newDriver as any).nome || driverData.name,
      phone: (newDriver as any).telefone || driverData.phone,
      vehicle: (newDriver as any).veiculo || driverData.vehicle,
      licensePlate: (newDriver as any).placa || driverData.licensePlate,
      city: (newDriver as any).cidade || driverData.city,
      neighborhood: (newDriver as any).bairro || driverData.neighborhood,
      state: (newDriver as any).estado || driverData.state,
      active: (newDriver as any).ativo !== undefined ? (newDriver as any).ativo : driverData.active,
      coverageAreas: driverData.coverageAreas || [],
      createdAt: (newDriver as any).created_at || (newDriver as any).createdAt || new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao adicionar motorista no MySQL, usando localStorage como fallback:', error);
    
    // Fallback para localStorage
    const drivers = await getDrivers();
    const newDriver: Driver = {
      ...driverData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    drivers.push(newDriver);
    await saveDrivers(drivers);
    return newDriver;
  }
}

export async function updateDriver(id: string, data: Partial<Omit<Driver, 'id' | 'createdAt'>>): Promise<Driver | null> {
  try {
    // Usar o serviço MySQL
    const updateData: any = {};
    if (data.name !== undefined) updateData.nome = data.name;
    if (data.phone !== undefined) updateData.telefone = data.phone;
    if (data.vehicle !== undefined) updateData.veiculo = data.vehicle;
    if (data.licensePlate !== undefined) updateData.placa = data.licensePlate;
    if (data.city !== undefined) updateData.cidade = data.city;
    if (data.neighborhood !== undefined) updateData.bairro = data.neighborhood;
    if (data.state !== undefined) updateData.estado = data.state;
    if (data.active !== undefined) updateData.ativo = data.active;
    if (data.coverageAreas !== undefined) {
      // Mapear coverageAreas para o formato esperado pelo backend
      const mappedCoverageAreas = data.coverageAreas.map(area => ({
        cidade: (area as any).city || (area as any).cidade || '',
        bairro: (area as any).neighborhood || (area as any).bairro || '',
        estado: (area as any).state || (area as any).estado || undefined
      }));
      updateData.coverageAreas = mappedCoverageAreas;
    }

    const updatedDriver = await DriverService.update(id, updateData);
    
    if (!updatedDriver) return null;

    // Se há áreas de cobertura, atualizá-las separadamente
    if (data.coverageAreas !== undefined) {
      try {
        const mappedCoverageAreas = data.coverageAreas.map(area => ({
          cidade: (area as any).city || (area as any).cidade || '',
          bairro: (area as any).neighborhood || (area as any).bairro || '',
          estado: (area as any).state || (area as any).estado || undefined
        }));
        await DriverService.updateCoverageAreas(id, mappedCoverageAreas);
        console.log(`✅ ${mappedCoverageAreas.length} áreas de cobertura atualizadas para ${data.name}`);
      } catch (error) {
        console.error('Erro ao atualizar áreas de cobertura:', error);
      }
    }

    // Mapear para o formato esperado pelo frontend
    return {
      id: updatedDriver.id,
      name: (updatedDriver as any).nome || data.name,
      phone: (updatedDriver as any).telefone || data.phone,
      vehicle: (updatedDriver as any).veiculo || data.vehicle,
      licensePlate: (updatedDriver as any).placa || data.licensePlate,
      city: (updatedDriver as any).cidade || data.city,
      neighborhood: (updatedDriver as any).bairro || data.neighborhood,
      state: (updatedDriver as any).estado || data.state,
      active: (updatedDriver as any).ativo !== undefined ? (updatedDriver as any).ativo : data.active,
      coverageAreas: data.coverageAreas || [],
      createdAt: (updatedDriver as any).created_at || (updatedDriver as any).createdAt || new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao atualizar motorista no MySQL, usando localStorage como fallback:', error);
    
    // Fallback para localStorage
    const drivers = await getDrivers();
    const idx = drivers.findIndex(d => d.id === id);
    if (idx === -1) return null;
    
    drivers[idx] = { ...drivers[idx], ...data };
    await saveDrivers(drivers);
    return drivers[idx];
  }
}

export async function deleteDriver(id: string): Promise<boolean> {
  try {
    // Usar o serviço MySQL
    await DriverService.delete(id);
    return true;
  } catch (error) {
    console.error('Erro ao excluir motorista no MySQL, usando localStorage como fallback:', error);
    
    // Fallback para localStorage
    const drivers = await getDrivers();
    const filtered = drivers.filter(d => d.id !== id);
    if (filtered.length === drivers.length) return false;
    
    await saveDrivers(filtered);
    return true;
  }
}

// Iniciar migração automaticamente quando o módulo for carregado
if (typeof window !== 'undefined') {
  migrateToMySQL();
}

// Exportar função de migração para chamada manual se necessário
export { migrateToMySQL };
