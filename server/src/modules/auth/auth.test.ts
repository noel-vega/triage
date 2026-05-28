// src/app.test.ts
import { describe, it, expect } from 'vitest'; // or 'jest'
import request from 'supertest';
import { app } from '../../app.js';

describe('POST /auth/signin', () => {
  it('echoes a valid body', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .send({ email: 'a@b.com', password: 'hunter2' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: 'a@b.com', password: 'hunter2' });
  });

  it('400s on invalid body', async () => {
    const res = await request(app)
      .post('/auth/signin')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});
