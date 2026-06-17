export type SeatStatus = 'available' | 'selected' | 'occupied' | 'fixed' | 'disabled';

export type SeatType = 'standard' | 'window' | 'quiet' | 'vip';

export interface Seat {
  id: string;
  seatNo: string;
  row: number;
  col: number;
  type: SeatType;
  status: SeatStatus;
  hasPower: boolean;
  nearWindow: boolean;
  isQuiet: boolean;
  monthlyFixed?: boolean;
  monthlyUserId?: string;
}

export interface SeatZone {
  id: string;
  name: string;
  description: string;
  rows: number;
  cols: number;
  seats: Seat[];
}
