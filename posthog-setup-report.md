# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into Menui, a SaaS platform for restaurant menus. The integration covers the full business lifecycle: restaurant onboarding, customer ordering via WhatsApp, and subscription payments via MercadoPago. Both client-side and server-side event tracking are in place, along with user identification on key conversion events.

**New files created:**
- `instrumentation-client.ts` — initializes PostHog JS (client-side) via the Next.js 15.3+ instrumentation hook
- `src/lib/posthog-server.ts` — shared singleton PostHog Node client for server-side routes
- `next.config.ts` — updated with `/ingest/*` reverse-proxy rewrites and `skipTrailingSlashRedirect`

**`.env.local` keys added:** `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`

---

## Events instrumented

| Event name | Description | File |
|---|---|---|
| `onboarding_form_submitted` | User clicks 'Crear y continuar' to submit the restaurant onboarding form. | `src/app/contratar/onboarding-form.tsx` |
| `onboarding_completed` | Onboarding form submission succeeds and the result card with credentials is shown. | `src/app/contratar/onboarding-form.tsx` |
| `checkout_to_mercadopago_clicked` | User clicks 'Continuar a Mercado Pago' after a successful onboarding. | `src/app/contratar/onboarding-form.tsx` |
| `product_detail_viewed` | User opens the detail modal for a product in the menu. | `src/components/mobile-menu.tsx` |
| `product_added_to_cart` | User adds a product to the cart for the first time (qty 0 → 1). | `src/components/mobile-menu.tsx` |
| `cart_opened` | User opens the cart drawer by clicking the floating cart button. | `src/components/mobile-menu.tsx` |
| `order_submitted` | User clicks 'Enviar pedido por WhatsApp', passing all checkout validations. | `src/components/mobile-menu.tsx` |
| `whatsapp_order_opened` | User clicks 'Abrir WhatsApp y enviar' on the order confirmation screen. | `src/components/order-confirmation-view.tsx` |
| `restaurant_admin_login` | Restaurant admin successfully authenticates and a session token is issued. | `src/app/api/restaurant-auth/login/route.ts` |
| `restaurant_created` | New restaurant record successfully created through the public onboarding API. | `src/app/api/public/onboarding/route.ts` |
| `subscription_payment_activated` | MercadoPago webhook activates or updates a restaurant subscription status. | `src/app/api/mercadopago/webhook/route.ts` |
| `cart_event_saved` | Customer cart successfully saved to the database via the menu cart-events API. | `src/app/api/menu/cart-events/route.ts` |

---

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/484676/dashboard/1756644)
- [Onboarding conversion funnel (wizard)](https://us.posthog.com/project/484676/insights/LRfEZPWJ)
- [Menu ordering funnel (wizard)](https://us.posthog.com/project/484676/insights/GW46PsT8)
- [New restaurants created (wizard)](https://us.posthog.com/project/484676/insights/SseDUMEK)
- [Orders submitted over time (wizard)](https://us.posthog.com/project/484676/insights/nWhaZonP)
- [Subscription payment activations (wizard)](https://us.posthog.com/project/484676/insights/zK4zfpqR)

---

## Verify before merging

- [ ] Run a full production build (`npm run build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the restaurant admin login only identifies on fresh login; returning sessions with an existing cookie skip the login route and will be on anonymous distinct IDs until they log in again.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
