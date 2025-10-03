# 🚀 Kechita Capital Staff Portal - Deployment Guide

## 📋 Prerequisites Checklist

Before deployment, ensure you have:
- [x] Node.js 18+ installed
- [x] pnpm installed
- [x] PostgreSQL database
- [x] Git installed
- [x] GitHub account (DenisMakokha / deniswanjala16@gmail.com)

---

## 🛑 STEP 1: Stop Running Servers (MANUAL)

**⚠️ IMPORTANT: You must manually stop the running servers first!**

### How to Stop Servers in VSCode:

1. Look at the **TERMINAL** panel at the bottom of VSCode
2. You should see 3 active terminals running:
   - `pnpm --filter @kechita/api dev` (Port 4000)
   - `pnpm --filter @kechita/api dev` (duplicate)
   - `pnpm --filter @kechita/web dev` (Port 5174)

3. **For each terminal:**
   - Click on the terminal to focus it
   - Press `Ctrl + C` to stop the process
   - OR click the 🗑️ (trash) icon on the right to kill the terminal

4. **Verify all stopped:**
   - No processes should be running
   - All terminal output should have stopped

---

## 🔧 STEP 2: Generate Prisma Client

After stopping the servers, run these commands:

```bash
# Navigate to database package
cd packages/db

# Generate Prisma Client
pnpm prisma generate

# Expected output:
# ✔ Generated Prisma Client to ./node_modules/@prisma/client
```

**If you see errors:**
- Make sure all terminals are stopped
- Try closing and reopening VSCode
- Run: `pnpm install` first

---

## 🧪 STEP 3: Run Test Suite

```bash
# Navigate to API directory
cd ../../apps/api

# Run all tests
pnpm test

# Expected output:
# PASS  src/modules/auth/__tests__/auth.test.ts
#   Authentication Module
#     User Authentication
#       ✓ should create a user with hashed password
#       ✓ should verify password correctly
#       ✓ should enforce unique email constraint
#       ✓ should track failed login attempts
#       ✓ should lock account after 5 failed attempts
#       ✓ should reset failed attempts on successful login
#       ✓ should use test utility to create user
#       ✓ should generate auth token
#
# Test Suites: 2 passed, 2 total
# Tests:       8 passed, 8 total
```

### Run Tests with Coverage

```bash
pnpm test:coverage

# This will generate:
# - Console coverage report
# - HTML report in apps/api/coverage/index.html
# - LCOV report for CI/CD
```

### View Coverage Report

```bash
# Open HTML coverage report in browser
start coverage/index.html    # Windows
open coverage/index.html     # macOS
xdg-open coverage/index.html # Linux
```

---

## 🐙 STEP 4: Initialize Git & Push to GitHub

### 4.1 Initialize Git Repository

```bash
# Go to project root
cd ../..

# Initialize git (if not already done)
git init

# Configure git user (if not configured globally)
git config user.name "Denis Makokha"
git config user.email "deniswanjala16@gmail.com"

# Add all files
git add .

# Create initial commit
git commit -m "feat: Complete Kechita Capital Staff Portal

- Backend: 10 modules, 140+ API endpoints
- Frontend: 30+ pages (Admin + Staff portal)
- Mobile: React Native app (iOS & Android)
- Database: 38 Prisma models
- Testing: Jest, 8 unit tests, CI/CD pipeline
- Documentation: Complete guides and API docs

Features:
- Authentication & Authorization (JWT + RBAC)
- Recruitment Management
- Leave Management
- Claims Processing
- Staff Loans (14th/15th)
- Petty Cash Management
- Performance KPIs
- Document Management
- Communication System
- Admin Panel with Audit Logs

Tech Stack:
- Backend: Node.js, Express, TypeScript, Prisma
- Frontend: React, TypeScript, Vite, TailwindCSS
- Mobile: React Native, Expo
- Database: PostgreSQL
- Testing: Jest, Supertest, Playwright
- CI/CD: GitHub Actions"
```

### 4.2 Create GitHub Repository

**Option A: Via GitHub Web Interface**

1. Go to: https://github.com/new
2. Fill in details:
   - **Owner**: DenisMakokha
   - **Repository name**: Kechita-Portal
   - **Description**: Enterprise HR Staff Portal for Kechita Capital - Full-stack application with Web and Mobile platforms
   - **Visibility**: 
     - Public (if you want to showcase it)
     - Private (for internal use)
   - **DO NOT** initialize with:
     - ❌ README (we have one)
     - ❌ .gitignore (we have one)
     - ❌ License (add later if needed)
3. Click "Create repository"

**Option B: Via GitHub CLI (if installed)**

```bash
gh repo create Kechita-Portal --public --source=. --remote=origin --description="Enterprise HR Staff Portal for Kechita Capital"
```

### 4.3 Push to GitHub

```bash
# Add GitHub remote
git remote add origin https://github.com/DenisMakokha/Kechita-Portal.git

# Verify remote
git remote -v

# Push to main branch
git branch -M main
git push -u origin main
```

**If you get authentication errors:**

```bash
# Use Personal Access Token (PAT)
# 1. Go to: https://github.com/settings/tokens
# 2. Click "Generate new token (classic)"
# 3. Select scopes: repo, workflow
# 4. Copy the token
# 5. Use it as password when pushing:

git push -u origin main
# Username: DenisMakokha
# Password: <paste your PAT here>
```

### 4.4 Verify GitHub Push

1. Go to: https://github.com/DenisMakokha/Kechita-Portal
2. You should see:
   - ✅ All project files
   - ✅ README.md displayed
   - ✅ CI/CD workflow in ".github/workflows"
   - ✅ First CI/CD run should start automatically

---

## 🔄 STEP 5: Configure GitHub Secrets (Optional)

For full CI/CD functionality, add these secrets:

1. Go to: https://github.com/DenisMakokha/Kechita-Portal/settings/secrets/actions
2. Click "New repository secret"
3. Add the following:

### Required Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `DATABASE_URL` | Production database URL | Your PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret | Generate: `openssl rand -base64 32` |

### Optional Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SNYK_TOKEN` | Security scanning | Sign up at snyk.io |
| `CODECOV_TOKEN` | Coverage reporting | Sign up at codecov.io |
| `VERCEL_TOKEN` | Frontend deployment | Get from vercel.com |
| `HEROKU_API_KEY` | Backend deployment | Get from heroku.com |

---

## 📊 STEP 6: Monitor CI/CD Pipeline

### View Workflow Run

1. Go to: https://github.com/DenisMakokha/Kechita-Portal/actions
2. Click on the first workflow run
3. Watch it execute:
   - ✅ Install dependencies
   - ✅ Run linter
   - ✅ Setup database
   - ✅ Run tests
   - ✅ Build applications
   - ✅ Upload coverage
   - ✅ Security scan

### Expected Results

```
✓ Test & Build (5-10 minutes)
  ✓ Checkout code
  ✓ Setup Node.js
  ✓ Install pnpm
  ✓ Install dependencies
  ✓ Lint code
  ✓ Setup database
  ✓ Run backend tests (8 passed)
  ✓ Run frontend tests
  ✓ Build backend
  ✓ Build frontend
  ✓ Upload coverage

✓ Security Scan (2-3 minutes)
  ✓ npm audit
  ✓ Snyk scan (if configured)
```

---

## 🎯 POST-DEPLOYMENT TASKS

### 1. Add Project Badges

Add these to the top of README.md:

```markdown
![CI/CD](https://github.com/DenisMakokha/Kechita-Portal/workflows/CI/CD%20Pipeline/badge.svg)
![Coverage](https://codecov.io/gh/DenisMakokha/Kechita-Portal/branch/main/graph/badge.svg)
![Tests](https://img.shields.io/badge/tests-8%20passed-success)
![License](https://img.shields.io/badge/license-MIT-blue)
```

### 2. Set Up Branch Protection

1. Go to: Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators

### 3. Enable GitHub Pages (Optional)

1. Go to: Settings → Pages
2. Source: Deploy from a branch
3. Branch: main / docs
4. Use for project documentation

### 4. Configure Dependabot

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## 🚀 DEPLOYMENT OPTIONS

### Backend Deployment

**Option 1: Heroku**
```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create kechita-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Deploy
git push heroku main
```

**Option 2: AWS/Azure/GCP**
- Use GitHub Actions to deploy
- Configure secrets for cloud credentials
- Update `.github/workflows/ci.yml` with deployment steps

### Frontend Deployment

**Option 1: Vercel** (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd apps/web
vercel --prod
```

**Option 2: Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd apps/web
netlify deploy --prod
```

### Mobile App Deployment

**iOS (App Store)**
```bash
cd apps/mobile
expo build:ios
expo upload:ios
```

**Android (Play Store)**
```bash
cd apps/mobile
expo build:android
expo upload:android
```

---

## 📋 VERIFICATION CHECKLIST

Before considering deployment complete:

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] Linter passes with no errors
- [ ] No console.log in production code
- [ ] Environment variables configured

### Testing
- [ ] All tests pass locally
- [ ] Coverage meets thresholds (80%+)
- [ ] CI/CD tests pass
- [ ] E2E tests configured

### Security
- [ ] Dependencies audited (npm audit)
- [ ] Secrets not committed to git
- [ ] API endpoints secured
- [ ] Database credentials protected

### Documentation
- [ ] README.md complete
- [ ] API documentation up to date
- [ ] Deployment guide available
- [ ] User guide written

### GitHub
- [ ] Repository created
- [ ] Code pushed successfully
- [ ] CI/CD pipeline runs
- [ ] Secrets configured
- [ ] Branch protection enabled

---

## 🆘 TROUBLESHOOTING

### Issue: Tests Fail with Prisma Error

**Solution:**
```bash
# Regenerate Prisma Client
cd packages/db
pnpm prisma generate

# Clear node_modules and reinstall
cd ../..
rm -rf node_modules
pnpm install
```

### Issue: Git Push Rejected

**Solution:**
```bash
# Pull latest changes first
git pull origin main --rebase

# Then push
git push origin main
```

### Issue: CI/CD Fails

**Solution:**
1. Check workflow file syntax
2. Verify all secrets are configured
3. Check database connection in CI
4. Review error logs in GitHub Actions

### Issue: Port Already in Use

**Solution:**
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:4000 | xargs kill -9
```

---

## 📞 SUPPORT

For issues or questions:
- **Developer**: Denis Makokha
- **Email**: deniswanjala16@gmail.com
- **GitHub**: @DenisMakokha

---

## 🎉 SUCCESS!

Once all steps are complete, you will have:

✅ Tests passing locally  
✅ Code pushed to GitHub  
✅ CI/CD pipeline running  
✅ Coverage reports generated  
✅ Security scanning active  
✅ Ready for production deployment  

**Congratulations on completing the Kechita Capital Staff Portal!** 🎊
