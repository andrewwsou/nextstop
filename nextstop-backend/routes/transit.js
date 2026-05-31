const express = require("express");
const router = express.Router();

// GET /api/transit/nearby?lat=33.64&lon=-117.84
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const response = await fetch(
      `https://external.transitapp.com/v3/public/nearby_routes?lat=${lat}&lon=${lon}`,
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
    res.status(500).json({ error: "Transit API error" });
  }
});

module.exports = router;