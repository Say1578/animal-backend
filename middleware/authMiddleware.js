const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Нет доступа, токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Декодированные данные токена, например { id: 123 }
    next();
  } catch (err) {
    console.error('Ошибка аутентификации:', err.message);
    res.status(401).json({ message: 'Неверный или истекший токен' });
  }
};

module.exports = authMiddleware;
