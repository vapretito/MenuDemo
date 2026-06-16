export const normalizeWhatsapp = (value: string) => value.replace(/\D/g, "");

export const isValidWhatsapp = (value: string) =>
  value.length >= 10 && value.length <= 15;
