const request = require("supertest");
const app = require("../app");
let authToken;

beforeAll(async () => {
  // Создаем тестового пользователя и получаем токен
  const signupRes = await request(app)
    .post("/auth/signup")
    .send({ name: "Test User", email: "testadmin@example.com", password: "password123" });

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
  });
});
