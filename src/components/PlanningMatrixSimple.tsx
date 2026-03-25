import { useMemo } from 'react';
import { Delivery } from '@/types/delivery';
import { Users, Package } from 'lucide-react';
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

export function PlanningMatrixSimple({ deliveries, drivers, assignedGroups = [] }: PlanningMatrixProps) {
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
      
      // Processar cada grupo atribuído
      assignedGroups.forEach(group => {
        const driverName = drivers.find(d => d.id === group.assignedDriver)?.name || 'Não atribuído';
        const routeCode = group.name;
        
        // Adicionar motorista e rota aos sets
        driverSet.add(driverName);
        routeSet.add(routeCode);
        
        // Inicializar dados do motorista se não existir
        if (!data[driverName]) {
          data[driverName] = { total: 0 };
        }
        
        // Adicionar contagem de entregas para esta rota
        data[driverName][routeCode] = group.deliveries.length;
        data[driverName].total += group.deliveries.length;
      });
      
      return {
        data,
        routes: Array.from(routeSet).sort(),
        driverNames: Array.from(driverSet).sort()
      };
    }
    
    // Se não houver grupos atribuídos, retornar dados vazios
    return {
      data: {},
      routes: [],
      driverNames: []
    };
  }, [deliveries, drivers, assignedGroups]);

  const { data, routes, driverNames } = matrixData;

  // Se não há dados, mostrar mensagem
  if (routes.length === 0 || driverNames.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Nenhuma atribuição encontrada.</p>
        <p className="text-sm mt-2">Atribua motoristas aos grupos para ver a matriz.</p>
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
              <Package className="w-5 h-5 mr-2" />
              Rotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{routes.length}</div>
            <p className="text-sm text-gray-600">Códigos de rota diferentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Matriz de Planejamento */}
      <Card>
        <CardHeader>
          <CardTitle>
            {assignedGroups.length > 0 ? 'Matriz de Atribuição Manual' : 'Matriz de Atribuição'}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {assignedGroups.length > 0 
              ? 'Distribuição de entregas por motorista e rota (baseado nas atribuições manuais)'
              : 'Distribuição de entregas por motorista e rota'
            }
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
                  {routes.map(routeCode => (
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
                {driverNames.map(driverName => {
                  const driverData = data[driverName];
                  const driver = drivers.find(d => d.name === driverName);
                  
                  return (
                    <tr key={driverName} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-medium">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: driver?.color || '#3B82F6' }}
                          />
                          {driverName}
                        </div>
                      </td>
                      {routes.map(routeCode => (
                        <td key={routeCode} className="border border-gray-200 px-4 py-2 text-center">
                          <span className="font-medium">
                            {driverData[routeCode] || 0}
                          </span>
                        </td>
                      ))}
                      <td className="border border-gray-200 px-4 py-2 text-center bg-blue-50 font-bold">
                        {driverData.total}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-100 font-bold">
                  <td className="border border-gray-200 px-4 py-2">
                    Total por Rota
                  </td>
                  {routes.map(routeCode => {
                    const routeTotal = driverNames.reduce((sum, driver) => sum + (data[driver][routeCode] || 0), 0);
                    return (
                      <td key={routeCode} className="border border-gray-200 px-4 py-2 text-center bg-blue-50">
                        {routeTotal}
                      </td>
                    );
                  })}
                  <td className="border border-gray-200 px-4 py-2 text-center bg-blue-100">
                    {driverNames.reduce((sum, driver) => sum + data[driver].total, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
