# Menui Local Ordering Specification

Last updated: 2026-07-27

## Purpose

This document replaces a table-centric interpretation of QR ordering with a broader domain:

- `Pedidos en local`
- English internal label: `Local Ordering`

Menui must support on-premise ordering for:

- restaurants with table service;
- food courts;
- gastronomic fairs;
- food trucks;
- venues where the customer orders on the phone and then pays at the cashier;
- restaurants with pickup at the counter.

The implementation must not be designed exclusively around the concept of a numbered table.

## Current codebase audit

Review date: 2026-07-27

Current repository state shows:

- QR support already exists for public visual menu access via `/qr/[slug]`;
- the active ordering flow is still menu + cart + WhatsApp handoff;
- Prisma does not yet contain `Order`, `RestaurantTable`, `TableSession`, or `GuestTableSession` models;
- no concrete implementation tied to `tableId`, `tableNumber`, or `TABLE_QR` was found in the current codebase.

Conclusion:

- there is no mature table-based domain to preserve yet;
- this is the right moment to introduce a generalized local-ordering architecture before adding in-store order logic.

## Naming direction

Use domain terms that remain correct across multiple business types.

Preferred concepts:

- `LocalOrder`
- `ServiceMode`
- `ServiceLocation`
- `GuestSession`
- `LocalOrderSource`

Avoid introducing new table-only names such as:

- `RestaurantTable`
- `TableSession`
- `GuestTableSession`
- `tableId`
- `tableNumber`
- `TABLE_QR`

If a legacy name already exists in future branches, generalize it before building more features on top.

## Service modes

Each restaurant must configure how local ordering works.

Conceptually:

`serviceMode`

Minimum values:

- `TABLE_SERVICE`
- `COUNTER_PICKUP`
- `BOTH`

### `TABLE_SERVICE`

The order is associated with a location inside the establishment.

Examples:

- `12`
- `Mesa 15`
- `Terraza`
- `Barra`
- `Patio`
- `VIP`
- `Mesa Ventana`

Important:

- do not model the location as a numeric-only field;
- use a configurable string name such as `serviceLocation.name`.

### `COUNTER_PICKUP`

The order does not require a table or physical location.

The customer identifies the order by:

- `customerName`
- a short unique `pickupCode`

Visible reference example:

- `Victor - A184`

Never rely only on the customer name.

### `BOTH`

The data model must support a restaurant that accepts:

- orders tied to a location;
- orders for counter pickup.

The first UX iteration does not need to expose every option on the same screen if that complicates the flow.

## Service locations

For in-store orders tied to a place, use a generalized location entity.

Recommended name:

- `ServiceLocation`

Possible alternatives if the codebase strongly suggests otherwise:

- `DiningLocation`
- `RestaurantLocation`

The model should represent places like:

- `Mesa 4`
- `Terraza`
- `Barra`
- `Patio`

Suggested conceptual fields:

- `id`
- `restaurantId`
- `name`
- `isActive`
- `publicToken`
- `createdAt`
- `updatedAt`

Constraints:

- `name` is a string, not an integer;
- `publicToken` powers location-specific QR access;
- uniqueness should be enforced per restaurant for active operational use.

## QR model

Menui must support two QR entry points.

### Location QR

Example route:

`/ordenar/{publicLocationToken}`

When scanned, Menui already knows:

- restaurant;
- service location.

Typical use case:

- table service or other fixed seating/service areas.

### General restaurant QR

Example route:

`restaurant.menui.online/ordenar`

This QR is not tied to a location and is useful for:

- food courts;
- fairs;
- food trucks;
- venues with pickup;
- cashier or counter ordering.

## Orders and kitchen readiness

This distinction is mandatory:

- `Order`
- kitchen-visible work item, whether implemented as a separate `KitchenTicket` model or as an eligible subset of `Order`

A customer-created order must not automatically become an active kitchen ticket.

### Required flow for pay-before-preparation

1. Customer creates order.
2. Order starts in `AWAITING_PAYMENT`.
3. Customer approaches cashier.
4. Employee finds the order.
5. Employee confirms order and payment.
6. Order moves to `CONFIRMED` and payment to `PAID`.
7. Kitchen becomes allowed to see the order.
8. Kitchen moves order through `PREPARING`, `READY`, and `DELIVERED`.

Rule:

- orders in `AWAITING_PAYMENT` must never appear in the kitchen queue.

## Payment behavior

Each restaurant should be prepared to configure:

- `PAY_BEFORE_PREPARATION`
- `PAY_LATER`

Initial implementation priority:

- `PAY_BEFORE_PREPARATION`

When this mode is active:

- customer-submitted local orders begin in `AWAITING_PAYMENT`;
- they do not enter kitchen flow yet.

## Counter pickup customer flow

Initial target flow:

1. Customer enters through the general QR.
2. Customer browses the menu.
3. Customer adds products.
4. Before final confirmation, Menui asks: `A nombre de quien hacemos el pedido?`
5. Menui validates `customerName`.
6. Menui creates the order.
7. Menui generates a short `pickupCode`.
8. Menui shows the registration screen with code, name, total, and cashier instruction.

Required initial order state:

- `AWAITING_PAYMENT`

Example customer-facing confirmation:

- `Pedido registrado`
- `Victor - A184`
- `Total: $...`
- `Acercate a caja para confirmar y pagar tu pedido.`

## Cashier view

Add an admin view optimized for cashier operation.

Conceptual route:

`/admin/orders/counter`

Primary section:

- pending payment orders first

Each order card should show:

- code;
- customer name;
- elapsed time since creation;
- products;
- quantities;
- item notes;
- total.

Suggested primary actions:

- `Ver pedido`
- `Confirmar y cobrar`

## Cashier search

The employee must be able to search quickly by:

- `pickupCode`
- `customerName`

The interaction must be fast and usable on touch devices and tablets.

## Payment confirmation

Order detail should clearly show:

- customer;
- code;
- products;
- total.

Primary cashier action:

- `Confirmar pago`

On confirmation, update inside a transaction.

Conceptually:

- `paymentStatus = PAID`
- `orderStatus = CONFIRMED`
- `confirmedAt = now()`

Then the order becomes eligible for kitchen preparation.

Mandatory constraint:

- the operation must be idempotent;
- double submit or retried requests must never generate duplicate kitchen work for the same order.

## Kitchen logic

Kitchen must show only orders enabled for preparation.

This can be implemented in either of these ways:

- a dedicated `KitchenTicket` model;
- the existing `Order` model with clear eligibility rules.

Do not create a separate model if it adds complexity without value.

What matters is the business rule:

- `AWAITING_PAYMENT` -> not visible in kitchen
- `CONFIRMED` or equivalent paid-and-approved state -> visible in kitchen

## Kitchen view

Kitchen cards should show a clear pickup-oriented or location-oriented reference.

Example:

- `COMANDA A184`
- `Victor`
- `2 x Hamburguesa`
- `Sin cebolla`
- `1 x Papas`
- `Hora: 11:52`

Suggested actions:

- `Preparando`
- `Marcar listo`

## Order identity

A local order should support these optional fields:

- `serviceLocationId`
- `customerName`
- `pickupCode`

Examples:

`TABLE_SERVICE`

- `serviceLocation = Mesa 7`
- `customerName = null`
- `pickupCode = optional`

`COUNTER_PICKUP`

- `serviceLocation = null`
- `customerName = Victor`
- `pickupCode = A184`

Rule:

- `serviceLocationId` must not be mandatory.

## Conceptual data model

Adapt this to the existing schema instead of copying it literally.

### `Order`

- `id`
- `restaurantId`
- `source`
- `serviceMode`
- `serviceLocationId` nullable
- `customerName` nullable
- `pickupCode` nullable
- `orderStatus`
- `paymentStatus`
- `total`
- `confirmedAt` nullable
- `createdAt`

### Source suggestions

- `WHATSAPP`
- `LOCAL_QR`

### Payment status suggestions

- `PENDING`
- `PAID`
- `CANCELLED`

### Order status

Order status must be mapped to the eventual state machine chosen in implementation, but it must cover:

- awaiting payment;
- confirmed;
- preparing;
- ready;
- delivered;
- expired;
- cancelled if needed.

Do not duplicate enums or models unnecessarily if existing concepts can be extended cleanly.

## Pickup code strategy

The `pickupCode` must be:

- short;
- easy to say aloud;
- easy to search;
- unique within the relevant restaurant scope.

Examples:

- `A184`
- `B392`
- `F028`

Rules:

- never expose raw database IDs to customers;
- implement safe collision handling;
- uniqueness can be restaurant-scoped, optionally bounded by active or recent orders depending on implementation details.

## Expiration of unpaid orders

Orders in `AWAITING_PAYMENT` must not remain active forever.

Initial behavior:

- expire after 15 minutes

Future-proofing:

- duration should be configurable later per restaurant or per environment.

On expiration:

- status becomes `EXPIRED`;
- the order must not appear as a normal cashier order;
- it must never appear in kitchen;
- it must not be confirmable without an explicit recovery action.

Customer-facing message:

- `Este pedido vencio. Realiza uno nuevo.`

## Customer status after payment

The customer status screen should update after cashier confirmation.

Initial implementation may use polling if that is the simplest fit for the current architecture.

Expected progression:

Before payment:

- `Pedido A184`
- `Pendiente de pago`
- `Acercate a caja.`

After payment confirmation:

- `Pedido A184`
- `Pago confirmado`
- `Preparando`
- `Listo`

Final state:

- `Tu pedido esta listo para retirar.`

## Sessions

Keep the temporary QR session concept, but generalize it.

A `GuestSession` must be able to exist for:

- a restaurant general QR;
- a specific service location QR.

It must not depend obligatorily on a `ServiceLocation`.

If a future branch contains table-specific session naming, rename it before expanding the flow further.

## Admin UX direction

Conceptually, Menui should converge toward:

`Pedidos`

- `Nuevos`
- `Caja`
- `Cocina`
- `Historial`

`Pedidos en local / QR`

- `Configuracion`
- `Ubicaciones`
- `Codigos QR`

This does not have to be implemented as literal navigation if the current admin information architecture suggests a cleaner structure.

## Compatibility requirements

Do not break:

- WhatsApp ordering;
- current QR menu;
- current cart;
- existing restaurants;
- historical orders and event data;
- admin panel;
- subdomain behavior.

Schema additions should use nullable fields or compatible defaults whenever possible.

## Recommended implementation sequence

1. Introduce generalized domain names and schema design for local ordering.
2. Add `ServiceMode` and restaurant-level local-order configuration.
3. Add `ServiceLocation` and tokenized location QR support.
4. Add `Order` domain for local QR orders with optional `serviceLocationId`.
5. Add cashier confirmation flow and idempotent payment confirmation.
6. Add kitchen eligibility logic and kitchen view.
7. Add customer post-payment status tracking.

## Explicit architecture guardrails

Before implementation, verify that no new code introduces assumptions such as:

- every local order must have a table;
- every QR must map to a table;
- every session must require a location;
- kitchen visibility starts at customer submission time;
- the order reference shown to the customer can be a database ID.

If any new implementation starts from those assumptions, stop and generalize first.
