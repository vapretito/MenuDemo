type CashEvent = {
    totalArs: number;
    itemCount: number;
    paymentMethod: string;
    createdAt: Date;
  };
  
  export type PaymentBreakdownItem = {
    label: string;
    totalEvents: number;
    totalItems: number;
    totalArs: number;
  };
  
  export type PaymentBreakdown = Record<string, PaymentBreakdownItem>;
  
  const DEFAULT_TIME_ZONE = "America/Argentina/Cordoba";
  
  export function getLocalDateKey(date: Date, timeZone?: string | null) {
    const safeTimeZone = timeZone || DEFAULT_TIME_ZONE;
  
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: safeTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
  
    const year = parts.find((part) => part.type === "year")?.value ?? "0000";
    const month = parts.find((part) => part.type === "month")?.value ?? "00";
    const day = parts.find((part) => part.type === "day")?.value ?? "00";
  
    return `${year}-${month}-${day}`;
  }
  
  export function getTodayDateKey(timeZone?: string | null) {
    return getLocalDateKey(new Date(), timeZone);
  }
  
  function normalizePaymentMethod(value: string) {
    const normalized = value.trim().toLowerCase();
  
    const labels: Record<string, string> = {
      cash: "Efectivo",
      efectivo: "Efectivo",
      transfer: "Transferencia",
      transferencia: "Transferencia",
      mercado_pago: "Mercado Pago",
      mercadopago: "Mercado Pago",
      card: "Tarjeta",
      tarjeta: "Tarjeta",
    };
  
    return {
      key: normalized || "sin_especificar",
      label: labels[normalized] ?? (value || "Sin especificar"),
    };
  }
  
  export function summarizeCashEvents(input: {
    events: CashEvent[];
    timeZone?: string | null;
    businessDate?: string;
  }) {
    const businessDate = input.businessDate ?? getTodayDateKey(input.timeZone);
  
    const dayEvents = input.events.filter(
      (event) => getLocalDateKey(event.createdAt, input.timeZone) === businessDate
    );
  
    const totalEvents = dayEvents.length;
  
    const totalEstimatedArs = dayEvents.reduce(
      (sum, event) => sum + event.totalArs,
      0
    );
  
    const totalItems = dayEvents.reduce((sum, event) => sum + event.itemCount, 0);
  
    const averageTicketArs =
      totalEvents > 0 ? Math.round(totalEstimatedArs / totalEvents) : 0;
  
    const paymentBreakdown: PaymentBreakdown = {};
  
    for (const event of dayEvents) {
      const payment = normalizePaymentMethod(event.paymentMethod);
  
      if (!paymentBreakdown[payment.key]) {
        paymentBreakdown[payment.key] = {
          label: payment.label,
          totalEvents: 0,
          totalItems: 0,
          totalArs: 0,
        };
      }
  
      paymentBreakdown[payment.key].totalEvents += 1;
      paymentBreakdown[payment.key].totalItems += event.itemCount;
      paymentBreakdown[payment.key].totalArs += event.totalArs;
    }
  
    return {
      businessDate,
      totalEvents,
      totalEstimatedArs,
      totalItems,
      averageTicketArs,
      paymentBreakdown,
    };
  }