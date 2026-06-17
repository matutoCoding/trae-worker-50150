import React, { useMemo, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useBooking } from '../../store/booking-context';
import { monthlyPackages } from '../../data/pricing';
import { mockSeatZones, getAllSeats } from '../../data/seats';
import SeatGrid from '../../components/SeatGrid';
import DatePicker from '../../components/DatePicker';
import { MonthlyPackage } from '../../types/pricing';
import { Seat } from '../../types/seat';
import { isSeatFixedForMonthly, isSeatOccupiedInRange } from '../../utils/conflict';
import styles from './index.module.scss';

const MonthlyBookingPage: React.FC = () => {
  const router = useRouter();
  const pkgId = router.params.pkgId;

  const {
    bookings,
    monthlyBookingInfo,
    setMonthlyPackage,
    setMonthlyStartDate,
    setMonthlySeat,
    createMonthlyBooking,
    checkMonthlyConflict,
    resetMonthlyBooking,
  } = useBooking();

  const { package: selectedPkg, startDate, endDate, seat: selectedSeat } = monthlyBookingInfo;

  const [showSeatPicker, setShowSeatPicker] = useState(false);

  React.useEffect(() => {
    if (pkgId) {
      const pkg = monthlyPackages.find((p) => p.id === pkgId);
      if (pkg) {
        setMonthlyPackage(pkg);
      }
    }
    return () => {
      resetMonthlyBooking();
    };
  }, [pkgId, setMonthlyPackage, resetMonthlyBooking]);

  const occupiedSeatIdsForMonthly = useMemo(() => {
    const result: string[] = [];
    const seats = getAllSeats();
    seats.forEach((s) => {
      let conflict = false;
      const start = new Date(startDate);
      const end = new Date(endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (isSeatFixedForMonthly(s.id, dateStr, bookings)) {
          conflict = true;
          break;
        }
      }
      if (!conflict) {
        const normalConflicts = isSeatOccupiedInRange(s.id, startDate, endDate, bookings);
        if (normalConflicts.length > 0) {
          conflict = true;
        }
      }
      if (conflict) {
        result.push(s.id);
      }
    });
    return result;
  }, [startDate, endDate, bookings]);

  const canSubmit = useMemo(() => {
    if (!selectedPkg) return false;
    if (!selectedSeat) return false;
    const check = checkMonthlyConflict(selectedSeat.id, startDate, endDate);
    return !check.hasConflict;
  }, [selectedPkg, selectedSeat, startDate, endDate, checkMonthlyConflict]);

  const handlePackageSelect = (pkg: MonthlyPackage) => {
    setMonthlyPackage(pkg);
  };

  const handleDateChange = (date: string) => {
    setMonthlyStartDate(date);
  };

  const handleSeatClick = (clickedSeat: Seat) => {
    if (clickedSeat.status === 'disabled') {
      Taro.showToast({ title: '该座位维护中', icon: 'none' });
      return;
    }
    if (clickedSeat.status === 'fixed') {
      Taro.showToast({ title: '该座位为固定月租座', icon: 'none' });
      return;
    }
    if (occupiedSeatIdsForMonthly.includes(clickedSeat.id)) {
      const conflict = checkMonthlyConflict(clickedSeat.id, startDate, endDate);
      Taro.showToast({
        title: conflict.hasConflict && conflict.message ? conflict.message : '该座位在所选日期范围内已被锁定',
        icon: 'none',
      });
      return;
    }
    setMonthlySeat(clickedSeat);
    setShowSeatPicker(false);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;

    const conflict = checkMonthlyConflict(selectedSeat!.id, startDate, endDate);
    if (conflict.hasConflict) {
      Taro.showToast({
        title: conflict.message || '该座位在所选日期范围内有冲突',
        icon: 'none',
      });
      return;
    }

    Taro.showModal({
      title: '确认开通',
      content: `确定开通 ${selectedPkg!.name} 吗？\n\n座位：${selectedSeat!.seatNo}\n有效期：${startDate} 至 ${endDate}\n价格：¥${selectedPkg!.price}`,
      confirmText: '确认支付',
      confirmColor: '#4F6EF5',
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '开通中...' });
          setTimeout(() => {
            const newBooking = createMonthlyBooking();
            Taro.hideLoading();
            if (newBooking) {
              Taro.showToast({ title: '开通成功', icon: 'success' });
              setTimeout(() => {
                Taro.redirectTo({
                  url: `/pages/order-detail/index?id=${newBooking.id}`,
                });
              }, 1000);
            } else {
              Taro.showToast({ title: '开通失败，请重试', icon: 'none' });
            }
          }, 500);
        }
      },
    });
  };

  if (!selectedPkg) {
    return (
      <View className={styles.monthlyPage}>
        <View className={styles.content}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🎫</Text>
            选择套餐
          </Text>
          {monthlyPackages.map((pkg) => (
            <View
              key={pkg.id}
              className={classnames(styles.packageCard, selectedPkg?.id === pkg.id && styles.selected)}
              onClick={() => handlePackageSelect(pkg)}
            >
              <View className={styles.packageHeader}>
                <View>
                  <Text className={styles.packageName}>{pkg.name}</Text>
                  <Text className={styles.packageDesc}>{pkg.description}</Text>
                </View>
                <View className={styles.packagePrice}>
                  <Text className={styles.packageAmount}>
                    <Text className={styles.currency}>¥</Text>
                    {pkg.price}
                  </Text>
                  <Text className={styles.packageUnit}>/{pkg.days}天</Text>
                </View>
              </View>
              <View className={styles.packageFeatures}>
                {pkg.features.map((f) => (
                  <Text key={f} className={styles.featureTag}>✓ {f}</Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (showSeatPicker) {
    return (
      <View className={styles.monthlyPage}>
        <View className={styles.content}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>💺</Text>
            选择固定座位
          </Text>
          <Text style={{ fontSize: '26rpx', color: '#86909C', marginBottom: '24rpx' }}>
            灰色座位为已被锁定（月租或已有普通预订）
          </Text>
          {mockSeatZones.map((zone) => (
            <View key={zone.id} className={styles.seatGridSection}>
              <SeatGrid
                zone={zone}
                selectedSeatId={selectedSeat?.id}
                onSeatClick={handleSeatClick}
                occupiedSeatIds={occupiedSeatIdsForMonthly}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className={styles.monthlyPage}>
      <View className={styles.content}>
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>🎫</Text>
            已选套餐
          </Text>
          <View className={classnames(styles.packageCard, styles.selected)}>
            <View className={styles.packageHeader}>
              <View>
                <Text className={styles.packageName}>{selectedPkg.name}</Text>
                <Text className={styles.packageDesc}>{selectedPkg.description}</Text>
              </View>
              <View className={styles.packagePrice}>
                <Text className={styles.packageAmount}>
                  <Text className={styles.currency}>¥</Text>
                  {selectedPkg.price}
                </Text>
                <Text className={styles.packageUnit}>/{selectedPkg.days}天</Text>
              </View>
            </View>
            <View className={styles.packageFeatures}>
              {selectedPkg.features.map((f) => (
                <Text key={f} className={styles.featureTag}>✓ {f}</Text>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>📅</Text>
            选择有效期
          </Text>
          <View className={styles.infoCard}>
            <DatePicker selectedDate={startDate} onDateChange={handleDateChange} />
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>开始日期</Text>
              <Text className={styles.infoValue}>{startDate}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>结束日期</Text>
              <Text className={classnames(styles.infoValue, styles.highlight)}>{endDate}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>总天数</Text>
              <Text className={styles.infoValue}>{selectedPkg.days}天</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            <Text className={styles.sectionIcon}>💺</Text>
            选择固定座位
          </Text>
          <View className={styles.infoCard}>
            <View className={styles.seatInfoRow}>
              <Text className={styles.seatLabel}>固定座位</Text>
              {selectedSeat ? (
                <>
                  <View className={styles.seatValue}>
                    <View className={styles.seatBadge}>
                      <View className={styles.seatIcon} />
                      <Text>{selectedSeat.seatNo}号</Text>
                    </View>
                    <Text style={{ fontSize: '24rpx', color: '#86909C', marginTop: '8rpx' }}>
                      {selectedSeat.id.startsWith('seat-a') ? 'A区·静谧学习区' : 'B区·开放协作区'}
                      {selectedSeat.nearWindow && ' · 靠窗'}
                      {selectedSeat.type === 'quiet' && ' · 静音'}
                      {selectedSeat.type === 'vip' && ' · VIP'}
                    </Text>
                  </View>
                  <Text className={styles.seatAction} onClick={() => setShowSeatPicker(true)}>更换</Text>
                </>
              ) : (
                <>
                  <Text className={styles.seatValue} style={{ color: '#86909C' }}>请选择座位</Text>
                  <Text className={styles.seatAction} onClick={() => setShowSeatPicker(true)}>选择</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View className={styles.ruleCard}>
          <Text className={styles.ruleTitle}>
            <Text>⚠️</Text>
            月租须知
          </Text>
          <Text className={styles.ruleItem}>• 固定座一旦开通，有效期内专属使用，不可更换座位</Text>
          <Text className={styles.ruleItem}>• 月租订单一经确认，不予退款</Text>
          <Text className={styles.ruleItem}>• 有效期内全天不限时使用（营业时间 08:00-22:00）</Text>
          <Text className={styles.ruleItem}>• 请保持座位整洁，爱护设施设备</Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.priceBlock}>
          <Text className={styles.priceLabel}>应付金额</Text>
          <Text className={styles.priceValue}>
            <Text className={styles.currency}>¥</Text>
            {selectedPkg.price}
          </Text>
        </View>
        <Button
          className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          立即开通
        </Button>
      </View>
    </View>
  );
};

export default MonthlyBookingPage;
