module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Подставляет содержимое .sql файлов прямо в бандл — так миграции Drizzle
    // уезжают в сборку вместе с кодом, а не ищутся в файловой системе телефона.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
