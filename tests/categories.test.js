const request = require("supertest");
const app = require("../app");
const pool = require("../db");

describe("Categories API", () => {
  let testCategory;

  beforeAll(async () => {
    // Очистка тестовых данных перед тестами
    await pool.query("DELETE FROM categories WHERE name = $1", ["Test Category"]);

    // Создание тестовой категории
    const result = await pool.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING *",
      ["Test Category"]
    );
    testCategory = result.rows[0];
  });

  it("should get a list of categories", async () => {
    const response = await request(app).get("/categories");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const category = response.body.find((cat) => cat.name === "Test Category");
    expect(category).toBeDefined();
    expect(category).toHaveProperty("id");
    expect(category).toHaveProperty("name", "Test Category");
  });

  it("should return an empty list if no categories exist", async () => {
    // Очистка всех категорий
    await pool.query("DELETE FROM categories");

    const response = await request(app).get("/categories");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);

    // Восстановление тестовой категории
    const result = await pool.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING *",
      ["Test Category"]
    );
    testCategory = result.rows[0];
  });

  it("should return 404 for an invalid route", async () => {
    const response = await request(app).get("/categories-invalid");
    expect(response.status).toBe(404);
  });

  afterAll(async () => {
    // Удаление тестовой категории после всех тестов
    await pool.query("DELETE FROM categories WHERE id = $1", [testCategory.id]);
  });
});
