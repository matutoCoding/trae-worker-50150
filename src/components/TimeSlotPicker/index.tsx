import React, { useMemo, useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import classnames from 'classnames';
import { generateTimeSlots, timeToMinutes } from '../../utils/date';
import { getSeatOccupiedTimeRanges } from '../../utils/conflict';
import { Booking } from '../../types/booking';
import styles from './index.module.scss';

interface TimeSlotPickerProps {
  startTime: string;
  endTime: string;
  seatId?: string;
  date: string;
  bookings: Booking[];
  onTimeChange: (start: string, end: string) => void;
}

type SelectMode = 'start' | 'end';

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  startTime,
  endTime,
  seatId,
  date,
  bookings,
  onTimeChange,
}) => {
  const [selectMode, setSelectMode] = useState<SelectMode>('start');
  const slots = useMemo(() => generateTimeSlots(8, 22, 30), []);

  const occupiedRanges = useMemo(() => {
    if (!seatId) return [];
    return getSeatOccupiedTimeRanges(seatId, date, bookings);
  }, [seatId, date, bookings]);

  const isSlotOccupied = (time: string): boolean => {
    const minutes = timeToMinutes(time);
    return occupiedRanges.some(
      (r) => minutes >= timeToMinutes(r.startTime) && minutes < timeToMinutes(r.endTime)
    );
  };

  const isInRange = (time: string): boolean => {
    const minutes = timeToMinutes(time);
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    return minutes > startMin && minutes < endMin;
  };

  const handleSlotClick = (time: string) => {
    if (isSlotOccupied(time)) return;

    if (selectMode === 'start') {
      if (timeToMinutes(time) >= timeToMinutes(endTime)) {
        onTimeChange(time, slots[slots.length - 1].time);
      } else {
        onTimeChange(time, endTime);
      }
      setSelectMode('end');
    } else {
      if (timeToMinutes(time) <= timeToMinutes(startTime)) {
        onTimeChange(startTime, slots[Math.min(slots.findIndex((s) => s.time === startTime) + 2, slots.length - 1)].time);
      } else {
        onTimeChange(startTime, time);
      }
      setSelectMode('start');
    }
  };

  const getSlotClass = (time: string): string => {
    if (isSlotOccupied(time)) return styles.slotOccupied;
    if (time === startTime) return styles.slotStartActive;
    if (time === endTime) return styles.slotEndActive;
    if (isInRange(time)) return styles.slotInRange;
    return styles.slotAvailable;
  };

  const handleQuickSelect = (hours: number) => {
    const startIdx = slots.findIndex((s) => s.time === startTime);
    const endIdx = Math.min(startIdx + hours * 2, slots.length - 1);
    onTimeChange(startTime, slots[endIdx].time);
  };

  return (
    <View className={styles.timeSlotPicker}>
      <Text className={styles.sectionTitle}>选择时段</Text>

      <View className={styles.selectorRow}>
        <View className={styles.selector} onClick={() => setSelectMode('start')}>
          <Text className={styles.selectorLabel}>开始时间</Text>
          <Text className={styles.selectorValue}>{startTime}</Text>
        </View>
        <View className={styles.selector} onClick={() => setSelectMode('end')}>
          <Text className={styles.selectorLabel}>结束时间</Text>
          <Text className={styles.selectorValue}>{endTime}</Text>
        </View>
      </View>

      <View className={styles.quickButtons}>
        <Button className={styles.quickBtn} onClick={() => handleQuickSelect(1)}>1小时</Button>
        <Button className={styles.quickBtn} onClick={() => handleQuickSelect(2)}>2小时</Button>
        <Button className={styles.quickBtn} onClick={() => handleQuickSelect(3)}>3小时</Button>
        <Button className={styles.quickBtn} onClick={() => handleQuickSelect(4)}>4小时</Button>
      </View>

      <Text className={styles.label}>点击选择{selectMode === 'start' ? '开始' : '结束'}时间：</Text>
      <View className={styles.slotsContainer}>
        {slots.map((slot) => (
          <View
            key={slot.time}
            className={classnames(styles.slotItem, getSlotClass(slot.time))}
            onClick={() => handleSlotClick(slot.time)}
          >
            <Text>{slot.time}</Text>
          </View>
        ))}
      </View>

      <Text className={styles.hint}>
        {selectMode === 'start' ? '请选择开始时间' : '请选择结束时间'}
        {seatId ? ' · 红色时段已被占用' : ''}
      </Text>
    </View>
  );
};

export default TimeSlotPicker;
