import { RouteGroup } from '@/types/delivery';
import { getRouteStats } from '@/lib/routeStats';
import { BarChart3, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';

interface RouteStatsProps {
  routeGroups: RouteGroup[];
}

export function RouteStats({ routeGroups }: RouteStatsProps) {
  const stats = getRouteStats(routeGroups);
  const totalPackages = stats.reduce((sum, stat) => sum + stat.totalPackages, 0);
  const totalDelivered = stats.reduce((sum, stat) => sum + stat.deliveredPackages, 0);
  const totalPending = stats.reduce((sum, stat) => sum + stat.pendingPackages, 0);
  const totalInTransit = stats.reduce((sum, stat) => sum + stat.inTransitPackages, 0);
  const totalFailed = stats.reduce((sum, stat) => sum + stat.failedPackages, 0);

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground">Total Rotas</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.length}</div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-muted-foreground">Total Pacotes</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{totalPackages}</div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-xs font-medium text-muted-foreground">Pendentes</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground">Em Trânsito</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{totalInTransit}</div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground">Entregues</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{totalDelivered}</div>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-muted-foreground">Falhados</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
        </div>
      </div>

      {/* Tabela de Estatísticas por Rota */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Estatísticas por Rota</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Código da Rota
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Pendentes
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Em Trânsito
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Entregues
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Falhados
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  % do Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Progresso
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {stats.map((stat, index) => {
                const completionRate = stat.totalPackages > 0 
                  ? (stat.deliveredPackages / stat.totalPackages) * 100 
                  : 0;
                
                return (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ 
                          backgroundColor: routeGroups[index]?.color || '#gray' 
                        }} />
                        <span className="font-medium text-foreground">{stat.routeCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-foreground">{stat.totalPackages}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-yellow-600">{stat.pendingPackages}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-blue-600">{stat.inTransitPackages}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-green-600">{stat.deliveredPackages}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-red-600">{stat.failedPackages}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-muted-foreground">{stat.percentage.toFixed(1)}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                          {completionRate.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
