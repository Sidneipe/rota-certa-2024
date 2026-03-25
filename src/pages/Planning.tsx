import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { PlanningMatrix } from '@/components/PlanningMatrix';
import { useDeliveries } from '@/context/DeliveryContext';
import { getDrivers } from '@/lib/driverStorage';
import { useNavigate } from 'react-router-dom';

const Planning = () => {
  const { deliveries, hasData } = useDeliveries();
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

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              Matriz de Planejamento
            </h2>
            <p className="text-muted-foreground mb-8">
              Carregue uma planilha para começar o planejamento
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
            <h2 className="text-2xl font-display font-bold text-foreground">Matriz de Planejamento</h2>
            <p className="text-sm text-muted-foreground">
              Distribuição de pacotes por palete e motorista
            </p>
          </div>
        </div>

        <PlanningMatrix deliveries={deliveries} drivers={drivers} />
      </main>
    </div>
  );
};

export default Planning;
