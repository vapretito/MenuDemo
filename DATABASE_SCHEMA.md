# Menui Database Base

## User

- `id`
- `name`
- `email`
- `password`
- `role`: `SUPER_ADMIN | RESTAURANT_ADMIN`

## Restaurant

- `id`
- `name`
- `slug`
- `subdomain`
- `logo`
- `whatsapp`
- `status`: `trial | active | past_due | suspended | cancelled | manual`
- `planId`
- `ownerId`
- `mercadoPagoSubscriptionId`
- `nextBillingDate`
- `graceUntil`
- `dnsStatus`
- `connectedToDemo`
- `billingMode`

## Plan

- `id`
- `name`
- `price`
- `productLimit`
- `features`

## Product

- `id`
- `restaurantId`
- `categoryId`
- `name`
- `description`
- `price`
- `image`
- `active`

## Category

- `id`
- `restaurantId`
- `name`
- `order`

## Payment

- `id`
- `restaurantId`
- `amount`
- `status`
- `mercadoPagoPaymentId`
- `mercadoPagoSubscriptionId`
- `paidAt`

## Billing flow

1. Superadmin creates restaurant.
2. Superadmin chooses plan.
3. System uses Mercado Pago subscription plan or MVP link.
4. First payment arrives.
5. Webhook updates backend.
6. Restaurant moves to `active`.
7. Failed renewals move it to `past_due`.
8. Grace period expiry moves it to `suspended`.
