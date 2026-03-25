import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { useDeliveries } from '@/context/DeliveryContext';
import { getDrivers } from '@/lib/driverStorage';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Users, MapPin, Package, Printer, Eye, Clipboard } from 'lucide-react';
import { Driver, Delivery } from '@/types/delivery';
import { autoAssignPorRoteiro } from '@/lib/roteiroAssignment';

const Bingo = () => {
  const { deliveries, hasData, drivers, routeGroups } = useDeliveries();
  const navigate = useNavigate();
  const [isAssigning, setIsAssigning] = useState(false);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadDrivers = async () => {
      try {
        await getDrivers();
      } catch (error) {
        console.error('Erro ao carregar motoristas:', error);
      }
    };
    
    loadDrivers();
  }, []);

  // Função para toggle de rota expandida
  const toggleRouteExpansion = (routeCode: string) => {
    setExpandedRoutes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(routeCode)) {
        newSet.delete(routeCode);
      } else {
        newSet.add(routeCode);
      }
      return newSet;
    });
  };

  // Função para imprimir apenas a tabela expandida COM a matriz
  const printExpandedTable = (routeCode: string) => {
    // Encontrar o elemento da tabela
    const tableElement = document.getElementById(`table-${routeCode}`);
    if (!tableElement) {
      alert('Tabela não encontrada!');
      return;
    }

    // Criar conteúdo HTML para impressão (tabela + matriz)
    const printContent = `
      <html>
        <head>
          <title>Rota ${routeCode} - Entregas e Matriz de Controle</title>
          <style>
            @page { 
              margin: 15mm 10mm 15mm 10mm; 
              size: A4;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 10px;
              font-size: 10px;
            }
            h1 { 
              color: #333; 
              text-align: center; 
              margin: 0 0 10px 0; 
              font-size: 18px;
            }
            h2 { 
              color: #666; 
              text-align: center; 
              margin: 0 0 15px 0; 
              font-size: 14px;
              page-break-after: avoid;
            }
            .section { 
              margin-bottom: 20px; 
              page-break-inside: avoid;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 10px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 3px; 
              text-align: left; 
              font-size: 10px;
            }
            th { 
              background-color: #f2f2f2; 
              font-weight: bold; 
            }
            .route-table th, .route-table td { text-align: center; }
            .matrix-table th, .matrix-table td { text-align: center; font-size: 9px; padding: 2px; }
            .driver-name { text-align: left; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
            .small-text { font-size: 9px; }
            .header-info { 
              text-align: center; 
              margin: 0 0 15px 0; 
              font-size: 10px; 
              color: #666;
            }
            .no-break { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="no-break">
            <h1>📦 Rota ${routeCode}</h1>
            <div class="header-info">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
          </div>
          
          <!-- Seção 1: Tabela da Rota -->
          <div class="section no-break">
            <h2>Entregas da Rota</h2>
            ${tableElement.outerHTML}
          </div>
          
          <!-- Seção 2: Matriz de Controle -->
          <div class="section no-break">
            <h2>Matriz de Controle - Distribuição Geral</h2>
            <table class="matrix-table">
              <thead>
                <tr>
                  <th class="driver-name">Motorista</th>
                  ${routeCodes.map(routeCode => `<th class="small-text">${routeCode}</th>`).join('')}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${drivers?.filter(d => d.active).map(driver => {
                  const driverData = planningMatrix[driver.name] || {};
                  const total = Object.values(driverData).reduce((sum, count) => sum + count, 0);
                  
                  return `
                    <tr>
                      <td class="driver-name">
                        <div style="display: flex; align-items: center; gap: 3px;">
                          <div style="width: 6px; height: 6px; border-radius: 50%; background-color: ${driver.color || '#3B82F6'};"></div>
                          <span class="small-text">${driver.name}</span>
                        </div>
                      </td>
                      ${routeCodes.map(routeCode => `<td class="small-text">${driverData[routeCode] || 0}</td>`).join('')}
                      <td class="total-row small-text">${total}</td>
                    </tr>
                  `;
                }).join('')}
                <tr class="total-row">
                  <td class="driver-name small-text">TOTAL</td>
                  ${routeCodes.map(routeCode => `<td class="small-text">${getTotalsByRoute(routeCode)}</td>`).join('')}
                  <td class="small-text">${deliveries.filter(d => d.routeCode).length}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 15px; text-align: center; font-size: 9px; color: #666;">
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

  // Função para extrair código base (número + primeira letra)
  const extractBaseCode = (packageCode: string) => {
    if (!packageCode) return '';
    
    // Remove espaços e converte para maiúsculo
    const cleanCode = packageCode.trim().toUpperCase();
    
    // Procura padrão: número(s) seguido(s) de letra(s)
    const match = cleanCode.match(/^(\d+[A-Z])/);
    
    // Se encontrar padrão, retorna só número + primeira letra
    // Senão, retorna o código original
    const baseCode = match ? match[1] : cleanCode;
    
    // Debug: mostrar conversão
    if (packageCode !== baseCode) {
      console.log(`🔄 Código "${packageCode}" → base "${baseCode}"`);
    }
    
    return baseCode;
  };

// Função para contar paradas únicas (códigos de pacote repetidos na MESMA ROTA)
  const countUniqueStops = (assignments: Array<{ delivery: Delivery; driverName: string }>) => {
    const routeCodePackagePairs = assignments.map(assignment => {
      const packageCode = (assignment.delivery as any).rawData?.packageNumber || '';
      const routeCode = assignment.delivery.routeCode || '';
      const baseCode = extractBaseCode(packageCode); // Extrai só número + primeira letra
      return `${routeCode}-${baseCode}`; // Combina ROTA + CÓDIGO BASE
    }).filter(pair => pair.trim() !== '');
    
    // Debug: mostrar contagem por rota
    const routeGroups: Record<string, string[]> = {};
    routeCodePackagePairs.forEach(pair => {
      const [routeCode] = pair.split('-');
      if (!routeGroups[routeCode]) {
        routeGroups[routeCode] = [];
      }
      routeGroups[routeCode].push(pair);
    });
    
    Object.entries(routeGroups).forEach(([routeCode, pairs]) => {
      const uniquePairs = new Set(pairs);
      console.log(`📍 Rota ${routeCode}: ${pairs.length} pacotes → ${uniquePairs.size} paradas únicas`);
      console.log(`   Códigos: ${[...uniquePairs].join(', ')}`);
    });
    
    // Contar pares únicos (cada par ROTA+CÓDIGO BASE diferente = 1 parada)
    const uniquePairs = new Set(routeCodePackagePairs);
    
    return uniquePairs.size;
  };
  const printMatrixPDF = () => {
    // Criar conteúdo HTML para impressão da matriz
    const printContent = `
      <html>
        <head>
          <title>Matriz de Planejamento - Relatório</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; margin-bottom: 20px; }
            h2 { color: #666; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 20px; font-size: 14px; }
            .driver-name { text-align: left; font-weight: bold; }
            .total-row { font-weight: bold; background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Matriz de Planejamento</h1>
            <h2>Distribuição de Entregas por Motorista e Rota</h2>
            <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <div class="summary">
            <strong>Total de Motoristas:</strong> ${drivers?.length || 0}<br>
            <strong>Total de Rotas:</strong> ${routeCodes.length}<br>
            <strong>Total de Entregas:</strong> ${deliveries.filter(d => d.routeCode).length}
          </div>
          
          <table>
            <thead>
              <tr>
                <th class="driver-name">Motorista</th>
                ${routeCodes.map(routeCode => `<th>${routeCode}</th>`).join('')}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${drivers?.filter(d => d.active).map(driver => {
                const driverData = planningMatrix[driver.name] || {};
                const total = Object.values(driverData).reduce((sum, count) => sum + count, 0);
                
                return `
                  <tr>
                    <td class="driver-name">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${driver.color || '#3B82F6'};"></div>
                        ${driver.name}
                      </div>
                    </td>
                    ${routeCodes.map(routeCode => `<td>${driverData[routeCode] || 0}</td>`).join('')}
                    <td class="total-row">${total}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total-row">
                <td class="driver-name">TOTAL</td>
                ${routeCodes.map(routeCode => `<td>${getTotalsByRoute(routeCode)}</td>`).join('')}
                <td>${deliveries.filter(d => d.routeCode).length}</td>
              </tr>
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
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
  const printRoutePDF = (routeCode: string, assignments: Array<{ delivery: Delivery; driverName: string }>) => {
    // Criar conteúdo HTML para impressão
    const printContent = `
      <html>
        <head>
          <title>Rota ${routeCode} - Relatório de Entregas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { margin-bottom: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📦 Rota ${routeCode}</h1>
            <p>Relatório de Entregas - ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          
          <div class="summary">
            <strong>Total de Entregas:</strong> ${assignments.length}<br>
            <strong>Data de Geração:</strong> ${new Date().toLocaleString('pt-BR')}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Nº</th>
                <th>Motorista</th>
                <th>Destinatário</th>
                <th>Endereço</th>
                <th>Bairro</th>
                <th>Cidade</th>
                <th>Código Rastreamento</th>
              </tr>
            </thead>
            <tbody>
              ${assignments.map((assignment, index) => `
                <tr>
                  <td>${(assignment.delivery as any).rawData?.packageNumber || '-'}</td>
                  <td>${assignment.driverName}</td>
                  <td>${assignment.delivery.recipientName || '-'}</td>
                  <td>${assignment.delivery.address}${assignment.delivery.number ? ', ' + assignment.delivery.number : ''}</td>
                  <td>${assignment.delivery.neighborhood || '-'}</td>
                  <td>${assignment.delivery.city || '-'}</td>
                  <td>${assignment.delivery.trackingCode || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
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

    console.log('🔍 CONSTRUINDO MATRIZ DE BINGO');
    console.log('📦 Total de entregas:', deliveries.length);
    console.log('👤 Total de motoristas:', drivers.length);

    const matrix: Record<string, Record<string, number>> = {};
    
    // Inicializa matriz
    drivers.forEach(driver => {
      matrix[driver.name] = {};
    });

    // Distribui entregas baseado nas coverageAreas
    deliveries.forEach(delivery => {
      if (!delivery.routeCode) return;

      let assignedDriver = null;

      // Procura motorista que cobre esta entrega
      drivers.forEach(driver => {
        if (driver.coverageAreas && driver.coverageAreas.length > 0) {
          const deliveryCity = normalizeString(delivery.city || '');
          const deliveryNeighborhood = normalizeString(delivery.neighborhood || '');

          const hasCoverage = driver.coverageAreas.some((area: any) => {
            const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
            const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
            return areaCity === deliveryCity && areaNeighborhood === deliveryNeighborhood;
          });

          if (hasCoverage && !assignedDriver) {
            assignedDriver = driver;
          }
        }
      });

      if (assignedDriver) {
        if (!matrix[assignedDriver.name][delivery.routeCode]) {
          matrix[assignedDriver.name][delivery.routeCode] = 0;
        }
        matrix[assignedDriver.name][delivery.routeCode]++;
      }
    });

    return matrix;
  }, [deliveries, drivers]);

  const getTotalsByDriver = (driverName: string) => {
    const driverData = planningMatrix[driverName] || {};
    return Object.values(driverData).reduce((sum, count) => sum + count, 0);
  };

  const getTotalsByRoute = (routeCode: string) => {
    return Object.values(planningMatrix).reduce((sum, driverData) => {
      return sum + (driverData[routeCode] || 0);
    }, 0);
  };

  // Obter todas as rotas únicas
  const routeCodes = useMemo(() => {
    const routes = new Set<string>();
    deliveries.forEach(delivery => {
      if (delivery.routeCode) {
        routes.add(delivery.routeCode);
      }
    });
    return Array.from(routes).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
      const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
      return numA - numB;
    });
  }, [deliveries]);

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              Matriz de Bingo
            </h2>
            <p className="text-muted-foreground mb-8">
              Carregue uma planilha para começar o bingo
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-medium hover:shadow-lg transition-all"
            >
              Ir para o Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Matriz de Bingo</h2>
            <p className="text-sm text-muted-foreground">
              Distribuição de pacotes por palete e motorista (Modo Bingo)
            </p>
          </div>
        </div>

        {/* Matriz de Planejamento */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="w-5 h-5" />
                Matriz de Planejamento - Distribuição por Motorista
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={printMatrixPDF}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir Matriz
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-200 px-4 py-2 bg-gray-50">Motorista</th>
                    {routeCodes.map(routeCode => (
                      <th key={routeCode} className="border border-gray-200 px-4 py-2 bg-gray-50 text-center">
                        {routeCode}
                      </th>
                    ))}
                    <th className="border border-gray-200 px-4 py-2 bg-gray-50 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers?.filter(d => d.active).map(driver => {
                    const total = getTotalsByDriver(driver.name);
                    
                    return (
                      <tr key={driver.id}>
                        <td className="border border-gray-200 px-4 py-2 font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
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
                        <td className="border border-gray-200 px-4 py-2 text-center font-bold bg-gray-50">
                          {total}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50 font-bold">
                    <td className="border border-gray-200 px-4 py-2">Total por Rota</td>
                    {routeCodes.map(routeCode => {
                      const routeTotal = getTotalsByRoute(routeCode);
                      return (
                        <td key={routeCode} className="border border-gray-200 px-4 py-2 text-center">
                          {routeTotal}
                        </td>
                      );
                    })}
                    <td className="border border-gray-200 px-4 py-2 text-center">
                      {deliveries.filter(d => d.routeCode).length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Resumo - Nº de Pacotes vs Nº de Paradas por Código */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Resumo de Entregas - Contagem por Código de Pacote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-200 px-4 py-2 bg-gray-50">Motorista</th>
                    <th className="border border-gray-200 px-4 py-2 bg-gray-50 text-center">Nº de Pacotes</th>
                    <th className="border border-gray-200 px-4 py-2 bg-gray-50 text-center">Nº de Paradas</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Coletar todas as entregas de todas as rotas
                    const allAssignments: Array<{ delivery: Delivery; driverName: string }> = [];
                    
                    routeCodes.forEach(routeCode => {
                      const routeDeliveries = deliveries.filter(d => d.routeCode === routeCode);
                      
                      routeDeliveries.forEach(delivery => {
                        let assignedDriver = null;
                        
                        drivers.forEach(driver => {
                          if (driver.coverageAreas && driver.coverageAreas.length > 0) {
                            const deliveryCity = normalizeString(delivery.city || '');
                            const deliveryNeighborhood = normalizeString(delivery.neighborhood || '');
                            
                            const hasCoverage = driver.coverageAreas.some((area: any) => {
                              const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
                              const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
                              return areaCity === deliveryCity && areaNeighborhood === deliveryNeighborhood;
                            });
                            
                            if (hasCoverage && !assignedDriver) {
                              assignedDriver = driver;
                            }
                          }
                        });
                        
                        if (assignedDriver) {
                          allAssignments.push({
                            delivery,
                            driverName: assignedDriver.name
                          });
                        }
                      });
                    });
                    
                    // Agrupar por motorista
                    const driverGroups: Record<string, Array<{ delivery: Delivery; driverName: string }>> = {};
                    allAssignments.forEach(assignment => {
                      if (!driverGroups[assignment.driverName]) {
                        driverGroups[assignment.driverName] = [];
                      }
                      driverGroups[assignment.driverName].push(assignment);
                    });
                    
                    // Renderizar cada motorista com totais (ordenado alfabeticamente)
                    return Object.entries(driverGroups)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([driverName, driverAssignments]) => {
                      const totalPackages = driverAssignments.length;
                      const totalStops = countUniqueStops(driverAssignments);
                      
                      return (
                        <tr key={driverName} className="hover:bg-gray-50">
                          <td className="border border-gray-200 px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ 
                                  backgroundColor: drivers.find(d => d.name === driverName)?.color || '#3B82F6' 
                                }}
                              />
                              {driverName}
                            </div>
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center font-semibold">
                            {totalPackages}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-center font-semibold text-blue-600">
                            {totalStops}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td className="border border-gray-200 px-4 py-2">
                      TOTAL GERAL
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center">
                      {(() => {
                        let totalPackages = 0;
                        routeCodes.forEach(routeCode => {
                          const routeDeliveries = deliveries.filter(d => d.routeCode === routeCode);
                          routeDeliveries.forEach(delivery => {
                            drivers.forEach(driver => {
                              if (driver.coverageAreas && driver.coverageAreas.length > 0) {
                                const deliveryCity = normalizeString(delivery.city || '');
                                const deliveryNeighborhood = normalizeString(delivery.neighborhood || '');
                                
                                const hasCoverage = driver.coverageAreas.some((area: any) => {
                                  const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
                                  const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
                                  return areaCity === deliveryCity && areaNeighborhood === deliveryNeighborhood;
                                });
                                
                                if (hasCoverage) {
                                  totalPackages++;
                                }
                              }
                            });
                          });
                        });
                        return totalPackages;
                      })()}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center text-blue-600">
                      {(() => {
                        const allAssignments: Array<{ delivery: Delivery; driverName: string }> = [];
                        
                        routeCodes.forEach(routeCode => {
                          const routeDeliveries = deliveries.filter(d => d.routeCode === routeCode);
                          routeDeliveries.forEach(delivery => {
                            drivers.forEach(driver => {
                              if (driver.coverageAreas && driver.coverageAreas.length > 0) {
                                const deliveryCity = normalizeString(delivery.city || '');
                                const deliveryNeighborhood = normalizeString(delivery.neighborhood || '');
                                
                                const hasCoverage = driver.coverageAreas.some((area: any) => {
                                  const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
                                  const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
                                  return areaCity === deliveryCity && areaNeighborhood === deliveryNeighborhood;
                                });
                                
                                if (hasCoverage) {
                                  allAssignments.push({
                                    delivery,
                                    driverName: driver.name
                                  });
                                }
                              }
                            });
                          });
                        });
                        
                        return countUniqueStops(allAssignments);
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Rotas com Botões Expandir */}
        <div className="space-y-4">
          {routeCodes.map(routeCode => {
            // Obter entregas desta rota
            const routeDeliveries = deliveries.filter(d => d.routeCode === routeCode);
            
            // Mapear entregas para motoristas
            const assignments: Array<{
              delivery: Delivery;
              driverName: string;
            }> = [];
            
            routeDeliveries.forEach(delivery => {
              let assignedDriver = null;
              
              // Procura motorista que cobre esta entrega
              drivers.forEach(driver => {
                if (driver.coverageAreas && driver.coverageAreas.length > 0) {
                  const deliveryCity = normalizeString(delivery.city || '');
                  const deliveryNeighborhood = normalizeString(delivery.neighborhood || '');
                  
                  const hasCoverage = driver.coverageAreas.some((area: any) => {
                    const areaCity = normalizeString((area as any).cidade || (area as any).city || '');
                    const areaNeighborhood = normalizeString((area as any).bairro || (area as any).neighborhood || '');
                    return areaCity === deliveryCity && areaNeighborhood === deliveryNeighborhood;
                  });
                  
                  if (hasCoverage && !assignedDriver) {
                    assignedDriver = driver;
                  }
                }
              });
              
              if (assignedDriver) {
                assignments.push({
                  delivery,
                  driverName: assignedDriver.name
                });
              }
            });
            
            // Estado para controlar expansão
            const isExpanded = expandedRoutes.has(routeCode);
            
            return (
              <Card key={routeCode}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: '#3B82F6' }}
                      />
                      <CardTitle className="text-lg">
                        Rota {routeCode}
                      </CardTitle>
                      <Badge variant="outline">
                        {assignments.length} entregas
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printExpandedTable(routeCode)}
                        className="flex items-center gap-2"
                        disabled={!isExpanded}
                      >
                        <Eye className="w-4 h-4" />
                        Imprimir Tela
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printRoutePDF(routeCode, assignments)}
                        className="flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Imprimir PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRouteExpansion(routeCode)}
                        className="flex items-center gap-2"
                      >
                        <Package className="w-4 h-4" />
                        {isExpanded ? 'Recolher' : 'Expandir'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Tabela expandida */}
                {isExpanded && (
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table id={`table-${routeCode}`} className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-1 py-1 text-left text-xs font-semibold w-16">Rota</th>
                            <th className="border border-gray-300 px-1 py-1 text-left text-xs font-semibold w-16">Nº</th>
                            <th className="border border-gray-300 px-1 py-1 text-left text-xs font-semibold">Motorista</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assignments.map((assignment, index) => (
                            <tr key={`${routeCode}-${index}`} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-1 py-1 text-xs font-medium">
                                {routeCode}
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-xs font-medium">
                                {(assignment.delivery as any).rawData?.packageNumber || '-'}
                              </td>
                              <td className="border border-gray-300 px-1 py-1 text-xs">
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ 
                                      backgroundColor: drivers.find(d => d.name === assignment.driverName)?.color || '#3B82F6' 
                                    }}
                                  />
                                  {assignment.driverName}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Bingo;
