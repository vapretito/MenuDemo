type GoogleRoutesResponse = {
  routes?: Array<{ distanceMeters?: number }>;
};

export async function getDeliveryRouteDistanceMeters(input: {
  originAddress: string;
  destinationAddress: string;
}) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Falta configurar GOOGLE_MAPS_API_KEY para calcular el delivery por kilómetros."
    );
  }

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { address: input.originAddress },
        destination: { address: input.destinationAddress },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        units: "METRIC",
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("No se pudo calcular la ruta de delivery para esa dirección.");
  }

  const data = (await response.json()) as GoogleRoutesResponse;
  const distanceMeters = data.routes?.[0]?.distanceMeters;

  if (!distanceMeters || distanceMeters <= 0) {
    throw new Error("No encontramos una ruta para esa dirección.");
  }

  return Math.round(distanceMeters);
}
