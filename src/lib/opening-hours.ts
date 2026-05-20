import { OpeningHour } from "@/types/platform";

const DEFAULT_TIME_ZONE = "America/Argentina/Cordoba";

const weekdayMap: Record<string, string> = {
  sunday: "sunday",
  monday: "monday",
  tuesday: "tuesday",
  wednesday: "wednesday",
  thursday: "thursday",
  friday: "friday",
  saturday: "saturday",
};

const dayOrder = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function timeToMinutes(value: string) {
  const [hoursRaw, minutesRaw] = value.split(":");

  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

function getZonedTimeParts(timeZone?: string | null) {
  const safeTimeZone = timeZone || DEFAULT_TIME_ZONE;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const weekday =
    parts.find((part) => part.type === "weekday")?.value.toLowerCase() ??
    "monday";

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0
  );

  const day = weekdayMap[weekday] ?? "monday";

  return {
    day,
    minutes: hour * 60 + minute,
  };
}

function getPreviousDay(day: string) {
  const index = dayOrder.indexOf(day);

  if (index <= 0) return "saturday";

  return dayOrder[index - 1];
}

function findHour(openingHours: OpeningHour[], day: string) {
  return openingHours.find((hour) => hour.day === day);
}

function isOvernight(openTime: string, closeTime: string) {
  return timeToMinutes(closeTime) <= timeToMinutes(openTime);
}

export function getRestaurantOpeningStatus(input: {
  openingHours?: OpeningHour[] | null;
  timeZone?: string | null;
}) {
  const openingHours = Array.isArray(input.openingHours)
    ? input.openingHours
    : [];

  if (!openingHours.length) {
    return {
      hasSchedule: false,
      isOpen: true,
      label: "Horario no configurado",
      detail: "El restaurante aún no configuró horarios.",
    };
  }

  const { day, minutes } = getZonedTimeParts(input.timeZone);
  const today = findHour(openingHours, day);
  const yesterday = findHour(openingHours, getPreviousDay(day));

  if (
    yesterday?.enabled &&
    isOvernight(yesterday.openTime, yesterday.closeTime)
  ) {
    const yesterdayClose = timeToMinutes(yesterday.closeTime);

    if (minutes < yesterdayClose) {
      return {
        hasSchedule: true,
        isOpen: true,
        label: "Abierto ahora",
        detail: `Abierto desde ${yesterday.label}: ${yesterday.openTime} - ${yesterday.closeTime}`,
      };
    }
  }

  if (!today?.enabled) {
    return {
      hasSchedule: true,
      isOpen: false,
      label: "Cerrado ahora",
      detail: today ? `${today.label}: cerrado` : "Cerrado hoy",
    };
  }

  const openMinutes = timeToMinutes(today.openTime);
  const closeMinutes = timeToMinutes(today.closeTime);
  const overnight = closeMinutes <= openMinutes;

  const isOpen = overnight
    ? minutes >= openMinutes
    : minutes >= openMinutes && minutes < closeMinutes;

  return {
    hasSchedule: true,
    isOpen,
    label: isOpen ? "Abierto ahora" : "Cerrado ahora",
    detail: `${today.label}: ${today.openTime} - ${today.closeTime}`,
  };
}