const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async function (req, res, next) {
  try {
    const { min_price, max_price, category_id, region, name, page, limit } = req.query;

    const minPrice = min_price ? Number(min_price) : 0;
    const maxPrice = max_price ? Number(max_price) : 9999999;
    const pageNumber = page ? Number(page) : 1;
    const pageSize = limit ? Number(limit) : 12;

    const offset = (pageNumber - 1) * pageSize;

    let queryParams = [minPrice, maxPrice];
    let whereClauses = [
      'pets.price >= $1',
      'pets.price <= $2'
    ];

    if (category_id !== undefined) {
      whereClauses.push(`pets.category_id = $${queryParams.length + 1}`);
      queryParams.push(category_id);
    }

    if (region !== undefined) {
      whereClauses.push(`pets.region = $${queryParams.length + 1}`);
      queryParams.push(region);
    }

    if (name !== undefined) {
      whereClauses.push(`pets.name ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${name}%`);
    }

    const whereClause = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const dataQueryParams = [...queryParams, pageSize, offset];

    const query = `
      SELECT 
        pets.*, 
        categories.name AS category_name 
      FROM 
        pets 
      LEFT JOIN 
        categories 
      ON 
        pets.category_id = categories.id 
      ${whereClause}
      ORDER BY 
        pets.price ASC 
      LIMIT 
        $${queryParams.length + 1} 
      OFFSET 
        $${queryParams.length + 2}
    `;

    const countQuery = `
      SELECT 
        COUNT(*) 
      FROM 
        pets 
      ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, dataQueryParams),
      pool.query(countQuery, queryParams)
    ]);

    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / pageSize);

    res.send({
      page: pageNumber,
      limit: pageSize,
      total: result.rowCount,
      totalPages: totalPages,
      totalItems: totalItems,
      data: result.rows,
    });
  } catch (err) {
    res.status(500).send('Server Error');
    console.error('Ошибка при получении списка питомцев:', err);
  }
});




// Получение питомца по ID
router.get('/:id', async (req, res) => {
  try {
    const petId = Number(req.params.id);
    if (isNaN(petId)) return res.status(400).json({ message: 'Некорректный ID' });

    const query = `
      SELECT pets.*, categories.name AS category_name, users.name AS user_name 
      FROM pets 
      LEFT JOIN categories ON pets.category_id = categories.id 
      LEFT JOIN users ON pets.user_id = users.id 
      WHERE pets.id = $1
    `;
    const result = await pool.query(query, [petId]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Питомец не найден' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Добавление питомца
router.post('/', async (req, res) => {
  try {
    const { user_id, category_id, name, price, description, region, email, phone, additional_phone, telegram, images } = req.body;
    const query = `
      INSERT INTO pets (user_id, category_id, name, price, description, region, email, phone, additional_phone, telegram, images)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *
    `;
    const values = [user_id, category_id, name, price, description, region, email, phone, additional_phone, telegram, images];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Обновление питомца
router.put('/:id', async (req, res) => {
  try {
    const petId = Number(req.params.id);
    if (isNaN(petId)) return res.status(400).json({ message: 'Некорректный ID' });

    const { name, price, description, region, email, phone, additional_phone, telegram, images } = req.body;
    const query = `
      UPDATE pets
      SET name = $1, price = $2, description = $3, region = $4, email = $5, phone = $6, additional_phone = $7, telegram = $8, images = $9, updated_at = NOW()
      WHERE id = $10 RETURNING *
    `;
    const values = [name, price, description, region, email, phone, additional_phone, telegram, images, petId];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Питомец не найден' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

// Удаление питомца
router.delete('/:id', async (req, res) => {
  try {
    const petId = Number(req.params.id);
    if (isNaN(petId)) return res.status(400).json({ message: 'Некорректный ID' });

    const query = 'DELETE FROM pets WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [petId]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Питомец не найден' });
    res.json({ message: 'Питомец удален' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
});

module.exports = router;
