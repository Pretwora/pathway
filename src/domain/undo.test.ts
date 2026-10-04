import { sessionTotal, tapsByDay, type Tap } from './undo';

describe('sessionTotal', () => {
  it('складывает тапы сессии', () => {
    const taps: Tap[] = [
      { day: '2026-07-17', amount: 10 },
      { day: '2026-07-17', amount: 10 },
      { day: '2026-07-17', amount: 10 },
    ];
    expect(sessionTotal(taps)).toBe(30);
  });

  it('пустая сессия — ноль', () => {
    expect(sessionTotal([])).toBe(0);
  });

  it('разные шаги в одной сессии', () => {
    const taps: Tap[] = [
      { day: '2026-07-17', amount: 10 },
      { day: '2026-07-17', amount: 120 },
    ];
    expect(sessionTotal(taps)).toBe(130);
  });
});

describe('tapsByDay', () => {
  it('обычный случай: вся сессия в одном дне', () => {
    const taps: Tap[] = [
      { day: '2026-07-17', amount: 10 },
      { day: '2026-07-17', amount: 10 },
      { day: '2026-07-17', amount: 10 },
    ];
    expect([...tapsByDay(taps)]).toEqual([['2026-07-17', 30]]);
  });

  it('сессия переехала через полночь — снимаем с каждого дня его долю', () => {
    const taps: Tap[] = [
      { day: '2026-07-17', amount: 10 },
      { day: '2026-07-17', amount: 20 },
      { day: '2026-07-18', amount: 30 },
    ];
    const result = tapsByDay(taps);
    expect(result.get('2026-07-17')).toBe(30);
    expect(result.get('2026-07-18')).toBe(30);
  });

  it('пустая сессия — нечего снимать', () => {
    expect(tapsByDay([]).size).toBe(0);
  });

  it('сумма по дням равна сумме сессии', () => {
    const taps: Tap[] = [
      { day: '2026-07-17', amount: 10 },
      { day: '2026-07-18', amount: 25 },
      { day: '2026-07-17', amount: 5 },
    ];
    const total = [...tapsByDay(taps).values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(sessionTotal(taps));
  });
});
