const express = require('express');
const router = express.Router();
const pool = require('../db'); 

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const offset = (page - 1) * limit;
  const searchValue = req.query.searchValue || '';

  try {
    const params = [];
    let paramIndex = 1;

    const filterCondition = searchValue
      ? `
        WHERE 
          m.content ILIKE $${paramIndex} OR 
          c.name ILIKE $${paramIndex} OR 
          c.phone_number ILIKE $${paramIndex}
      `
      : '';

    if (searchValue) {
      params.push(`%${searchValue}%`);
      paramIndex++;
    }

    const limitParamIndex = paramIndex++;
    const offsetParamIndex = paramIndex++;
    params.push(limit, offset);

    const query = `
      WITH filtered_data AS (
        SELECT
          m.contact_id,
          m.content,
          m.timestamp,
          c.name,
          c.phone_number,
          ROW_NUMBER() OVER (PARTITION BY m.contact_id ORDER BY m.timestamp DESC) AS rn
        FROM messages m
        JOIN contacts c ON m.contact_id = c.id
        ${filterCondition}
      ),
      latest_messages AS (
        SELECT * FROM filtered_data WHERE rn = 1
      )
      SELECT * FROM latest_messages
      ORDER BY timestamp DESC
      LIMIT $${limitParamIndex}
      OFFSET $${offsetParamIndex};
    `;

    const countQuery = `
      WITH filtered_data AS (
        SELECT
          m.contact_id,
          ROW_NUMBER() OVER (PARTITION BY m.contact_id ORDER BY m.timestamp DESC) AS rn
        FROM messages m
        JOIN contacts c ON m.contact_id = c.id
        ${filterCondition}
      )
      SELECT COUNT(*) FROM filtered_data WHERE rn = 1;
    `;

    const [dataRes, countRes] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, searchValue ? 1 : 0))
    ]);

    const totalCount = parseInt(countRes.rows[0].count);

    res.json({
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalConversations: totalCount,
      data: dataRes.rows,
    });

  } catch (err) {
    console.error('Error in search:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
