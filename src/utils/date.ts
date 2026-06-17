export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getToday = (): string => {
  return formatDate(new Date());
};

export const getDateList = (days: number = 7): { date: string; label: string; weekday: string }[] => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const result = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = formatDate(date);
    let label = `${date.getMonth() + 1}/${date.getDate()}`;
    if (i === 0) label = '今天';
    if (i === 1) label = '明天';

    result.push({
      date: dateStr,
      label,
      weekday: weekdays[date.getDay()],
    });
  }

  return result;
};

export const generateTimeSlots = (
  startHour: number = 8,
  endHour: number = 22,
  intervalMinutes: number = 30
): { time: string; label: string }[] => {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let min = 0; min < 60; min += intervalMinutes) {
      const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      slots.push({ time, label: time });
    }
  }
  const endTime = `${String(endHour).padStart(2, '0')}:00`;
  slots.push({ time: endTime, label: endTime });
  return slots;
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  return timeToMinutes(endTime) - timeToMinutes(startTime);
};

export const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分钟`;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
};

export const formatMoney = (amount: number): string => {
  return `¥${amount.toFixed(2)}`;
};
