const request = require("supertest");
const app = require("../app");

describe("Categories API", () => {
  it("should get a list of categories", async () => {
    const response = await request(app).get("/categories");
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("name");
    }
  });
});