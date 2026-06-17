import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import { Booking, BookingStatus } from '../../types/booking';
import styles from './index.module.scss';

interface OrderCardProps {
  booking: Booking;
  onViewDetail?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
}

const getStatusClass = (status: BookingStatus): string => {
  switch (status) {
    case 'confirmed':
      return styles.statusConfirmed;
    case 'pending':
      return styles.statusPending;
    case 'cancelled':
      return styles.statusCancelled;
    case 'completed':
      return styles.statusCompleted;
    default:
      return styles.statusPending;
  }
};

const getStatusText = (status: BookingStatus): string => {
  switch (status) {
    case 'confirmed':
      return '已确认';
    case 'pending':
      return '待确认';
    case 'cancelled':
      return '已取消';
    case 'completed':
      return '已完成';
    default:
      return '未知';
  }
};

const OrderCard: React.FC<OrderCardProps> = ({ booking, onViewDetail, onCancel }) => {
  const seatNo = booking.seat?.seatNo || '未知座位';
  const seatTags: string[] = [];

  if (booking.seat?.type === 'vip') seatTags.push('VIP');
  if (booking.seat?.type === 'quiet') seatTags.push('静音区');
  if (booking.seat?.nearWindow) seatTags.push('靠窗');
  if (booking.seat?.hasPower) seatTags.push('有插座');

  return (
    <View className={styles.orderCard} onClick={() => onViewDetail?.(booking)}>
      <View className={styles.cardHeader}>
        <Text className={styles.orderNo}>订单号：{booking.orderNo}</Text>
        <Text className={classnames(styles.status, getStatusClass(booking.status))}>
          {getStatusText(booking.status)}
        </Text>
      </View>

      <View className={styles.orderBody}>
        <View className={styles.seatInfo}>
          <Text className={styles.seatNo}>
            {seatNo}
            {booking.isMonthly && <Text className={styles.monthlyTag}>月租</Text>}
          </Text>
          <View className={styles.seatTags}>
            {seatTags.map((tag) => (
              <Text key={tag} className={styles.seatTag}>{tag}</Text>
            ))}
          </View>
        </View>
        <View className={styles.timeInfo}>
          <Text className={styles.dateText}>
            {booking.isMonthly && booking.monthlyStartDate
              ? `${booking.monthlyStartDate.slice(5)} ~ ${booking.monthlyEndDate?.slice(5)}`
              : booking.date}
          </Text>
          <Text className={styles.timeRange}>
            {booking.isMonthly ? '全天可用' : `${booking.startTime} - ${booking.endTime}`}
          </Text>
        </View>
      </View>

      <View className={styles.cardFooter}>
        <Text className={styles.amount}>
          <Text className={styles.currency}>¥</Text>
          {booking.billing.totalAmount.toFixed(2)}
        </Text>
        <View className={styles.actions}>
          <Button
            className={classnames(styles.actionBtn, styles.btnSecondary)}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetail?.(booking);
            }}
          >
            查看详情
          </Button>
          {(booking.status === 'confirmed' || booking.status === 'pending') && !booking.isMonthly && (
            <Button
              className={classnames(styles.actionBtn, styles.btnDanger)}
              onClick={(e) => {
                e.stopPropagation();
                onCancel?.(booking);
              }}
            >
              退订
            </Button>
          )}
        </View>
      </View>
    </View>
  );
};

export default OrderCard;
