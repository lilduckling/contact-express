const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;
  const searchValue = req.query.searchValue || '';

  try {
    let baseQuery = `
      SELECT m.contact_id, c.name, c.phone_number, m.content, m.timestamp
      FROM (
        SELECT DISTINCT ON (contact_id) *
        FROM messages
        ORDER BY contact_id, timestamp DESC
      ) m
      JOIN contacts c ON c.id = m.contact_id
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (searchValue) {
      conditions.push(`(
        c.name ILIKE $${paramIndex} OR
        c.phone_number ILIKE $${paramIndex} OR
        m.content ILIKE $${paramIndex}
      )`);
      params.push(`%${searchValue}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    baseQuery += ` ORDER BY m.timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1};`;
    params.push(limit, offset);

    const result = await pool.query(baseQuery, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) FROM (
        SELECT DISTINCT ON (contact_id) m.contact_id
        FROM messages m
        JOIN contacts c ON c.id = m.contact_id
        ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
        ORDER BY contact_id, timestamp DESC
      ) AS sub;
    `;
    const countRes = await pool.query(countQuery, params.slice(0, conditions.length));
    const totalCount = parseInt(countRes.rows[0].count);

    res.json({
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalConversations: totalCount,
      data: result.rows,
    });

  } catch (err) {
    console.error('Error in search:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
