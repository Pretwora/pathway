/**
 * Анимации появления при «Уменьшить движение»: хук их убирает, а в коде нет
 * анимаций мимо хука. Без второго теста ошибка вернулась бы с первой же новой
 * анимацией — на Android её не видно, а iPhone с уменьшенным движением
 * показывает пустой экран.
 */
import { useReducedMotion } from 'react-native-reanimated';

import { useMotion } from './useMotion';

jest.mock('react-native-reanimated', () => ({ useReducedMotion: jest.fn() }));

const reducedMock = useReducedMotion as jest.MockedFunction<typeof useReducedMotion>;

// Тесты идут в Node, но типов Node в проекте нет — описываем ровно то, что нужно.
type Fs = {
  readdirSync: (path: string) => string[];
  readFileSync: (path: string, encoding: 'utf8') => string;
  statSync: (path: string) => { isDirectory: () => boolean };
};
type PathModule = { join: (...parts: string[]) => string; relative: (from: string, to: string) => string; sep: string };
declare const __dirname: string;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readdirSync, readFileSync, statSync }: Fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { join, relative, sep }: PathModule = require('path');

describe('useMotion', () => {
  const animation = { name: 'FadeIn' };

  it('обычный режим — анимация та же', () => {
    reducedMock.mockReturnValue(false);
    expect(useMotion()(animation)).toBe(animation);
  });

  it('«Уменьшить движение» — анимации нет, элемент появляется сразу', () => {
    reducedMock.mockReturnValue(true);
    expect(useMotion()(animation)).toBeUndefined();
  });
});

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return tsxFiles(full);
    return name.endsWith('.tsx') ? [full] : [];
  });
}

describe('анимации появления только через useMotion', () => {
  it('у каждого entering / exiting в разметке — motion(...)', () => {
    const root = join(__dirname, '..', '..');
    const offenders = tsxFiles(join(root, 'src')).flatMap((file) => {
      const rel = relative(root, file).split(sep).join('/');
      return readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .flatMap((line, i) =>
          /\b(?:entering|exiting)=\{(?!motion\()/.test(line) ? [`${rel}:${i + 1}: ${line.trim()}`] : [],
        );
    });
    expect(offenders).toEqual([]);
  });
});
