import { describe, test, expect, beforeAll, jest } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";

let app;

const makeCookie = (payload = { userId: "test-user-id" }) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return `authtoken=${token}`;
};

beforeAll(async () => {
  // Avoid touching real Upstash during tests.
  jest.unstable_mockModule("../src/middleware/ratelimiter.js", () => ({
    __esModule: true,
    default: (req, res, next) => next(),
    ratelimiterIp: (req, res, next) => next(),
  }));

  // Avoid DB lookups in authority middleware.
  // We simulate a user role via the `x-test-role` header (default: admin).
  jest.unstable_mockModule("../src/middleware/verifyAuthorityLevel.js", () => ({
    __esModule: true,
    getAuthRoleMiddleware: (allowedRoles) => (req, res, next) => {
      const role = req.header("x-test-role") || "admin";
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Forbidden, you don't have permission." });
      }
      req.reqUser = { role, clubId: null, refereeType: "main" };
      next();
    },
  }));

  // Mock controllers to avoid DB access and keep tests focused on routing + auth.
  jest.unstable_mockModule("../src/controllers/authController.js", () => ({
    __esModule: true,
    createUser: (req, res) => res.status(201).json({ success: true }),
    forgotPass: (req, res) => res.status(200).json({ success: true }),
    login: (req, res) => res.status(200).json({ success: true }),
    logout: (req, res) => res.status(200).json({ success: true }),
    resetPass: (req, res) => res.status(200).json({ success: true }),
    checkAuth: (req, res) => res.status(200).json({ success: true, userId: req.userId }),
    sendNotification: (req, res) => res.status(200).json({ success: true }),
    readNotification: (req, res) => res.status(200).json({ success: true }),
  }));

  jest.unstable_mockModule("../src/controllers/matchController.js", () => ({
    __esModule: true,
    createMatch: (req, res) => res.status(201).json({ success: true }),
    deleteMatch: (req, res) => res.status(200).json({ success: true }),
    getMatchById: (req, res) => res.status(200).json({ success: true, matchId: req.params.id }),
    getMatches: (req, res) => res.status(200).json({ success: true, matches: [] }),
    updateMatch: (req, res) => res.status(200).json({ success: true }),
  }));

  // Mock other route modules so importing the app doesn't pull in lots of controllers.
  // This keeps the test scope limited to the services we care about for Task 4.
  const passthroughRouter = () => ({
    __esModule: true,
    default: (req, res, next) => next(),
  });
  jest.unstable_mockModule("../src/routes/refereeRoutes.js", passthroughRouter);
  jest.unstable_mockModule("../src/routes/clubRoutes.js", passthroughRouter);
  jest.unstable_mockModule("../src/routes/teamRoutes.js", passthroughRouter);
  jest.unstable_mockModule("../src/routes/playerRoutes.js", passthroughRouter);
  jest.unstable_mockModule("../src/routes/arenaRoutes.js", passthroughRouter);
  jest.unstable_mockModule("../src/routes/seriesRoutes.js", passthroughRouter);
  jest.unstable_mockModule("../src/routes/adminCaseRoutes.js", passthroughRouter);

  const mod = await import("../src/app.js");
  app = mod.default;
});

describe("Backend API", () => {
  test("GET /health returns ok=true (happy path)", async () => {
    // Verifies the service is reachable.
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test("GET /api/auth/check-auth rejects missing auth cookie", async () => {
    // Verifies protected endpoints fail without authentication.
    const res = await request(app).get("/api/auth/check-auth");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("GET /api/auth/check-auth rejects invalid JWT cookie", async () => {
    // Verifies token validation fails correctly.
    const res = await request(app)
      .get("/api/auth/check-auth")
      .set("Cookie", ["authtoken=not-a-jwt"]);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("GET /api/auth/check-auth accepts a valid JWT cookie", async () => {
    // Verifies happy path auth when JWT is valid.
    const res = await request(app)
      .get("/api/auth/check-auth")
      .set("Cookie", [makeCookie({ userId: "u-123" })]);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, userId: "u-123" });
  });

  test("GET /api/match rejects missing auth cookie", async () => {
    // Verifies auth is enforced on match routes.
    const res = await request(app).get("/api/match");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("GET /api/match returns 200 for allowed role", async () => {
    // Verifies role middleware allows access for an allowed role.
    const res = await request(app)
      .get("/api/match")
      .set("Cookie", [makeCookie()])
      .set("x-test-role", "trainer");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, matches: [] });
  });

  test("GET /api/match returns 403 for forbidden role", async () => {
    // Verifies role middleware blocks access for non-allowed roles.
    const res = await request(app)
      .get("/api/match")
      .set("Cookie", [makeCookie()])
      .set("x-test-role", "guest");

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  test("GET /api/match/:id returns match payload when authorized", async () => {
    // Verifies parameterized routes work and controller is reached.
    const res = await request(app)
      .get("/api/match/abc123")
      .set("Cookie", [makeCookie()])
      .set("x-test-role", "referee");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, matchId: "abc123" });
  });

  test("POST /api/auth/login returns 200", async () => {
    // Verifies login endpoint is wired (ratelimiter mocked).
    const res = await request(app).post("/api/auth/login").send({ email: "x", password: "y" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true });
  });

  test("Unknown route returns 404", async () => {
    // Verifies non-existing routes are not accidentally handled.
    const res = await request(app).get("/does-not-exist");
    expect(res.status).toBe(404);
  });
});
