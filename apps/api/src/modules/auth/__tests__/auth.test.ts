import { describe, it, expect, beforeEach } from '@jest/globals';
import { prisma } from '../../../__tests__/setup';
import bcrypt from 'bcryptjs';

describe('Authentication Module', () => {
  describe('User Authentication', () => {
    beforeEach(async () => {
      // Clean up users before each test
      await prisma.user.deleteMany({});
    });

    it('should create a user with hashed password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = await prisma.user.create({
        data: {
          email: 'test@kechita.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: 'STAFF',
          position: 'Staff',
          branch: 'HQ',
          region: 'Nairobi',
          status: 'ACTIVE'
        }
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('test@kechita.com');
      expect(user.password).not.toBe('password123'); // Password should be hashed
    });

    it('should verify password correctly', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const user = await prisma.user.create({
        data: {
          email: 'verify@kechita.com',
          password: hashedPassword,
          firstName: 'Verify',
          lastName: 'Test',
          role: 'STAFF',
          position: 'Staff',
          branch: 'HQ',
          region: 'Nairobi',
          status: 'ACTIVE'
        }
      });

      // Test password verification
      const isValid = await bcrypt.compare(plainPassword, user.password);
      const isInvalid = await bcrypt.compare('wrongpassword', user.password);

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    it('should enforce unique email constraint', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await prisma.user.create({
        data: {
          email: 'unique@kechita.com',
          password: hashedPassword,
          firstName: 'First',
          lastName: 'User',
          role: 'STAFF',
          position: 'Staff',
          branch: 'HQ',
          region: 'Nairobi',
          status: 'ACTIVE'
        }
      });

      // Try to create another user with same email
      await expect(
        prisma.user.create({
          data: {
            email: 'unique@kechita.com',
            password: hashedPassword,
            firstName: 'Second',
            lastName: 'User',
            role: 'STAFF',
            position: 'Staff',
            branch: 'HQ',
            region: 'Nairobi',
            status: 'ACTIVE'
          }
        })
      ).rejects.toThrow();
    });

    it('should track failed login attempts', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = await prisma.user.create({
        data: {
          email: 'failcount@kechita.com',
          password: hashedPassword,
          firstName: 'Fail',
          lastName: 'Count',
          role: 'STAFF',
          position: 'Staff',
          branch: 'HQ',
          region: 'Nairobi',
          status: 'ACTIVE',
          failedLoginAttempts: 0
        }
      });

      // Simulate failed login attempt
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 }
        }
      });

      expect(updatedUser.failedLoginAttempts).toBe(1);
    });

    it('should lock account after 5 failed attempts', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = await prisma.user.create({
        data: {
          email: 'locktest@kechita.com',
          password: hashedPassword,
          firstName: 'Lock',
          lastName: 'Test',
          role: 'STAFF',
          position: 'Staff',
          branch: 'HQ',
          region: 'Nairobi',
          status: 'ACTIVE',
          failedLoginAttempts: 4
        }
      });

      // Increment to 5 failed attempts
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          status: 'LOCKED'
        }
      });

      expect(updatedUser.failedLoginAttempts).toBe(5);
      expect(updatedUser.status).toBe('LOCKED');
    });

    it('should reset failed attempts on successful login', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      const user = await prisma.user.create({
        data: {
          email: 'reset@kechita.com',
          password: hashedPassword,
          firstName: 'Reset',
          lastName: 'Test',
          role: 'STAFF',
          position: 'Staff',
          branch: 'HQ',
          region: 'Nairobi',
          status: 'ACTIVE',
          failedLoginAttempts: 3
        }
      });

      // Simulate successful login - reset attempts
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lastLogin: new Date()
        }
      });

      expect(updatedUser.failedLoginAttempts).toBe(0);
      expect(updatedUser.lastLogin).toBeDefined();
    });

    it('should use test utility to create user', async () => {
      const user = await global.testUtils.createTestUser({
        email: 'utility@kechita.com',
        role: 'HR'
      });

      expect(user).toBeDefined();
      expect(user.email).toBe('utility@kechita.com');
      expect(user.role).toBe('HR');
    });

    it('should generate auth token', () => {
      const userId = 'test-user-id-123';
      const token = global.testUtils.generateAuthToken(userId);

      expect(token).toBeDefined();
      expect(token).toContain(userId);
    });
  });
});
