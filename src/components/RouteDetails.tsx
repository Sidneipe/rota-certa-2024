import React, { useState, useEffect, useMemo } from 'react';
import { type Driver, type CoverageArea, type Delivery } from '@/types/delivery';
import { X, Plus, Trash2, MapPin, Search, Printer, Package, User, Phone, CheckCircle, Clock, XCircle, AlertCircle, Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RouteDetailsProps {
  routeName: string;
  deliveries: Delivery[];
  assignedDriver: string;
  driverColor: string;
  // Nova prop para indicar se deve agrupar rotas
  groupRoutes?: boolean;
  // Nova props para lista de motoristas disponíveis
  availableDrivers?: Array<{ id: string; name: string; active: boolean }>;
  // Nova prop para o ID do motorista atribuído
  assignedDriverId?: string;
  // Nova prop para atualizar atribuições no estado global
  onDriverAssignment?: (groupId: number, driverId: string, deliveryId?: string) => void;
  // Nova prop para o ID do grupo
  groupId?: number;
  // Nova prop para atribuições individuais atuais
  currentIndividualAssignments?: Record<string, string>;
}

export function RouteDetails({ 
  routeName, 
  deliveries, 
  assignedDriver, 
  driverColor, 
  groupRoutes = false, 
  availableDrivers = [],
  assignedDriverId = '',
  onDriverAssignment,
  groupId,
  currentIndividualAssignments
}: RouteDetailsProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inicializa todos os selects com as atribuições individuais ou o motorista padrão
  const [deliveryDrivers, setDeliveryDrivers] = useState<Record<string, string>>(() => {
    const initialDrivers: Record<string, string> = {};
    deliveries.forEach(delivery => {
      if (delivery.id) {
        // Usa atribuição individual se existir, senão usa o motorista do grupo
        initialDrivers[delivery.id] = currentIndividualAssignments?.[delivery.id] || assignedDriverId;
      }
    });
    return initialDrivers;
  });

  // Função para atualizar o motorista de uma entrega específica
  // Função para imprimir em PDF (sem Tipo e Motorista, formato paisagem)
  const printPDF = () => {
    // Filtrar entregas para impressão
    const deliveriesToPrint = filteredDeliveries.map(delivery => ({
      rota: delivery.routeCode || '-',
      numero: (delivery as any).rawData?.packageNumber || '-',
      endereco: delivery.address ? 
        `${delivery.address}${delivery.number ? `, ${delivery.number}` : ''}` : 
        '-',
      complemento: (delivery as any).complement || '-',
      bairro: delivery.neighborhood || '-',
      cidade: delivery.city || '-'
    }));

    // Criar conteúdo HTML para impressão
    const printContent = `
      <html>
        <head>
          <title>Relatório de Entregas - ${routeName}</title>
          <style>
            @page { 
              margin: 10mm; 
              size: landscape; /* Formato paisagem */
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 15px;
              font-size: 10px;
            }
            h1 { 
              color: #333; 
              text-align: center; 
              margin-bottom: 15px; 
              font-size: 16px;
            }
            .header-info { 
              text-align: center; 
              margin-bottom: 20px; 
              font-size: 11px; 
              color: #666;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 10px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 5px; 
              text-align: left; 
              font-size: 9px;
            }
            th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
            }
            .footer { 
              margin-top: 20px; 
              text-align: center; 
              font-size: 9px; 
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>📦 Relatório de Entregas</h1>
          <div class="header-info">
            <strong>Motorista:</strong> ${assignedDriver} | 
            <strong>Rota:</strong> ${routeName} | 
            <strong>Total:</strong> ${deliveriesToPrint.length} entregas | 
            <strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Rota</th>
                <th>Nº</th>
                <th>Endereço Completo</th>
                <th>Complemento</th>
                <th>Bairro</th>
                <th>Cidade</th>
              </tr>
            </thead>
            <tbody>
              ${deliveriesToPrint.map(delivery => `
                <tr>
                  <td>${delivery.rota}</td>
                  <td><strong>${delivery.numero}</strong></td>
                  <td>${delivery.endereco}</td>
                  <td>${delivery.complemento}</td>
                  <td>${delivery.bairro}</td>
                  <td>${delivery.cidade}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Documento gerado pelo Sistema Rota Certa</p>
          </div>
        </body>
      </html>
    `;

    // Criar janela de impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    }
  };

  // Função para atualizar o motorista de uma entrega específica
  const handleDriverChange = (deliveryId: string, driverId: string) => {
    setDeliveryDrivers(prev => ({
      ...prev,
      [deliveryId]: driverId
    }));
    
    // 🔄 ATUALIZAÇÃO GLOBAL: Atualiza apenas esta entrega específica
    if (groupId && onDriverAssignment) {
      console.log(`🔄 RouteDetails: Atualizando entrega ${deliveryId} do grupo ${groupId} com motorista ${driverId}`);
      onDriverAssignment(groupId, driverId, deliveryId); // 🔧 Passa deliveryId também
    }
  };

  // Função para obter o nome do motorista selecionado
  const getDriverName = (driverId: string) => {
    const driver = availableDrivers.find(d => d.id === driverId);
    return driver ? driver.name : '';
  };

  // Atualiza os selects quando as entregas, motorista atribuído ou atribuições individuais mudam
  useEffect(() => {
    const updatedDrivers: Record<string, string> = {};
    deliveries.forEach(delivery => {
      if (delivery.id) {
        // Prioridade: atribuição individual > motorista do grupo
        updatedDrivers[delivery.id] = currentIndividualAssignments?.[delivery.id] || assignedDriverId;
      }
    });
    setDeliveryDrivers(updatedDrivers);
  }, [deliveries, assignedDriverId, currentIndividualAssignments]);

  // Se for para agrupar rotas, combina AM_6 e AM_9 para o motorista Roça
  const processedDeliveries = useMemo(() => {
    if (!groupRoutes || assignedDriver !== 'Roça') {
      return deliveries;
    }

    // Para o motorista Roça, mantém as rotas originais (AM_6 e AM_9 separados)
    return deliveries;
  }, [deliveries, groupRoutes, assignedDriver]);

  // Nome da rota exibido (considerando agrupamento)
  const displayRouteName = groupRoutes && assignedDriver === 'Roça' 
    ? 'Roteiro Combinado AM_6 e AM_9' 
    : routeName;

  // Estatísticas das entregas
  const stats = useMemo(() => {
    const total = processedDeliveries.length;
    const pendentes = processedDeliveries.filter(d => d.status === 'pending').length;
    const entregues = processedDeliveries.filter(d => d.status === 'delivered').length;
    const emRota = processedDeliveries.filter(d => d.status === 'in_transit').length;
    const cancelados = processedDeliveries.filter(d => d.status === 'failed').length;

    return { total, pendentes, entregues, emRota, cancelados };
  }, [processedDeliveries]);

  // Filtra entregas baseado no termo de busca
  const filteredDeliveries = useMemo(() => {
    if (!searchTerm) return processedDeliveries;
    
    const term = searchTerm.toLowerCase();
    return processedDeliveries.filter(delivery => 
      delivery.recipientName?.toLowerCase().includes(term) ||
      delivery.address?.toLowerCase().includes(term) ||
      delivery.neighborhood?.toLowerCase().includes(term) ||
      delivery.city?.toLowerCase().includes(term) ||
      delivery.trackingCode?.toLowerCase().includes(term)
    );
  }, [processedDeliveries, searchTerm]);

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'in_transit': return <Truck className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Entregue';
      case 'in_transit': return 'Em Rota';
      case 'pending': return 'Pendente';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative group"
      >
        <Package className="w-4 h-4 mr-1" />
        Detalhes
        {/* Badge com contador */}
        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {processedDeliveries.length}
        </span>
        {/* Tooltip com informações rápidas */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
          <div className="text-center">
            <div className="font-semibold">{processedDeliveries.length} entregas</div>
            <div className="flex gap-2 justify-center">
              <span className="text-green-300">✓ {stats.entregues}</span>
              <span className="text-yellow-300">⏳ {stats.pendentes}</span>
              <span className="text-blue-300">🚚 {stats.emRota}</span>
            </div>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: driverColor }}
                />
                {displayRouteName}
                <Badge variant="outline">{processedDeliveries.length} entregas</Badge>
                {groupRoutes && assignedDriver === 'Roça' && (
                  <Badge variant="secondary" className="text-xs">
                    Roteiro Combinado
                  </Badge>
                )}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={printPDF}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
            </div>
          </DialogHeader>

          {/* Resumo e Filtros */}
          <div className="space-y-4">
            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
                <div className="text-sm text-gray-600">Pendentes</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.emRota}</div>
                <div className="text-sm text-gray-600">Em Rota</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.entregues}</div>
                <div className="text-sm text-gray-600">Entregues</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{stats.cancelados}</div>
                <div className="text-sm text-gray-600">Falharam</div>
              </div>
            </div>

            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por destinatário, endereço, bairro, cidade ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de Entregas */}
            <div className="space-y-2">
              {filteredDeliveries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma entrega encontrada</p>
                </div>
              ) : (
                <>
                  {/* Tabela com todas as colunas */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold">Rota</th>
                          <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold">Nº</th>
                          <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold">Endereço Completo</th>
                          <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold">Complemento</th>
                          <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold">Bairro</th>
                          <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold">Cidade</th>
                          <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold">Tipo</th>
                          <th className="border border-gray-300 px-2 py-1 text-left text-xs font-semibold">Motorista</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDeliveries.map((delivery, index) => (
                          <tr key={delivery.id || index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-2 py-1 text-xs">
                              {delivery.routeCode || '-'}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-xs font-medium">
                              {(delivery as any).rawData?.packageNumber || '-'}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-xs">
                              {delivery.address ? 
                                `${delivery.address}${delivery.number ? `, ${delivery.number}` : ''}` : 
                                '-'
                              }
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-xs">
                              {(delivery as any).complement || '-'}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-xs">
                              {delivery.neighborhood || '-'}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-xs">
                              {delivery.city || '-'}
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-xs">
                              <Badge className={getStatusColor(delivery.status || 'pending')}>
                                {getStatusText(delivery.status || 'pending')}
                              </Badge>
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-xs">
                              {availableDrivers.length > 0 ? (
                                <Select
                                  value={deliveryDrivers[delivery.id || ''] || assignedDriver}
                                  onValueChange={(value) => handleDriverChange(delivery.id || '', value)}
                                >
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue placeholder="Selecionar..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableDrivers
                                      .filter(driver => driver.active)
                                      .map(driver => (
                                        <SelectItem key={driver.id} value={driver.id} className="text-xs">
                                          {driver.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-gray-500 text-xs">Nenhum motorista</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Resumo final */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>
                  Mostrando {filteredDeliveries.length} de {processedDeliveries.length} entregas
                </span>
                <span>
                  Motorista: <span className="font-semibold" style={{ color: driverColor }}>
                    {assignedDriver}
                  </span>
                </span>
              </div>
              
              {/* Resumo de atribuições individuais */}
              {Object.keys(deliveryDrivers).length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 text-blue-800">📋 Atribuições Individuais:</h4>
                  <div className="space-y-1 text-xs">
                    {Object.entries(deliveryDrivers).map(([deliveryId, driverId]) => {
                      const delivery = processedDeliveries.find(d => d.id === deliveryId);
                      const driverName = getDriverName(driverId);
                      return delivery ? (
                        <div key={deliveryId} className="flex justify-between">
                          <span className="text-gray-700">
                            {delivery.recipientName || delivery.trackingCode || deliveryId}
                          </span>
                          <span className={`font-medium ${driverName !== assignedDriver ? 'text-orange-700' : 'text-green-700'}`}>
                            {driverName !== assignedDriver ? '→ ' : '✓ '}
                            {driverName || 'Não atribuído'}
                          </span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-700">
                    <strong>Legenda:</strong> ✓ Motorista padrão | → Motorista alterado
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
