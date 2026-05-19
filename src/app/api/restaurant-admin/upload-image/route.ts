import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getRestaurantSession } from "@/lib/restaurant-session";

export const runtime = "nodejs";

const ALLOWED_KINDS = new Set(["logo", "cover", "product"]);

function sanitizeFileName(fileName: string) {
  const cleanName = fileName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return cleanName || "image";
}

function getMaxSizeByKind(kind: string) {
  if (kind === "logo") return 2 * 1024 * 1024;

  return 4 * 1024 * 1024;
}

export async function POST(request: Request) {
  const session = await getRestaurantSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    const fileValue = formData.get("file");
    const kind = String(formData.get("kind") ?? "product").trim();

    if (!ALLOWED_KINDS.has(kind)) {
      return NextResponse.json(
        { error: "Tipo de imagen inválido." },
        { status: 400 }
      );
    }

    if (!fileValue || typeof fileValue === "string") {
      return NextResponse.json(
        { error: "No se recibió ningún archivo." },
        { status: 400 }
      );
    }

    const file = fileValue as File;

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen." },
        { status: 400 }
      );
    }

    const maxSizeBytes = getMaxSizeByKind(kind);

    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          error:
            kind === "logo"
              ? "El logo no debería pesar más de 2MB."
              : "La imagen no debería pesar más de 4MB.",
        },
        { status: 400 }
      );
    }

    const safeName = sanitizeFileName(file.name);
    const pathname = `restaurants/${session.restaurantSlug}/${kind}/${Date.now()}-${randomUUID()}-${safeName}`;

    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
    });

    return NextResponse.json({
      ok: true,
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("[Restaurant Image Upload Error]", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo subir la imagen.",
      },
      { status: 500 }
    );
  }
}