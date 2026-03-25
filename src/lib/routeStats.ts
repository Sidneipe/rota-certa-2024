import { Delivery, RouteGroup } from '@/types/delivery';

export interface RouteStats {
  routeCode: string;
  totalPackages: number;
  pendingPackages: number;
  deliveredPackages: number;
  inTransitPackages: number;
  failedPackages: number;
  percentage: number;
}

/**
 * Calcula estatísticas detalhadas por rota
 */
export function getRouteStats(routeGroups: RouteGroup[]): RouteStats[] {
  const totalPackages = routeGroups.reduce((sum, group) => sum + group.deliveries.length, 0);
  
  return routeGroups.map(group => {
    const pending = group.deliveries.filter(d => d.status === 'pending').length;
    const delivered = group.deliveries.filter(d => d.status === 'delivered').length;
    const inTransit = group.deliveries.filter(d => d.status === 'in_transit').length;
    const failed = group.deliveries.filter(d => d.status === 'failed').length;
    
    return {
      routeCode: group.name.replace(/\s*\(\d+\s*pacotes\)/, ''), // Remove o sufixo de quantidade
      totalPackages: group.deliveries.length,
      pendingPackages: pending,
      deliveredPackages: delivered,
      inTransitPackages: inTransit,
      failedPackages: failed,
      percentage: totalPackages > 0 ? (group.deliveries.length / totalPackages) * 100 : 0,
    };
  });
}

/**
 * Gera relatório de rotas para exportação
 */
export function generateRouteReport(routeGroups: RouteGroup[]): any[] {
  const stats = getRouteStats(routeGroups);
  
  return stats.map(stat => ({
    'Código da Rota': stat.routeCode,
    'Total de Pacotes': stat.totalPackages,
    'Pendentes': stat.pendingPackages,
    'Em Trânsito': stat.inTransitPackages,
    'Entregues': stat.deliveredPackages,
    'Falhados': stat.failedPackages,
    'Percentual do Total': `${stat.percentage.toFixed(1)}%`,
  }));
}

/**
 * Ordena rotas por diferentes critérios
 */
export function sortRoutes(routeGroups: RouteGroup[], sortBy: 'code' | 'size' | 'status'): RouteGroup[] {
  const sorted = [...routeGroups];
  
  switch (sortBy) {
    case 'code':
      // Ordenar alfabeticamente pelo código da rota
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    
    case 'size':
      // Ordenar por quantidade de pacotes (maior primeiro)
      return sorted.sort((a, b) => b.deliveries.length - a.deliveries.length);
    
    case 'status':
      // Ordenar por percentual de entregas concluídas (maior primeiro)
      return sorted.sort((a, b) => {
        const deliveredA = a.deliveries.filter(d => d.status === 'delivered').length;
        const deliveredB = b.deliveries.filter(d => d.status === 'delivered').length;
        const percentA = a.deliveries.length > 0 ? (deliveredA / a.deliveries.length) : 0;
        const percentB = b.deliveries.length > 0 ? (deliveredB / b.deliveries.length) : 0;
        return percentB - percentA;
      });
    
    default:
      return sorted;
  }
}
