"use client";

const ADMIN_NOTIFICATION_TAG = "menui-admin-local-orders";

const playOscillator = (context: AudioContext, frequency: number, startAt: number) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.14, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + 0.24);
};

export const canUseBrowserNotifications = () =>
  typeof window !== "undefined" && "Notification" in window;

export const getBrowserNotificationPermission = () => {
  if (!canUseBrowserNotifications()) {
    return "unsupported" as const;
  }

  return window.Notification.permission;
};

export const requestBrowserNotificationPermission = async () => {
  if (!canUseBrowserNotifications()) {
    return "unsupported" as const;
  }

  return window.Notification.requestPermission();
};

export const showBrowserNotification = (
  title: string,
  body: string,
  options?: {
    tag?: string;
    requireInteraction?: boolean;
  }
) => {
  if (getBrowserNotificationPermission() !== "granted") {
    return;
  }

  try {
    new window.Notification(title, {
      body,
      tag: options?.tag ?? ADMIN_NOTIFICATION_TAG,
      requireInteraction: options?.requireInteraction ?? false,
    });
  } catch (error) {
    console.error("[Browser Notification Error]", error);
  }
};

export const playNotificationTone = async () => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      return false;
    }

    const context = new AudioContextClass();

    if (context.state === "suspended") {
      await context.resume();
    }

    const startAt = context.currentTime + 0.02;
    playOscillator(context, 880, startAt);
    playOscillator(context, 1174, startAt + 0.12);

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 450);

    if ("vibrate" in navigator) {
      navigator.vibrate?.([150, 80, 180]);
    }

    return true;
  } catch (error) {
    console.error("[Notification Tone Error]", error);
    return false;
  }
};
