var express = require('express');
var router = express.Router();
const pool = require('../db');

router.get('/', async function(req, res, next) {
  try {
    const { min_price, max_price, category_id, page, limit } = req.query;

    const minPrice = min_price ? Number(min_price) : 0;
    const maxPrice = max_price ? Number(max_price) : 9999999;
    const pageNumber = page ? Number(page) : 1;
    const pageSize = limit ? Number(limit) : 10;

    const offset = (pageNumber - 1) * pageSize;

    let query;
    let queryParams = [minPrice, maxPrice, pageSize, offset];

    if (category_id !== undefined) {
      query = `
        SELECT pets.*, categories.name AS category_name 
        FROM pets 
        LEFT JOIN categories ON pets.category_id = categories.id
        WHERE pets.price >= $1 AND pets.price <= $2 AND pets.category_id = $5
        ORDER BY pets.price ASC
        LIMIT $3 OFFSET $4
      `;
      queryParams.push(category_id);
    } else {
      query = `
        SELECT pets.*, categories.name AS category_name 
        FROM pets 
        LEFT JOIN categories ON pets.category_id = categories.id
        WHERE pets.price >= $1 AND pets.price <= $2
        ORDER BY pets.price ASC
        LIMIT $3 OFFSET $4
      `;
    }

    const result = await pool.query(query, queryParams);

    res.send({
      page: pageNumber,
      limit: pageSize,
      total: result.rowCount,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).send('Server Error');
    console.error('Ошибка при получении списка питомцев:', err);
  }
});



router.get('/:id', async function(req, res, next) {
  try {
    const petId = req.params.id;

    if (isNaN(petId)) {
      return res.status(400).json({ message: 'Некорректный ID' });
    }

    const query = `
      SELECT pets.*, categories.name AS category_name 
      FROM pets 
      JOIN categories ON pets.category_id = categories.id 
      WHERE pets.id = $1
    `;

    const result = await pool.query(query, [petId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Питомец не найден' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
    console.error('Ошибка при получении питомца:', err);
  }
});

module.exports = router;
