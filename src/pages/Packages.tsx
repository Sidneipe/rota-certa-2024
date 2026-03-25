import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { useDeliveries } from '@/context/DeliveryContext';
import { Delivery } from '@/types/delivery';
import { useNavigate } from 'react-router-dom';
import { Package, FileUp, MapPin, User, Navigation, Search } from 'lucide-react';

const statusLabels: Record<Delivery['status'], string> = {
  pending: 'Pendente',
  in_transit: 'Em trânsito',
  delivered: 'Entregue',
  failed: 'Falha',
};

const statusStyles: Record<Delivery['status'], string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  in_transit: 'bg-accent/10 text-accent border-accent/20',
  delivered: 'bg-success/10 text-success border-success/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusFilters: Delivery['status'][] = ['pending', 'in_transit', 'delivered', 'failed'];

const Packages = () => {
  const { deliveries, handleStatusChange, hasData } = useDeliveries();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Delivery['status'] | 'all'>('all');

  const filtered = useMemo(() => {
    let list = deliveries;
    if (statusFilter !== 'all') {
      list = list.filter(d => d.status === statusFilter);
    }
    if (search) {
      const term = search.toLowerCase();
      list = list.filter(d =>
        d.recipientName.toLowerCase().includes(term) ||
        d.address.toLowerCase().includes(term) ||
        d.neighborhood.toLowerCase().includes(term) ||
        d.city.toLowerCase().includes(term) ||
        (d.trackingCode || '').toLowerCase().includes(term) ||
        (d.zipCode || '').includes(term)
      );
    }
    return list;
  }, [deliveries, search, statusFilter]);

  const openInMaps = (d: Delivery) => {
    const query = encodeURIComponent(
      `${d.address}${d.number ? ', ' + d.number : ''}, ${d.neighborhood}, ${d.city}${d.state ? ' - ' + d.state : ''}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  if (!hasData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <FileUp className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-display font-bold text-foreground">Nenhum pacote importado</h2>
          <p className="text-sm text-muted-foreground">
            Importe uma planilha no Dashboard para visualizar os pacotes.
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
            <h2 className="text-2xl font-display font-bold text-foreground">Pacotes</h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length} de {deliveries.length} entrega{deliveries.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, endereço, rastreio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === 'all'
                  ? 'gradient-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos
            </button>
            {statusFilters.map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === status
                    ? 'gradient-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        {/* Package List */}
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden divide-y divide-border">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum pacote encontrado.
            </div>
          ) : (
            filtered.map((delivery, idx) => (
              <div
                key={delivery.id}
                className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors"
              >
                <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {delivery.recipientName}
                    </span>
                    {delivery.trackingCode && (
                      <span className="text-xs text-muted-foreground/60 font-mono hidden sm:inline">
                        {delivery.trackingCode}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-muted-foreground">
                      {delivery.address}{delivery.number ? `, ${delivery.number}` : ''}
                      {delivery.complement ? ` - ${delivery.complement}` : ''}
                      {' • '}{delivery.neighborhood} • {delivery.city}
                      {delivery.zipCode ? ` • CEP ${delivery.zipCode}` : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={delivery.status}
                    onChange={(e) => handleStatusChange(delivery.id, e.target.value as Delivery['status'])}
                    className={`text-xs px-2 py-1 rounded-lg border font-medium cursor-pointer ${statusStyles[delivery.status]} bg-transparent`}
                  >
                    {Object.entries(statusLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => openInMaps(delivery)}
                    className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center hover:bg-accent/20 transition-colors"
                    title="Abrir no Google Maps"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Packages;
