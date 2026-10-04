# Pathway - tracker

Трекер целей, к которым идут по чуть-чуть: «тысяча отжиманий», «3000 страниц». Ставишь цель-число, после каждого подхода тапаешь `+10`, приложение складывает, показывает тропу до финиша и празднует, когда цель достигнута.

Expo + React Native + TypeScript, данные только на телефоне (SQLite), без сервера и аккаунтов. Сайт приложения — [pretwora.github.io/pathway-web](https://pretwora.github.io/pathway-web/).

## Документация

- [`CLAUDE.md`](CLAUDE.md) — правила проекта, коротко
- [`docs/01-концепция.md`](docs/01-концепция.md) — продукт и экраны
- [`docs/02-дизайн-система.md`](docs/02-дизайн-система.md) — палитра, тропа, шрифты, иконка, заставка
- [`docs/03-архитектура.md`](docs/03-архитектура.md) — стек и структура
- [`docs/07-публикация.md`](docs/07-публикация.md) — App Store и Google Play

## Запуск

```bash
npm install
npx expo run:android
```

Подробно про Windows, эмулятор и сборку APK — [`docs/08-windows.md`](docs/08-windows.md).

## Проверки

```bash
npx jest
npx tsc --noEmit
npx expo lint
```

## Лицензия

© 2026 Сергей Григорьев. Все права защищены. Подробнее — [`LICENSE`](LICENSE).
