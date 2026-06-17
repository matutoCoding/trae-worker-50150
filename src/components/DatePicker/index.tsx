import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { getDateList } from '../../utils/date';
import styles from './index.module.scss';

interface DatePickerProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  days?: number;
}

const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onDateChange, days = 7 }) => {
  const dateList = getDateList(days);

  return (
    <View className={styles.datePicker}>
      <ScrollView className={styles.scrollContainer} scrollX enhanced showScrollbar={false}>
        {dateList.map((item) => (
          <View
            key={item.date}
            className={classnames(
              styles.dateItem,
              selectedDate === item.date ? styles.dateItemActive : styles.dateItemNormal
            )}
            onClick={() => onDateChange(item.date)}
          >
            <Text className={styles.label}>{item.label}</Text>
            <Text className={styles.weekday}>{item.weekday}</Text>
            <Text className={styles.date}>{item.date.slice(5)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default DatePicker;
