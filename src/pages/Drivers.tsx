import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DriverForm } from '@/components/DriverForm';
import { Driver } from '@/types/delivery';
import { getDrivers, addDriver, updateDriver, deleteDriver } from '@/lib/driverStorage';
import { Plus, Pencil, Trash2, UserCheck, UserX, Car, MapPin, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Drivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleSave = async (data: Omit<Driver, 'id' | 'createdAt'>) => {
    try {
      if (editingDriver) {
        await updateDriver(editingDriver.id, data);
        toast({ title: 'Motorista atualizado', description: `${data.name} foi atualizado com sucesso.` });
      } else {
        await addDriver(data);
        toast({ title: 'Motorista cadastrado', description: `${data.name} foi adicionado à equipe.` });
      }
      
      const driversData = await getDrivers();
      setDrivers(Array.isArray(driversData) ? driversData : []);
      setShowForm(false);
      setEditingDriver(null);
    } catch (error) {
      console.error('Erro ao salvar motorista:', error);
      toast({ 
        title: 'Erro ao salvar', 
        description: 'Não foi possível salvar o motorista. Tente novamente.',
        variant: 'destructive' 
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const driver = drivers.find(d => d.id === id);
      await deleteDriver(id);
      
      const driversData = await getDrivers();
      setDrivers(Array.isArray(driversData) ? driversData : []);
      setConfirmDelete(null);
      toast({ title: 'Motorista removido', description: `${driver?.name} foi removido da equipe.`, variant: 'destructive' });
    } catch (error) {
      console.error('Erro ao excluir motorista:', error);
      toast({ 
        title: 'Erro ao excluir', 
        description: 'Não foi possível excluir o motorista. Tente novamente.',
        variant: 'destructive' 
      });
    }
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setShowForm(true);
  };

  const toggleActive = async (driver: Driver) => {
    try {
      await updateDriver(driver.id, { active: !driver.active });
      
      const driversData = await getDrivers();
      setDrivers(Array.isArray(driversData) ? driversData : []);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({ 
        title: 'Erro ao atualizar', 
        description: 'Não foi possível atualizar o status do motorista. Tente novamente.',
        variant: 'destructive' 
      });
    }
  };

  const activeCount = drivers.filter(d => d.active).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">Motoristas</h2>
            <p className="text-sm text-muted-foreground">
              {drivers.length} cadastrado{drivers.length !== 1 ? 's' : ''} • {activeCount} ativo{activeCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => { setEditingDriver(null); setShowForm(true); }}
            className="h-10 px-4 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Novo Motorista
          </button>
        </div>

        {/* Driver List */}
        {drivers.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Car className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-display font-semibold text-foreground">Nenhum motorista cadastrado</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Cadastre seus motoristas para que o sistema possa gerar escalas automáticas baseadas na localização de cada um.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {drivers.map(driver => (
              <div
                key={driver.id}
                className={`bg-card border rounded-xl p-4 shadow-card transition-all ${
                  driver.active ? 'border-border' : 'border-border opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      driver.active ? 'gradient-primary' : 'bg-muted'
                    }`}
                  >
                    <span className={`text-sm font-bold ${driver.active ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                      {driver.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-foreground truncate">{driver.name}</h3>
                      {driver.active ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 font-medium">Ativo</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border font-medium">Inativo</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {driver.neighborhood}, {driver.city}{driver.state ? ` - ${driver.state}` : ''}
                      </span>
                      {driver.coverageAreas && driver.coverageAreas.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium w-fit">
                            +{driver.coverageAreas.length} área{driver.coverageAreas.length > 1 ? 's' : ''} de cobertura
                          </span>
                          <div className="bg-muted/20 rounded-lg p-2 border border-dashed border-border">
                            <p className="text-xs font-medium text-foreground mb-1">Áreas de cobertura:</p>
                            <div className="space-y-1">
                              {driver.coverageAreas.map((area, index) => (
                                <div key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 text-accent" />
                                  <span>
                                    <strong>{(area as any).bairro || (area as any).neighborhood}</strong>
                                    {(area as any).cidade || (area as any).city ? `, ${(area as any).cidade || (area as any).city}` : ''}
                                    {(area as any).state ? ` - ${(area as any).state}` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {driver.vehicle && (
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          {driver.vehicle}{driver.licensePlate ? ` • ${driver.licensePlate}` : ''}
                        </span>
                      )}
                      {driver.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {driver.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(driver)}
                      className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                      title={driver.active ? 'Desativar' : 'Ativar'}
                    >
                      {driver.active ? (
                        <UserCheck className="w-4 h-4 text-success" />
                      ) : (
                        <UserX className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(driver)}
                      className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {confirmDelete === driver.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="h-7 px-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90 transition-colors"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="h-7 px-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(driver.id)}
                        className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <DriverForm
          driver={editingDriver}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingDriver(null); }}
        />
      )}
    </div>
  );
};

export default Drivers;
