import { PrismaClient } from '@prisma/client';

// Create test database client  
const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_TEST_URL || process.env.DATABASE_URL
      }
    }
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Setup before all tests
beforeAll(async () => {
  // Connect to database
  await prisma.$connect();
  console.log('Test database connected');
});

// Cleanup after each test
afterEach(async () => {
  // Clean up test data
  const tables = [
    'UserSession',
    'AuditLog',
    'Announcement',
    'StaffDocument',
    'Claim',
    'LeaveApplication',
    'Loan',
    'User'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch (error) {
      console.warn(`Could not truncate ${table}:`, error);
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
  console.log('Test database disconnected');
});

// Global test utilities
global.testUtils = {
  createTestUser: async (data: any) => {
    return prisma.user.create({
      data: {
        email: data.email || 'test@example.com',
        password: data.password || 'hashedPassword',
        firstName: data.firstName || 'Test',
        lastName: data.lastName || 'User',
        role: data.role || 'STAFF',
        position: data.position || 'Staff',
        branch: data.branch || 'HQ',
        region: data.region || 'Nairobi',
        status: data.status || 'ACTIVE'
      }
    });
  },

  generateAuthToken: (userId: string) => {
    // Mock JWT token generation for tests
    return `test-token-${userId}`;
  }
};

// Extend global namespace
declare global {
  var testUtils: {
    createTestUser: (data: any) => Promise<any>;
    generateAuthToken: (userId: string) => string;
  };
}
