# FunPay

MVP игрового маркетплейса: регистрация, каталог, объявления, заказы и чат по заказу.

## Структура

```text
FunPay/
├── backend/       API, PostgreSQL, модели, миграции, логи
├── frontend/      сайт на React
└── docs/          описание проекта, планы, БД, API и задачи команды
```

## Быстрый старт

```powershell
docker compose up -d
dotnet build .\FunPay.sln
cd .\FunPay\frontend
npm install
npm run dev
```

## Главное в MVP

- Авторизация и регистрация.
- Каталог игр и услуг.
- Объявления.
- Заказы без реальной оплаты.
- Чат внутри заказа.
- Профиль и мини-админка.
