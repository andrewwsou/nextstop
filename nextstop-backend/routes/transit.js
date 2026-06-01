const express = require("express");
const router = express.Router();

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