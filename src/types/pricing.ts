export type PriceTier = 'peak' | 'normal' | 'valley';

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface PriceRate {
  tier: PriceTier;
  name: string;
  pricePerHour: number;
  startTime: string;
  endTime: string;
}

export interface BillingSegment {
  tier: PriceTier;
  tierName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  pricePerHour: number;
  subtotal: number;
}

export interface BillingResult {
  segments: BillingSegment[];
  totalDurationMinutes: number;
  totalAmount: number;
  isMonthly: boolean;
  monthlyFee?: number;
}

export interface MonthlyPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  days: number;
  hoursPerDay: number;
  features: string[];
}
