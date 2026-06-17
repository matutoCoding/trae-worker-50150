import { Booking, BookingConflict } from '../types/booking';
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

export const checkBookingConflict = (
  seatId: string,
  date: string,
  startTime: string,
  endTime: string,
  existingBookings: Booking[],
  excludeBookingId?: string
): BookingConflict => {
  const conflictingBookings = existingBookings.filter((booking) => {
    if (excludeBookingId && booking.id === excludeBookingId) return false;
    if (booking.seatId !== seatId) return false;
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

export const releaseBookingTimeSlot = (
  bookingId: string,
  existingBookings: Booking[]
): Booking[] => {
  return existingBookings.map((booking) => {
    if (booking.id === bookingId) {
      return {
        ...booking,
        status: 'cancelled' as const,
        cancelledAt: new Date().toISOString(),
      };
    }
    return booking;
  });
};
