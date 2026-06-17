import { Seat } from './seat';
import { BillingResult, BillingSegment } from './pricing';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface BookingTimeRange {
  date: string;
  startTime: string;
  endTime: string;
}

export interface RefundInfo {
  refundAmount: number;
  refundRate: number;
  reason: string;
  hoursBeforeStart: number;
}

export interface Booking {
  id: string;
  orderNo: string;
  seatId: string;
  seat?: Seat;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  billing: BillingResult;
  createdAt: string;
  cancelledAt?: string;
  refundInfo?: RefundInfo;
  isMonthly: boolean;
  monthlyStartDate?: string;
  monthlyEndDate?: string;
  modifiedAt?: string;
  originalDate?: string;
  originalStartTime?: string;
  originalEndTime?: string;
}

export interface BookingConflict {
  hasConflict: boolean;
  conflictingBookings: Booking[];
  message?: string;
}

export interface SelectedSeatInfo {
  seat: Seat | null;
  date: string;
  startTime: string;
  endTime: string;
}
