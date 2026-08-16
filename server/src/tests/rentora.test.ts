// Force node env to test before importing server modules
process.env.NODE_ENV = 'test';

import request from 'supertest';
import mongoose from 'mongoose';
import { app, server } from '../server';
import { User } from '../models/user.model';
import { Category } from '../models/category.model';
import { Listing } from '../models/listing.model';
import { RentalRequest } from '../models/rentalRequest.model';
import { Review } from '../models/review.model';
import { OTP } from '../models/otp.model';
import { config } from '../config/config';

// Set timeout for remote database connections during integration tests
jest.setTimeout(30000);

describe('Rentora Integration Tests', () => {
  let adminToken: string = '';
  let studentAToken: string = '';
  let studentBToken: string = '';
  let studentAId: string = '';
  let studentBId: string = '';
  let categoryId: string = '';
  let listingId: string = '';
  let rentalRequestId: string = '';

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      // Isolate tests from development database by directing connection to rentora_test database
      let testUri = config.MONGODB_URI;
      if (testUri.includes('.mongodb.net/?')) {
        testUri = testUri.replace('.mongodb.net/?', '.mongodb.net/rentora_test?');
      } else if (testUri.includes('.mongodb.net/')) {
        const urlParts = testUri.split('.mongodb.net/');
        const rest = urlParts[1];
        if (rest.includes('?')) {
          const dbName = rest.split('?')[0];
          const query = rest.split('?')[1];
          testUri = `${urlParts[0]}.mongodb.net/${dbName || 'rentora'}_test?${query}`;
        } else {
          testUri = `${urlParts[0]}.mongodb.net/${rest}_test`;
        }
      } else {
        testUri = testUri.includes('localhost') || testUri.includes('127.0.0.1')
          ? testUri.split('?')[0].replace(/\/$/, '') + '/rentora_test'
          : testUri;
      }

      await mongoose.connect(testUri, {
        serverSelectionTimeoutMS: 5000,
      });
    }

    // Clean test database
    await User.deleteMany({});
    await Category.deleteMany({});
    await Listing.deleteMany({});
    await RentalRequest.deleteMany({});
    await Review.deleteMany({});

    // Seed a category for testing listings
    const testCategory = await Category.create({
      name: 'Test Materials',
      slug: 'test-materials',
      description: 'Test category',
      isActive: true,
    });
    categoryId = testCategory._id.toString();

    // Seed a dummy admin user so subsequent registered test users are STUDENTs
    await User.create({
      fullName: 'System Administrator',
      email: 'admin@niet.co.in',
      passwordHash: 'dummy_hash_123',
      role: 'ADMIN',
      course: 'Management',
      branch: 'Admin',
      year: 1,
      collegeName: 'NIET Plot 19',
      isVerified: true,
    });
  });

  afterAll(async () => {
    try {
      if (mongoose.connection.readyState === 1) {
        await User.deleteMany({});
        await Category.deleteMany({});
        await Listing.deleteMany({});
        await RentalRequest.deleteMany({});
        await Review.deleteMany({});
        await mongoose.connection.close();
      }
    } catch {}
    server.close();
  });

  describe('1. Authentication & Authorization Tests', () => {
    it('should register Student A successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Student A',
          email: 'studenta@niet.co.in',
          password: 'Password123',
          course: 'B.Tech',
          branch: 'CSE',
          year: 3,
          collegeName: 'NIET Plot 19',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const otpDoc = await OTP.findOne({ email: 'studenta@niet.co.in' });
      expect(otpDoc).toBeDefined();

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: 'studenta@niet.co.in',
          otp: otpDoc?.otp,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.accessToken).toBeDefined();
      studentAToken = verifyRes.body.accessToken;
      studentAId = verifyRes.body.user.id;
    });

    it('should register Student B successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Student B',
          email: 'studentb@niet.co.in',
          password: 'Password123',
          course: 'B.Tech',
          branch: 'ECE',
          year: 2,
          collegeName: 'NIET Plot 19',
        });

      expect(res.status).toBe(201);

      const otpDoc = await OTP.findOne({ email: 'studentb@niet.co.in' });
      expect(otpDoc).toBeDefined();

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .send({
          email: 'studentb@niet.co.in',
          otp: otpDoc?.otp,
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.accessToken).toBeDefined();
      studentBToken = verifyRes.body.accessToken;
      studentBId = verifyRes.body.user.id;
    });

    it('should block registration if domain domain is restricted (e.g. gmail.com if ALLOWED_EMAIL_DOMAIN is configured)', async () => {
      // Temporarily set restriction for verification
      config.ALLOWED_EMAIL_DOMAIN = 'niet.co.in';

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Spam User',
          email: 'spam@gmail.com',
          password: 'Password123',
          course: 'B.Tech',
          branch: 'CSE',
          year: 1,
          collegeName: 'NIET Plot 19',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('DOMAIN_RESTRICTED');

      // Revert restriction setup
      config.ALLOWED_EMAIL_DOMAIN = '';
    });

    it('should login Student A successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'studenta@niet.co.in',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should reject login for Student A with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'studenta@niet.co.in',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject access to protected routes without a token', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
    });

    it('should block students from accessing admin dashboard routes', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('2. Listing Management Tests', () => {
    it('should allow Student A to create a listing', async () => {
      const res = await request(app)
        .post('/api/listings')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          title: 'Mechanical Lab Kit',
          description: 'A complete mechanical tool kit with wrench and calipers.',
          category: categoryId,
          condition: 'LIKE_NEW',
          rentalPrice: 15,
          priceUnit: 'DAY',
          securityDeposit: 300,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.listing.title).toBe('Mechanical Lab Kit');
      listingId = res.body.listing._id;
    });

    it('should allow searching listings by title keywords', async () => {
      const res = await request(app).get('/api/listings?search=Mechanical');
      expect(res.status).toBe(200);
      expect(res.body.listings.length).toBeGreaterThan(0);
      expect(res.body.listings[0].title).toContain('Mechanical');
    });

    it('should reject updating Student A\'s listing by Student B (Unauthorized)', async () => {
      const res = await request(app)
        .patch(`/api/listings/${listingId}`)
        .set('Authorization', `Bearer ${studentBToken}`)
        .send({
          rentalPrice: 5,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow updating Student A\'s listing by Student A (Owner)', async () => {
      const res = await request(app)
        .patch(`/api/listings/${listingId}`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          rentalPrice: 18,
        });

      expect(res.status).toBe(200);
      expect(res.body.listing.rentalPrice).toBe(18);
    });
  });

  describe('3. Rental Request & Lifecycle Tests', () => {
    it('should block Student A from renting their own listing', async () => {
      const res = await request(app)
        .post('/api/rental-requests')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          listing: listingId,
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Can I rent my own item?',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('SELF_RENTAL_PROHIBITED');
    });

    it('should allow Student B to request Student A\'s listing', async () => {
      const res = await request(app)
        .post('/api/rental-requests')
        .set('Authorization', `Bearer ${studentBToken}`)
        .send({
          listing: listingId,
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          message: 'Needed for my engineering physics experiment.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.request.status).toBe('PENDING');
      rentalRequestId = res.body.request._id;
    });

    it('should allow Student A (Owner) to accept the request', async () => {
      const res = await request(app)
        .patch(`/api/rental-requests/${rentalRequestId}/accept`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe('ACCEPTED');
      expect(res.body.conversationId).toBeDefined(); // Chat environment created
    });

    it('should reject completing rental before it becomes ACTIVE (Invalid lifecycle transition)', async () => {
      const res = await request(app)
        .patch(`/api/rental-requests/${rentalRequestId}/complete`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_TRANSITION');
    });

    it('should allow transitioning ACCEPTED -> ACTIVE (Physical Handover confirmed)', async () => {
      const reqDoc = await RentalRequest.findById(rentalRequestId);
      const otp = reqDoc?.handoverOTP;

      const res = await request(app)
        .patch(`/api/rental-requests/${rentalRequestId}/handover`)
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({ otp });

      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe('ACTIVE');
    });

    it('should allow transitioning ACTIVE -> COMPLETED (Item returned)', async () => {
      const res = await request(app)
        .patch(`/api/rental-requests/${rentalRequestId}/complete`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.request.status).toBe('COMPLETED');
    });
  });

  describe('4. Review & Rating Verification Tests', () => {
    it('should block reviews if rental request status is not COMPLETED', async () => {
      // Create a new rental request that is PENDING
      const pendingReq = await RentalRequest.create({
        listing: new mongoose.Types.ObjectId(listingId),
        owner: new mongoose.Types.ObjectId(studentAId),
        renter: new mongoose.Types.ObjectId(studentBId),
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'PENDING',
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${studentBToken}`)
        .send({
          rentalRequestId: pendingReq._id.toString(),
          rating: 5,
          comment: 'Perfect lender!',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('RENTAL_NOT_COMPLETED');
    });

    it('should allow Student B to rate Student A for completed rental', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${studentBToken}`)
        .send({
          rentalRequestId,
          rating: 5,
          comment: 'Outstanding tools! Handover was seamless.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.review.rating).toBe(5);

      // Verify that Student A's User rating average has updated
      const studentA = await User.findById(studentAId);
      expect(studentA?.ratingAverage).toBe(5);
      expect(studentA?.ratingCount).toBe(1);
    });

    it('should block duplicate reviews from Student B on the same rental request', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${studentBToken}`)
        .send({
          rentalRequestId,
          rating: 4,
          comment: 'Trying to review again.',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('DUPLICATE_REVIEW');
    });
  });
});
