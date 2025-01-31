const request = require("supertest");
const app = require("../app");
const pool = require("../db");

describe("Pets API", () => {
  let testCategory;
  let testPets = [];

  beforeAll(async () => {
    // Удаляем тестовые данные, если они есть
    await pool.query("DELETE FROM pets WHERE name LIKE 'Test Pet%'");
    await pool.query("DELETE FROM categories WHERE name = $1", ["Test Category"]);

    // Создаем тестовую категорию
    const categoryResult = await pool.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING *",
      ["Test Category"]
    );
    testCategory = categoryResult.rows[0];

    // Создаём 3 тестовых питомца с разной ценой
    for (let i = 1; i <= 3; i++) {
      const petResult = await pool.query(
        "INSERT INTO pets (category_id, name, price, description) VALUES ($1, $2, $3, $4) RETURNING *",
        [testCategory.id, `Test Pet ${i}`, i * 50, `Description ${i}`]
      );
      testPets.push(petResult.rows[0]);
    }
  });

  it("should get a list of pets with pagination", async () => {
    const response = await request(app).get("/pets?limit=2&page=1");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("page", 1);
    expect(response.body).toHaveProperty("limit", 2);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
  });

  it("should return pets sorted by price (ascending)", async () => {
    const response = await request(app).get("/pets");

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(1);

    for (let i = 1; i < response.body.data.length; i++) {
      expect(response.body.data[i].price).toBeGreaterThanOrEqual(response.body.data[i - 1].price);
    }
  });

  it("should filter pets by price range", async () => {
    const response = await request(app).get("/pets?min_price=50&max_price=100");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);

    response.body.data.forEach((pet) => {
      expect(pet.price).toBeGreaterThanOrEqual(50);
      expect(pet.price).toBeLessThanOrEqual(100);
    });
  });

  it("should filter pets by category", async () => {
    const response = await request(app).get(`/pets?category_id=${testCategory.id}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);

    response.body.data.forEach((pet) => {
      expect(pet.category_id).toBe(testCategory.id);
    });
  });

  it("should return an empty list if no pets match filters", async () => {
    const response = await request(app).get("/pets?min_price=10000&max_price=20000");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toEqual([]);
  });

  it("should get a single pet by ID", async () => {
    const response = await request(app).get(`/pets/${testPets[0].id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id", testPets[0].id);
    expect(response.body).toHaveProperty("name", testPets[0].name);
    expect(response.body).toHaveProperty("price", testPets[0].price);
  });

  it("should return 400 for invalid pet ID", async () => {
    const response = await request(app).get("/pets/invalid-id");
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message", "Некорректный ID");
  });

  it("should return 404 if pet does not exist", async () => {
    const response = await request(app).get("/pets/999999");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message", "Питомец не найден");
  });

  afterAll(async () => {
    // Удаление тестовых данных после тестов
    for (let pet of testPets) {
      await pool.query("DELETE FROM pets WHERE id = $1", [pet.id]);
    }
    await pool.query("DELETE FROM categories WHERE id = $1", [testCategory.id]);
  });
});
