# Menui Product Roadmap

## Producto base

- Una sola base de app web para todos los restaurantes.
- Cada restaurante vive bajo un subdominio propio: `slug.menui.oi`.
- El menu publico prioriza mobile, pero sigue funcionando en web.
- El carrito no cobra dentro del menu: arma el pedido y lo envia al WhatsApp del local.

## Roles

- `public`: visita landing y menu.
- `restaurant_admin`: gestiona identidad, categorias, productos, precios, fotos y disponibilidad.
- `super_admin`: crea restaurantes, asigna subdominios y coordina membresias.

## Cobro SaaS

- Opcion A MVP: usar un plan/link de suscripcion de Mercado Pago y activar manualmente.
- Flujo ideal: generar suscripcion, recibir webhook y actualizar estado del restaurante.
- Estados esperados: `trial`, `active`, `past_due`, `suspended`, `cancelled`, `manual`.

## Flujo operativo real

1. Superadmin crea restaurante en backoffice.
2. Carga manualmente el subdominio ya creado en Hostinger.
3. Se inicia suscripcion mensual en Mercado Pago o se define modo manual.
4. Se habilita acceso del admin restaurante.
5. El restaurante personaliza su menu sobre la base comun del producto.

## Siguiente capa tecnica

- Base de datos para restaurantes, categorias, productos, assets y suscripciones.
- Auth real por roles para restaurante y superadmin.
- Integracion Mercado Pago `preapproval` para membresia automatica.
- Upload real de imagenes con almacenamiento persistente.
- Provision de subdominios y resolucion por host en produccion.
