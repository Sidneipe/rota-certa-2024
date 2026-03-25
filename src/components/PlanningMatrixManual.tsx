import { useMemo } from 'react';
import { Delivery } from '@/types/delivery';
import { Users, Package, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PlanningMatrixManualProps {
  deliveries: Delivery[];
  drivers: any[];
  assignedGroups?: Array<{
    id: string;
    name: string;
    deliveries: Delivery[];
    assignedDriver: string;
  }>;
  // Nova prop para atribuições individuais das entregas
  individualAssignments?: Record<string, string>; // deliveryId -> driverId
  // Nova prop para TODOS os grupos (não apenas atribuídos)
  allGroups?: Array<{
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

export function PlanningMatrixManual({ deliveries, drivers, assignedGroups = [], individualAssignments = {}, allGroups = [] }: PlanningMatrixManualProps) {
  console.log('🚀 PlanningMatrixManual - Iniciando processamento...');
  console.log('📋 Entregas recebidas:', deliveries.length);
  console.log('👥 Motoristas recebidos:', drivers.length);
  console.log('📦 Grupos atribuídos:', assignedGroups.length);
  
  // Processar dados para formato de matriz (motoristas x rotas)
  const matrixData = useMemo((): { data: MatrixData; routes: string[]; driverNames: string[] } => {
    const data: MatrixData = {};
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
      data[driverName] = { total: 0 };
      routeSet.forEach(routeCode => {
        data[driverName][routeCode] = 0;
      });
    });
    
    // Preencher com grupos que têm motorista atribuído E atribuições individuais
    console.log('🔍 DEBUG assignedGroups completo:', assignedGroups);
    console.log('🔍 DEBUG allGroups completo:', allGroups);
    console.log('🔍 DEBUG individualAssignments:', individualAssignments);
    
    // 🔄 COMBINA: grupos atribuídos + grupos com atribuições individuais
    const groupsToProcess = [...assignedGroups];
    
    // Adiciona grupos que têm atribuições individuais mas não estão em assignedGroups
    allGroups.forEach(group => {
      const hasIndividualAssignments = group.deliveries.some(delivery => 
        delivery.id && individualAssignments[delivery.id]
      );
      
      if (hasIndividualAssignments && !groupsToProcess.find(g => g.id === group.id)) {
        groupsToProcess.push(group);
      }
    });
    
    console.log(`🔄 Processando ${groupsToProcess.length} grupos no total`);
    
    groupsToProcess.forEach(group => {
      console.log(`📦 Processando grupo: ID=${group.id}, Nome=${group.name}, Motorista=${group.assignedDriver}, Entregas=${group.deliveries.length}`);
      
      // 🔧 VERIFICA SE HÁ ATRIBUIÇÕES INDIVIDUAIS PARA ESTE GRUPO
      const groupIndividualAssignments = group.deliveries.filter(delivery => 
        delivery.id && individualAssignments[delivery.id]
      );
      
      const hasIndividualAssignments = groupIndividualAssignments.length > 0;
      
      console.log(`🔍 Tem ${groupIndividualAssignments.length} atribuições individuais de ${group.deliveries.length} entregas`);
      
      if (hasIndividualAssignments && groupIndividualAssignments.length < group.deliveries.length) {
        // 🔄 MIX: Processa individuais + as restantes como grupo
        console.log(`🔄 MODO MIX: ${groupIndividualAssignments.length} individuais + ${group.deliveries.length - groupIndividualAssignments.length} em grupo`);
        
        // Processa entregas individuais
        groupIndividualAssignments.forEach(delivery => {
          const driverId = individualAssignments[delivery.id!];
          const driverName = drivers.find(d => d.id === driverId)?.name || 'Não atribuído';
          const routeCode = group.name.split(' (')[0].toUpperCase();
          
          console.log(`📦 Individual: Entrega ${delivery.id} -> ${driverName} (rota ${routeCode})`);
          
          if (data[driverName] && data[driverName][routeCode] !== undefined) {
            data[driverName][routeCode] += 1;
            data[driverName].total += 1;
            console.log(`✅ Atualizado individual: ${driverName}[${routeCode}] = ${data[driverName][routeCode]}`);
          }
        });
        
        // Processa entregas restantes como grupo (se houver motorista no grupo)
        if (group.assignedDriver) {
          const remainingDeliveries = group.deliveries.length - groupIndividualAssignments.length;
          const driverName = drivers.find(d => d.id === group.assignedDriver)?.name || 'Não atribuído';
          const routeCode = group.name.split(' (')[0].toUpperCase();
          
          console.log(`📦 Grupo restante: ${remainingDeliveries} entregas -> ${driverName} (rota ${routeCode})`);
          
          if (data[driverName] && data[driverName][routeCode] !== undefined && remainingDeliveries > 0) {
            data[driverName][routeCode] += remainingDeliveries;
            data[driverName].total += remainingDeliveries;
            console.log(`✅ Atualizado grupo restante: ${driverName}[${routeCode}] = ${data[driverName][routeCode]}`);
          }
        }
      } else if (hasIndividualAssignments && groupIndividualAssignments.length === group.deliveries.length) {
        // 🔄 TODAS INDIVIDUAIS: Processa apenas individuais
        console.log(`🔄 MODO 100% INDIVIDUAL: Todas ${group.deliveries.length} entregas são individuais`);
        
        groupIndividualAssignments.forEach(delivery => {
          const driverId = individualAssignments[delivery.id!];
          const driverName = drivers.find(d => d.id === driverId)?.name || 'Não atribuído';
          const routeCode = group.name.split(' (')[0].toUpperCase();
          
          console.log(`📦 Individual: Entrega ${delivery.id} -> ${driverName} (rota ${routeCode})`);
          
          if (data[driverName] && data[driverName][routeCode] !== undefined) {
            data[driverName][routeCode] += 1;
            data[driverName].total += 1;
            console.log(`✅ Atualizado individual: ${driverName}[${routeCode}] = ${data[driverName][routeCode]}`);
          }
        });
      } else if (group.assignedDriver) {
        // 🔄 GRUPO INTEIRO: Processa grupo inteiro
        const driverName = drivers.find(d => d.id === group.assignedDriver)?.name || 'Não atribuído';
        const routeCode = group.name.split(' (')[0].toUpperCase();
        
        console.log(`📦 Processando grupo inteiro: ${group.name} -> ${driverName} (${group.deliveries.length} entregas)`);
        console.log(`🔧 Rota corrigida: "${routeCode}"`);
        
        if (data[driverName] && data[driverName][routeCode] !== undefined) {
          data[driverName][routeCode] = group.deliveries.length;
          data[driverName].total += group.deliveries.length;
          console.log(`✅ Atualizado grupo: ${driverName}[${routeCode}] = ${group.deliveries.length}`);
        } else {
          console.log(`❌ ERRO: Motorista ${driverName} ou rota ${routeCode} não encontrados na matriz`);
          console.log(`📋 Motoristas disponíveis:`, Object.keys(data));
          console.log(`📋 Rotas disponíveis:`, Array.from(routeSet));
        }
      }
    });
    
    return {
      data,
      routes: Array.from(routeSet).sort(),
      driverNames: Array.from(driverSet).sort()
    };
  }, [deliveries, drivers, assignedGroups, individualAssignments, allGroups]);

  // Exportar matriz para Excel
  const handleExport = () => {
    const exportData: any[] = [];
    
    // Header
    const header: any = { 'Motorista/Rota': 'TOTAL' };
    matrixData.routes.forEach(route => {
      header[route] = route;
    });
    exportData.push(header);
    
    // Dados
    matrixData.driverNames.forEach(driverName => {
      const row: any = { 'Motorista/Rota': driverName };
      row['TOTAL'] = matrixData.data[driverName]?.total || 0;
      
      matrixData.routes.forEach(route => {
        row[route] = matrixData.data[driverName]?.[route] || 0;
      });
      
      exportData.push(row);
    });
    
    // Criar worksheet e workbook
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matriz de Planejamento');
    
    // Download
    XLSX.writeFile(wb, `matriz_planejamento_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (assignedGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Matriz de Planejamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhuma atribuição encontrada</p>
            <p className="text-sm">
              Atribua motoristas aos grupos para visualizar a matriz de planejamento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Matriz de Planejamento
            <Badge variant="outline">
              {assignedGroups.length} grupos atribuídos
            </Badge>
          </CardTitle>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-50 p-2 text-left font-semibold">
                  Motorista/Rota
                </th>
                <th className="border border-gray-300 bg-gray-50 p-2 text-center font-semibold bg-blue-50">
                  TOTAL
                </th>
                {matrixData.routes.map(route => (
                  <th key={route} className="border border-gray-300 bg-gray-50 p-2 text-center font-semibold">
                    {route}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.driverNames.map(driverName => (
                <tr key={driverName}>
                  <td className="border border-gray-300 p-2 font-medium">
                    {driverName}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold bg-blue-50">
                    {matrixData.data[driverName]?.total || 0}
                  </td>
                  {matrixData.routes.map(route => (
                    <td key={route} className="border border-gray-300 p-2 text-center">
                      {matrixData.data[driverName]?.[route] || 0}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="border border-gray-300 p-2">
                  TOTAL
                </td>
                <td className="border border-gray-300 p-2 text-center bg-blue-100">
                  {matrixData.driverNames.reduce((sum, driver) => sum + (matrixData.data[driver]?.total || 0), 0)}
                </td>
                {matrixData.routes.map(route => (
                  <td key={route} className="border border-gray-300 p-2 text-center bg-gray-100">
                    {matrixData.driverNames.reduce((sum, driver) => sum + (matrixData.data[driver]?.[route] || 0), 0)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>📊 Matriz mostra apenas grupos com motorista atribuído manualmente.</p>
          <p>🔢 Total de entregas atribuídas: {matrixData.driverNames.reduce((sum, driver) => sum + (matrixData.data[driver]?.total || 0), 0)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
