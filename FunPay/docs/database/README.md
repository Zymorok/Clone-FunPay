# Database

Основная БД: PostgreSQL.

## Таблицы

| Таблица | Поля |
| --- | --- |
| Users | Id, Nick, Email, PasswordHash, Role, CreatedAt |
| Games | Id, Name, ImageUrl |
| Categories | Id, Name |
| Products | Id, UserId, GameId, CategoryId, Title, Description, Price, Status |
| Orders | Id, ProductId, BuyerId, SellerId, Status, CreatedAt |
| Messages | Id, OrderId, SenderId, Text, CreatedAt |

## Роли

- `User`
- `Admin`

## Статусы заказа

- `Created`
- `InProgress`
- `Completed`
- `Cancelled`

## Статусы объявления

- `Active`
- `Hidden`
- `Sold`

## Важно

- Пароли храним только как hash.
- Ник и email не должны повторяться.
- Реальные платежи в MVP не делаем.
