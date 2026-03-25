import { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { Delivery, RouteGroup } from '@/types/delivery';
import { parseSpreadsheet } from '@/lib/parseSpreadsheet';
import { parsePdf } from '@/lib/parsePdf';
import { groupDeliveries, getStats, GroupingMode } from '@/lib/routeOptimizer';
import { getDrivers } from '@/lib/driverStorage';
import { autoAssignDrivers } from '@/lib/driverAssignment';
import { addDeliveries, getDeliveries } from '@/lib/deliveryStorage';
import { ImportedFileService } from '@/services/importedFileService';
import { RouteGroupService } from '@/services/routeGroupService';

export interface DeliveryContextType {
  deliveries: Delivery[];
  routeGroups: RouteGroup[];
  stats: ReturnType<typeof getStats>;
  groupingMode: GroupingMode;
  setGroupingMode: (mode: GroupingMode) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  autoAssign: boolean;
  setAutoAssign: (val: boolean) => void;
  manualAssignments: Record<number, string>;
  handleFileLoaded: (data: ArrayBuffer, fileType: 'spreadsheet' | 'pdf') => void;
  handleStatusChange: (deliveryId: string, status: Delivery['status']) => void;
  handleManualAssign: (groupId: number, driverId: string | undefined) => void;
  handleReset: () => void;
  hasData: boolean;
  drivers: any[];
  updateRouteGroups: (groups: RouteGroup[]) => void;
  getDrivers: () => Promise<void>;
  loading: boolean;
}

const DeliveryContext = createContext<DeliveryContextType | null>(null);

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('routeCode');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoAssign, setAutoAssign] = useState(false);
  const [manualAssignments, setManualAssignments] = useState<Record<number, string>>({});
  const [routeGroups, setRouteGroups] = useState<RouteGroup[]>([]);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar motoristas e entregas do storage
  const loadDrivers = useCallback(async () => {
    try {
      const loadedDrivers = await getDrivers();
      setDrivers(Array.isArray(loadedDrivers) ? loadedDrivers : []);
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedDrivers, loadedDeliveries] = await Promise.all([
          getDrivers(),
          getDeliveries()
        ]);
        setDrivers(Array.isArray(loadedDrivers) ? loadedDrivers : []);
        setDeliveries(Array.isArray(loadedDeliveries) ? loadedDeliveries : []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => getStats(deliveries), [deliveries]);

  const handleFileLoaded = useCallback(async (data: ArrayBuffer, fileType: 'spreadsheet' | 'pdf', fileName?: string) => {
    let parsed: Delivery[];
    if (fileType === 'pdf') {
      parsed = await parsePdf(data);
    } else {
      parsed = parseSpreadsheet(data);
    }
    
    try {
      // Registrar arquivo importado no banco
      if (fileName) {
        console.log('📄 Registrando arquivo importado:', {
          nome_arquivo: fileName,
          tipo_arquivo: fileType,
          tamanho_bytes: data.byteLength,
          quantidade_registros: parsed.length
        });
        
        const fileResponse = await ImportedFileService.create({
          nome_arquivo: fileName,
          tipo_arquivo: fileType === 'spreadsheet' ? 'xlsx' : fileType,
          tamanho_arquivo: data.byteLength,
          quantidade_registros: parsed.length,
          status_importacao: 'completed'
        });
        
        console.log('✅ Arquivo registrado:', fileResponse);
      }
      
      // Salvar entregas no MySQL através do novo serviço
      console.log('📦 Salvando entregas no MySQL...');
      await addDeliveries(parsed);
      console.log('✅ Entregas salvas');
      
      // Criar grupos de rotas no banco
      console.log('🚚 Criando grupos de rotas...');
      const groups = groupDeliveries(parsed, groupingMode);
      console.log('📋 Grupos a criar:', groups);
      
      for (const group of groups) {
        try {
          console.log('Criando grupo:', group.name);
          const routeResponse = await RouteGroupService.create({
            nome: group.name,
            cor: group.color
          });
          console.log('✅ Grupo criado:', routeResponse);
        } catch (error) {
          console.error('❌ Erro ao criar grupo de rota:', error);
        }
      }
      
      setDeliveries(parsed);
      setManualAssignments({});
    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
    }
  }, [groupingMode]);

  const computedRouteGroups = useMemo(() => {
    let filtered = deliveries;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = deliveries.filter(d =>
        d.recipientName.toLowerCase().includes(term) ||
        d.address.toLowerCase().includes(term) ||
        d.neighborhood.toLowerCase().includes(term) ||
        d.city.toLowerCase().includes(term) ||
        (d.trackingCode || '').toLowerCase().includes(term) ||
        (d.zipCode || '').includes(term)
      );
    }
    let groups = groupDeliveries(filtered, groupingMode);

    if (autoAssign && drivers.length > 0) {
      groups = autoAssignDrivers(groups, drivers);
    }

    groups = groups.map(g => ({
      ...g,
      assignedDriver: manualAssignments[g.id] ?? g.assignedDriver,
    }));

    return groups;
  }, [deliveries, groupingMode, searchTerm, autoAssign, drivers, manualAssignments]);

  const handleStatusChange = useCallback((deliveryId: string, status: Delivery['status']) => {
    setDeliveries(prev =>
      prev.map(d => d.id === deliveryId ? { ...d, status } : d)
    );
  }, []);

  const handleReset = useCallback(() => {
    setDeliveries([]);
    setSearchTerm('');
    setAutoAssign(false);
    setManualAssignments({});
  }, []);

  const handleManualAssign = useCallback((groupId: number, driverId: string | undefined) => {
    setManualAssignments(prev => {
      const next = { ...prev };
      if (driverId) {
        next[groupId] = driverId;
      } else {
        delete next[groupId];
      }
      return next;
    });
  }, []);

  const updateRouteGroups = useCallback((groups: RouteGroup[]) => {
    setRouteGroups(groups);
  }, []);

  const value: DeliveryContextType = {
    deliveries,
    routeGroups: routeGroups.length > 0 ? routeGroups : computedRouteGroups,
    stats,
    groupingMode,
    setGroupingMode,
    searchTerm,
    setSearchTerm,
    autoAssign,
    setAutoAssign,
    manualAssignments,
    handleFileLoaded,
    handleStatusChange,
    handleManualAssign,
    handleReset,
    hasData: deliveries.length > 0,
    drivers,
    updateRouteGroups,
    getDrivers: loadDrivers,
    loading,
  };

  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDeliveries() {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error('useDeliveries must be used within DeliveryProvider');
  return ctx;
}
