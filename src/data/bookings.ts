import { Booking } from '../types/booking';
import { getToday, addDays } from '../utils/date';
import { calculateBilling, calculateMonthlyBilling } from '../utils/billing';
import { getSeatById } from './seats';

const generateOrderNo = (): string => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `JX${dateStr}${random}`;
};

const today = getToday();

export const mockBookings: Booking[] = [
  {
    id: 'booking-001',
    orderNo: generateOrderNo(),
    seatId: 'seat-a8',
    seat: getSeatById('seat-a8'),
    userId: 'user-001',
    date: today,
    startTime: '09:00',
    endTime: '12:00',
    status: 'confirmed',
    billing: calculateBilling('09:00', '12:00'),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isMonthly: false,
  },
  {
    id: 'booking-002',
    orderNo: generateOrderNo(),
    seatId: 'seat-a9',
    seat: getSeatById('seat-a9'),
    userId: 'user-001',
    date: today,
    startTime: '14:00',
    endTime: '20:00',
    status: 'confirmed',
    billing: calculateBilling('14:00', '20:00'),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isMonthly: false,
  },
  {
    id: 'booking-003',
    orderNo: generateOrderNo(),
    seatId: 'seat-b3',
    seat: getSeatById('seat-b3'),
    userId: 'user-001',
    date: today,
    startTime: '10:00',
    endTime: '11:30',
    status: 'confirmed',
    billing: calculateBilling('10:00', '11:30'),
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isMonthly: false,
  },
  {
    id: 'booking-004',
    orderNo: generateOrderNo(),
    seatId: 'seat-a21',
    seat: getSeatById('seat-a21'),
    userId: 'user-001',
    date: addDays(today, -1),
    startTime: '18:00',
    endTime: '21:00',
    status: 'completed',
    billing: calculateBilling('18:00', '21:00'),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isMonthly: false,
  },
  {
    id: 'booking-005',
    orderNo: generateOrderNo(),
    seatId: 'seat-a12',
    seat: getSeatById('seat-a12'),
    userId: 'user-001',
    date: today,
    startTime: '08:00',
    endTime: '22:00',
    status: 'confirmed',
    billing: calculateMonthlyBilling(699, today, addDays(today, 29)),
    createdAt: new Date(Date.now() - 604800000).toISOString(),
    isMonthly: true,
    monthlyStartDate: today,
    monthlyEndDate: addDays(today, 29),
  },
  {
    id: 'booking-006',
    orderNo: generateOrderNo(),
    seatId: 'seat-b5',
    seat: getSeatById('seat-b5'),
    userId: 'user-001',
    date: addDays(today, -2),
    startTime: '13:00',
    endTime: '17:00',
    status: 'cancelled',
    billing: calculateBilling('13:00', '17:00'),
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    cancelledAt: new Date(Date.now() - 250000000).toISOString(),
    isMonthly: false,
  },
];
