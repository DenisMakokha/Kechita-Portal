# 🧪 Testing Strategy - Kechita Capital Staff Portal

## Comprehensive Testing Plan

---

## 📊 Testing Overview

### Testing Pyramid
```
              E2E Tests (10%)
         Integration Tests (30%)
    Unit Tests (60%)
```

### Coverage Goals
- **Backend**: 80%+ code coverage
- **Frontend**: 70%+ code coverage
- **Critical Paths**: 100% coverage
- **E2E Scenarios**: Key workflows

---

## 1️⃣ UNIT TESTING

### Backend Unit Tests (Jest)

#### Setup
```bash
cd apps/api
pnpm add -D jest @types/jest ts-jest
pnpm add -D @testing-library/react-hooks
```

#### Configuration (`apps/api/jest.config.js`)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### Test Examples

**Authentication Tests** (`apps/api/src/modules/auth/__tests__/auth.test.ts`)
```typescript
import { login, register, resetPassword } from '../routes';
import { prisma } from '@kechita/db';

describe('Authentication Module', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('Login', () => {
    it('should login with valid credentials', async () => {
      // Test implementation
    });

    it('should reject invalid credentials', async () => {
      // Test implementation
    });

    it('should lock account after 5 failed attempts', async () => {
      // Test implementation
    });
  });

  describe('Password Reset', () => {
    it('should send reset email', async () => {
      // Test implementation
    });

    it('should reset password with valid token', async () => {
      // Test implementation
    });
  });
});
```

**Leave Management Tests** (`apps/api/src/modules/leave/__tests__/leave.test.ts`)
```typescript
describe('Leave Management', () => {
  it('should create leave application', async () => {
    // Test implementation
  });

  it('should calculate days correctly', async () => {
    // Test implementation
  });

  it('should check balance before approval', async () => {
    // Test implementation
  });

  it('should send notification on approval', async () => {
    // Test implementation
  });
});
```

### Frontend Unit Tests (Vitest + React Testing Library)

#### Setup
```bash
cd apps/web
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event
```

#### Configuration (`apps/web/vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
});
```

#### Test Examples

**Login Component** (`apps/web/src/pages/__tests__/Login.test.tsx`)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Login from '../Login';

describe('Login Component', () => {
  it('should render login form', () => {
    render(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('should submit with valid credentials', async () => {
    render(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@kechita.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    // Assert redirect
  });

  it('should show error for invalid credentials', async () => {
    // Test implementation
  });
});
```

**Dashboard Component** (`apps/web/src/pages/__tests__/Dashboard.test.tsx`)
```typescript
describe('Dashboard Component', () => {
  it('should display user statistics', async () => {
    // Test implementation
  });

  it('should show pending items count', async () => {
    // Test implementation
  });

  it('should navigate to applications on click', async () => {
    // Test implementation
  });
});
```

---

## 2️⃣ INTEGRATION TESTING

### API Integration Tests

#### Setup
```bash
pnpm add -D supertest
```

#### Test Examples

**Leave Workflow** (`apps/api/src/__tests__/integration/leave-workflow.test.ts`)
```typescript
import request from 'supertest';
import app from '../../index';

describe('Leave Application Workflow', () => {
  let authToken: string;
  let applicationId: string;

  beforeAll(async () => {
    // Setup: Login and get token
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'staff@kechita.com', password: 'password123' });
    authToken = response.body.token;
  });

  it('should complete full leave workflow', async () => {
    // 1. Submit application
    const submitRes = await request(app)
      .post('/leave/applications')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        leaveTypeId: '...',
        startDate: '2025-10-10',
        endDate: '2025-10-15',
        reason: 'Vacation'
      });
    expect(submitRes.status).toBe(201);
    applicationId = submitRes.body.id;

    // 2. Manager approves
    const approveRes = await request(app)
      .post(`/leave/applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ comments: 'Approved' });
    expect(approveRes.status).toBe(200);

    // 3. Verify balance deduction
    const balanceRes = await request(app)
      .get('/leave/balance/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(balanceRes.body.used).toBeGreaterThan(0);
  });
});
```

### Database Integration Tests

```typescript
describe('Database Operations', () => {
  it('should handle concurrent leave applications', async () => {
    // Test race conditions
  });

  it('should maintain referential integrity', async () => {
    // Test cascading deletes
  });

  it('should rollback on transaction failure', async () => {
    // Test transaction handling
  });
});
```

---

## 3️⃣ END-TO-END TESTING

### Playwright/Cypress Setup

#### Installation
```bash
pnpm add -D @playwright/test
# or
pnpm add -D cypress
```

#### Configuration (`playwright.config.ts`)
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter @kechita/web dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Test Examples

**User Journey: Leave Application** (`e2e/leave-application.spec.ts`)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Leave Application User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'staff@kechita.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should apply for leave successfully', async ({ page }) => {
    // Navigate to leave application
    await page.click('text=Request Leave');
    await expect(page).toHaveURL('/leave/apply');

    // Fill form
    await page.selectOption('[name="leaveType"]', 'Annual Leave');
    await page.fill('[name="startDate"]', '2025-10-10');
    await page.fill('[name="endDate"]', '2025-10-15');
    await page.fill('[name="reason"]', 'Family vacation');

    // Submit
    await page.click('button:has-text("Submit Application")');

    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page).toHaveURL('/leave');
  });
});
```

**Admin Workflow** (`e2e/admin-workflow.spec.ts`)
```typescript
test.describe('Admin Workflows', () => {
  test('should approve leave application', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'hr@kechita.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to approvals
    await page.click('text=Pending Approvals');

    // Approve first item
    await page.click('button:has-text("Approve"):first');
    await page.fill('[name="comments"]', 'Approved by HR');
    await page.click('button:has-text("Confirm")');

    // Verify approval
    await expect(page.locator('.success-toast')).toBeVisible();
  });
});
```

---

## 4️⃣ PERFORMANCE TESTING

### Load Testing (k6)

#### Installation
```bash
brew install k6  # macOS
# or download from k6.io
```

#### Test Script (`load-tests/api-load.js`)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // <1% errors
  },
};

export default function () {
  // Login
  const loginRes = http.post('http://localhost:4000/auth/login', JSON.stringify({
    email: 'test@kechita.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  const token = loginRes.json('token');

  // Get dashboard
  const dashboardRes = http.get('http://localhost:4000/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  check(dashboardRes, {
    'dashboard loaded': (r) => r.status === 200,
  });

  sleep(1);
}
```

#### Run Tests
```bash
k6 run load-tests/api-load.js
```

---

## 5️⃣ SECURITY TESTING

### Automated Security Scans

#### OWASP ZAP
```bash
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:4000 \
  -r security-report.html
```

#### npm audit
```bash
pnpm audit
pnpm audit --fix
```

### Manual Security Tests

**Checklist**:
- [ ] SQL Injection tests
- [ ] XSS vulnerability tests
- [ ] CSRF protection tests
- [ ] Authentication bypass attempts
- [ ] Authorization checks
- [ ] Rate limiting tests
- [ ] File upload restrictions
- [ ] API input validation

---

## 6️⃣ MOBILE APP TESTING

### React Native Testing Library

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';

describe('LoginScreen', () => {
  it('should login with biometrics', async () => {
    const { getByText } = render(<LoginScreen />);
    const biometricButton = getByText('Login with Face ID');
    fireEvent.press(biometricButton);
    // Assert
  });
});
```

### Device Testing Matrix

| Device | OS | Priority |
|--------|----|---------| 
| iPhone 14 Pro | iOS 17 | High |
| iPhone 12 | iOS 16 | Medium |
| Samsung S23 | Android 13 | High |
| Pixel 6 | Android 12 | Medium |
| iPad Pro | iPadOS 17 | Low |

---

## 7️⃣ CI/CD INTEGRATION

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run linter
        run: pnpm lint
      
      - name: Run unit tests
        run: pnpm test
      
      - name: Run integration tests
        run: pnpm test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 8️⃣ TEST DATA MANAGEMENT

### Fixtures

**User Fixtures** (`apps/api/src/__tests__/fixtures/users.ts`)
```typescript
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Test123!',
    role: 'HR'
  },
  staff: {
    email: 'staff@test.com',
    password: 'Test123!',
    role: 'STAFF'
  }
};
```

### Database Seeds for Testing
```typescript
// test-seed.ts
export async function seedTestData() {
  await prisma.user.createMany({
    data: [...testUsers]
  });
  await prisma.leaveType.createMany({
    data: [...leaveTypes]
  });
  // More seeds...
}
```

---

## 9️⃣ MONITORING & REPORTING

### Test Reports

- **Unit Test Coverage**: Jest HTML Report
- **E2E Test Results**: Playwright HTML Report
- **Load Test Results**: k6 HTML Report
- **Security Scan**: OWASP ZAP Report

### Metrics to Track

- **Code Coverage**: >80% target
- **Test Pass Rate**: >95% target
- **Performance**: <500ms API response
- **Error Rate**: <1% in production
- **Security**: 0 critical vulnerabilities

---

## 🔟 TEST EXECUTION PLAN

### Development Phase
```bash
# Run unit tests (fast feedback)
pnpm test:unit

# Run on file changes
pnpm test:watch
```

### Pre-commit
```bash
# Lint + unit tests
pnpm pre-commit
```

### CI Pipeline
```bash
1. Lint
2. Unit tests
3. Integration tests
4. Build
5. E2E tests
6. Security scan
```

### Pre-release
```bash
1. Full test suite
2. Load testing
3. Security audit
4. Manual testing
5. UAT sign-off
```

---

## ✅ TESTING CHECKLIST

### Backend
- [ ] Unit tests for all modules
- [ ] Integration tests for workflows
- [ ] API endpoint tests
- [ ] Database tests
- [ ] Error handling tests

### Frontend
- [ ] Component unit tests
- [ ] Page tests
- [ ] Form validation tests
- [ ] Navigation tests
- [ ] E2E user journeys

### Mobile
- [ ] Screen component tests
- [ ] Navigation tests
- [ ] Biometric tests
- [ ] Camera tests
- [ ] Offline mode tests

### Performance
- [ ] Load tests
- [ ] Stress tests
- [ ] Database query optimization
- [ ] API response times
- [ ] Frontend bundle size

### Security
- [ ] Authentication tests
- [ ] Authorization tests
- [ ] Input validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection

---

## 📊 SUCCESS CRITERIA

### Coverage Targets
- Backend: 80%+
- Frontend: 70%+
- Critical paths: 100%

### Performance Targets
- API response: <500ms (p95)
- Page load: <3s
- Error rate: <1%

### Quality Targets
- 0 critical bugs
- 0 high severity security issues
- 95%+ test pass rate

---

**Status**: Testing Strategy Complete  
**Coverage**: Comprehensive test plan  
**Ready for**: Implementation & Execution
