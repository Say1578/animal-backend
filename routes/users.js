var express = require('express');
var router = express.Router();
const pool = require('../db');

/* GET user profile */
router.get('/:id', async function(req, res, next) {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [id]);
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;