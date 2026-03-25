export interface Delivery {
  id: string;
  trackingCode?: string;
  recipientName: string;
  address: string;
  number?: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state?: string;
  zipCode: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  assignedTo?: string;
  routeGroup?: number;
  order?: number;
  notes?: string;
  rawData?: Record<string, unknown>;
}

export interface RouteGroup {
  id: number;
  name: string;
  color: string;
  deliveries: Delivery[];
  assignedDriver?: string;
}
