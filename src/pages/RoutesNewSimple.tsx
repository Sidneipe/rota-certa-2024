import React, { useState } from 'react';
import { useDeliveries } from '@/context/DeliveryContext';
import { RouteGroupCard } from '@/components/RouteGroupCard';
import { RouteDetails } from '@/components/RouteDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit3, Save, X } from 'lucide-react';
// import { Header } from '@/components/Header';

export default function RoutesNewSimple() {
  const {
    deliveries,
    routeGroups,
    drivers,
    loading,
    updateRouteGroups
  } = useDeliveries();

  // Estado para controle de edição
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>('');

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return 'Não atribuído';
    const driver = drivers?.find(d => d.id === driverId);
    return driver ? driver.name : 'Motorista não encontrado';
  };

  const getDriverColor = (driverId: string | null) => {
    if (!driverId) return '#6B7280';
    const driver = drivers?.find(d => d.id === driverId);
    return driver?.color || '#3B82F6';
  };

  const handleManualAssignment = (groupId: number) => {
    if (!selectedDriver) {
      console.error('Nenhum motorista selecionado');
      return;
    }

    try {
      // Simples atualização - apenas para teste
      console.log(`✅ Atribuição manual: Grupo ${groupId} -> Motorista ${selectedDriver}`);
      
      // Limpa estado de edição
      setEditingGroupId(null);
      setSelectedDriver('');
    } catch (error) {
      console.error('Erro na atribuição manual:', error);
    }
  };

  const cancelEdit = () => {
    setEditingGroupId(null);
    setSelectedDriver('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando rotas...</p>
        </div>
      </div>
    );
  }

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
            <h2 className="text-xl font-semibold mb-4">Nenhuma entrega encontrada</h2>
            <p className="text-gray-600 mb-4">
              Carregue as entregas na planilha para visualizar as rotas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rotas - Novo Sistema</h1>
            <p className="text-gray-600 mt-2">
              Organização das entregas por grupos e motoristas
            </p>
          </div>
        </div>

        {/* Grupos de Rotas */}
        <div className="space-y-4">
          {routeGroups?.map(group => {
            const driverName = getDriverName(group.assignedDriver);
            const isEditing = editingGroupId === group.id.toString();
            
            return (
              <Card key={group.id} className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getDriverColor(group.assignedDriver) }}
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        <p className="text-sm text-gray-600">
                          {group.deliveries.length} entregas • {driverName}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant="outline">
                      {group.deliveries.length} entregas
                    </Badge>
                  </div>

                  {/* Modo de visualização */}
                  {!isEditing && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingGroupId(group.id.toString())}
                          className="flex-1"
                        >
                          <Edit3 className="w-3 h-3 mr-2" />
                          Editar Atribuição
                        </Button>
                        <RouteDetails
                          routeName={group.name}
                          deliveries={group.deliveries}
                          assignedDriver={driverName}
                          driverColor={getDriverColor(group.assignedDriver)}
                          assignedDriverId={group.assignedDriver}
                          availableDrivers={drivers?.filter(d => d.active).map(d => ({
                            id: d.id,
                            name: d.name,
                            active: d.active
                          })) || []}
                        />
                      </div>
                    </div>
                  )}

                  {/* Modo de edição */}
                  {isEditing && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                          Atribuir para:
                        </label>
                        <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um motorista" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers?.filter(d => d.active).map(driver => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleManualAssignment(group.id)}
                          disabled={!selectedDriver}
                          className="flex-1"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Salvar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
