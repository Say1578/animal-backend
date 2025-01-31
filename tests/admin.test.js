const request = require("supertest");
const app = require("../app");
const pool = require("../db"); // Подключение к базе данных

let authToken;
let adminId;

beforeAll(async () => {
  // Удаляем тестового админа перед запуском тестов (если он есть)
  await pool.query("DELETE FROM users WHERE email = $1", ["testadmin@example.com"]);

  // Создаем тестового пользователя (админа) и получаем токен
  const signupRes = await request(app)
    .post("/auth/signup")
    .send({ name: "Test Admin", email: "testadmin@example.com", password: "password123" });

  adminId = signupRes.body.id; // Сохраняем ID созданного админа

  const loginRes = await request(app)
    .post("/auth/login")
    .send({ email: "testadmin@example.com", password: "password123" });

  authToken = loginRes.body.token;
});

describe("Admin Pets API", () => {
  let petId;

  it("should create a new pet", async () => {
    const res = await request(app)
      .post("/admin/pets")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ category_id: 1, name: "Fluffy", price: 50, description: "Cute cat" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Fluffy");
    petId = res.body.id;
  });

  it("should get all pets for authenticated user", async () => {
    const res = await request(app)
      .get("/admin/pets")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  it("should get a single pet by ID", async () => {
    const res = await request(app)
      .get(`/admin/pets/${petId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", petId);
  });

  it("should update a pet", async () => {
    const res = await request(app)
      .patch(`/admin/pets/${petId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Updated Fluffy", price: 60 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Fluffy");
    expect(res.body.price).toBe(60);
  });

  it("should delete a pet", async () => {
    const res = await request(app)
      .delete(`/admin/pets/${petId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "Питомец успешно удален");

    // Проверяем, что питомец действительно удалён
    const checkRes = await request(app)
      .get(`/admin/pets/${petId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(checkRes.status).toBe(404);
  });
});

afterAll(async () => {
  // Удаляем тестового админа после завершения тестов
  if (adminId) {
    await pool.query("DELETE FROM users WHERE id = $1", [adminId]);
  }
});
