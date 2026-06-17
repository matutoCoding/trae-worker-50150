import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { PriceRate } from '../../types/pricing';
import styles from './index.module.scss';

interface PriceTierCardProps {
  rate: PriceRate;
  desc?: string;
}

const getBadgeClass = (tier: string): string => {
  switch (tier) {
    case 'peak':
      return styles.badgePeak;
    case 'normal':
      return styles.badgeNormal;
    case 'valley':
      return styles.badgeValley;
    default:
      return styles.badgeNormal;
  }
};

const getPriceClass = (tier: string): string => {
  switch (tier) {
    case 'peak':
      return '';
    case 'normal':
      return styles.priceNormal;
    case 'valley':
      return styles.priceValley;
    default:
      return '';
  }
};

const PriceTierCard: React.FC<PriceTierCardProps> = ({ rate, desc }) => {
  return (
    <View className={styles.priceTierCard}>
      <View className={styles.tierHeader}>
        <Text className={styles.tierName}>
          <View className={classnames(styles.tierBadge, getBadgeClass(rate.tier))} />
          {rate.name}
        </Text>
        <Text className={styles.timeRange}>{rate.startTime} - {rate.endTime}</Text>
      </View>
      <View className={styles.priceRow}>
        <Text className={classnames(styles.price, getPriceClass(rate.tier))}>
          <Text className={styles.currency}>¥</Text>
          {rate.pricePerHour}
          <Text className={styles.perUnit}>/小时</Text>
        </Text>
      </View>
      {desc && <Text className={styles.desc}>{desc}</Text>}
    </View>
  );
};

export default PriceTierCard;
