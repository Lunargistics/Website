import { HttpResponse, http } from "msw";

export const handlers = [
  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      user: {
        id: "1",
        email: body?.email || "",
        username: body?.username || "",
      },
      message: "User registered successfully",
    });
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as any;
    if (body?.email === "test@example.com" && body?.password === "password123") {
      return HttpResponse.json({
        user: {
          id: "1",
          email: body?.email || "",
          username: "testuser",
        },
        token: "mock-jwt-token",
      });
    }
    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  http.get("/api/missions", () => {
    return HttpResponse.json({
      missions: [
        {
          id: "1",
          name: "Lunar Mission 1",
          status: "planning",
          launchDate: "2025-12-01",
        },
        {
          id: "2",
          name: "Asteroid Mining Mission",
          status: "active",
          launchDate: "2025-06-15",
        },
      ],
    });
  }),

  http.post("/api/orekit", async ({ request }) => {
    const body = await request.json();
    if (body && typeof body === "object" && body.action === "parseTLE") {
      return HttpResponse.json({
        orbitalElements: {
          semiMajorAxis: 6800,
          eccentricity: 0.001,
          inclination: 51.6,
          raan: 0,
          argumentOfPerigee: 0,
          trueAnomaly: 0,
          period: 92,
          apogee: 420,
          perigee: 410,
        },
      });
    }
    if (body && typeof body === "object" && body.action === "propagate") {
      return HttpResponse.json({
        propagation: {
          position: { x: 6800, y: 0, z: 0 },
          velocity: { x: 0, y: 7.6, z: 0 },
          latitude: 0,
          longitude: 0,
          altitude: 420,
          timestamp: new Date().toISOString(),
        },
      });
    }
    return HttpResponse.json({ ok: true });
  }),

  http.get("/api/equipment", () => {
    return HttpResponse.json({
      equipment: [
        {
          id: "1",
          name: "Solar Panel Array",
          type: "power",
          status: "operational",
        },
        {
          id: "2",
          name: "Communication Antenna",
          type: "communication",
          status: "maintenance",
        },
      ],
    });
  }),
];
