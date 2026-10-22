import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();
const suffix = Date.now().toString(36);
const customerEmail = `test-${suffix}@jalanyuk.id`;
let customerToken = '';
let adminToken = '';
let scheduleId = '';
let seatA = '';
let seatB = '';
let schedulePrice = 0;

beforeAll(async () => {
  await request(app).post('/api/auth/register').send({
    email: customerEmail,
    password: 'password123',
    fullName: 'Penguji Otomatis',
    phone: '081234567890',
  });
  const login = await request(app).post('/api/auth/login').send({ email: customerEmail, password: 'password123' });
  customerToken = login.body.data.token;

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: process.env.ADMIN_EMAIL || 'admin@jalanyuk.id', password: process.env.ADMIN_PASSWORD || 'admin123' });
  adminToken = adminLogin.body.data.token;

  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
  const search = await request(app).get(`/api/search/bus?origin=Jakarta&destination=Bandung&date=${tomorrow}`);
  const first = search.body.data.schedules[0];
  scheduleId = first.id;
  schedulePrice = first.price;
  const detail = await request(app).get(`/api/bus-schedules/${scheduleId}`);
  const avail = detail.body.data.seats.filter((s: { status: string }) => s.status === 'AVAILABLE');
  seatA = avail[0].seatNumber;
  seatB = avail[1].seatNumber;
}, 60000);

describe('Auth & RBAC', () => {
  it('register selalu menghasilkan role CUSTOMER', async () => {
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${customerToken}`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.role).toBe('CUSTOMER');
  });

  it('endpoint Algorithm Lab: tanpa token → 401', async () => {
    const res = await request(app).get('/api/algorithm-lab/dataset');
    expect(res.status).toBe(401);
  });

  it('endpoint Algorithm Lab: customer → 403', async () => {
    const res = await request(app).get('/api/algorithm-lab/dataset').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('endpoint Algorithm Lab: admin → 200', async () => {
    const res = await request(app).get('/api/algorithm-lab/dataset').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('endpoint admin: customer → 403', async () => {
    const res = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it('login dengan password salah → 401', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: customerEmail, password: 'salahpassword' });
    expect(res.status).toBe(401);
  });
});

describe('Booking flow & integritas harga', () => {
  let bookingId = '';

  const payload = () => ({
    transportType: 'BUS',
    scheduleId,
    seatNumbers: [seatA, seatB],
    passengers: [
      { fullName: 'Penumpang Uji Satu', phone: '081234567890', email: 'satu@uji.id' },
      { fullName: 'Penumpang Uji Dua', phone: '081234567891', email: 'dua@uji.id' },
    ],
    paymentMethod: 'SIMULATION_QRIS',
    idempotencyKey: `test-${suffix}`,
  });

  it('membuat booking dengan total dihitung ulang server', async () => {
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${customerToken}`).send(payload());
    expect(res.status).toBe(201);
    const b = res.body.data;
    bookingId = b.id;
    expect(b.status).toBe('PENDING');
    expect(b.subtotal).toBe(schedulePrice * 2);
    expect(b.serviceFee).toBe(5000 * 2);
    expect(b.total).toBe(b.subtotal + b.serviceFee - b.discount);
    expect(b.code).toMatch(/^JY-/);
  }, 30000);

  it('idempotency: request sama tidak membuat booking ganda', async () => {
    const res = await request(app).post('/api/bookings').set('Authorization', `Bearer ${customerToken}`).send(payload());
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(bookingId);
  }, 30000);

  it('double booking kursi yang sama → 409', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ ...payload(), idempotencyKey: `test-lain-${suffix}` });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SEAT_TAKEN');
  }, 30000);

  it('pembayaran simulasi SUCCESS → booking CONFIRMED & payment PAID', async () => {
    const res = await request(app)
      .post('/api/payments/simulate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ bookingId, scenario: 'SUCCESS' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.payment.status).toBe('PAID');
  }, 30000);

  it('customer lain tidak bisa melihat booking ini', async () => {
    const other = await request(app).post('/api/auth/register').send({
      email: `lain-${suffix}@jalanyuk.id`,
      password: 'password123',
      fullName: 'Pengguna Lain',
      phone: '081234567892',
    });
    const otherToken = other.body.data.token;
    const res = await request(app).get(`/api/bookings/${bookingId}`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  }, 30000);
});
