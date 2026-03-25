import { Header } from '@/components/Header';
import { FileUpload } from '@/components/FileUpload';
import { StatsCards } from '@/components/StatsCards';
import { useDeliveries } from '@/context/DeliveryContext';
import { useNavigate } from 'react-router-dom';
import { Package, Route, Users, Upload, ArrowRight, TestTube } from 'lucide-react';
import { getDrivers } from '@/lib/driverStorage';
import { useState, useEffect } from 'react';

const Dashboard = () => {
  const { stats, hasData, handleFileLoaded, handleReset } = useDeliveries();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<any[]>([]);

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

  const onFileLoaded = (data: ArrayBuffer, fileType: 'spreadsheet' | 'pdf') => {
    handleFileLoaded(data, fileType);
    navigate('/rotas');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome */}
        <div className="text-center space-y-2 pt-4">
          <h2 className="text-3xl font-display font-bold text-foreground">
            Dashboard
          </h2>
          <p className="text-muted-foreground">
            Visão geral do sistema de entregas RotaFlex
          </p>
        </div>

        {hasData && <StatsCards {...stats} />}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Import Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Importar Planilha</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Importe a planilha para para organizar as rotas de entrega.
              </p>
            </div>
            <FileUpload onFileLoaded={onFileLoaded} />
          </div>

          {/* Routes Card */}
          <div
            className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/rotas')}
          >
            <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
              <Route className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Rotas</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {hasData
                  ? `${stats.neighborhoods} rotas organizadas por bairro`
                  : 'Importe uma planilha para ver as rotas'}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm text-accent font-medium">
              Ver rotas <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Routes New Card */}
          <div
            className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/rotas_novo')}
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <TestTube className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Rotas (Novo)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Sistema com roteiros fixos (baseado na planilha)
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm text-orange-500 font-medium">
              Testar <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Planning New Card */}
          <div
            className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4 cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/planejamento_novo')}
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <TestTube className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Planejamento (Novo)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Matriz com roteiros fixos
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm text-purple-500 font-medium">
              Testar <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Drivers summary */}
        <div
          className="bg-card border border-border rounded-xl p-5 shadow-card flex items-center justify-between cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate('/motoristas')}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground">Motoristas</h3>
              <p className="text-xs text-muted-foreground">
                {drivers.length} cadastrado{drivers.length !== 1 ? 's' : ''} • {drivers.filter(d => d.active).length} ativo{drivers.filter(d => d.active).length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Packages Card */}
        <div
          className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4 cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => navigate('/pacotes')}
        >
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">Pacotes</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {hasData
                ? `${stats.total} entregas programadas`
                : 'Nenhum pacote importado ainda'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-success font-medium">
            Ver pacotes <ArrowRight className="w-4 h-4" />
          </div>
        </div>
        {hasData && (
          <div className="text-center">
            <button
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Limpar dados e importar nova planilha
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
