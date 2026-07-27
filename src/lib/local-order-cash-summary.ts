import { getLocalDateKey, getTodayDateKey } from "@/lib/cash-summary";

type LocalOrderCashEvent = {
  totalArs: number;
  itemCount: number;
  status: string;
  paymentStatus: string;
  paidAt: Date | null;
};

export function summarizeLocalOrderCash(input: {
  orders: LocalOrderCashEvent[];
  timeZone?: string | null;
  businessDate?: string;
}) {
  const businessDate = input.businessDate ?? getTodayDateKey(input.timeZone);

  const dayOrders = input.orders.filter((order) => {
    if (!order.paidAt || order.paymentStatus !== "PAID") {
      return false;
    }

    return getLocalDateKey(order.paidAt, input.timeZone) === businessDate;
  });

  const totalOrders = dayOrders.length;
  const totalPaidArs = dayOrders.reduce((sum, order) => sum + order.totalArs, 0);
  const totalItems = dayOrders.reduce((sum, order) => sum + order.itemCount, 0);
  const averageTicketArs =
    totalOrders > 0 ? Math.round(totalPaidArs / totalOrders) : 0;

  const statusBreakdown = dayOrders.reduce<Record<string, { label: string; totalOrders: number; totalArs: number }>>(
    (accumulator, order) => {
      const key = order.status.toLowerCase();

      if (!accumulator[key]) {
        accumulator[key] = {
          label: order.status,
          totalOrders: 0,
          totalArs: 0,
        };
      }

      accumulator[key].totalOrders += 1;
      accumulator[key].totalArs += order.totalArs;

      return accumulator;
    },
    {}
  );

  return {
    businessDate,
    totalOrders,
    totalPaidArs,
    totalItems,
    averageTicketArs,
    statusBreakdown,
  };
}
