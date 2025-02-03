var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');


const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  };

router.post('/signup', async function(req, res, next) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Все поля обязательны' });
  }
    
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const result = await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *', [name, email, hashedPassword]); 
    res.send(result.rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
    console.log(err);
  }
});

router.post('/login', async function(req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }
 
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]); 
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Неверный email или пароль' });
      }
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return res.status(401).json({ message: 'Неверный email или пароль' });
      }
      
      const token = generateToken(user.id);
      res.json({ message: 'Вход выполнен', token });

    } catch (err) {
      res.status(500).send('Server Error');
      console.log(err);
    }
  });
  
  
module.exports = router;