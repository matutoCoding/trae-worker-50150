import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useBooking } from '../../store/booking-context';
import BillingDetail from '../../components/BillingDetail';
import { calculateBilling } from '../../utils/billing';
import { checkBookingConflict } from '../../utils/conflict';
import styles from './index.module.scss';

const BookingPage: React.FC = () => {
  const { selectedSeatInfo, createBooking, bookings } = useBooking();
  const { seat, date, startTime, endTime } = selectedSeatInfo;

  const billing = useMemo(() => {
    if (!startTime || !endTime) return null;
    return calculateBilling(startTime, endTime);
  }, [startTime, endTime]);

  const hasConflict = useMemo(() => {
    if (!seat) return false;
    const result = checkBookingConflict(seat.id, date, startTime, endTime, bookings);
    return result.hasConflict;
  }, [seat, date, startTime, endTime, bookings]);

  const seatTags: string[] = [];
  if (seat?.type === 'vip') seatTags.push('VIP座位');
  if (seat?.type === 'quiet') seatTags.push('静音区');
  if (seat?.nearWindow) seatTags.push('靠窗');
  if (seat?.hasPower) seatTags.push('有插座');

  const handleSubmit = () => {
    if (!seat || !billing) return;
    if (hasConflict) {
      Taro.showToast({ title: '该时段已被占用，请重新选择', icon: 'none' });
      return;
    }

    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      const newBooking = createBooking();
      Taro.hideLoading();
      if (newBooking) {
        Taro.showToast({ title: '预订成功', icon: 'success' });
        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/order-detail/index?id=${newBooking.id}`,
          });
        }, 1000);
      } else {
        Taro.showToast({ title: '预订失败，请重试', icon: 'none' });
      }
    }, 500);
  };

  const handleGoSelect = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  if (!seat || !billing) {
    return (
      <View className={styles.bookingPage}>
        <View className={styles.content}>
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>💺</Text>
            <Text className={styles.emptyText}>请先选择座位和时段</Text>
            <Button className={styles.goBtn} onClick={handleGoSelect}>
              去选座
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.bookingPage}>
      <View className={styles.content}>
        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>💺</Text>
            座位信息
          </Text>
          <View className={styles.seatDetail}>
            <View className={styles.seatVisual}>
              <View className={styles.seatVisualIcon} />
              <Text className={styles.seatVisualNo}>{seat.seatNo}</Text>
            </View>
            <View className={styles.seatInfo}>
              <Text className={styles.seatNoLarge}>{seat.seatNo}号座位</Text>
              <View className={styles.seatTags}>
                {seatTags.map((tag) => (
                  <Text key={tag} className={styles.seatTag}>{tag}</Text>
                ))}
              </View>
              <Text className={styles.seatZone}>
                {seat.id.startsWith('seat-a') ? 'A区·静谧学习区' : 'B区·开放协作区'}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>📅</Text>
            预订信息
          </Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预订日期</Text>
            <Text className={styles.infoValue}>{date}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>使用时段</Text>
            <Text className={styles.infoValue}>{startTime} - {endTime}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>使用时长</Text>
            <Text className={styles.infoValue}>
              {Math.floor(billing.totalDurationMinutes / 60)}小时{billing.totalDurationMinutes % 60}分钟
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>状态检测</Text>
            <Text className={`${styles.infoValue} ${hasConflict ? '' : styles.highlight}`}>
              {hasConflict ? '⚠️ 时段冲突' : '✓ 可预订'}
            </Text>
          </View>
        </View>

        <BillingDetail billing={billing} title="费用明细" />

        <View className={styles.noticeCard}>
          <Text className={styles.noticeTitle}>⚠️ 预订须知</Text>
          <View className={styles.noticeList}>
            <Text className={styles.noticeItem}>请按时到达，逾期15分钟未到将自动取消</Text>
            <Text className={styles.noticeItem}>开始前2小时可免费退订</Text>
            <Text className={styles.noticeItem}>请保持安静，手机调至静音模式</Text>
            <Text className={styles.noticeItem}>爱护设施，离座时请整理好个人物品</Text>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.priceBlock}>
          <Text className={styles.priceLabel}>应付金额</Text>
          <Text className={styles.priceValue}>
            <Text className={styles.currency}>¥</Text>
            {billing.totalAmount.toFixed(2)}
          </Text>
        </View>
        <Button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={hasConflict}
        >
          确认支付
        </Button>
      </View>
    </View>
  );
};

export default BookingPage;
