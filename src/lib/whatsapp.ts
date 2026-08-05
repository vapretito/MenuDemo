export const normalizeWhatsapp = (value: string) => value.replace(/\D/g, "");

export const isValidWhatsapp = (value: string) =>
  value.length >= 10 && value.length <= 15;

type LocalOrderReadyMessageInput = {
  customerName?: string | null;
  pickupCode?: string | null;
  restaurantName: string;
  totalArs?: number | null;
  template: string;
};

const readyMessageMoney = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const buildWhatsappUrl = (whatsapp: string, message: string) =>
  `https://wa.me/${normalizeWhatsapp(whatsapp)}?text=${encodeURIComponent(message)}`;

export const buildLocalOrderReadyMessage = ({
  customerName,
  pickupCode,
  restaurantName,
  totalArs,
  template,
}: LocalOrderReadyMessageInput) => {
  const safeTemplate =
    template.trim() ||
    "Hola {customerName}, tu pedido {pickupCode} ya esta listo para retirar en {restaurantName}.";

  return safeTemplate
    .replaceAll("{customerName}", customerName?.trim() || "cliente")
    .replaceAll("{pickupCode}", pickupCode?.trim() || "sin codigo")
    .replaceAll("{restaurantName}", restaurantName.trim())
    .replaceAll(
      "{total}",
      typeof totalArs === "number" ? readyMessageMoney.format(totalArs) : "-"
    );
};
