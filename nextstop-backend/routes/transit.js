const express = require("express");
const router = express.Router();

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

router.get("/routes", async (req, res) => {
  const start = req.query.start?.trim();
  const destination = req.query.destination?.trim();
  const allowedTransit = new Set(
    (req.query.transit || "bus,train,express")
      .split(",")
      .filter(Boolean)
  );

  if (!start || !destination) {
    return res.status(400).json({
      error: "Start and destination are required",
    });
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
    routes,
  });
});

router.get("/nearby", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const url = `https://external.transitapp.com/v4/public/nearby_routes?lat=${lat}&lon=${lon}`;

    console.log("Request URL:", url);

    const response = await fetch(url, {
      headers: {
        apiKey: process.env.TRANSIT_API_KEY,
      },
    });

    console.log("Transit status:", response.status);

    const data = await response.json();

    console.log(
      "Transit response:",
      JSON.stringify(data, null, 2)
    );

    res.status(response.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Transit API error" });
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
