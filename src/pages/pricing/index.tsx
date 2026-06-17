import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { priceRates, monthlyPackages } from '../../data/pricing';
import PriceTierCard from '../../components/PriceTierCard';
import { calculateBilling } from '../../utils/billing';
import styles from './index.module.scss';

const PricingPage: React.FC = () => {
  const exampleBilling = calculateBilling('10:00', '19:00');

  return (
    <View className={styles.pricingPage}>
      <View className={styles.header}>
        <Text className={styles.title}>价格说明</Text>
        <Text className={styles.subtitle}>透明定价，分段计费，为你省钱</Text>
      </View>

      <View className={styles.content}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>⏰</Text>
            时段费率
          </Text>
          {priceRates.map((rate) => (
            <PriceTierCard
              key={rate.tier}
              rate={rate}
              desc={
                rate.tier === 'valley'
                  ? '上午时段，人少安静，性价比最高'
                  : rate.tier === 'normal'
                  ? '下午时段，适中价格，适合日常学习'
                  : '晚间黄金时段，需求旺盛，建议提前预订'
              }
            />
          ))}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🧮</Text>
            分段计费示例
          </Text>
          <View className={styles.exampleCard}>
            <Text className={styles.exampleTitle}>示例：10:00 - 19:00（共9小时）</Text>
            <Text className={styles.exampleDesc}>
              跨时段预订将自动按费率切换点拆分，分别计算后合计
            </Text>
            <View className={styles.exampleBreakdown}>
              {exampleBilling.segments.map((seg, idx) => (
                <View key={idx} className={styles.exampleRow}>
                  <Text className={styles.exampleLabel}>
                    {seg.tierName} {seg.startTime}-{seg.endTime}
                    （{Math.round(seg.durationMinutes / 60 * 10) / 10}小时 × ¥{seg.pricePerHour}）
                  </Text>
                  <Text className={styles.exampleValue}>¥{seg.subtotal.toFixed(2)}</Text>
                </View>
              ))}
              <View className={styles.exampleTotal}>
                <Text className={styles.exampleTotalLabel}>合计应付</Text>
                <Text className={styles.exampleTotalValue}>¥{exampleBilling.totalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🎫</Text>
            月租套餐
          </Text>
          {monthlyPackages.map((pkg, idx) => (
            <View
              key={pkg.id}
              className={classnames(styles.monthlyCard, idx === 1 && styles.recommended)}
            >
              <View className={styles.monthlyHeader}>
                <View>
                  <Text className={styles.monthlyName}>{pkg.name}</Text>
                  <Text className={styles.monthlyDesc}>{pkg.description}</Text>
                </View>
                <View className={styles.monthlyPrice}>
                  <Text className={styles.monthlyAmount}>
                    <Text className={styles.monthlyCurrency}>¥</Text>
                    {pkg.price}
                  </Text>
                  <Text className={styles.monthlyUnit}>/{pkg.days}天</Text>
                </View>
              </View>
              <View className={styles.monthlyFeatures}>
                {pkg.features.map((f) => (
                  <Text key={f} className={styles.featureTag}>✓ {f}</Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📋</Text>
            计费规则
          </Text>
          <View className={styles.rulesCard}>
            <View className={styles.ruleItem}>
              <View className={styles.ruleDot} />
              <View className={styles.ruleContent}>
                <Text className={styles.ruleTitle}>分段计费</Text>
                <Text className={styles.ruleDesc}>
                  预订时长跨费率切换点时，系统自动按各时段费率拆分计算，分别计费后合计总金额。
                </Text>
              </View>
            </View>
            <View className={styles.ruleItem}>
              <View className={styles.ruleDot} />
              <View className={styles.ruleContent}>
                <Text className={styles.ruleTitle}>最短时长</Text>
                <Text className={styles.ruleDesc}>
                  每次预订最短30分钟，按30分钟为单位递增。
                </Text>
              </View>
            </View>
            <View className={styles.ruleItem}>
              <View className={styles.ruleDot} />
              <View className={styles.ruleContent}>
                <Text className={styles.ruleTitle}>退订政策</Text>
                <Text className={styles.ruleDesc}>
                  开始前2小时可免费退订，开始前1-2小时退订收取50%费用，开始前1小时内不可退订。
                </Text>
              </View>
            </View>
            <View className={styles.ruleItem}>
              <View className={styles.ruleDot} />
              <View className={styles.ruleContent}>
                <Text className={styles.ruleTitle}>冲突检测</Text>
                <Text className={styles.ruleDesc}>
                  同一座位同一时段不可重复预订，系统会自动检测并提示冲突。
                </Text>
              </View>
            </View>
            <View className={styles.ruleItem}>
              <View className={styles.ruleDot} />
              <View className={styles.ruleContent}>
                <Text className={styles.ruleTitle}>月租权益</Text>
                <Text className={styles.ruleDesc}>
                  月租用户享受专属固定座位，无需每日抢座，全天不限时使用。
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PricingPage;
