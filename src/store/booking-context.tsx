import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { Seat } from '../types/seat';
import { Booking, SelectedSeatInfo } from '../types/booking';
import { BillingResult, MonthlyPackage } from '../types/pricing';
import { mockBookings } from '../data/bookings';
import { getToday, addDays } from '../utils/date';
import { checkBookingConflict, releaseBookingTimeSlot, isSeatFixedForMonthly, isSeatOccupiedInRange } from '../utils/conflict';
import { calculateBilling } from '../utils/billing';

const STORAGE_KEY_BOOKINGS = 'study_room_bookings';

interface ModifyResult {
  success: boolean;
  booking?: Booking;
  priceDiff?: number;
  message?: string;
}

interface MonthlyBookingInfo {
  package: MonthlyPackage | null;
  startDate: string;
  endDate: string;
  seat: Seat | null;
}

interface BookingContextValue {
  bookings: Booking[];
  selectedSeatInfo: SelectedSeatInfo;
  monthlyBookingInfo: MonthlyBookingInfo;
  modifyBookingId: string | null;
  setSelectedSeat: (seat: Seat | null) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (startTime: string, endTime: string) => void;
  setMonthlyPackage: (pkg: MonthlyPackage | null) => void;
  setMonthlyStartDate: (date: string) => void;
  setMonthlySeat: (seat: Seat | null) => void;
  setModifyBookingId: (id: string | null) => void;
  createBooking: () => Booking | null;
  createMonthlyBooking: () => Booking | null;
  cancelBooking: (bookingId: string) => boolean;
  modifyBooking: (bookingId: string) => ModifyResult;
  checkConflict: (seatId: string, date: string, startTime: string, endTime: string, excludeBookingId?: string) => boolean;
  checkMonthlyConflict: (seatId: string, startDate: string, endDate: string, excludeBookingId?: string) => { hasConflict: boolean; message?: string };
  calculateCurrentBilling: () => BillingResult | null;
  initModifyMode: (bookingId: string) => void;
  resetMonthlyBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

const initialSelectedInfo: SelectedSeatInfo = {
  seat: null,
  date: getToday(),
  startTime: '09:00',
  endTime: '12:00',
};

const initialMonthlyInfo: MonthlyBookingInfo = {
  package: null,
  startDate: getToday(),
  endDate: addDays(getToday(), 29),
  seat: null,
};

const loadBookingsFromStorage = (): Booking[] => {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_BOOKINGS);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      console.log('[BookingContext] 从本地存储加载订单:', stored.length, '条');
      return stored;
    }
    console.log('[BookingContext] 本地存储为空，使用Mock数据初始化');
    return mockBookings;
  } catch (e) {
    console.error('[BookingContext] 读取本地存储失败:', e);
    return mockBookings;
  }
};

const saveBookingsToStorage = (bookings: Booking[]) => {
  try {
    Taro.setStorageSync(STORAGE_KEY_BOOKINGS, bookings);
    console.log('[BookingContext] 订单已保存到本地存储:', bookings.length, '条');
  } catch (e) {
    console.error('[BookingContext] 保存本地存储失败:', e);
  }
};

const STORAGE_KEY_MODIFY_ID = 'study_room_modify_booking_id';

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>(() => loadBookingsFromStorage());
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<SelectedSeatInfo>(initialSelectedInfo);
  const [monthlyBookingInfo, setMonthlyBookingInfo] = useState<MonthlyBookingInfo>(initialMonthlyInfo);
  const [modifyBookingId, setModifyBookingId] = useState<string | null>(() => {
    try {
      return Taro.getStorageSync(STORAGE_KEY_MODIFY_ID) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    saveBookingsToStorage(bookings);
  }, [bookings]);

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

  const setMonthlyPackage = useCallback((pkg: MonthlyPackage | null) => {
    console.log('[BookingContext] 选择月租套餐:', pkg?.name);
    setMonthlyBookingInfo((prev) => ({
      ...prev,
      package: pkg,
      endDate: pkg ? addDays(prev.startDate, pkg.days - 1) : prev.endDate,
    }));
  }, []);

  const setMonthlyStartDate = useCallback((date: string) => {
    console.log('[BookingContext] 设置月租开始日期:', date);
    setMonthlyBookingInfo((prev) => ({
      ...prev,
      startDate: date,
      endDate: prev.package ? addDays(date, prev.package.days - 1) : addDays(date, 29),
    }));
  }, []);

  const setMonthlySeat = useCallback((seat: Seat | null) => {
    console.log('[BookingContext] 选择月租座位:', seat?.seatNo);
    setMonthlyBookingInfo((prev) => ({ ...prev, seat }));
  }, []);

  const setModifyBookingIdWithStorage = useCallback((id: string | null) => {
    console.log('[BookingContext] 设置改期订单ID:', id);
    setModifyBookingId(id);
    try {
      if (id) {
        Taro.setStorageSync(STORAGE_KEY_MODIFY_ID, id);
      } else {
        Taro.removeStorageSync(STORAGE_KEY_MODIFY_ID);
      }
    } catch (e) {
      console.error('[BookingContext] 保存改期订单ID失败:', e);
    }
  }, []);

  const resetMonthlyBooking = useCallback(() => {
    setMonthlyBookingInfo(initialMonthlyInfo);
  }, []);

  const checkMonthlyConflict = useCallback(
    (seatId: string, startDate: string, endDate: string, excludeBookingId?: string): { hasConflict: boolean; message?: string } => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const monthlyBooking = isSeatFixedForMonthly(seatId, dateStr, bookings, excludeBookingId);
        if (monthlyBooking) {
          return { hasConflict: true, message: `该座位在 ${dateStr} 已被月租锁定` };
        }
      }
      const normalConflicts = isSeatOccupiedInRange(seatId, startDate, endDate, bookings, excludeBookingId);
      if (normalConflicts.length > 0) {
        const conflictDates = [...new Set(normalConflicts.map((b) => b.date))];
        return { hasConflict: true, message: `该座位在 ${conflictDates.slice(0, 3).join('、')}${conflictDates.length > 3 ? '等日期' : ''} 已有普通预订订单` };
      }
      return { hasConflict: false };
    },
    [bookings]
  );

  const createMonthlyBooking = useCallback((): Booking | null => {
    const { package: pkg, startDate, endDate, seat } = monthlyBookingInfo;

    if (!pkg) {
      console.error('[BookingContext] 创建月租订单失败: 未选择套餐');
      return null;
    }
    if (!seat) {
      console.error('[BookingContext] 创建月租订单失败: 未选择座位');
      return null;
    }

    const conflictCheck = checkMonthlyConflict(seat.id, startDate, endDate);
    if (conflictCheck.hasConflict) {
      console.error('[BookingContext] 创建月租订单失败:', conflictCheck.message);
      return null;
    }

    const billing: BillingResult = {
      segments: [],
      totalDurationMinutes: 0,
      totalAmount: pkg.price,
      isMonthly: true,
      monthlyFee: pkg.price,
    };

    const newBooking: Booking = {
      id: `booking-${Date.now()}`,
      orderNo: `YX${startDate.replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      seatId: seat.id,
      seat,
      userId: 'user-001',
      date: startDate,
      startTime: '08:00',
      endTime: '22:00',
      status: 'confirmed',
      billing,
      createdAt: new Date().toISOString(),
      isMonthly: true,
      monthlyStartDate: startDate,
      monthlyEndDate: endDate,
    };

    console.log('[BookingContext] 创建月租订单成功:', newBooking.orderNo, '有效期:', startDate, '至', endDate);
    setBookings((prev) => [...prev, newBooking]);
    setMonthlyBookingInfo(initialMonthlyInfo);

    return newBooking;
  }, [monthlyBookingInfo, checkMonthlyConflict]);

  const checkConflict = useCallback(
    (seatId: string, date: string, startTime: string, endTime: string, excludeBookingId?: string): boolean => {
      const result = checkBookingConflict(seatId, date, startTime, endTime, bookings, excludeBookingId);
      return result.hasConflict;
    },
    [bookings]
  );

  const initModifyMode = useCallback((bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setSelectedSeatInfo({
        seat: booking.seat || null,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
      });
      console.log('[BookingContext] 进入修改模式:', booking.orderNo);
    }
  }, [bookings]);

  const modifyBooking = useCallback((bookingId: string): ModifyResult => {
    const { seat, date, startTime, endTime } = selectedSeatInfo;
    const originalBooking = bookings.find((b) => b.id === bookingId);

    if (!originalBooking) {
      return { success: false, message: '原订单不存在' };
    }
    if (!seat) {
      return { success: false, message: '请选择座位' };
    }

    const conflict = checkBookingConflict(seat.id, date, startTime, endTime, bookings, bookingId);
    if (conflict.hasConflict) {
      return { success: false, message: conflict.message || '新时段存在冲突' };
    }

    const newBilling = calculateBilling(startTime, endTime);
    const priceDiff = newBilling.totalAmount - originalBooking.billing.totalAmount;

    const updatedBooking: Booking = {
      ...originalBooking,
      seatId: seat.id,
      seat,
      date,
      startTime,
      endTime,
      billing: newBilling,
      modifiedAt: new Date().toISOString(),
      originalDate: originalBooking.originalDate || originalBooking.date,
      originalStartTime: originalBooking.originalStartTime || originalBooking.startTime,
      originalEndTime: originalBooking.originalEndTime || originalBooking.endTime,
    };

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? updatedBooking : b))
    );
    setSelectedSeatInfo(initialSelectedInfo);

    console.log('[BookingContext] 修改订单成功:', originalBooking.orderNo, '差价:', priceDiff);
    return {
      success: true,
      booking: updatedBooking,
      priceDiff,
      message: priceDiff > 0 ? `需补差价 ¥${priceDiff.toFixed(2)}` : priceDiff < 0 ? `将退还 ¥${Math.abs(priceDiff).toFixed(2)}` : '价格无变化',
    };
  }, [selectedSeatInfo, bookings]);

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
    monthlyBookingInfo,
    modifyBookingId,
    setSelectedSeat,
    setSelectedDate,
    setSelectedTime,
    setMonthlyPackage,
    setMonthlyStartDate,
    setMonthlySeat,
    setModifyBookingId: setModifyBookingIdWithStorage,
    createBooking,
    createMonthlyBooking,
    cancelBooking,
    modifyBooking,
    checkConflict,
    checkMonthlyConflict,
    calculateCurrentBilling,
    initModifyMode,
    resetMonthlyBooking,
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
