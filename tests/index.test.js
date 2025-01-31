const request = require('supertest');
const express = require('express');
const path = require('path');
const app = express();

// Мокируем рендеринг, если необходимо (например, для тестирования без реального рендеринга)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Инициализируем роут из твоего кода
const indexRouter = require('../routes/index'); // Путь к твоему файлу
app.use('/', indexRouter);

describe('GET /', () => {
  it('should return status 200 and render the correct title', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>Express</title>');
  });

  it('should render the home page correctly', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.text).toContain('Express');
  });

  it('should handle missing or incorrect routes with 404 error', async () => {
    const response = await request(app).get('/nonexistent-route');
    expect(response.status).toBe(404);
    expect(response.text).toContain('Cannot GET /nonexistent-route');
  });

  it('should respond with correct content type', async () => {
    const response = await request(app).get('/');
    expect(response.header['content-type']).toMatch(/html/); // Проверка типа контента
  });

  it('should handle repeated requests and not crash', async () => {
    const requests = Array(10).fill(request(app).get('/'));
    const responses = await Promise.all(requests);

    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.text).toContain('Express');
    });
  });

  it('should handle performance and respond within acceptable time', async () => {
    const startTime = Date.now();
    const response = await request(app).get('/');
    const endTime = Date.now();

    expect(response.status).toBe(200);
    expect(endTime - startTime).toBeLessThan(500); // Проверка времени отклика, меньше 500 мс
  });

  it('should handle dynamic changes (like environment variables)', async () => {
    process.env.TITLE = 'New Title'; // Поменяли переменную окружения
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('<title>New Title</title>');
  });
});
