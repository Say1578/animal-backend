var express = require('express');
var router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware.js');
const { body, validationResult } = require('express-validator');

router.get('/pets', authMiddleware, async function(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM pets where user_id = $1', [req.user.id]); 
    res.send(result.rows);
  } catch (err) {
    res.status(500).send('Server Error');
    console.log(err);
  }
});

router.get('/pets/:id', authMiddleware, async function(req, res, next) {
  try {
    const petId = req.params.id;
    const userId = req.user.id;
    const result = await pool.query('SELECT * FROM pets where id = $1 AND user_id = $2', [petId, userId]); 
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Питомец не найден или у вас нет доступа' });
    }
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
    console.log(err);
  }
});

router.post('/pets', authMiddleware,
  [
  body('category_id').isInt().withMessage('category_id must be an integer'),
  body('name').notEmpty().withMessage('name is required'),
  body('price').isFloat({ min: 0 }).withMessage('price must be a positive number'),
  body('description').optional().isString().withMessage('description must be a string'),
  ],
  async function(req, res) {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { category_id, name, price, description } = req.body;
      const userId = req.user.id;

      const result = await pool.query('INSERT INTO pets (user_id, category_id, name, price, description) VALUES ($1, $2, $3, $4, $5) RETURNING *', [userId, category_id, name, price, description]); 
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error('Ошибка при добавлении питомца:', err.message);
      res.status(500).send('Ошибка сервера');
    }
  });

router.patch('/pets/:id', authMiddleware, async function(req, res) {
    try {
      const petId = req.params.id;
      const userId = req.user.id;
      const { category_id, name, price, description } = req.body;

      const petExists = await pool.query('SELECT * FROM pets WHERE id = $1 AND user_id = $2', [petId, userId]);

      if (petExists.rows.length === 0) {
        return res.status(404).json({ message: 'Питомец не найден или у вас нет доступа' });
      }

      let updateFields = [];
      let queryValues = [];
      let index = 1;
  
      if (category_id !== undefined) {
        updateFields.push(`category_id = $${index++}`);
        queryValues.push(category_id);
      }
      if (name !== undefined) {
        updateFields.push(`name = $${index++}`);
        queryValues.push(name);
      }
      if (price !== undefined) {
        updateFields.push(`price = $${index++}`);
        queryValues.push(price);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${index++}`);
        queryValues.push(description);
      }
  
      if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Нет данных для обновления' });
      }

    queryValues.push(userId, petId);
    const updateQuery = `
      UPDATE pets 
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE user_id = $${queryValues.length - 1} AND id = $${queryValues.length}
      RETURNING *;
    `;

    const result = await pool.query(updateQuery, queryValues);
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении питомца:', err.message);
    res.status(500).send('Ошибка сервера');
    }
  });

  router.delete('/pets/:id', authMiddleware, async function(req, res, next) {
    try {
      const petId = req.params.id;
      const userId = req.user.id;

      const result = await pool.query('DELETE FROM pets WHERE id = $1 AND user_id = $2 RETURNING *',[petId, userId]);

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Питомец не найден или не принадлежит вам' });
      }

      res.status(200).json({ message: 'Питомец успешно удален', pet: result.rows[0] });
    } catch (err) {
    res.status(500).send('Server Error');
    console.error('Ошибка при удалении питомца:', err);
    }
});

module.exports = router;
