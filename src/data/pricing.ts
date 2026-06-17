import { PriceRate, MonthlyPackage } from '../types/pricing';

export const priceRates: PriceRate[] = [
  {
    tier: 'valley',
    name: '谷时段',
    pricePerHour: 4,
    startTime: '08:00',
    endTime: '12:00',
  },
  {
    tier: 'normal',
    name: '平时段',
    pricePerHour: 6,
    startTime: '12:00',
    endTime: '18:00',
  },
  {
    tier: 'peak',
    name: '高峰时段',
    pricePerHour: 10,
    startTime: '18:00',
    endTime: '22:00',
  },
];

export const monthlyPackages: MonthlyPackage[] = [
  {
    id: 'pkg-basic',
    name: '基础月卡',
    description: '日均4小时，适合轻度学习者',
    price: 399,
    days: 30,
    hoursPerDay: 4,
    features: ['每日4小时使用时长', 'A区/B区通用', '免费插座使用', '免费WiFi'],
  },
  {
    id: 'pkg-standard',
    name: '标准月卡',
    description: '日均8小时，考研考公首选',
    price: 699,
    days: 30,
    hoursPerDay: 8,
    features: ['每日8小时使用时长', 'A区/B区通用', 'VIP座位优先', '免费插座使用', '免费WiFi', '免费饮用水'],
  },
  {
    id: 'pkg-premium',
    name: '尊享月卡',
    description: '不限时长，专属固定座',
    price: 1299,
    days: 30,
    hoursPerDay: 24,
    features: ['全天不限时长', '专属固定座位', 'VIP安静区', '免费插座使用', '免费WiFi', '免费饮用水', '免费储物柜', '专属客服'],
  },
];

export const getPriceRateAtTime = (time: string): PriceRate | undefined => {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;

  return priceRates.find((rate) => {
    const [sh, sm] = rate.startTime.split(':').map(Number);
    const [eh, em] = rate.endTime.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    return totalMinutes >= startMinutes && totalMinutes < endMinutes;
  });
};
