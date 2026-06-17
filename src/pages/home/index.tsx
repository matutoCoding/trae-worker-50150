import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useBooking } from '../../store/booking-context';
import { mockSeatZones } from '../../data/seats';
import DatePicker from '../../components/DatePicker';
import TimeSlotPicker from '../../components/TimeSlotPicker';
import SeatGrid from '../../components/SeatGrid';
import BillingDetail from '../../components/BillingDetail';
import { Seat } from '../../types/seat';
import { checkBookingConflict, isTimeOverlap, isSeatFixedForMonthly } from '../../utils/conflict';
import { calculateBilling } from '../../utils/billing';
import styles from './index.module.scss';

const HomePage: React.FC = () => {
  const {
    bookings,
    selectedSeatInfo,
    modifyBookingId,
    setSelectedSeat,
    setSelectedDate,
    setSelectedTime,
    setModifyBookingId,
  } = useBooking();

  const { seat, date, startTime, endTime } = selectedSeatInfo;

  const occupiedSeatIds = useMemo(() => {
    const timeOccupied = bookings
      .filter((b) => b.date === date && b.status !== 'cancelled' && !b.isMonthly)
      .filter((b) => b.id !== modifyBookingId)
      .filter((b) => isTimeOverlap(startTime, endTime, b.startTime, b.endTime))
      .map((b) => b.seatId);

    const monthlyFixed = bookings
      .filter((b) => b.isMonthly && b.status !== 'cancelled')
      .filter((b) => b.id !== modifyBookingId)
      .filter((b) => b.monthlyStartDate && b.monthlyEndDate)
      .filter((b) => isSeatFixedForMonthly(b.seatId, date, bookings, modifyBookingId || undefined) !== null)
      .map((b) => b.seatId);

    return [...new Set([...timeOccupied, ...monthlyFixed])];
  }, [bookings, date, startTime, endTime, modifyBookingId]);

  const conflictInfo = useMemo(() => {
    if (!seat) return null;
    return checkBookingConflict(seat.id, date, startTime, endTime, bookings, modifyBookingId || undefined);
  }, [seat, date, startTime, endTime, bookings, modifyBookingId]);

  const billing = useMemo(() => {
    return calculateBilling(startTime, endTime);
  }, [startTime, endTime]);

  const handleSeatClick = (clickedSeat: Seat) => {
    if (clickedSeat.status === 'disabled') {
      Taro.showToast({ title: '该座位维护中', icon: 'none' });
      return;
    }
    if (clickedSeat.status === 'fixed') {
      Taro.showToast({ title: '该座位为固定月租座', icon: 'none' });
      return;
    }
    if (occupiedSeatIds.includes(clickedSeat.id)) {
      Taro.showToast({ title: '该座位此时段已被占用', icon: 'none' });
      return;
    }
    if (seat?.id === clickedSeat.id) {
      setSelectedSeat(null);
    } else {
      setSelectedSeat(clickedSeat);
    }
  };

  const canConfirm = seat && !conflictInfo?.hasConflict;

  const handleConfirm = () => {
    if (!seat) {
      Taro.showToast({ title: '请先选择座位', icon: 'none' });
      return;
    }
    if (conflictInfo?.hasConflict) {
      Taro.showToast({ title: conflictInfo.message || '时段冲突', icon: 'none' });
      return;
    }
    if (modifyBookingId) {
      console.log('[HomePage] 改期模式，跳转到确认订单页', modifyBookingId);
      Taro.navigateTo({ url: `/pages/booking/index?modifyId=${modifyBookingId}` });
    } else {
      console.log('[HomePage] 跳转到确认订单页');
      Taro.navigateTo({ url: '/pages/booking/index' });
    }
  };

  return (
    <View className={styles.homePage}>
      <View className={styles.header}>
        <Text className={styles.title}>
          {modifyBookingId ? '修改预订' : '静学自习室'}
        </Text>
        <Text className={styles.subtitle}>
          {modifyBookingId ? '重新选择日期、时段和座位' : '选择日期和时段，挑选你喜欢的座位'}
        </Text>
      </View>

      {modifyBookingId && (
        <View style={{ background: '#E8F0FE', margin: '24rpx 32rpx 0', padding: '20rpx 24rpx', borderRadius: '16rpx' }}>
          <Text style={{ fontSize: '26rpx', color: '#4F6EF5' }}>
            📝 您正在修改订单，原订单的时段已临时释放，选完座位确认后将覆盖原订单
          </Text>
        </View>
      )}

      <View className={styles.content}>
        <DatePicker selectedDate={date} onDateChange={setSelectedDate} />

        <TimeSlotPicker
          startTime={startTime}
          endTime={endTime}
          seatId={seat?.id}
          date={date}
          bookings={bookings.filter((b) => b.id !== modifyBookingId)}
          onTimeChange={setSelectedTime}
        />

        {conflictInfo?.hasConflict && (
          <View className={styles.conflictTip}>
            <Text className={styles.conflictText}>⚠️ {conflictInfo.message}</Text>
          </View>
        )}

        {mockSeatZones.map((zone) => (
          <SeatGrid
            key={zone.id}
            zone={zone}
            selectedSeatId={seat?.id}
            onSeatClick={handleSeatClick}
            occupiedSeatIds={occupiedSeatIds}
          />
        ))}

        {seat && <BillingDetail billing={billing} title="预估费用" />}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.seatSummary}>
          {seat ? (
            <>
              <Text className={styles.selectedSeat}>
                已选 {seat.seatNo}
                {seat.nearWindow && ' · 靠窗'}
                {seat.type === 'quiet' && ' · 静音'}
                {seat.type === 'vip' && ' · VIP'}
              </Text>
              <Text className={styles.selectedTime}>
                {date.slice(5)} {startTime} - {endTime}
              </Text>
            </>
          ) : (
            <>
              <Text className={styles.selectedSeat}>请选择座位</Text>
              <Text className={styles.selectedTime}>点击座位图中的座位进行选择</Text>
            </>
          )}
        </View>
        <View className={styles.priceSection}>
          <Text className={styles.priceLabel}>预估</Text>
          <Text className={styles.priceValue}>¥{billing.totalAmount.toFixed(2)}</Text>
        </View>
        <Button
          className={classnames(styles.confirmBtn, !canConfirm && styles.disabled)}
          onClick={handleConfirm}
        >
          确认预订
        </Button>
      </View>
    </View>
  );
};

export default HomePage;
