/**
 * Сторож словарей: английский полон и действительно английский, а в коде нет
 * текста мимо словаря. Тип `Dictionary` ловит пропущенный ключ при сборке, но
 * не ловит русскую строку, вписанную в английский словарь, и фразу, вписанную
 * прямо в компонент.
 */
import { en } from './en';
import { ru } from './ru';

// Тесты идут в Node, но типов Node в проекте нет — описываем ровно то, что
// нужно, и берём модули через require: import 'fs' не пропустит tsc.
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

const CYRILLIC = /[А-Яа-яЁё]/;

/** Все строки словаря: функции вызываем с образцами аргументов. */
function strings(node: unknown, path = ''): [string, string][] {
  if (typeof node === 'string') return [[path, node]];
  if (typeof node === 'function') {
    const args = Array.from({ length: node.length }, (_, i) => (i === 0 ? 12 : 1000));
    return [[path, String(node(...args))]];
  }
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([key, value]) => strings(value, path ? `${path}.${key}` : key));
  }
  return [];
}

/** Форма словаря: ключи и вид значения, без самих слов. */
function shape(node: unknown): unknown {
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, shape(v)]));
  }
  return typeof node === 'function' ? `fn/${node.length}` : typeof node;
}

describe('словари', () => {
  it('английский повторяет форму русского', () => {
    expect(shape(en)).toEqual(shape(ru));
  });

  it('в английском нет кириллицы', () => {
    const russian = strings(en).filter(([, s]) => CYRILLIC.test(s));
    expect(russian).toEqual([]);
  });

  it('нет пустых строк там, где ждут слова', () => {
    // Пустыми бывают только «хвосты» вокруг числа: «осталось 5» / «5 to go».
    const allowedEmpty = new Set(['counter.leftBefore', 'counter.leftAfter']);
    const empty = [...strings(ru), ...strings(en)].filter(([path, s]) => s.trim() === '' && !allowedEmpty.has(path));
    expect(empty).toEqual([]);
  });
});

/** Файлы, где кириллица в коде законна: русский словарь и месяцы для дат. */
const ALLOWED = new Set(['src/i18n/ru.ts', 'src/domain/day.ts', 'src/i18n/index.ts']);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

/** Код без комментариев — по строкам, с путём от корня проекта. */
function codeLines(): { rel: string; lines: string[] }[] {
  const root = join(__dirname, '..', '..');
  return sourceFiles(join(root, 'src')).map((file) => ({
    rel: relative(root, file).split(sep).join('/'),
    lines: readFileSync(file, 'utf8')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // {/* комментарии в JSX */}
      .replace(/\/\*[\s\S]*?\*\//g, '') // /* блочные */
      .split(/\r?\n/)
      .map((line) => line.replace(/(^|\s)\/\/.*$/, '')), // // строчные
  }));
}

describe('текст только через словарь', () => {
  it('в коде нет русских строк мимо src/i18n', () => {
    const offenders = codeLines().flatMap(({ rel, lines }) =>
      ALLOWED.has(rel) ? [] : lines.flatMap((line, i) => (CYRILLIC.test(line) ? [`${rel}:${i + 1}: ${line.trim()}`] : [])),
    );
    expect(offenders).toEqual([]);
  });

  it('в разметке нет английских надписей мимо словаря', () => {
    // Надписи в пропсах-строках и текст между тегами. Бренд — не надпись.
    const PROP = /\b(?:title|label|placeholder|accessibilityLabel|dialogTitle)="([^"]*[A-Za-z][^"]*)"/g;
    const JSX_TEXT = />\s*([A-Za-z][^<>{}]*?)\s*</g;
    const BRAND = new Set(['pathway', 'Pathway']);
    const offenders = codeLines()
      .filter(({ rel }) => rel.endsWith('.tsx'))
      .flatMap(({ rel, lines }) =>
        lines.flatMap((line, i) =>
          [...line.matchAll(PROP), ...line.matchAll(JSX_TEXT)]
            .map((m) => m[1].trim())
            .filter((s) => !BRAND.has(s))
            .map((s) => `${rel}:${i + 1}: ${s}`),
        ),
      );
    expect(offenders).toEqual([]);
  });
});
