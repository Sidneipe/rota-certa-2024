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
  routeCode?: string; // Nova coluna para código da rota
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

export interface CoverageArea {
  city: string;
  neighborhood: string;
  state?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  vehicle?: string;
  licensePlate?: string;
  city: string;
  neighborhood: string;
  state?: string;
  coverageAreas: CoverageArea[];
  active: boolean;
  createdAt: string;
}
