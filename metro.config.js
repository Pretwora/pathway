const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Миграции Drizzle — это .sql файлы, которые импортируются как модули.
// Без этого Metro не считает их исходниками и падает на импорте.
config.resolver.sourceExts.push('sql');

module.exports = config;
