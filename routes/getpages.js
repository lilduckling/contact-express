const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  try {
    const conversationsQuery = `
      SELECT m.contact_id, c.name, c.phone_number, m.content, m.timestamp
      FROM (
        SELECT DISTINCT ON (contact_id) *
        FROM messages
        ORDER BY contact_id, timestamp DESC
      ) m
      JOIN contacts c ON c.id = m.contact_id
      ORDER BY m.timestamp DESC
      LIMIT $1 OFFSET $2;
    `;
    const { rows } = await pool.query(conversationsQuery, [limit, offset]);

    const countQuery = `SELECT COUNT(DISTINCT contact_id) FROM messages;`;
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
    console.error('Error in get50page:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
