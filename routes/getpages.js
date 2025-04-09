const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  try {
    // Optimized query using a materialized view or pre-aggregated data
    const conversationsQuery = `
      SELECT m.contact_id, c.name, c.phone_number, m.content, m.timestamp
      FROM (
        SELECT contact_id, MAX(timestamp) AS latest_timestamp
        FROM messages
        GROUP BY contact_id
      ) latest
      JOIN messages m ON m.contact_id = latest.contact_id AND m.timestamp = latest.latest_timestamp
      JOIN contacts c ON c.id = m.contact_id
      ORDER BY m.timestamp DESC
      LIMIT $1 OFFSET $2;
    `;
    const { rows } = await pool.query(conversationsQuery, [limit, offset]);

    // Optimized count query using pre-aggregated data
    const countQuery = `SELECT COUNT(*) FROM (SELECT DISTINCT contact_id FROM messages) AS unique_contacts;`;
    const countResult = await pool.query(countQuery);
    const totalConversations = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalConversations / limit);

    res.json({
      page,
      limit,
      totalPages,
      totalConversations,
      data: rows,
    });
  } catch (err) {
    console.error('Error in getpages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
