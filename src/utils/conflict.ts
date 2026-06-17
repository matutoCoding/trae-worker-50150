import { Booking, BookingConflict, RefundInfo } from '../types/booking';
import { timeToMinutes } from './date';

export const isTimeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
};

const isDateInRange = (date: string, startDate: string, endDate: string): boolean => {
  const d = new Date(date).getTime();
  const s = new Date(startDate).getTime();
  const e = new Date(endDate).getTime();
  return d >= s && d <= e;
};

export const isSeatFixedForMonthly = (
  seatId: string,
  date: string,
  existingBookings: Booking[],
  excludeBookingId?: string
): Booking | null => {
  return existingBookings.find((booking) => {
    if (excludeBookingId && booking.id === excludeBookingId) return false;
    if (booking.seatId !== seatId) return false;
    if (!booking.isMonthly) return false;
    if (booking.status === 'cancelled') return false;
    if (!booking.monthlyStartDate || !booking.monthlyEndDate) return false;
    return isDateInRange(date, booking.monthlyStartDate, booking.monthlyEndDate);
  }) || null;
};

export const isSeatOccupiedInRange = (
  seatId: string,
  startDate: string,
  endDate: string,
  existingBookings: Booking[],
  excludeBookingId?: string
): Booking[] => {
  const conflicts: Booking[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    existingBookings.forEach((booking) => {
      if (excludeBookingId && booking.id === excludeBookingId) return;
      if (booking.seatId !== seatId) return;
      if (booking.isMonthly) return;
      if (booking.status === 'cancelled') return;
      if (booking.date !== dateStr) return;
      conflicts.push(booking);
    });
  }
  return conflicts;
};

export const checkBookingConflict = (
  seatId: string,
  date: string,
  startTime: string,
  endTime: string,
  existingBookings: Booking[],
  excludeBookingId?: string
): BookingConflict => {
  const fixedBooking = isSeatFixedForMonthly(seatId, date, existingBookings, excludeBookingId);
  if (fixedBooking) {
    return {
      hasConflict: true,
      conflictingBookings: [fixedBooking],
      message: `该座位为${fixedBooking.monthlyStartDate}至${fixedBooking.monthlyEndDate}的月租固定座，此期间不可预订`,
    };
  }

  const conflictingBookings = existingBookings.filter((booking) => {
    if (excludeBookingId && booking.id === excludeBookingId) return false;
    if (booking.seatId !== seatId) return false;
    if (booking.isMonthly) return false;
    if (booking.date !== date) return false;
    if (booking.status === 'cancelled') return false;
    return isTimeOverlap(startTime, endTime, booking.startTime, booking.endTime);
  });

  if (conflictingBookings.length === 0) {
    return {
      hasConflict: false,
      conflictingBookings: [],
    };
  }

  const conflictInfo = conflictingBookings
    .map((b) => `${b.startTime}-${b.endTime}`)
    .join('、');

  return {
    hasConflict: true,
    conflictingBookings,
    message: `该座位在 ${conflictInfo} 时段已被预订，请选择其他时段或座位`,
  };
};

export const isSeatAvailableAtTime = (
  seatId: string,
  date: string,
  time: string,
  existingBookings: Booking[]
): boolean => {
  const activeBookings = existingBookings.filter(
    (b) =>
      b.seatId === seatId &&
      b.date === date &&
      b.status !== 'cancelled'
  );

  for (const booking of activeBookings) {
    if (isTimeOverlap(time, time, booking.startTime, booking.endTime)) {
      return false;
    }
  }

  return true;
};

export const getSeatOccupiedTimeRanges = (
  seatId: string,
  date: string,
  existingBookings: Booking[]
): { startTime: string; endTime: string }[] => {
  return existingBookings
    .filter(
      (b) =>
        b.seatId === seatId &&
        b.date === date &&
        b.status !== 'cancelled'
    )
    .map((b) => ({
      startTime: b.startTime,
      endTime: b.endTime,
    }));
};

export const calculateRefund = (booking: Booking): RefundInfo | null => {
  if (booking.isMonthly) {
    return {
      refundAmount: 0,
      refundRate: 0,
      reason: '月租订单一经确认，不予退款',
      hoursBeforeStart: -1,
    };
  }

  const now = new Date();
  const startDateTime = new Date(`${booking.date}T${booking.startTime}:00`);
  const diffMs = startDateTime.getTime() - now.getTime();
  const hoursBeforeStart = diffMs / (1000 * 60 * 60);

  const totalAmount = booking.billing.totalAmount;

  if (hoursBeforeStart >= 2) {
    return {
      refundAmount: totalAmount,
      refundRate: 100,
      reason: '开始前2小时以上退订，全额退款',
      hoursBeforeStart,
    };
  } else if (hoursBeforeStart >= 1) {
    return {
      refundAmount: totalAmount * 0.5,
      refundRate: 50,
      reason: '开始前1-2小时退订，退款50%',
      hoursBeforeStart,
    };
  } else if (hoursBeforeStart > 0) {
    return {
      refundAmount: 0,
      refundRate: 0,
      reason: '开始前1小时内不可退订',
      hoursBeforeStart,
    };
  } else {
    return {
      refundAmount: 0,
      refundRate: 0,
      reason: '预订已开始，不可退订',
      hoursBeforeStart,
    };
  }
};

export const canCancelBooking = (booking: Booking): boolean => {
  if (booking.status !== 'confirmed' && booking.status !== 'pending') {
    return false;
  }
  const refund = calculateRefund(booking);
  return refund ? refund.hoursBeforeStart > 0 : false;
};

export const releaseBookingTimeSlot = (
  bookingId: string,
  existingBookings: Booking[]
): Booking[] => {
  return existingBookings.map((booking) => {
    if (booking.id === bookingId) {
      const refundInfo = calculateRefund(booking);
      return {
        ...booking,
        status: 'cancelled' as const,
        cancelledAt: new Date().toISOString(),
        refundInfo,
      };
    }
    return booking;
  });
};
