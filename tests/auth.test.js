const request = require("supertest");
const app = require("../app");

describe("Auth API", () => {
  let registeredUser;

  it("should register a new user", async () => {
    const response = await request(app)
      .post("/auth/signup")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123"
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("email", "test@example.com");
    registeredUser = response.body;
  });

  it("should not allow duplicate email registration", async () => {
    const response = await request(app)
      .post("/auth/signup")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "password123"
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should not register a user with invalid email", async () => {
    const response = await request(app)
      .post("/auth/signup")
      .send({
        name: "Invalid Email",
        email: "invalid-email",
        password: "password123"
      });
    
    expect(response.status).toBe(400);
  });

  it("should not register a user with short password", async () => {
    const response = await request(app)
      .post("/auth/signup")
      .send({
        name: "Short Password",
        email: "short@example.com",
        password: "123"
      });
    
    expect(response.status).toBe(400);
  });

  it("should login an existing user", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "password123"
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  it("should not login with incorrect password", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "test@example.com",
        password: "wrongpassword"
      });
    
    expect(response.status).toBe(401);
  });

  it("should not login with unregistered email", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "nonexistent@example.com",
        password: "password123"
      });
    
    expect(response.status).toBe(401);
  });
});
