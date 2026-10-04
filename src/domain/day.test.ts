import { DAY_MS, dayKey, dayNumber, daysSpent, formatDay, formatDaysSpent } from './day';

describe('dayKey', () => {
  it('одна тренировка — один ключ', () => {
    const morning = dayKey(new Date(2026, 6, 17, 10, 0).getTime());
    const evening = dayKey(new Date(2026, 6, 17, 22, 30).getTime());
    expect(morning).toBe(evening);
  });

  it('переход через полночь — разные дни', () => {
    const before = dayKey(new Date(2026, 6, 17, 23, 40).getTime());
    const after = dayKey(new Date(2026, 6, 18, 0, 20).getTime());
    expect(before).not.toBe(after);
  });

  it('ведущие нули: ключи сортируются как строки', () => {
    expect(dayKey(new Date(2026, 0, 5, 12, 0).getTime())).toBe('2026-01-05');
  });

  it('строковая сортировка совпадает с хронологией', () => {
    const keys = [
      dayKey(new Date(2026, 11, 31).getTime()),
      dayKey(new Date(2026, 0, 5).getTime()),
      dayKey(new Date(2026, 6, 17).getTime()),
    ];
    expect([...keys].sort()).toEqual(['2026-01-05', '2026-07-17', '2026-12-31']);
  });
});

describe('formatDay', () => {
  it('склоняет месяц', () => {
    expect(formatDay('2026-07-17')).toBe('17 июля');
  });

  it('убирает ведущий ноль из дня', () => {
    expect(formatDay('2026-01-05')).toBe('5 января');
  });

  it('декабрь — последний месяц таблицы, не выходит за границы', () => {
    expect(formatDay('2026-12-31')).toBe('31 декабря');
  });
});

describe('daysSpent', () => {
  const start = Date.UTC(2026, 6, 1, 12, 0);

  it('обычный случай: с 1 по 25 июля — 25 календарных дней', () => {
    expect(daysSpent(start, start + 24 * DAY_MS)).toBe(25);
  });

  it('закрыл за один присест — «за 1 день», а не за 0', () => {
    expect(daysSpent(start, start + 60_000)).toBe(1);
  });

  it('с полудня до полудня следующего дня — два календарных дня', () => {
    expect(daysSpent(start, start + DAY_MS)).toBe(2);
  });

  it('полночь — новый день, даже если прошло 20 минут', () => {
    const late = new Date(2026, 8, 14, 23, 50).getTime();
    expect(daysSpent(late, new Date(2026, 8, 15, 0, 10).getTime())).toBe(2);
  });

  it('совпадает с «День N» на счётчике в день финиша', () => {
    const started = new Date(2026, 8, 22, 12, 0).getTime();
    const finished = new Date(2026, 9, 3, 9, 45).getTime();
    expect(daysSpent(started, finished)).toBe(12);
    expect(daysSpent(started, finished)).toBe(dayNumber(started, finished));
  });

  it('часы устройства прыгнули назад — не отрицательное число', () => {
    expect(daysSpent(start, start - DAY_MS)).toBe(1);
  });
});

describe('formatDaysSpent', () => {
  it('склоняет единицу', () => {
    expect(formatDaysSpent(1)).toBe('за 1 день');
  });

  it('склоняет 2–4', () => {
    expect(formatDaysSpent(3)).toBe('за 3 дня');
  });

  it('склоняет 5 и дальше', () => {
    expect(formatDaysSpent(7)).toBe('за 7 дней');
  });

  it('11–14 — исключение русского языка', () => {
    expect(formatDaysSpent(11)).toBe('за 11 дней');
    expect(formatDaysSpent(12)).toBe('за 12 дней');
    expect(formatDaysSpent(14)).toBe('за 14 дней');
  });

  it('21 — снова «день», а не «дней»', () => {
    expect(formatDaysSpent(21)).toBe('за 21 день');
  });

  it('22–24 — «дня»', () => {
    expect(formatDaysSpent(24)).toBe('за 24 дня');
  });

  it('111–114 — тоже исключение', () => {
    expect(formatDaysSpent(111)).toBe('за 111 дней');
  });

  it('101 — «день»', () => {
    expect(formatDaysSpent(101)).toBe('за 101 день');
  });
});

describe('dayNumber', () => {
  it('день создания — первый', () => {
    const start = new Date(2026, 8, 14, 9, 0).getTime();
    expect(dayNumber(start, new Date(2026, 8, 14, 22, 0).getTime())).toBe(1);
  });

  it('полночь переворачивает счёт, даже если прошло 20 минут', () => {
    const start = new Date(2026, 8, 14, 23, 50).getTime();
    expect(dayNumber(start, new Date(2026, 8, 15, 0, 10).getTime())).toBe(2);
  });

  it('с 14 по 25 сентября — день 12', () => {
    const start = new Date(2026, 8, 14, 18, 0).getTime();
    expect(dayNumber(start, new Date(2026, 8, 25, 8, 0).getTime())).toBe(12);
  });

  it('через смену месяца и года', () => {
    const start = new Date(2026, 11, 31, 12, 0).getTime();
    expect(dayNumber(start, new Date(2027, 0, 1, 12, 0).getTime())).toBe(2);
  });

  it('часы ушли назад — не меньше первого дня', () => {
    const start = new Date(2026, 8, 14, 12, 0).getTime();
    expect(dayNumber(start, new Date(2026, 8, 10, 12, 0).getTime())).toBe(1);
  });
});
