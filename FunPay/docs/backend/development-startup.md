# Автоматический запуск проекта

В режиме `Development` достаточно запустить `FunPay.Backend` в Visual Studio.

Backend автоматически:

1. Проверяет подключение к PostgreSQL.
2. При необходимости запускает Docker Desktop.
3. Выполняет `docker compose up -d postgres`.
4. Ждёт готовности контейнера `funpay-postgres`.
5. Применяет все недостающие миграции Entity Framework.
6. Запускает frontend и открывает сайт.

Вручную выполнять `docker compose up -d` и `dotnet ef database update` не нужно.

На новом компьютере один раз должны быть установлены Docker Desktop, .NET SDK и Node.js. Если одного из них нет, консоль backend покажет понятное сообщение.

Автоматическая подготовка базы работает только в режиме разработки. Для временного отключения можно установить `DevDatabase:AutoPrepare` в `false`.
