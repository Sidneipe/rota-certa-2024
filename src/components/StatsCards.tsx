import { Package, MapPin, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatsProps {
  total: number;
  pending: number;
  delivered: number;
  inTransit: number;
  failed: number;
  neighborhoods: number;
  cities: number;
}

const stats = [
  { key: 'total', label: 'Total Entregas', icon: Package, variant: 'default' as const },
  { key: 'neighborhoods', label: 'Bairros', icon: MapPin, variant: 'accent' as const },
  { key: 'pending', label: 'Pendentes', icon: Truck, variant: 'warning' as const },
  { key: 'delivered', label: 'Entregues', icon: CheckCircle2, variant: 'success' as const },
  { key: 'failed', label: 'Falhas', icon: AlertCircle, variant: 'destructive' as const },
];

const variantStyles = {
  default: 'bg-card',
  accent: 'bg-card',
  warning: 'bg-card',
  success: 'bg-card',
  destructive: 'bg-card',
};

const iconStyles = {
  default: 'gradient-primary text-primary-foreground',
  accent: 'gradient-accent text-accent-foreground',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  destructive: 'bg-destructive/10 text-destructive',
};

export function StatsCards(props: StatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map(({ key, label, icon: Icon, variant }) => (
        <div
          key={key}
          className={`${variantStyles[variant]} rounded-xl p-4 shadow-card border border-border`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconStyles[variant]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">
                {props[key as keyof StatsProps]}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
