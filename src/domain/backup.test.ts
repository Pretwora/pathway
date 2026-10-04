import { parseBackup } from './backup';

const goal = {
  id: 'g1',
  title: 'Тысяча отжиманий',
  target: 1000,
  description: 'По 30–50 за подход',
  quickSteps: [10, 30, 120],
  status: 'active',
  createdAt: 1000,
  completedAt: null,
};

const entry = { id: 'e1', goalId: 'g1', day: '2026-07-17', amount: 100, createdAt: 1000, updatedAt: 1000 };

function valid() {
  return { app: 'pathway', version: 1, exportedAt: 123, goals: [goal], entries: [entry] };
}

describe('parseBackup', () => {
  it('разбирает корректную копию', () => {
    const data = parseBackup(valid());
    expect(data.goals).toHaveLength(1);
    expect(data.entries).toHaveLength(1);
    expect(data.goals[0].quickSteps).toEqual([10, 30, 120]);
  });

  it('не спотыкается о срок из старой копии — просто забывает его', () => {
    const data = parseBackup({ ...valid(), goals: [{ ...goal, deadlineAt: 1_700_000_000_000 }] });
    expect(data.goals[0]).not.toHaveProperty('deadlineAt');
    expect(data.goals[0].title).toBe(goal.title);
  });

  it('читает старую копию, где описание называлось unit', () => {
    const { description: _drop, ...old } = goal;
    const data = parseBackup({ ...valid(), goals: [{ ...old, unit: 'отжиманий' }] });
    expect(data.goals[0].description).toBe('отжиманий');
  });

  it('пустая копия — это валидно', () => {
    const data = parseBackup({ app: 'pathway', version: 1, exportedAt: 0, goals: [], entries: [] });
    expect(data.goals).toHaveLength(0);
  });

  it('не наш файл — отвергается', () => {
    expect(() => parseBackup({ foo: 'bar' })).toThrow(/не файл копии/i);
  });

  it('чужой app — отвергается', () => {
    expect(() => parseBackup({ ...valid(), app: 'other' })).toThrow(/не файл копии/i);
  });

  it('версия новее поддерживаемой — отвергается с советом обновиться', () => {
    expect(() => parseBackup({ ...valid(), version: 99 })).toThrow(/обнови/i);
  });

  it('не JSON-объект — отвергается', () => {
    expect(() => parseBackup('строка')).toThrow();
    expect(() => parseBackup(null)).toThrow();
  });

  it('goals не массив — отвергается', () => {
    expect(() => parseBackup({ ...valid(), goals: 'нет' })).toThrow(/повреждён/i);
  });

  it('испорченное поле цели — отвергается', () => {
    const bad = { ...valid(), goals: [{ ...goal, target: 'много' }] };
    expect(() => parseBackup(bad)).toThrow(/target/i);
  });

  it('неизвестный статус цели — отвергается', () => {
    const bad = { ...valid(), goals: [{ ...goal, status: 'paused' }] };
    expect(() => parseBackup(bad)).toThrow(/статус/i);
  });

  it('две активные цели — отвергается', () => {
    const bad = { ...valid(), goals: [goal, { ...goal, id: 'g2' }] };
    expect(() => parseBackup(bad)).toThrow(/активн/i);
  });

  it('активное + архивное — норма', () => {
    const data = parseBackup({
      ...valid(),
      goals: [goal, { ...goal, id: 'g2', status: 'archived', completedAt: 2000 }],
    });
    expect(data.goals).toHaveLength(2);
  });

  it('испорченная запись — отвергается', () => {
    const bad = { ...valid(), entries: [{ ...entry, amount: null }] };
    expect(() => parseBackup(bad)).toThrow(/amount/i);
  });
});
