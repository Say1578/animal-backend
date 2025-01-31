const request = require("supertest");
const app = require("../app");
const pool = require("../db"); // Подключаем базу данных

describe("Auth API", () => {
  let registeredUser;
  let testEmail = "test@example.com";
  let testPassword = "password123";

  beforeAll(async () => {
    // Очистка тестового пользователя перед тестами
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  it("should register a new user", async () => {
    const response = await request(app)
      .post("/auth/signup")
      .send({
        name: "Test User",
        email: testEmail,
        password: testPassword,
      });

    expect(response.status).toBe(200); // В твоем коде signup возвращает 200, а не 201
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("email", testEmail);
    registeredUser = response.body;
  });

  it("should not allow duplicate email registration", async () => {
    const response = await request(app)
      .post("/auth/signup")
      .send({
        name: "Test User",
        email: testEmail,
        password: testPassword,
      });

    expect(response.status).toBe(500); // Ошибка сервера (можно улучшить обработку)
  });

  it("should not register a user with invalid email", async () => {
    const response = await request(app)
      .post("/auth/signup")
      .send({
        name: "Invalid Email",
        email: "invalid-email",
        password: testPassword,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Все поля обязательны");
  });

  it("should not register a user with short password", async () => {
    const response = await request(app)
      .post("/auth/signup")
      .send({
        name: "Short Password",
        email: "short@example.com",
        password: "123",
      });

    expect(response.status).toBe(400);
  });

  it("should not register a user with a short name", async () => {
    const response = await request(app)
      .post("/auth/signup")
      .send({
        name: "A",
        email: "shortname@example.com",
        password: testPassword,
      });

    expect(response.status).toBe(400);
  });

  it("should login an existing user", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("message", "Вход выполнен");
  });

  it("should not login with incorrect password", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: testEmail,
        password: "wrongpassword",
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Неверный email или пароль");
  });

  it("should not login with unregistered email", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: testPassword,
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message", "Неверный email или пароль");
  });

  afterAll(async () => {
    // Удаление тестового пользователя после всех тестов
    if (registeredUser) {
      await pool.query("DELETE FROM users WHERE id = $1", [registeredUser.id]);
    }
  });
});
