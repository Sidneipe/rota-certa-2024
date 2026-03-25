import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, User, Navigation, UserCircle } from 'lucide-react';
import { RouteGroup, Delivery, Driver } from '@/types/delivery';

interface RouteGroupCardProps {
  group: RouteGroup;
  drivers?: Driver[];
  onStatusChange: (deliveryId: string, status: Delivery['status']) => void;
  onAssignDriver?: (groupId: number, driverId: string | undefined) => void;
}

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

export function RouteGroupCard({ group, drivers = [], onStatusChange, onAssignDriver }: RouteGroupCardProps) {
  const [expanded, setExpanded] = useState(false);
  const delivered = group.deliveries.filter(d => d.status === 'delivered').length;
  const progress = group.deliveries.length > 0 ? (delivered / group.deliveries.length) * 100 : 0;
  const assignedDriver = Array.isArray(drivers) ? drivers.find(d => d.id === group.assignedDriver) : undefined;

  const openInMaps = (d: Delivery) => {
    const query = encodeURIComponent(
      `${d.address}${d.number ? ', ' + d.number : ''}, ${d.neighborhood}, ${d.city}${d.state ? ' - ' + d.state : ''}`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: group.color }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-foreground truncate">
            {group.name}
          </h3>
          {assignedDriver && (
            <div className="flex items-center gap-1 text-xs text-accent">
              <UserCircle className="w-3 h-3" />
              <span className="truncate">{assignedDriver.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: group.color }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {delivered}/{group.deliveries.length}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border">
          {drivers.length > 0 && onAssignDriver && (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border">
              <UserCircle className="w-4 h-4 text-muted-foreground" />
              <select
                value={group.assignedDriver || ''}
                onChange={(e) => onAssignDriver(group.id, e.target.value || undefined)}
                className="text-xs px-2 py-1 rounded-lg border border-border bg-card text-foreground cursor-pointer"
              >
                <option value="">Sem motorista</option>
                {drivers.filter(d => d.active).map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.neighborhood}, {d.city}</option>
                ))}
              </select>
            </div>
          )}
          {group.deliveries.map((delivery, idx) => (
            <div
              key={delivery.id}
              className="flex items-start gap-3 p-4 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {delivery.recipientName}
                  </span>
                </div>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground">
                    {delivery.address}{delivery.number ? `, ${delivery.number}` : ''}
                    {delivery.complement ? ` - ${delivery.complement}` : ''}
                    {' • '}{delivery.neighborhood}
                    {delivery.zipCode ? ` • CEP ${delivery.zipCode}` : ''}
                  </span>
                </div>
                {delivery.trackingCode && (
                  <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
                    {delivery.trackingCode}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={delivery.status}
                  onChange={(e) => onStatusChange(delivery.id, e.target.value as Delivery['status'])}
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
          ))}
        </div>
      )}
    </div>
  );
}
