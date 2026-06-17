import { Seat, SeatZone, SeatType } from '../types/seat';

const generateSeatNo = (row: number, col: number): string => {
  const rowLetter = String.fromCharCode(65 + row);
  return `${rowLetter}${col + 1}`;
};

const createSeat = (
  id: string,
  row: number,
  col: number,
  type: SeatType = 'standard',
  overrides: Partial<Seat> = {}
): Seat => ({
  id,
  seatNo: generateSeatNo(row, col),
  row,
  col,
  type,
  status: 'available',
  hasPower: true,
  nearWindow: col === 0 || col === 5,
  isQuiet: type === 'quiet',
  ...overrides,
});

export const mockSeatZones: SeatZone[] = [
  {
    id: 'zone-a',
    name: 'A区·静谧学习区',
    description: '安静环境，适合深度阅读和专注学习',
    rows: 4,
    cols: 6,
    seats: [
      createSeat('seat-a1', 0, 0, 'window', { nearWindow: true }),
      createSeat('seat-a2', 0, 1, 'standard'),
      createSeat('seat-a3', 0, 2, 'standard'),
      createSeat('seat-a4', 0, 3, 'standard'),
      createSeat('seat-a5', 0, 4, 'standard'),
      createSeat('seat-a6', 0, 5, 'window', { nearWindow: true }),
      createSeat('seat-a7', 1, 0, 'window', { nearWindow: true }),
      createSeat('seat-a8', 1, 1, 'quiet'),
      createSeat('seat-a9', 1, 2, 'quiet'),
      createSeat('seat-a10', 1, 3, 'quiet'),
      createSeat('seat-a11', 1, 4, 'standard'),
      createSeat('seat-a12', 1, 5, 'window', { nearWindow: true, status: 'fixed', monthlyFixed: true }),
      createSeat('seat-a13', 2, 0, 'window', { nearWindow: true }),
      createSeat('seat-a14', 2, 1, 'standard'),
      createSeat('seat-a15', 2, 2, 'standard'),
      createSeat('seat-a16', 2, 3, 'standard'),
      createSeat('seat-a17', 2, 4, 'standard'),
      createSeat('seat-a18', 2, 5, 'window', { nearWindow: true }),
      createSeat('seat-a19', 3, 0, 'window', { nearWindow: true, status: 'disabled' }),
      createSeat('seat-a20', 3, 1, 'standard'),
      createSeat('seat-a21', 3, 2, 'vip'),
      createSeat('seat-a22', 3, 3, 'vip'),
      createSeat('seat-a23', 3, 4, 'standard'),
      createSeat('seat-a24', 3, 5, 'window', { nearWindow: true }),
    ],
  },
  {
    id: 'zone-b',
    name: 'B区·开放协作区',
    description: '轻松氛围，适合小组讨论和轻量学习',
    rows: 3,
    cols: 6,
    seats: [
      createSeat('seat-b1', 0, 0, 'window', { nearWindow: true }),
      createSeat('seat-b2', 0, 1, 'standard'),
      createSeat('seat-b3', 0, 2, 'standard'),
      createSeat('seat-b4', 0, 3, 'standard'),
      createSeat('seat-b5', 0, 4, 'standard'),
      createSeat('seat-b6', 0, 5, 'window', { nearWindow: true }),
      createSeat('seat-b7', 1, 0, 'window', { nearWindow: true }),
      createSeat('seat-b8', 1, 1, 'standard'),
      createSeat('seat-b9', 1, 2, 'standard'),
      createSeat('seat-b10', 1, 3, 'standard'),
      createSeat('seat-b11', 1, 4, 'standard'),
      createSeat('seat-b12', 1, 5, 'window', { nearWindow: true, monthlyFixed: true, status: 'fixed' }),
      createSeat('seat-b13', 2, 0, 'window', { nearWindow: true }),
      createSeat('seat-b14', 2, 1, 'standard'),
      createSeat('seat-b15', 2, 2, 'standard'),
      createSeat('seat-b16', 2, 3, 'standard'),
      createSeat('seat-b17', 2, 4, 'standard'),
      createSeat('seat-b18', 2, 5, 'window', { nearWindow: true }),
    ],
  },
];

export const getAllSeats = (): Seat[] => {
  return mockSeatZones.flatMap((zone) => zone.seats);
};

export const getSeatById = (id: string): Seat | undefined => {
  return getAllSeats().find((seat) => seat.id === id);
};
