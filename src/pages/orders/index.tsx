import React, { useState, useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useBooking } from '../../store/booking-context';
import OrderCard from '../../components/OrderCard';
import { Booking, BookingStatus } from '../../types/booking';
import styles from './index.module.scss';

type TabType = 'all' | 'confirmed' | 'completed' | 'cancelled';

const tabs: { key: TabType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'confirmed', label: '已确认' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const OrdersPage: React.FC = () => {
  const { bookings, cancelBooking } = useBooking();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const filteredBookings = useMemo(() => {
    let result = [...bookings];
    if (activeTab !== 'all') {
      result = result.filter((b) => b.status === activeTab);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, activeTab]);

  const handleViewDetail = (booking: Booking) => {
    console.log('[OrdersPage] 查看订单详情:', booking.id);
    Taro.navigateTo({
      url: `/pages/order-detail/index?id=${booking.id}`,
    });
  };

  const handleCancel = (booking: Booking) => {
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

  const handleGoBook = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  return (
    <View className={styles.ordersPage}>
      <View className={styles.header}>
        <Text className={styles.title}>我的订单</Text>
        <View className={styles.tabs}>
          {tabs.map((tab) => (
            <View
              key={tab.key}
              className={classnames(
                styles.tab,
                activeTab === tab.key ? styles.tabActive : styles.tabInactive
              )}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.listContainer}>
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <OrderCard
              key={booking.id}
              booking={booking}
              onViewDetail={handleViewDetail}
              onCancel={handleCancel}
            />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无订单记录</Text>
            <Button className={styles.goBookBtn} onClick={handleGoBook}>
              去选座预订
            </Button>
          </View>
        )}
      </View>
    </View>
  );
};

export default OrdersPage;
