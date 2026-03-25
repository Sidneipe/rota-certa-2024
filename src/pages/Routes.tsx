import { useMemo, useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { RouteGroupCard } from '@/components/RouteGroupCard';
import { RouteStats } from '@/components/RouteStats';
import { useDeliveries } from '@/context/DeliveryContext';
import { getDrivers } from '@/lib/driverStorage';
import { GroupingMode } from '@/lib/routeOptimizer';
import { RotateCcw, Filter, Download, Users, FileUp, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const groupingLabels: Record<GroupingMode, string> = {
  routeCode: 'Código da Rota',
  neighborhood: 'Bairro',
  zipCode: 'CEP (região)',
  city: 'Cidade',
};

const Routes = () => {
  const {
    routeGroups, hasData, groupingMode, setGroupingMode,
    searchTerm, setSearchTerm, autoAssign, setAutoAssign,
    handleStatusChange, handleManualAssign, handleReset,
  } = useDeliveries();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const driversData = await getDrivers();
        setDrivers(Array.isArray(driversData) ? driversData : []);
      } catch (error) {
        console.error('Erro ao carregar motoristas:', error);
        setDrivers([]);
      }
    };
    
    loadDrivers();
  }, []);

  const handleExport = () => {
    const data = routeGroups.flatMap(group =>
      group.deliveries.map((d, idx) => ({
        'Rota': group.name,
        'Motorista': drivers.find(dr => dr.id === group.assignedDriver)?.name || '',
        'Ordem': idx + 1,
        'Destinatário': d.recipientName,
        'Endereço': d.address,
        'Número': d.number,
        'Complemento': d.complement,
        'Bairro': d.neighborhood,
        'Cidade': d.city,
        'CEP': d.zipCode,
        'Status': d.status === 'pending' ? 'Pendente' : d.status === 'delivered' ? 'Entregue' : d.status === 'in_transit' ? 'Em trânsito' : 'Falha',
        'Código Rastreio': d.trackingCode,
      }))
    );
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rotas');
    XLSX.writeFile(wb, 'rotas-organizadas.xlsx');
  };

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <FileUp className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">Nenhuma planilha importada</h2>
          <p className="text-sm text-muted-foreground">
            Importe uma planilha no Dashboard para visualizar as rotas organizadas.
          </p>
          <button
            onClick={() => navigate('/')}
            className="h-10 px-6 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Ir para o Dashboard
          </button>
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
            <h2 className="text-2xl font-display font-bold text-foreground">Rotas</h2>
            <p className="text-sm text-muted-foreground">{routeGroups.length} rota{routeGroups.length !== 1 ? 's' : ''} organizadas</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nome, endereço, bairro, CEP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-4 pr-4 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1">
              <Filter className="w-4 h-4 text-muted-foreground ml-2" />
              {(Object.keys(groupingLabels) as GroupingMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setGroupingMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    groupingMode === mode
                      ? 'gradient-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {groupingLabels[mode]}
                </button>
              ))}
            </div>
            {drivers.length > 0 && (
              <button
                onClick={() => setAutoAssign(!autoAssign)}
                className={`h-9 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  autoAssign
                    ? 'gradient-primary text-primary-foreground'
                    : 'border border-border bg-card text-foreground hover:bg-muted'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Escalar
              </button>
            )}
            <button
              onClick={handleExport}
              className="h-9 px-3 rounded-xl border border-border bg-card text-foreground text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className={`h-9 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                showStats 
                  ? 'gradient-primary text-primary-foreground' 
                  : 'border border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              {showStats ? 'Ver Rotas' : 'Estatísticas'}
            </button>
            <button
              onClick={handleReset}
              className="h-9 px-3 rounded-xl border border-border bg-card text-foreground text-xs font-medium hover:bg-muted transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Nova planilha
            </button>
          </div>
        </div>

        {/* Route Groups ou Estatísticas */}
        {showStats ? (
          <RouteStats routeGroups={routeGroups} />
        ) : (
          <div className="space-y-3">
            {routeGroups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma entrega encontrada para o filtro aplicado.
              </div>
            ) : (
              routeGroups.map(group => (
                <RouteGroupCard
                  key={group.id}
                  group={group}
                  drivers={drivers}
                  onStatusChange={handleStatusChange}
                  onDriverAssign={handleManualAssign}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Routes;
