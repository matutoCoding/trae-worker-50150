import React, { useMemo, useEffect } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useBooking } from '../../store/booking-context';
import BillingDetail from '../../components/BillingDetail';
import { calculateBilling } from '../../utils/billing';
import { checkBookingConflict } from '../../utils/conflict';
import styles from './index.module.scss';

const BookingPage: React.FC = () => {
  const router = useRouter();
  const modifyId = router.params.modifyId;
  const { selectedSeatInfo, createBooking, modifyBooking, bookings, initModifyMode } = useBooking();
  const { seat, date, startTime, endTime } = selectedSeatInfo;
  const isModifyMode = !!modifyId;

  const originalBooking = useMemo(() => {
    if (!isModifyMode) return null;
    return bookings.find((b) => b.id === modifyId);
  }, [isModifyMode, modifyId, bookings]);

  useEffect(() => {
    if (isModifyMode && originalBooking) {
      initModifyMode(modifyId);
    }
  }, [isModifyMode, modifyId, originalBooking, initModifyMode]);

  const billing = useMemo(() => {
    if (!startTime || !endTime) return null;
    return calculateBilling(startTime, endTime);
  }, [startTime, endTime]);

  const hasConflict = useMemo(() => {
    if (!seat) return false;
    const result = checkBookingConflict(seat.id, date, startTime, endTime, bookings, isModifyMode ? modifyId : undefined);
    return result.hasConflict;
  }, [seat, date, startTime, endTime, bookings, isModifyMode, modifyId]);

  const priceDiff = useMemo(() => {
    if (!isModifyMode || !originalBooking || !billing) return null;
    return billing.totalAmount - originalBooking.billing.totalAmount;
  }, [isModifyMode, originalBooking, billing]);

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
      if (isModifyMode && modifyId) {
        const result = modifyBooking(modifyId);
        Taro.hideLoading();
        if (result.success && result.booking) {
          Taro.showToast({ 
            title: result.priceDiff && result.priceDiff > 0 
              ? `修改成功，${result.message}` 
              : '修改成功', 
            icon: 'success' 
          });
          setTimeout(() => {
            Taro.redirectTo({
              url: `/pages/order-detail/index?id=${result.booking!.id}`,
            });
          }, 1000);
        } else {
          Taro.showToast({ title: result.message || '修改失败，请重试', icon: 'none' });
        }
      } else {
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

        {isModifyMode && originalBooking && (
          <View className={styles.infoCard}>
            <Text className={styles.cardTitle}>
              <Text className={styles.cardTitleIcon}>📝</Text>
              原始订单信息
            </Text>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>原日期</Text>
              <Text className={styles.infoValue}>{originalBooking.date}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>原时段</Text>
              <Text className={styles.infoValue}>
                {originalBooking.startTime} - {originalBooking.endTime}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>原金额</Text>
              <Text className={styles.infoValue}>
                ¥{originalBooking.billing.totalAmount.toFixed(2)}
              </Text>
            </View>
            {priceDiff !== null && (
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>差价</Text>
                <Text className={`${styles.infoValue} ${priceDiff > 0 ? styles.priceUp : priceDiff < 0 ? styles.priceDown : ''}`}>
                  {priceDiff > 0 ? `+¥${priceDiff.toFixed(2)}` : priceDiff < 0 ? `-¥${Math.abs(priceDiff).toFixed(2)}` : '¥0.00'}
                </Text>
              </View>
            )}
          </View>
        )}

        <BillingDetail billing={billing} title={isModifyMode ? "新费用明细" : "费用明细"} />

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
          <Text className={styles.priceLabel}>
            {isModifyMode ? (priceDiff && priceDiff > 0 ? '应付差价' : priceDiff && priceDiff < 0 ? '退还金额' : '金额无变化') : '应付金额'}
          </Text>
          <Text className={styles.priceValue}>
            <Text className={styles.currency}>¥</Text>
            {isModifyMode && priceDiff !== null 
              ? (priceDiff > 0 ? priceDiff : priceDiff < 0 ? Math.abs(priceDiff) : 0).toFixed(2)
              : billing.totalAmount.toFixed(2)}
          </Text>
        </View>
        <Button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={hasConflict}
        >
          {isModifyMode ? '确认修改' : '确认支付'}
        </Button>
      </View>
    </View>
  );
};

export default BookingPage;
