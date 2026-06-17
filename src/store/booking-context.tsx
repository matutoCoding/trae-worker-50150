import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Seat } from '../types/seat';
import { Booking, SelectedSeatInfo } from '../types/booking';
import { BillingResult } from '../types/pricing';
import { mockBookings } from '../data/bookings';
import { getToday } from '../utils/date';
import { checkBookingConflict, releaseBookingTimeSlot } from '../utils/conflict';
import { calculateBilling } from '../utils/billing';

interface BookingContextValue {
  bookings: Booking[];
  selectedSeatInfo: SelectedSeatInfo;
  setSelectedSeat: (seat: Seat | null) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (startTime: string, endTime: string) => void;
  createBooking: () => Booking | null;
  cancelBooking: (bookingId: string) => boolean;
  checkConflict: (seatId: string, date: string, startTime: string, endTime: string) => boolean;
  calculateCurrentBilling: () => BillingResult | null;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

const initialSelectedInfo: SelectedSeatInfo = {
  seat: null,
  date: getToday(),
  startTime: '09:00',
  endTime: '12:00',
};

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<SelectedSeatInfo>(initialSelectedInfo);

  const setSelectedSeat = useCallback((seat: Seat | null) => {
    console.log('[BookingContext] 选择座位:', seat?.seatNo);
    setSelectedSeatInfo((prev) => ({ ...prev, seat }));
  }, []);

  const setSelectedDate = useCallback((date: string) => {
    console.log('[BookingContext] 选择日期:', date);
    setSelectedSeatInfo((prev) => ({ ...prev, date }));
  }, []);

  const setSelectedTime = useCallback((startTime: string, endTime: string) => {
    console.log('[BookingContext] 选择时段:', { startTime, endTime });
    setSelectedSeatInfo((prev) => ({ ...prev, startTime, endTime }));
  }, []);

  const checkConflict = useCallback(
    (seatId: string, date: string, startTime: string, endTime: string): boolean => {
      const result = checkBookingConflict(seatId, date, startTime, endTime, bookings);
      return result.hasConflict;
    },
    [bookings]
  );

  const calculateCurrentBilling = useCallback((): BillingResult | null => {
    const { startTime, endTime } = selectedSeatInfo;
    if (!startTime || !endTime) return null;
    return calculateBilling(startTime, endTime);
  }, [selectedSeatInfo]);

  const createBooking = useCallback((): Booking | null => {
    const { seat, date, startTime, endTime } = selectedSeatInfo;

    if (!seat) {
      console.error('[BookingContext] 创建预订失败: 未选择座位');
      return null;
    }

    const conflict = checkBookingConflict(seat.id, date, startTime, endTime, bookings);
    if (conflict.hasConflict) {
      console.error('[BookingContext] 创建预订失败: 时段冲突', conflict.message);
      return null;
    }

    const billing = calculateBilling(startTime, endTime);
    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      orderNo: `JX${date.replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      seatId: seat.id,
      seat,
      userId: 'user-001',
      date,
      startTime,
      endTime,
      status: 'confirmed',
      billing,
      createdAt: new Date().toISOString(),
      isMonthly: false,
    };

    console.log('[BookingContext] 创建预订成功:', newBooking.orderNo);
    setBookings((prev) => [...prev, newBooking]);
    setSelectedSeatInfo(initialSelectedInfo);

    return newBooking;
  }, [selectedSeatInfo, bookings]);

  const cancelBooking = useCallback((bookingId: string): boolean => {
    console.log('[BookingContext] 取消预订:', bookingId);
    const updated = releaseBookingTimeSlot(bookingId, bookings);
    if (updated.length === bookings.length) {
      const target = updated.find((b) => b.id === bookingId);
      if (target && target.status === 'cancelled') {
        setBookings(updated);
        console.log('[BookingContext] 取消成功，时段已释放');
        return true;
      }
    }
    console.error('[BookingContext] 取消预订失败');
    return false;
  }, [bookings]);

  const value: BookingContextValue = {
    bookings,
    selectedSeatInfo,
    setSelectedSeat,
    setSelectedDate,
    setSelectedTime,
    createBooking,
    cancelBooking,
    checkConflict,
    calculateCurrentBilling,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBooking = (): BookingContextValue => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
