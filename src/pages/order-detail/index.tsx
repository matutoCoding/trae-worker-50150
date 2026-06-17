import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useBooking } from '../../store/booking-context';
import BillingDetail from '../../components/BillingDetail';
import { BookingStatus } from '../../types/booking';
import { calculateRefund, canCancelBooking } from '../../utils/conflict';
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

  const refundInfo = useMemo(() => {
    if (!booking) return null;
    return calculateRefund(booking);
  }, [booking]);

  const canCancel = useMemo(() => {
    if (!booking) return false;
    return canCancelBooking(booking);
  }, [booking]);

  const handleCancel = () => {
    if (!booking || !refundInfo) return;
    if (!canCancel) {
      Taro.showToast({ title: refundInfo.reason, icon: 'none' });
      return;
    }

    const refundText = refundInfo.refundRate === 100 
      ? '全额退款' 
      : refundInfo.refundRate > 0 
        ? `退款${refundInfo.refundRate}%（¥${refundInfo.refundAmount.toFixed(2)}）`
        : '不予退款';

    Taro.showModal({
      title: '确认退订',
      content: `确定要退订 ${booking.seat?.seatNo || '该座位'} ${booking.date} ${booking.startTime}-${booking.endTime} 的预订吗？\n\n退订规则：${refundInfo.reason}\n预计退款：${refundText}\n\n退订后该时段将被释放。`,
      confirmText: '确认退订',
      confirmColor: '#F53F3F',
      success: (res) => {
        if (res.confirm) {
          const success = cancelBooking(booking.id);
          if (success) {
            Taro.showToast({ 
              title: refundInfo.refundAmount > 0 ? `退订成功，退款¥${refundInfo.refundAmount.toFixed(2)}` : '退订成功', 
              icon: 'success' 
            });
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

  const handleModify = () => {
    if (!booking) return;
    Taro.navigateTo({
      url: `/pages/booking/index?modifyId=${booking.id}`,
    });
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
    booking.modifiedAt && { time: booking.modifiedAt, content: '订单已修改' },
    booking.status === 'cancelled' && booking.cancelledAt && { time: booking.cancelledAt, content: booking.refundInfo?.refundAmount ? `订单已取消，已退款¥${booking.refundInfo.refundAmount.toFixed(2)}` : '订单已取消' },
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

        {booking.refundInfo && (
          <View className={styles.infoCard}>
            <Text className={styles.cardTitle}>
              <Text className={styles.cardTitleIcon}>💰</Text>
              退款信息
            </Text>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>退款状态</Text>
              <Text className={`${styles.infoValue} ${booking.refundInfo.refundAmount > 0 ? styles.highlight : styles.dimmed}`}>
                {booking.refundInfo.refundAmount > 0 ? '已退款' : '无退款'}
              </Text>
            </View>
            {booking.refundInfo.refundAmount > 0 && (
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>退款金额</Text>
                <Text className={`${styles.infoValue} ${styles.highlight}`}>
                  ¥{booking.refundInfo.refundAmount.toFixed(2)}
                </Text>
              </View>
            )}
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>退款说明</Text>
              <Text className={styles.infoValue}>{booking.refundInfo.reason}</Text>
            </View>
            {booking.refundInfo.hoursBeforeStart > 0 && (
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>退订时间</Text>
                <Text className={styles.infoValue}>
                  距开始前 {booking.refundInfo.hoursBeforeStart.toFixed(1)} 小时
                </Text>
              </View>
            )}
          </View>
        )}

        {booking.status === 'confirmed' && refundInfo && !booking.isMonthly && (
          <View className={styles.infoCard}>
            <Text className={styles.cardTitle}>
              <Text className={styles.cardTitleIcon}>📋</Text>
              退订规则
            </Text>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>当前状态</Text>
              <Text className={`${styles.infoValue} ${canCancel ? styles.highlight : styles.dimmed}`}>
                {canCancel ? '可退订' : '不可退订'}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>预计退款</Text>
              <Text className={`${styles.infoValue} ${styles.highlight}`}>
                {refundInfo.refundRate === 100 ? '全额退款' : `${refundInfo.refundRate}%（¥${refundInfo.refundAmount.toFixed(2)}）`}
              </Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>退订说明</Text>
              <Text className={styles.infoValue}>{refundInfo.reason}</Text>
            </View>
          </View>
        )}

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
        {(booking.status === 'confirmed' || booking.status === 'pending') && !booking.isMonthly ? (
          <>
            <Button className={classnames(styles.btn, styles.btnSecondary)} onClick={handleModify}>
              修改订单
            </Button>
            <Button 
              className={classnames(styles.btn, !canCancel && styles.disabled)} 
              onClick={handleCancel}
              disabled={!canCancel}
            >
              {canCancel ? '申请退订' : '不可退订'}
            </Button>
          </>
        ) : (
          <Button className={classnames(styles.btn, styles.btnPrimary, styles.fullWidth)} onClick={handleGoHome}>
            继续预订
          </Button>
        )}
      </View>
    </View>
  );
};

export default OrderDetailPage;
