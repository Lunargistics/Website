import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      user: {
        id: '1',
        email: body.email,
        username: body.username,
      },
      message: 'User registered successfully',
    });
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: body.email,
          username: 'testuser',
        },
        token: 'mock-jwt-token',
      });
    }
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.get('/api/missions', () => {
    return HttpResponse.json({
      missions: [
        {
          id: '1',
          name: 'Lunar Mission 1',
          status: 'planning',
          launchDate: '2025-12-01',
        },
        {
          id: '2',
          name: 'Asteroid Mining Mission',
          status: 'active',
          launchDate: '2025-06-15',
        },
      ],
    });
  }),

  http.get('/api/orekit', () => {
    return HttpResponse.json({
      propagation: {
        position: { x: 6878137, y: 0, z: 0 },
        velocity: { x: 0, y: 7668.63, z: 0 },
      },
    });
  }),

  http.get('/api/equipment', () => {
    return HttpResponse.json({
      equipment: [
        {
          id: '1',
          name: 'Solar Panel Array',
          type: 'power',
          status: 'operational',
        },
        {
          id: '2',
          name: 'Communication Antenna',
          type: 'communication',
          status: 'maintenance',
        },
      ],
    });
  }),
];