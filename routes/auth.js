var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Регистрация
router.post('/signup', async function(req, res, next) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Все поля обязательны' });
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // По умолчанию новый пользователь не админ
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, is_admin) VALUES ($1, $2, $3, $4) RETURNING *', 
            [name, email, hashedPassword, false]
        ); 

        res.send(result.rows[0]);
    } catch (err) {
        res.status(500).send('Server Error');
        console.log(err);
    }
});

// Логин
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

        // Возвращаем is_admin
        res.json({ message: 'Вход выполнен', token, is_admin: user.is_admin });

    } catch (err) {
        res.status(500).send('Server Error');
        console.log(err);
    }
});

// Проверка роли пользователя
router.get('/user/role', async function(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Нет токена' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [decoded.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }

        res.json({ is_admin: result.rows[0].is_admin });
    } catch (err) {
        res.status(401).json({ message: 'Неверный токен' });
    }
});

module.exports = router;
