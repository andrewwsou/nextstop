const express = require("express");
const router = express.Router();
const nearbyTransitCache = new Map();
const NEARBY_TRANSIT_CACHE_MS = 60 * 1000;
const TRANSIT_ENHANCEMENT_MAX_LOOKUPS = 4;

const routeOptions = [
  {
    id: "suggested-oc-metrolink",
    label: "Suggested Route",
    time: "8:15 AM -> 9:08 AM",
    depart: "Leaves from nearby stop",
    duration: "53 min",
    transfers: "1 transfer",
    walk: "9 min walk",
    segments: [
      { type: "walk" },
      { type: "transit", label: "OC 57", transitType: "bus" },
      { type: "walk" },
      { type: "transit", label: "Metrolink", transitType: "train" },
      { type: "walk" },
    ],
  },
  {
    id: "oc-bus-direct",
    time: "8:24 AM -> 9:18 AM",
    depart: "Leaves from campus area",
    duration: "54 min",
    transfers: "0 transfers",
    walk: "12 min walk",
    segments: [
      { type: "walk" },
      { type: "transit", label: "OC 43", transitType: "bus" },
      { type: "walk" },
    ],
  },
  {
    id: "anteater-express-oc",
    time: "8:30 AM -> 9:35 AM",
    depart: "Uses campus shuttle connection",
    duration: "65 min",
    transfers: "1 transfer",
    walk: "6 min walk",
    segments: [
      { type: "walk" },
      { type: "transit", label: "Anteater", transitType: "express" },
      { type: "walk" },
      { type: "transit", label: "OC 54", transitType: "bus" },
      { type: "walk" },
    ],
  },
];

function stripHtml(value) {
  return value.replace(/<[^>]*>/g, "");
}

function getDepartureTime(date, time) {
  if (!date) {
    return "now";
  }

  const tripDate = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(tripDate.getTime())) {
    return "now";
  }

  return Math.floor(tripDate.getTime() / 1000).toString();
}

function getTransitMode(transit) {
  const modes = transit.split(",").filter(Boolean);
  const googleModes = [];

  if (modes.includes("bus") || modes.includes("express")) {
    googleModes.push("bus");
  }

  if (modes.includes("train")) {
    googleModes.push("rail");
  }

  return googleModes.join("|");
}

function getNearbyTransitCacheKey(lat, lon) {
  return `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
}

function getCachedNearbyTransitData(lat, lon) {
  const key = getNearbyTransitCacheKey(lat, lon);
  const cached = nearbyTransitCache.get(key);

  if (!cached || Date.now() - cached.timestamp > NEARBY_TRANSIT_CACHE_MS) {
    return null;
  }

  return cached.data;
}

function setCachedNearbyTransitData(lat, lon, data) {
  nearbyTransitCache.set(getNearbyTransitCacheKey(lat, lon), {
    data,
    timestamp: Date.now(),
  });
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function getRouteSummary(route, transitLines, index) {
  if (route.summary) {
    return route.summary;
  }

  if (transitLines.length > 0) {
    return transitLines.join(" + ");
  }

  return `Route option ${index + 1}`;
}

function getStepType(step) {
  return step.travel_mode === "TRANSIT" ? "transit" : "walking";
}

function normalizeRouteName(value) {
  return (value || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getTransitRouteName(route) {
  return (
    route.route_short_name ||
    route.real_time_route_id ||
    route.compact_display_short_name?.elements?.filter(Boolean).join(" ") ||
    route.route_long_name ||
    ""
  );
}

function findTransitRouteMatch(routes, lineName) {
  const normalizedLine = normalizeRouteName(lineName);
  if (!normalizedLine) {
    return null;
  }

  return routes.find((route) => {
    const names = [
      getTransitRouteName(route),
      route.route_long_name,
      route.real_time_route_id,
    ];

    return names.some((name) => normalizeRouteName(name) === normalizedLine);
  });
}

function getNextDeparture(route) {
  const scheduleItems =
    route.merged_itineraries?.flatMap((itinerary) => itinerary.schedule_items || []) || [];
  const nextItem = scheduleItems.find((item) => item.departure_time || item.arrival_time);
  const timestamp = nextItem?.departure_time || nextItem?.arrival_time;

  return timestamp ? new Date(timestamp * 1000).toISOString() : undefined;
}

function getLiveRouteFields(route) {
  if (!route) {
    return undefined;
  }

  const realtimeAvailable = route.merged_itineraries?.some((itinerary) =>
    itinerary.schedule_items?.some((item) => item.is_real_time)
  );

  return {
    realtimeAvailable: Boolean(realtimeAvailable),
    routeColor: route.route_color ? `#${route.route_color}` : undefined,
    nextDeparture: getNextDeparture(route),
    status: route.alerts?.[0]?.title || undefined,
  };
}

function removeInternalStepFields(step) {
  const { departureLocation, ...publicStep } = step;
  return publicStep;
}

function getTransitType(vehicleType) {
  if (vehicleType === "BUS") {
    return "bus";
  }

  if (
    [
      "COMMUTER_TRAIN",
      "HEAVY_RAIL",
      "HIGH_SPEED_TRAIN",
      "INTERCITY_BUS",
      "METRO_RAIL",
      "RAIL",
      "TRAIN",
      "TRAM",
    ].includes(vehicleType)
  ) {
    return "train";
  }

  return "bus";
}

function mapGooglePlanStep(step) {
  const transit = step.transit_details;
  const line = transit?.line;

  return {
    type: getStepType(step),
    instruction: stripHtml(step.html_instructions || ""),
    duration: step.duration?.text || "",
    distance: step.distance?.text || "",
    lineName: line?.short_name || line?.name || undefined,
    vehicleType: line?.vehicle?.type || line?.vehicle?.name || undefined,
    departureStop: transit?.departure_stop?.name || undefined,
    arrivalStop: transit?.arrival_stop?.name || undefined,
    departureTime: transit?.departure_time?.text || undefined,
    arrivalTime: transit?.arrival_time?.text || undefined,
    departureLocation: transit?.departure_stop?.location || undefined,
  };
}

function mapGooglePlanRoute(route, index) {
  const leg = route.legs?.[0];
  const steps = leg?.steps?.map(mapGooglePlanStep) || [];
  const transitLines = uniqueValues(
    steps
      .filter((step) => step.type === "transit")
      .map((step) => step.lineName)
  );
  const walkSeconds =
    leg?.steps
      ?.filter((step) => step.travel_mode === "WALKING")
      .reduce((total, step) => total + (step.duration?.value || 0), 0) || 0;

  return {
    id: `google-${index}`,
    summary: getRouteSummary(route, transitLines, index),
    duration: leg?.duration?.text || "",
    arrivalTime: leg?.arrival_time?.text || "",
    departureTime: leg?.departure_time?.text || "",
    steps,
    transitLines,
    totalWalkingTime: walkSeconds ? `${Math.round(walkSeconds / 60)} min` : undefined,
    warnings: route.warnings || [],
  };
}

function mapGoogleRoute(route, index) {
  const leg = route.legs?.[0];
  const transitSteps =
    leg?.steps?.filter((step) => step.travel_mode === "TRANSIT") || [];
  const walkSeconds =
    leg?.steps
      ?.filter((step) => step.travel_mode === "WALKING")
      .reduce((total, step) => total + (step.duration?.value || 0), 0) || 0;

  return {
    id: `google-${index}`,
    label: index === 0 ? "Suggested Route" : undefined,
    time:
      leg?.departure_time && leg?.arrival_time
        ? `${leg.departure_time.text} -> ${leg.arrival_time.text}`
        : "Route option",
    depart: leg?.start_address
      ? `Leaves from ${leg.start_address}`
      : "Transit route",
    duration: leg?.duration?.text || "--",
    transfers:
      transitSteps.length > 1
        ? `${transitSteps.length - 1} transfer${
            transitSteps.length - 1 === 1 ? "" : "s"
          }`
        : "0 transfers",
    walk: `${Math.round(walkSeconds / 60)} min walk`,
    segments:
      leg?.steps?.map((step) => {
        if (step.travel_mode === "TRANSIT") {
          const line = step.transit_details?.line;
          return {
            type: "transit",
            label: line?.short_name || line?.name || stripHtml(step.html_instructions),
            transitType: getTransitType(line?.vehicle?.type),
          };
        }

        return { type: "walk" };
      }) || [],
  };
}

async function getGoogleRoutes({ start, destination, transit, date, time }) {
  const params = new URLSearchParams({
    origin: start,
    destination,
    mode: "transit",
    alternatives: "true",
    departure_time: getDepartureTime(date, time),
    key: process.env.GOOGLE_MAPS_API_KEY,
  });

  const transitMode = getTransitMode(transit);
  if (transitMode) {
    params.append("transit_mode", transitMode);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
  );
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(data.error_message || `Google Directions returned ${data.status}`);
  }

  return data.routes.map(mapGoogleRoute);
}

async function getNearbyTransitRoutes(lat, lon) {
  if (!process.env.TRANSIT_API_KEY || lat === undefined || lon === undefined) {
    return [];
  }

  const cached = getCachedNearbyTransitData(lat, lon);
  if (cached) {
    return cached.nearby_routes || [];
  }

  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  });

  const response = await fetch(
    `https://external.transitapp.com/v4/public/nearby_routes?${params.toString()}`,
    {
      headers: {
        apiKey: process.env.TRANSIT_API_KEY,
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  setCachedNearbyTransitData(lat, lon, data);
  return data.nearby_routes || [];
}

async function getNearbyTransitData(lat, lon) {
  if (!process.env.TRANSIT_API_KEY) {
    const error = new Error("TRANSIT_API_KEY is not configured");
    error.status = 500;
    throw error;
  }

  const cached = getCachedNearbyTransitData(lat, lon);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  });

  const response = await fetch(
    `https://external.transitapp.com/v4/public/nearby_routes?${params.toString()}`,
    {
      headers: {
        apiKey: process.env.TRANSIT_API_KEY,
      },
    }
  );
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.error || data.message || "Transit data could not be loaded"
    );
    error.status = response.status;
    throw error;
  }

  setCachedNearbyTransitData(lat, lon, data);
  return data;
}

async function enhanceRoutesWithTransitData(routes) {
  if (!process.env.TRANSIT_API_KEY) {
    return routes.map((route) => ({
      ...route,
      steps: route.steps.map(removeInternalStepFields),
    }));
  }

  const localLookupCache = new Map();
  let lookupCount = 0;
  const enhancedRoutes = [];

  for (const route of routes) {
    const enhancedSteps = [];

    for (const step of route.steps) {
      let enhancedStep = step;

      if (step.type === "transit" && step.departureLocation) {
        const { lat, lng } = step.departureLocation;
        const cacheKey = getNearbyTransitCacheKey(lat, lng);
        const cachedTransitData = getCachedNearbyTransitData(lat, lng);

        if (
          cachedTransitData ||
          localLookupCache.has(cacheKey) ||
          lookupCount < TRANSIT_ENHANCEMENT_MAX_LOOKUPS
        ) {
          try {
            if (!cachedTransitData && !localLookupCache.has(cacheKey)) {
              lookupCount += 1;
            }

            if (!localLookupCache.has(cacheKey)) {
              const nearbyRoutes = await getNearbyTransitRoutes(lat, lng);
              localLookupCache.set(cacheKey, nearbyRoutes);
            }

            const match = findTransitRouteMatch(
              localLookupCache.get(cacheKey),
              step.lineName
            );
            const live = getLiveRouteFields(match);

            if (live) {
              enhancedStep = {
                ...step,
                live,
              };
            }
          } catch {
            enhancedStep = step;
          }
        }
      }

      enhancedSteps.push(removeInternalStepFields(enhancedStep));
    }

    enhancedRoutes.push({
      ...route,
      steps: enhancedSteps,
    });
  }

  return enhancedRoutes;
}

async function getGooglePlanRoutes({ origin, destination, modes, date, time }) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    const error = new Error("GOOGLE_MAPS_API_KEY is not configured");
    error.status = 500;
    throw error;
  }

  const params = new URLSearchParams({
    origin,
    destination,
    mode: "transit",
    alternatives: "true",
    departure_time: getDepartureTime(date, time),
    key: process.env.GOOGLE_MAPS_API_KEY,
  });

  const transitMode = getTransitMode(modes || "bus,train,express");
  if (transitMode) {
    params.append("transit_mode", transitMode);
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`
  );

  if (!response.ok) {
    const error = new Error(`Google Directions request failed with ${response.status}`);
    error.status = 502;
    throw error;
  }

  const data = await response.json();

  if (data.status === "ZERO_RESULTS") {
    const error = new Error("No routes found");
    error.status = 404;
    throw error;
  }

  if (data.status !== "OK") {
    const error = new Error(data.error_message || `Google Directions returned ${data.status}`);
    error.status = 502;
    throw error;
  }

  if (!Array.isArray(data.routes) || data.routes.length === 0) {
    const error = new Error("No routes found");
    error.status = 404;
    throw error;
  }

  const routes = data.routes.map(mapGooglePlanRoute);
  return enhanceRoutesWithTransitData(routes);
}

router.get("/plan", async (req, res) => {
  const origin = req.query.origin?.trim();
  const destination = req.query.destination?.trim();

  if (!origin || !destination) {
    return res.status(400).json({
      error: "Origin and destination are required",
    });
  }

  try {
    const routes = await getGooglePlanRoutes({
      origin,
      destination,
      modes: req.query.modes,
      date: req.query.date,
      time: req.query.time,
    });

    res.json({
      origin,
      destination,
      source: "google",
      routes,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Route planning failed",
    });
  }
});

router.get("/routes", async (req, res) => {
  const start = req.query.start?.trim();
  const destination = req.query.destination?.trim();
  const transit = req.query.transit || "bus,train,express";
  const allowedTransit = new Set(
    transit
      .split(",")
      .filter(Boolean)
  );

  if (!start || !destination) {
    return res.status(400).json({
      error: "Start and destination are required",
    });
  }

  if (process.env.GOOGLE_MAPS_API_KEY) {
    try {
      const routes = await getGoogleRoutes({
        start,
        destination,
        transit,
        date: req.query.date,
        time: req.query.time,
      });

      return res.json({
        start,
        destination,
        source: "google",
        routes,
      });
    } catch (err) {
      console.error("Google Directions error:", err.message);
    }
  }

  const routes = routeOptions.filter((route) =>
    route.segments.every((segment) => {
      if (segment.type === "walk") {
        return true;
      }

      return allowedTransit.has(segment.transitType);
    })
  );

  res.json({
    start,
    destination,
    source: "mock",
    routes,
  });
});

router.get("/nearby", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Latitude and longitude are required" });
    }

    const data = await getNearbyTransitData(lat, lon);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message || "Transit API error",
    });
  }
});

// GET /api/transit/vehicles?global_route_id=MLA:5907&direction_id=0
router.get("/vehicles", async (req, res) => {
  try {
    const { global_route_id, direction_id } = req.query;

    if (!global_route_id) {
      return res.status(400).json({ error: "global_route_id is required" });
    }

    const params = new URLSearchParams({
      global_route_id,
    });

    if (direction_id !== undefined) {
      params.append("direction_id", direction_id);
    }

    const response = await fetch(
      `https://external.transitapp.com/v4/vehicles?${params.toString()}`,
      {
        headers: {
          apiKey: process.env.TRANSIT_API_KEY,
        },
      }
    );

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Transit vehicles API error" });
  }
});
module.exports = router;
