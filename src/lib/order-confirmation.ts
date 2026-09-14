export type ConfirmOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type ConfirmOrderPayload = {
  restaurantName: string;
  restaurantSlug: string;
  restaurantWhatsapp: string;
  customerName: string;
  customerWhatsapp: string;
  fulfillmentLabel: string;
  deliveryAddress: string;
  paymentMethodLabel: string;
  customerNote: string;
  totalArs: number;
  itemsTotalArs: number;
  deliveryFeeArs: number;
  deliveryDistanceMeters: number | null;
  whatsappUrl: string;
  items: ConfirmOrderItem[];
};

export const buildOrderConfirmationStorageKey = (slug: string) =>
  `menui:order-confirmation:${slug}`;
