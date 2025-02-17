const request = require('supertest');
const app = require('../app'); 
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Test1234'
};

beforeEach(async () => {
  await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
});

afterAll(async () => {
  await pool.end();
});

describe('Auth API', () => {
  test('Регистрация пользователя - успех', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send(testUser);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(testUser.email);

    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  test('Регистрация с неполными данными - ошибка', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({ email: 'fail@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Все поля обязательны');
  });

  test('Вход - успешный', async () => {
    await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
      [
        testUser.name,
        testUser.email,
        await bcrypt.hash(testUser.password, 10)
      ]
    );
    
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');

    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  test('Вход - неправильный пароль', async () => {
    await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
      [
        testUser.name,
        testUser.email,
        await bcrypt.hash(testUser.password, 10)
      ]
    );

    const res = await request(app)
      .post('/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Неверный email или пароль');

    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  test('Вход - пользователь не найден', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'notfound@example.com', password: 'SomePassword' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Неверный email или пароль');
  });
});
