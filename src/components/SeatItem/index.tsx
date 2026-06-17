import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { Seat, SeatStatus } from '../../types/seat';
import styles from './index.module.scss';

interface SeatItemProps {
  seat: Seat;
  isSelected?: boolean;
  onClick?: (seat: Seat) => void;
}

const getStatusClass = (status: SeatStatus, isSelected: boolean): string => {
  if (isSelected) return styles.selected;
  switch (status) {
    case 'available':
      return styles.available;
    case 'occupied':
      return styles.occupied;
    case 'fixed':
      return styles.fixed;
    case 'disabled':
      return styles.disabled;
    default:
      return styles.available;
  }
};

const SeatItem: React.FC<SeatItemProps> = ({ seat, isSelected = false, onClick }) => {
  const handleClick = () => {
    if (seat.status === 'disabled') return;
    onClick?.(seat);
  };

  const showTag = seat.type === 'vip' || seat.type === 'quiet' || seat.nearWindow;
  const tagClass = seat.type === 'vip'
    ? styles.tagVip
    : seat.type === 'quiet'
    ? styles.tagQuiet
    : seat.nearWindow
    ? styles.tagWindow
    : '';
  const tagText = seat.type === 'vip' ? 'VIP' : seat.type === 'quiet' ? '静' : seat.nearWindow ? '窗' : '';

  return (
    <View
      className={classnames(styles.seatItem, getStatusClass(seat.status, isSelected))}
      onClick={handleClick}
    >
      <View className={styles.seatIcon} />
      <Text className={styles.seatNo}>{seat.seatNo}</Text>
      {showTag && (
        <View className={classnames(styles.tag, tagClass)}>{tagText}</View>
      )}
    </View>
  );
};

export default SeatItem;
