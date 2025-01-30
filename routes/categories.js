var express = require('express');
var router = express.Router();
const pool = require('../db');

router.get('/', async function(req, res, next) {
  try {
    const result = await pool.query('SELECT id, name FROM categories'); 
    res.send(result.rows);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;