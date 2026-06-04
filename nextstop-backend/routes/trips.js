const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

// All trip routes require auth
router.use(authMiddleware);

let routeSummaryColumnReady = false;

async function ensureRouteSummaryColumn() {
  if (routeSummaryColumnReady) {
    return;
  }

  await pool.query('ALTER TABLE trips ADD COLUMN IF NOT EXISTS route_summary JSONB');
  routeSummaryColumnReady = true;
}

// GET /api/trips — get all trips for logged-in user
router.get('/', async (req, res) => {
  try {
    await ensureRouteSummaryColumn();
    const result = await pool.query(
      'SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/trips — save a new trip
router.post('/', async (req, res) => {
  const {
    origin,
    destination,
    departure_time,
    transit_modes,
    duration_minutes,
    route_summary,
  } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Origin and destination are required' });
  }

  try {
    await ensureRouteSummaryColumn();
    const result = await pool.query(
      `INSERT INTO trips (
        user_id,
        origin,
        destination,
        departure_time,
        transit_modes,
        duration_minutes,
        route_summary
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        req.user.id,
        origin,
        destination,
        departure_time,
        transit_modes,
        duration_minutes,
        route_summary || null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/trips/:id — update a trip (e.g. reschedule)
router.put('/:id', async (req, res) => {
  const { departure_time, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE trips SET departure_time = $1, status = $2
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [departure_time, status, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/trips/:id — delete a trip
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
