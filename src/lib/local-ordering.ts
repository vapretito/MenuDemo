const PICKUP_CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export const normalizeCustomerName = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ");

export const isValidCustomerName = (value: string) => {
  const normalized = normalizeCustomerName(value);

  if (normalized.length < 2 || normalized.length > 60) {
    return false;
  }

  return /^[\p{L}\p{N} .,'-]+$/u.test(normalized);
};

export const generatePickupCodeCandidate = () => {
  const letter =
    PICKUP_CODE_LETTERS[Math.floor(Math.random() * PICKUP_CODE_LETTERS.length)];
  const number = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  return `${letter}${number}`;
};

export const buildUnpaidExpirationDate = (minutes: number) => {
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 15;
  return new Date(Date.now() + safeMinutes * 60_000);
};

export const formatLocalOrderReference = (
  customerName: string | null | undefined,
  pickupCode: string | null | undefined
) => {
  const safeName = customerName?.trim();
  const safeCode = pickupCode?.trim();

  if (safeName && safeCode) {
    return `${safeName} - ${safeCode}`;
  }

  if (safeCode) {
    return safeCode;
  }

  return safeName || "Pedido en local";
};

export const getLocalOrderStatusLabel = (status: string) => {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "Pendiente de pago";
    case "CONFIRMED":
      return "Pago confirmado";
    case "PREPARING":
      return "Preparando";
    case "READY":
      return "Listo";
    case "DELIVERED":
      return "Entregado";
    case "EXPIRED":
      return "Vencido";
    case "CANCELLED":
      return "Cancelado";
    default:
      return "En proceso";
  }
};

export const getLocalOrderStatusMessage = (status: string) => {
  switch (status) {
    case "AWAITING_PAYMENT":
      return "Acercate a caja para confirmar y pagar tu pedido.";
    case "CONFIRMED":
      return "Tu pago fue confirmado. El pedido ya puede empezar a prepararse.";
    case "PREPARING":
      return "Tu pedido esta en preparacion.";
    case "READY":
      return "Tu pedido esta listo para retirar.";
    case "DELIVERED":
      return "Pedido entregado.";
    case "EXPIRED":
      return "Este pedido vencio. Realiza uno nuevo.";
    case "CANCELLED":
      return "Este pedido fue cancelado.";
    default:
      return "Estamos actualizando el estado de tu pedido.";
  }
};
