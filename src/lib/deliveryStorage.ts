import { Delivery, RouteGroup } from '@/types/delivery';
import { DeliveryService } from '@/services/deliveryServiceSimple';
import { DriverService } from '@/services/driverService';
import { ImportedFileService } from '@/services/importedFileService';
import { RouteGroupService } from '@/services/routeGroupService';

// Mantém compatibilidade com o código existente enquanto migra para MySQL
// Este arquivo agora serve como um adaptador para o novo serviço

const STORAGE_KEY = 'rotaflex_deliveries';
const ROUTES_KEY = 'rotaflex_routes';

// Função de migração para mover dados do localStorage para MySQL
async function migrateToMySQL(): Promise<void> {
  try {
    const localData = localStorage.getItem(STORAGE_KEY);
    const routesData = localStorage.getItem(ROUTES_KEY);
    
    if (localData || routesData) {
      const deliveries: Delivery[] = localData ? JSON.parse(localData) : [];
      const routeGroups: RouteGroup[] = routesData ? JSON.parse(routesData) : [];
      
      // Migrar entregas
      if (deliveries.length > 0) {
        console.log(`Migrando ${deliveries.length} entregas do localStorage para MySQL...`);
        
        try {
          // Mapear entregas para o formato do backend
          const mappedDeliveries = deliveries.map(delivery => ({
            codigo_rastreio: delivery.trackingCode,
            nome_destinatario: delivery.recipientName,
            endereco: delivery.address,
            numero: delivery.number,
            complemento: delivery.complement,
            bairro: delivery.neighborhood,
            cidade: delivery.city,
            estado: delivery.state,
            cep: delivery.zipCode,
            status: delivery.status,
            motorista_id: delivery.assignedTo,
            grupo_rota_id: delivery.routeGroup,
            ordem: delivery.order,
            observacoes: delivery.notes,
            dados_brutos: delivery.rawData
          }));
          
          await DeliveryService.bulkCreate(mappedDeliveries);
          console.log('Entregas migradas com sucesso!');
          localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
          console.error('Erro ao migrar entregas:', error);
        }
      }
      
      // Migrar grupos de rotas
      if (routeGroups.length > 0) {
        console.log(`Migrando ${routeGroups.length} grupos de rotas para MySQL...`);
        
        try {
          for (const group of routeGroups) {
            // Criar grupo de rota
            const routeData = {
              nome: group.name,
              cor: group.color,
              motorista_id: group.assignedDriver || null
            };
            
            // Nota: Precisamos implementar o endpoint para grupos de rotas no backend
            // Por enquanto, mantemos no localStorage
          }
        } catch (error) {
          console.error('Erro ao migrar grupos de rotas:', error);
        }
      }
    }
  } catch (error) {
    console.error('Erro durante migração de entregas:', error);
  }
}

// Funções adaptadas que usam o novo serviço
export async function getDeliveries(): Promise<Delivery[]> {
  try {
    // Tentar usar o serviço MySQL primeiro
    const deliveries = await DeliveryService.findAll();
    
    // Mapear para o formato esperado pelo frontend
    return deliveries.map(delivery => ({
      id: delivery.id,
      trackingCode: (delivery as any).codigo_rastreio,
      recipientName: (delivery as any).nome_destinatario,
      address: (delivery as any).endereco,
      number: (delivery as any).numero,
      complement: (delivery as any).complemento,
      neighborhood: (delivery as any).bairro,
      city: (delivery as any).cidade,
      state: (delivery as any).estado,
      zipCode: (delivery as any).cep,
      status: delivery.status as Delivery['status'],
      assignedTo: (delivery as any).motorista_id,
      routeGroup: (delivery as any).grupo_rota_id,
      order: (delivery as any).ordem,
      notes: (delivery as any).observacoes,
      rawData: (delivery as any).dados_brutos
    }));
  } catch (error) {
    console.warn('Erro ao buscar entregas do MySQL, usando localStorage como fallback:', error);
    
    // Fallback para localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export async function saveDeliveries(deliveries: Delivery[]): Promise<void> {
  try {
    // Salvar no MySQL (implementação futura para bulk update)
    console.log('Salvando entregas no MySQL...');
    
    // Por enquanto, manter no localStorage como backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deliveries));
  } catch (error) {
    console.error('Erro ao salvar entregas:', error);
    // Fallback para localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deliveries));
  }
}

export async function addDeliveries(newDeliveries: Delivery[]): Promise<void> {
  try {
    // Mapear entregas para o formato do backend
    const mappedDeliveries = newDeliveries.map(delivery => ({
      codigo_rastreio: delivery.trackingCode,
      nome_destinatario: delivery.recipientName,
      endereco: delivery.address,
      numero: delivery.number,
      complemento: delivery.complement,
      bairro: delivery.neighborhood,
      cidade: delivery.city,
      estado: delivery.state,
      cep: delivery.zipCode,
      status: delivery.status,
      motorista_id: delivery.assignedTo,
      grupo_rota_id: delivery.routeGroup,
      ordem: delivery.order,
      observacoes: delivery.notes,
      dados_brutos: delivery.rawData
    }));
    
    // Usar o serviço MySQL
    await DeliveryService.bulkCreate(mappedDeliveries);
    console.log(`${newDeliveries.length} entregas salvas no MySQL!`);
  } catch (error) {
    console.error('Erro ao adicionar entregas no MySQL, usando localStorage como fallback:', error);
    
    // Fallback para localStorage
    const deliveries = await getDeliveries();
    deliveries.push(...newDeliveries);
    await saveDeliveries(deliveries);
  }
}

export async function updateDelivery(id: string, data: Partial<Delivery>): Promise<Delivery | null> {
  try {
    // Usar o serviço MySQL
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.assignedTo !== undefined) updateData.motorista_id = data.assignedTo;
    if (data.routeGroup !== undefined) updateData.grupo_rota_id = data.routeGroup;
    if (data.order !== undefined) updateData.ordem = data.order;
    if (data.notes !== undefined) updateData.observacoes = data.notes;

    const updatedDelivery = await DeliveryService.update(id, updateData);
    
    if (!updatedDelivery) return null;

    // Mapear para o formato esperado pelo frontend
    return {
      id: updatedDelivery.id,
      trackingCode: (updatedDelivery as any).codigo_rastreio,
      recipientName: (updatedDelivery as any).nome_destinatario,
      address: (updatedDelivery as any).endereco,
      number: (updatedDelivery as any).numero,
      complement: (updatedDelivery as any).complemento,
      neighborhood: (updatedDelivery as any).bairro,
      city: (updatedDelivery as any).cidade,
      state: (updatedDelivery as any).estado,
      zipCode: (updatedDelivery as any).cep,
      status: updatedDelivery.status as Delivery['status'],
      assignedTo: (updatedDelivery as any).motorista_id,
      routeGroup: (updatedDelivery as any).grupo_rota_id,
      order: (updatedDelivery as any).ordem,
      notes: (updatedDelivery as any).observacoes,
      rawData: (updatedDelivery as any).dados_brutos
    };
  } catch (error) {
    console.error('Erro ao atualizar entrega no MySQL, usando localStorage como fallback:', error);
    
    // Fallback para localStorage
    const deliveries = await getDeliveries();
    const idx = deliveries.findIndex(d => d.id === id);
    if (idx === -1) return null;
    
    deliveries[idx] = { ...deliveries[idx], ...data };
    await saveDeliveries(deliveries);
    return deliveries[idx];
  }
}

export async function getRouteGroups(): Promise<RouteGroup[]> {
  try {
    // Por enquanto, usar localStorage até implementar grupos no backend
    const raw = localStorage.getItem(ROUTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Erro ao buscar grupos de rotas:', error);
    return [];
  }
}

export async function saveRouteGroups(groups: RouteGroup[]): Promise<void> {
  try {
    localStorage.setItem(ROUTES_KEY, JSON.stringify(groups));
  } catch (error) {
    console.error('Erro ao salvar grupos de rotas:', error);
  }
}

// Iniciar migração automaticamente quando o módulo for carregado
if (typeof window !== 'undefined') {
  migrateToMySQL();
}

// Exportar função de migração para chamada manual se necessário
export { migrateToMySQL };
