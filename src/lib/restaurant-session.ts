import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "menui_restaurant_session";

type RestaurantSessionPayload = {
  userId: string;
  restaurantId: string;
  restaurantSlug: string;
  role: "RESTAURANT_ADMIN";
  exp: number;
};

function getSessionSecret() {
  const secret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.MENUI_AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "Falta AUTH_SECRET, NEXTAUTH_SECRET o MENUI_AUTH_SECRET en variables de entorno."
    );
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export function createRestaurantSessionToken(
  payload: Omit<RestaurantSessionPayload, "exp">
) {
  const sessionPayload: RestaurantSessionPayload = {
    ...payload,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };

  const encodedPayload = Buffer.from(JSON.stringify(sessionPayload)).toString(
    "base64url"
  );

  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyRestaurantSessionToken(token?: string | null) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as RestaurantSessionPayload;

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function setRestaurantSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getRestaurantSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  return verifyRestaurantSessionToken(token);
}

export async function clearRestaurantSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(COOKIE_NAME);
}