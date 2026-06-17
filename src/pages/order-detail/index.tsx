import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useBooking } from '../../store/booking-context';
import BillingDetail from '../../components/BillingDetail';
import { BookingStatus } from '../../types/booking';
import classnames from 'classnames';
import styles from './index.module.scss';

const getStatusInfo = (status: BookingStatus) => {
  switch (status) {
    case 'confirmed':
      return { text: '预订成功', desc: '请按时到达自习室', icon: '✅' };
    case 'pending':
      return { text: '待确认', desc: '预订正在确认中', icon: '⏳' };
    case 'cancelled':
      return { text: '已取消', desc: '该订单已被取消', icon: '❌' };
    case 'completed':
      return { text: '已完成', desc: '感谢您的使用', icon: '📝' };
    default:
      return { text: '未知状态', desc: '', icon: '❓' };
  }
};

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const { bookings, cancelBooking } = useBooking();
  const orderId = router.params.id;

  const booking = useMemo(() => {
    return bookings.find((b) => b.id === orderId);
  }, [bookings, orderId]);

  const handleCancel = () => {
    if (!booking) return;
    Taro.showModal({
      title: '确认退订',
      content: `确定要退订 ${booking.seat?.seatNo || '该座位'} ${booking.date} ${booking.startTime}-${booking.endTime} 的预订吗？退订后该时段将被释放。`,
      confirmText: '确认退订',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          const success = cancelBooking(booking.id);
          if (success) {
            Taro.showToast({ title: '退订成功', icon: 'success' });
          } else {
            Taro.showToast({ title: '退订失败', icon: 'none' });
          }
        }
      },
    });
  };

  const handleGoHome = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  const handleContact = () => {
    Taro.showToast({ title: '客服功能开发中', icon: 'none' });
  };

  if (!booking) {
    return (
      <View className={styles.detailPage}>
        <View className={styles.content}>
          <View className={styles.infoCard} style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: '64rpx' }}>🔍</Text>
            <Text style={{ display: 'block', marginTop: '16rpx', color: '#86909C' }}>订单不存在</Text>
          </View>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo(booking.status);
  const seatTags: string[] = [];
  if (booking.seat?.type === 'vip') seatTags.push('VIP');
  if (booking.seat?.type === 'quiet') seatTags.push('静音区');
  if (booking.seat?.nearWindow) seatTags.push('靠窗');
  if (booking.seat?.hasPower) seatTags.push('有插座');

  const timeline = [
    { time: booking.createdAt, content: '订单创建成功' },
    booking.status === 'confirmed' && { time: booking.createdAt, content: '预订已确认' },
    booking.status === 'cancelled' && booking.cancelledAt && { time: booking.cancelledAt, content: '订单已取消' },
    booking.status === 'completed' && { time: booking.createdAt, content: '使用已完成' },
  ].filter(Boolean) as { time: string; content: string }[];

  return (
    <View className={styles.detailPage}>
      <View className={classnames(
        styles.statusBanner,
        booking.status === 'confirmed' && styles.statusConfirmed,
        booking.status === 'pending' && styles.statusPending,
        booking.status === 'cancelled' && styles.statusCancelled,
        booking.status === 'completed' && styles.statusCompleted,
      )}>
        <Text className={styles.statusIcon}>{statusInfo.icon}</Text>
        <Text className={styles.statusText}>{statusInfo.text}</Text>
        <Text className={styles.statusDesc}>{statusInfo.desc}</Text>
      </View>

      <View className={styles.content}>
        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>💺</Text>
            座位信息
          </Text>
          <View className={styles.seatRow}>
            <View className={styles.seatBadge}>
              <View className={styles.seatBadgeIcon} />
              <Text className={styles.seatBadgeNo}>{booking.seat?.seatNo}</Text>
            </View>
            <View className={styles.seatInfo}>
              <Text className={styles.seatNo}>
                {booking.seat?.seatNo}号座位
                {booking.isMonthly && '（月租固定座）'}
              </Text>
              <Text className={styles.seatMeta}>
                {seatTags.join(' · ') || '标准座位'}
              </Text>
            </View>
          </View>
        </View>

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>📋</Text>
            订单信息
          </Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>订单编号</Text>
            <Text className={styles.infoValue}>{booking.orderNo}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预订日期</Text>
            <Text className={styles.infoValue}>
              {booking.isMonthly && booking.monthlyStartDate
                ? `${booking.monthlyStartDate} ~ ${booking.monthlyEndDate}`
                : booking.date}
            </Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>使用时段</Text>
            <Text className={styles.infoValue}>
              {booking.isMonthly ? '全天可用' : `${booking.startTime} - ${booking.endTime}`}
            </Text>
          </View>
          {!booking.isMonthly && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>使用时长</Text>
              <Text className={styles.infoValue}>
                {Math.floor(booking.billing.totalDurationMinutes / 60)}小时
                {booking.billing.totalDurationMinutes % 60}分钟
              </Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>创建时间</Text>
            <Text className={styles.infoValue}>
              {new Date(booking.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>

        <BillingDetail billing={booking.billing} title="费用明细" />

        <View className={styles.infoCard}>
          <Text className={styles.cardTitle}>
            <Text className={styles.cardTitleIcon}>🕐</Text>
            订单状态
          </Text>
          <View className={styles.timeline}>
            {timeline.map((item, idx) => (
              <View key={idx} className={styles.timelineItem}>
                <Text className={styles.timelineTime}>
                  {new Date(item.time).toLocaleString()}
                </Text>
                <Text className={styles.timelineContent}>{item.content}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={handleContact}>
          联系客服
        </Button>
        {(booking.status === 'confirmed' || booking.status === 'pending') && !booking.isMonthly ? (
          <Button className={classnames(styles.btn, styles.btnDanger)} onClick={handleCancel}>
            申请退订
          </Button>
        ) : (
          <Button className={classnames(styles.btn, styles.btnPrimary)} onClick={handleGoHome}>
            继续预订
          </Button>
        )}
      </View>
    </View>
  );
};

export default OrderDetailPage;
