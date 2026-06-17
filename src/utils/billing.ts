import { PriceRate, BillingResult, BillingSegment, PriceTier } from '../types/pricing';
import { timeToMinutes, minutesToTime } from './date';

export const defaultPriceRates: PriceRate[] = [
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

export const getTierAtTime = (time: string, rates: PriceRate[]): PriceRate | null => {
  const minutes = timeToMinutes(time);
  for (const rate of rates) {
    const start = timeToMinutes(rate.startTime);
    const end = timeToMinutes(rate.endTime);
    if (minutes >= start && minutes < end) {
      return rate;
    }
  }
  return null;
};

export const getNextTierSwitchTime = (time: string, rates: PriceRate[]): string | null => {
  const minutes = timeToMinutes(time);
  let nextSwitch: number | null = null;

  for (const rate of rates) {
    const start = timeToMinutes(rate.startTime);
    const end = timeToMinutes(rate.endTime);

    if (start > minutes && (nextSwitch === null || start < nextSwitch)) {
      nextSwitch = start;
    }
    if (end > minutes && (nextSwitch === null || end < nextSwitch)) {
      nextSwitch = end;
    }
  }

  return nextSwitch !== null ? minutesToTime(nextSwitch) : null;
};

export const calculateBilling = (
  startTime: string,
  endTime: string,
  rates: PriceRate[] = defaultPriceRates
): BillingResult => {
  console.log('[Billing] 计算费用:', { startTime, endTime });

  const segments: BillingSegment[] = [];
  let currentTime = startTime;
  let totalDuration = 0;
  let totalAmount = 0;

  const endMinutes = timeToMinutes(endTime);

  while (timeToMinutes(currentTime) < endMinutes) {
    const currentMinutes = timeToMinutes(currentTime);
    const currentRate = getTierAtTime(currentTime, rates);

    if (!currentRate) {
      console.warn('[Billing] 当前时段无费率配置:', currentTime);
      break;
    }

    const nextSwitch = getNextTierSwitchTime(currentTime, rates);
    let segmentEnd: string;

    if (nextSwitch && timeToMinutes(nextSwitch) < endMinutes) {
      segmentEnd = nextSwitch;
    } else {
      segmentEnd = endTime;
    }

    const segmentStartMinutes = timeToMinutes(currentTime);
    const segmentEndMinutes = timeToMinutes(segmentEnd);
    const durationMinutes = segmentEndMinutes - segmentStartMinutes;
    const durationHours = durationMinutes / 60;
    const subtotal = Number((currentRate.pricePerHour * durationHours).toFixed(2));

    segments.push({
      tier: currentRate.tier,
      tierName: currentRate.name,
      startTime: currentTime,
      endTime: segmentEnd,
      durationMinutes,
      pricePerHour: currentRate.pricePerHour,
      subtotal,
    });

    totalDuration += durationMinutes;
    totalAmount += subtotal;
    currentTime = segmentEnd;
  }

  const result: BillingResult = {
    segments,
    totalDurationMinutes: totalDuration,
    totalAmount: Number(totalAmount.toFixed(2)),
    isMonthly: false,
  };

  console.log('[Billing] 计费结果:', result);
  return result;
};

export const calculateMonthlyBilling = (
  monthlyFee: number,
  startDate: string,
  endDate: string
): BillingResult => {
  return {
    segments: [
      {
        tier: 'normal',
        tierName: '月租套餐',
        startTime: `${startDate} 00:00`,
        endTime: `${endDate} 23:59`,
        durationMinutes: 0,
        pricePerHour: 0,
        subtotal: monthlyFee,
      },
    ],
    totalDurationMinutes: 0,
    totalAmount: monthlyFee,
    isMonthly: true,
    monthlyFee,
  };
};

export const getTierColor = (tier: PriceTier): string => {
  const colors: Record<PriceTier, string> = {
    peak: '#FF9A3C',
    normal: '#4F6EF5',
    valley: '#52C41A',
  };
  return colors[tier];
};

export const getTierName = (tier: PriceTier): string => {
  const names: Record<PriceTier, string> = {
    peak: '高峰',
    normal: '平时',
    valley: '谷时',
  };
  return names[tier];
};
