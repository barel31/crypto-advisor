export type AlertCondition = 'above' | 'below';

export interface PriceAlert {
  id: string;
  symbol: string;
  price: number;
  condition: AlertCondition;
  createdAt: Date;
  triggered?: boolean;
  userId?: string;
}

export interface CreateAlertDTO {
  symbol: string;
  price: number;
  condition: AlertCondition;
}

export interface AlertResponse {
  id: string;
  symbol: string;
  price: number;
  condition: AlertCondition;
  createdAt: string;
  triggered: boolean;
}

export interface AlertError {
  error: string;
  code?: string;
  status: number;
}
