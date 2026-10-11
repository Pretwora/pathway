import { BackupError, parseBackup, type BackupErrorCode } from './backup';

/** Код причины, с которой копия отвергнута. */
function rejection(raw: unknown): BackupErrorCode | 'accepted' | 'other' {
  try {
    parseBackup(raw);
    return 'accepted';
  } catch (e) {
    return e instanceof BackupError ? e.code : 'other';
  }
}

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
    expect(rejection({ foo: 'bar' })).toBe('notBackup');
  });

  it('чужой app — отвергается', () => {
    expect(rejection({ ...valid(), app: 'other' })).toBe('notBackup');
  });

  it('версия новее поддерживаемой — отвергается как более новая', () => {
    expect(rejection({ ...valid(), version: 99 })).toBe('newerVersion');
  });

  it('не JSON-объект — отвергается', () => {
    expect(rejection('строка')).toBe('notBackup');
    expect(rejection(null)).toBe('notBackup');
  });

  it('goals не массив — отвергается', () => {
    expect(rejection({ ...valid(), goals: 'нет' })).toBe('corrupted');
  });

  it('испорченное поле цели — отвергается', () => {
    const bad = { ...valid(), goals: [{ ...goal, target: 'много' }] };
    expect(rejection(bad)).toBe('corrupted');
    expect(() => parseBackup(bad)).toThrow(/target/);
  });

  it('неизвестный статус цели — отвергается', () => {
    const bad = { ...valid(), goals: [{ ...goal, status: 'paused' }] };
    expect(rejection(bad)).toBe('corrupted');
  });

  it('две активные цели — отвергается', () => {
    const bad = { ...valid(), goals: [goal, { ...goal, id: 'g2' }] };
    expect(rejection(bad)).toBe('twoActive');
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
