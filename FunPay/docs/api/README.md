# API

Черновик будущих endpoints.

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

## Products

- `GET /api/products`
- `GET /api/products/{id}`
- `POST /api/products`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`

## Orders

- `POST /api/orders`
- `GET /api/orders/my`
- `PUT /api/orders/{id}/status`

## Chat

- `GET /api/orders/{orderId}/messages`
- `POST /api/orders/{orderId}/messages`

## Admin

- `DELETE /api/admin/products/{id}`
- `DELETE /api/admin/users/{id}`
