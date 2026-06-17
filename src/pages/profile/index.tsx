import React from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useBooking } from '../../store/booking-context';
import { formatDuration } from '../../utils/date';
import styles from './index.module.scss';

const ProfilePage: React.FC = () => {
  const { bookings } = useBooking();

  const confirmedBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'completed'
  );
  const totalHours = confirmedBookings.reduce(
    (sum, b) => sum + b.billing.totalDurationMinutes,
    0
  );
  const totalSpent = confirmedBookings.reduce(
    (sum, b) => sum + b.billing.totalAmount,
    0
  );

  const handleMenuClick = (name: string) => {
    Taro.showToast({ title: `${name}功能开发中`, icon: 'none' });
  };

  return (
    <View className={styles.profilePage}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>👤</View>
          <View className={styles.userMeta}>
            <Text className={styles.userName}>学习达人</Text>
            <Text className={styles.userDesc}>已累计学习 {formatDuration(totalHours)}</Text>
          </View>
        </View>
        <View className={styles.stats}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{confirmedBookings.length}</Text>
            <Text className={styles.statLabel}>累计订单</Text>
          </View>
          <View className={styles.divider} />
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatDuration(totalHours)}</Text>
            <Text className={styles.statLabel}>学习时长</Text>
          </View>
          <View className={styles.divider} />
          <View className={styles.statItem}>
            <Text className={styles.statValue}>¥{totalSpent.toFixed(0)}</Text>
            <Text className={styles.statLabel}>累计消费</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.vipCard}>
          <Text className={styles.vipTitle}>🎫 升级月租会员</Text>
          <Text className={styles.vipDesc}>固定专属座位，天天学习更省心</Text>
          <Button
            className={styles.vipBtn}
            onClick={() => Taro.switchTab({ url: '/pages/pricing/index' })}
          >
            立即开通
          </Button>
        </View>

        <Text className={styles.sectionTitle}>常用功能</Text>
        <View className={styles.card}>
          <View className={styles.menuItem} onClick={() => Taro.switchTab({ url: '/pages/orders/index' })}>
            <View className={`${styles.menuIcon} ${styles.iconBlue}`}>📋</View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle}>我的订单</Text>
              <Text className={styles.menuDesc}>查看和管理预订记录</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuClick('我的收藏')}>
            <View className={`${styles.menuIcon} ${styles.iconOrange}`}>⭐</View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle}>收藏座位</Text>
              <Text className={styles.menuDesc}>快速预订常坐的座位</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuClick('学习记录')}>
            <View className={`${styles.menuIcon} ${styles.iconGreen}`}>📊</View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle}>学习记录</Text>
              <Text className={styles.menuDesc}>查看学习数据统计</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>

        <Text className={styles.sectionTitle}>其他</Text>
        <View className={styles.card}>
          <View className={styles.menuItem} onClick={() => handleMenuClick('消息通知')}>
            <View className={`${styles.menuIcon} ${styles.iconPurple}`}>🔔</View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle}>消息通知</Text>
              <Text className={styles.menuDesc}>预订提醒和系统通知</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuClick('帮助中心')}>
            <View className={`${styles.menuIcon} ${styles.iconBlue}`}>❓</View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle}>帮助中心</Text>
              <Text className={styles.menuDesc}>常见问题和使用指南</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuClick('联系客服')}>
            <View className={`${styles.menuIcon} ${styles.iconGreen}`}>💬</View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle}>联系客服</Text>
              <Text className={styles.menuDesc}>在线咨询和问题反馈</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={() => handleMenuClick('设置')}>
            <View className={`${styles.menuIcon} ${styles.iconRed}`}>⚙️</View>
            <View className={styles.menuContent}>
              <Text className={styles.menuTitle}>设置</Text>
              <Text className={styles.menuDesc}>账号和偏好设置</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProfilePage;
