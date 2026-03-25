import { useState, useEffect } from 'react';
import { type Driver, type CoverageArea } from '@/types/delivery';
import { X, Plus, Trash2, MapPin } from 'lucide-react';

interface DriverFormProps {
  driver?: Driver | null;
  onSave: (data: Omit<Driver, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
}

export function DriverForm({ driver, onSave, onCancel }: DriverFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [state, setState] = useState('');
  const [active, setActive] = useState(true);
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([]);

  useEffect(() => {
    if (driver) {
      setName(driver.name);
      setPhone(driver.phone || '');
      setVehicle(driver.vehicle || '');
      setLicensePlate(driver.licensePlate || '');
      setCity(driver.city);
      setNeighborhood(driver.neighborhood);
      setState(driver.state || '');
      setActive(driver.active);
      
      // Carregar áreas de cobertura existentes
      if (driver.coverageAreas && driver.coverageAreas.length > 0) {
        console.log('📍 Carregando áreas de cobertura existentes:', driver.coverageAreas);
        // Garantir que todas as áreas tenham todos os campos necessários
        const normalizedAreas = driver.coverageAreas.map(area => ({
          city: area.city || (area as any).cidade || '',
          neighborhood: area.neighborhood || (area as any).bairro || '',
          state: area.state || ''
        }));
        console.log('📍 Áreas normalizadas:', normalizedAreas);
        setCoverageAreas(normalizedAreas);
      } else {
        console.log('📍 Nenhuma área de cobertura encontrada para este motorista');
        setCoverageAreas([]);
      }
    } else {
      // Limpar formulário ao cadastrar novo motorista
      setCoverageAreas([]);
    }
  }, [driver]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !neighborhood.trim()) return;
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim() || undefined,
        vehicle: vehicle.trim() || undefined,
        licensePlate: licensePlate.trim() || undefined,
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        state: state.trim() || undefined,
        active,
        coverageAreas,
      });
    } catch (error) {
      console.error('Erro ao salvar motorista:', error);
    }
  };

  const addCoverageArea = () => {
    setCoverageAreas(prev => [...prev, { city: '', neighborhood: '', state: '' }]);
  };

  const updateCoverageArea = (index: number, field: keyof CoverageArea, value: string) => {
    setCoverageAreas(prev => prev.map((area, i) => i === index ? { ...area, [field]: value } : area));
  };

  const removeCoverageArea = (index: number) => {
    setCoverageAreas(prev => prev.filter((_, i) => i !== index));
  };

  const inputClass =
    'w-full h-10 px-3 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all';

  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">
              {driver ? 'Editar Motorista' : 'Novo Motorista'}
            </h2>
            {driver && (
              <p className="text-sm text-muted-foreground mt-1">
                Editando: <span className="font-medium">{driver.name}</span>
              </p>
            )}
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo" className={inputClass} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Veículo</label>
              <input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Moto, Van, Carro..." className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Placa</label>
            <input value={licensePlate} onChange={e => setLicensePlate(e.target.value)} placeholder="ABC-1234" className={inputClass} />
          </div>
          
          {/* Endereço de residência */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Endereço de residência
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Cidade *</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade" className={inputClass} required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Bairro *</label>
                <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro" className={inputClass} required />
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Estado</label>
              <input value={state} onChange={e => setState(e.target.value)} placeholder="UF" className={inputClass} />
            </div>
          </div>

          {/* Áreas de cobertura */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                Áreas de Cobertura
              </p>
              <button
                type="button"
                onClick={addCoverageArea}
                className="h-8 px-3 rounded-lg bg-accent/10 text-accent text-sm font-medium flex items-center gap-1.5 hover:bg-accent/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Área
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-4 bg-muted/30 p-3 rounded-lg border border-dashed border-border">
              💡 <strong>Dica:</strong> Adicione bairros e cidades adicionais que este motorista pode cobrer além do seu endereço de residência. 
              Isso ajuda o sistema a distribuir as entregas de forma mais equilibrada.
            </p>

            {coverageAreas.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-border rounded-xl bg-muted/20">
                <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">
                  Nenhuma área de cobertura adicional
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Este motorista só atenderá entregas no seu bairro principal
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {coverageAreas.map((area, index) => (
                  <div key={index} className="relative bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-accent" />
                        Área {index + 1}
                        {area.city && area.neighborhood && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">
                            {area.neighborhood}, {area.city}
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCoverageArea(index)}
                        className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors"
                        title="Remover área"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cidade da área</label>
                        <input
                          value={area.city}
                          onChange={e => updateCoverageArea(index, 'city', e.target.value)}
                          placeholder="Ex: São Paulo"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bairro da área</label>
                        <input
                          value={area.neighborhood}
                          onChange={e => updateCoverageArea(index, 'neighborhood', e.target.value)}
                          placeholder="Ex: Centro"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Estado (opcional)</label>
                      <input
                        value={area.state || ''}
                        onChange={e => updateCoverageArea(index, 'state', e.target.value)}
                        placeholder="UF"
                        className={inputClass}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary accent-primary"
            />
            <label htmlFor="active" className="text-sm text-foreground">Motorista ativo</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 h-10 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
              {driver ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
