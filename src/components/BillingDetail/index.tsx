import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { BillingResult } from '../../types/pricing';
import { formatDuration } from '../../utils/date';
import styles from './index.module.scss';

interface BillingDetailProps {
  billing: BillingResult;
  title?: string;
}

const getTierClass = (tier: string): string => {
  switch (tier) {
    case 'peak':
      return styles.tierPeak;
    case 'normal':
      return styles.tierNormal;
    case 'valley':
      return styles.tierValley;
    default:
      return styles.tierMonthly;
  }
};

const BillingDetail: React.FC<BillingDetailProps> = ({ billing, title = '费用明细' }) => {
  if (billing.isMonthly) {
    return (
      <View className={styles.billingDetail}>
        <Text className={styles.title}>{title}</Text>
        <View className={styles.overview}>
          <Text className={styles.durationText}>月租套餐</Text>
          <Text className={styles.totalAmount}>
            <Text className={styles.currency}>¥</Text>
            {billing.totalAmount.toFixed(2)}
          </Text>
        </View>
        <View className={styles.segments}>
          {billing.segments.map((seg, idx) => (
            <View key={idx} className={styles.segmentRow}>
              <View className={styles.segmentLeft}>
                <View className={classnames(styles.tierBadge, getTierClass(seg.tier))}>
                  {seg.tierName}
                </View>
                <Text className={styles.segmentTime}>{seg.startTime} - {seg.endTime}</Text>
              </View>
              <View className={styles.segmentRight}>
                <Text className={styles.segmentSubtotal}>¥{seg.subtotal.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className={styles.billingDetail}>
      <Text className={styles.title}>{title}</Text>
      <View className={styles.overview}>
        <Text className={styles.durationText}>共 {formatDuration(billing.totalDurationMinutes)}</Text>
        <Text className={styles.totalAmount}>
          <Text className={styles.currency}>¥</Text>
          {billing.totalAmount.toFixed(2)}
        </Text>
      </View>
      <View className={styles.segments}>
        {billing.segments.map((seg, idx) => (
          <View key={idx} className={styles.segmentRow}>
            <View className={styles.segmentLeft}>
              <View className={classnames(styles.tierBadge, getTierClass(seg.tier))}>
                {seg.tierName}
              </View>
              <Text className={styles.segmentTime}>
                {seg.startTime} - {seg.endTime}（{formatDuration(seg.durationMinutes)}）
              </Text>
            </View>
            <View className={styles.segmentRight}>
              <Text className={styles.segmentRate}>¥{seg.pricePerHour}/小时</Text>
              <Text className={styles.segmentSubtotal}>¥{seg.subtotal.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>
      <View className={styles.feeRow}>
        <Text className={styles.feeLabel}>合计</Text>
        <Text className={styles.feeValue}>¥{billing.totalAmount.toFixed(2)}</Text>
      </View>
    </View>
  );
};

export default BillingDetail;
