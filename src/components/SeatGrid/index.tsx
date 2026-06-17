import React from 'react';
import { View, Text } from '@tarojs/components';
import { SeatZone, Seat } from '../../types/seat';
import SeatItem from '../SeatItem';
import styles from './index.module.scss';

interface SeatGridProps {
  zone: SeatZone;
  selectedSeatId?: string | null;
  onSeatClick?: (seat: Seat) => void;
  occupiedSeatIds?: string[];
}

const SeatGrid: React.FC<SeatGridProps> = ({
  zone,
  selectedSeatId,
  onSeatClick,
  occupiedSeatIds = [],
}) => {
  const getSeatStatus = (seat: Seat): Seat['status'] => {
    if (seat.status === 'disabled' || seat.status === 'fixed') return seat.status;
    if (occupiedSeatIds.includes(seat.id)) return 'occupied';
    return 'available';
  };

  const seatsByRow: Seat[][] = [];
  for (let r = 0; r < zone.rows; r++) {
    seatsByRow.push(zone.seats.filter((s) => s.row === r).sort((a, b) => a.col - b.col));
  }

  return (
    <View className={styles.seatGrid}>
      <View className={styles.zoneHeader}>
        <Text className={styles.zoneName}>{zone.name}</Text>
        <Text className={styles.zoneDesc}>{zone.description}</Text>
      </View>

      <View className={styles.screen} />

      <View className={styles.gridContainer}>
        {seatsByRow.map((rowSeats, rowIndex) => (
          <View key={rowIndex} className={styles.gridRow}>
            <Text className={styles.rowLabel}>{String.fromCharCode(65 + rowIndex)}</Text>
            {rowSeats.map((seat) => {
              const displaySeat = { ...seat, status: getSeatStatus(seat) };
              return (
                <SeatItem
                  key={seat.id}
                  seat={displaySeat}
                  isSelected={selectedSeatId === seat.id}
                  onClick={onSeatClick}
                />
              );
            })}
            <Text className={styles.rowLabel}>{String.fromCharCode(65 + rowIndex)}</Text>
          </View>
        ))}
      </View>

      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotAvailable}`} />
          <Text className={styles.legendText}>空闲</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotSelected}`} />
          <Text className={styles.legendText}>已选</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotOccupied}`} />
          <Text className={styles.legendText}>已占用</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotFixed}`} />
          <Text className={styles.legendText}>固定座</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.dotDisabled}`} />
          <Text className={styles.legendText}>维修中</Text>
        </View>
      </View>
    </View>
  );
};

export default SeatGrid;
