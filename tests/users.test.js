const request = require('supertest');
const app = require('../app');
const pool = require('../db');

describe("Users API", () => {
  let testUser;

  beforeAll(async () => {
    // Очищаем базу от тестового пользователя, если он уже есть
    await pool.query("DELETE FROM users WHERE email = $1", ["testuser@example.com"]);

    // Создаём тестового пользователя
    const userResult = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      ["Test User", "testuser@example.com", "hashedpassword"]
    );
    testUser = userResult.rows[0];
  });

  it("should get a user profile by ID", async () => {
    const response = await request(app).get(`/users/${testUser.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", testUser.id);
    expect(response.body).toHaveProperty("name", "Test User");
    expect(response.body).toHaveProperty("email", "testuser@example.com");
  });

  it("should return 400 for invalid user ID", async () => {
    const response = await request(app).get("/users/invalid-id");

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Некорректный ID");
  });

  it("should return 404 if user does not exist", async () => {
    const response = await request(app).get("/users/9999999");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Пользователь не найден");
  });

  afterAll(async () => {
    // Удаляем тестового пользователя после тестов
    await pool.query("DELETE FROM users WHERE id = $1", [testUser.id]);
  });
});
