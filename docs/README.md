# KECHITA STAFF PORTAL — DOCUMENTATION INDEX

**Complete Documentation Hub**  
**Version:** 2.0  
**Last Updated:** January 2025

---

## 📚 DOCUMENTATION STRUCTURE

### Core Documentation
1. **[IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)** - Master implementation document with complete architecture
2. **[API_ENDPOINTS.md](./API_ENDPOINTS.md)** - Complete API reference (200+ endpoints)
3. **[DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)** - UI/UX design system and component library
4. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Infrastructure and deployment guide

### Quick Start Guides
- **[PROJECT_GUIDE.md](../PROJECT_GUIDE.md)** - Original project overview
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines
- **[SECURITY.md](../SECURITY.md)** - Security policies

---

## 🚀 QUICK START

### Prerequisites
- Node.js 20 LTS
- PostgreSQL 14+
- pnpm 9.7+

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Kechita-Portal

# Install dependencies
pnpm install

# Set up database
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your database credentials

# Run database migrations
pnpm --filter @kechita/api prisma:push

# Seed development data
pnpm --filter @kechita/api dev:seed

# Start development servers
pnpm dev:api    # API server on http://localhost:4000
pnpm dev:web    # Web app on http://localhost:5173
```

---

## 📊 PROJECT OVERVIEW

### System Architecture
```
┌─────────────────────────────────────────────────────┐
│                Kechita Staff Portal                  │
├─────────────────────────────────────────────────────┤
│  Frontend (React 18 + Vite + Tailwind CSS)         │
│  ↓ REST API + WebSocket                             │
│  Backend (Node.js + Express + TypeScript)           │
│  ↓ Prisma ORM                                       │
│  Database (PostgreSQL 14+)                          │
└─────────────────────────────────────────────────────┘
```

### Key Features
- **9 Core Modules**: Recruitment, Leave, Claims, Loans, Petty Cash, Performance, Documents, Communication, Admin
- **3 Dynamic Builders**: Role Builder, Workflow Builder, Dashboard Builder
- **32 Pre-built Widgets**: KPI cards, charts, tables, calendars
- **Real-time Updates**: WebSocket notifications
- **Enterprise Security**: JWT auth, RBAC, audit logging
- **Mobile App**: React Native (Expo) for executives

---

## 🗄️ DATABASE SCHEMA

### Models Overview (38 Total)

**Core Models (3)**
- Organization
- Department
- User

**Recruitment Module (10)**
- JobPosting
- Application
- BackgroundCheck
- Interview
- Offer
- ContractTemplate
- OnboardingTask
- OnboardingItem
- RecruitmentRuleSet
- RegretTemplate

**Leave Management (3)**
- LeaveType
- LeaveApplication
- LeaveBalance
- LeaveConflict

**Claims Management (2)**
- ClaimType
- Claim

**Staff Loans (2)**
- StaffLoan
- LoanRepayment

**Petty Cash (5)**
- PettyCashCategory
- BranchFloatConfig
- PettyCashTransaction
- PettyCashLedger
- ReplenishmentRequest
- CashCount

**Performance & KPIs (2)**
- BranchDailyKPI
- KPIImportJob
- KPIImportError

**Document Management (3)**
- StaffDocument
- PolicyDocument
- PolicyAcknowledgment

**Communication (3)**
- Announcement
- AnnouncementRead
- SmsMessage

**RBAC & Audit (7)**
- Role
- Permission
- PermissionGroup
- UserRole
- RoleDelegation
- NavigationMenu
- AuditLog
- WorkflowTemplate
- WorkflowInstance
- WorkflowAction
- WorkflowRule
- DashboardTemplate
- UserDashboard
- DashboardWidget
- DataSource
- WidgetTemplate
- RoleTemplate

---

## 🔌 API ENDPOINTS

### Summary by Module

| Module | Endpoints | Key Features |
|--------|-----------|--------------|
| Authentication | 8 | Login, register, password reset, MFA |
| Admin | 40+ | Users, roles, workflows, dashboards |
| Recruitment | 45+ | Jobs, applications, interviews, offers |
| Leave | 15+ | Types, applications, approvals, calendar |
| Claims | 12+ | Types, submissions, approvals, payments |
| Loans | 10+ | Requests, approvals, repayments |
| Petty Cash | 15+ | Categories, transactions, float management |
| Performance | 12+ | KPI submission, imports, dashboards |
| Documents | 10+ | Staff docs, policies, acknowledgments |
| Communication | 8+ | Announcements, SMS, notifications |

**Total: 200+ endpoints**

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for complete reference.

---

## 🎨 DESIGN SYSTEM

### Color Palette
- **Primary**: Blue (#0ea5e9) - Main actions, brand
- **Secondary**: Teal (#14b8a6) - Success states
- **Success**: Green (#10b981) - Approvals
- **Warning**: Amber (#f59e0b) - Pending items
- **Danger**: Red (#ef4444) - Rejections, errors

### Typography
- **Font**: Inter (Primary), JetBrains Mono (Code)
- **Scale**: 0.75rem to 2.25rem (8 sizes)
- **Weights**: 300, 400, 500, 600, 700

### Spacing System
- **Base Unit**: 8px (0.5rem)
- **Scale**: 0, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px

### Component Library
- **UI Framework**: Radix UI + Tailwind CSS
- **Components**: 40+ reusable components
- **Accessibility**: WCAG 2.1 AA compliant
- **Theme**: Light/Dark mode support

See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for complete specifications.

---

## 📅 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)
- [x] Project setup and configuration
- [ ] Database schema implementation
- [ ] Authentication & security layer
- [ ] Base API structure
- [ ] Design system setup

### Phase 2: Recruitment Module (Weeks 3-4)
- [ ] Core recruitment features
- [ ] Background checks
- [ ] Interviews & offers
- [ ] Onboarding workflow

### Phase 3: Leave & Claims (Weeks 5-7)
- [ ] Leave management with dynamic workflows
- [ ] Claims management
- [ ] Staff loans with 14th/15th processing

### Phase 4: Petty Cash & Performance (Weeks 8-10)
- [ ] Petty cash imprest system
- [ ] Performance KPI tracking
- [ ] Documents & communication

### Phase 5: Admin Builders (Weeks 11-13)
- [ ] Role Builder (7-step wizard)
- [ ] Workflow Builder (visual designer)
- [ ] Dashboard Builder (widget composer)

### Phase 6: User Management (Week 14)
- [ ] User CRUD operations
- [ ] Role assignment
- [ ] Password management
- [ ] Audit logging

### Phase 7: Frontend (Weeks 15-18)
- [ ] Core pages and components
- [ ] Module-specific pages
- [ ] Admin pages
- [ ] Responsive design

### Phase 8: Mobile App (Weeks 19-20)
- [ ] Executive dashboard
- [ ] Approval workflows
- [ ] Push notifications

### Phase 9: Testing & Deployment (Weeks 21-22)
- [ ] Comprehensive testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Production deployment

---

## 🛡️ SECURITY

### Authentication
- JWT tokens with httpOnly cookies
- Password hashing with bcrypt (cost 10)
- Multi-factor authentication (MFA) ready
- Session management

### Authorization
- Role-Based Access Control (RBAC)
- Permission-based system
- Dynamic role builder
- Data scope restrictions

### Data Protection
- Field-level encryption (AES-256-GCM)
- Sensitive data masking
- Audit logging for all critical actions
- Rate limiting

### Compliance
- GDPR considerations
- Data retention policies
- Right to be forgotten
- Export personal data

---

## 🧪 TESTING

### Testing Stack
- **Unit Tests**: Vitest
- **Integration Tests**: Supertest
- **E2E Tests**: Playwright
- **Code Coverage**: > 80% target

### Testing Commands
```bash
# Run all tests
pnpm test

# Run unit tests
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Generate coverage report
pnpm test:coverage
```

---

## 📦 DEPLOYMENT

### Development
```bash
pnpm dev:api    # http://localhost:4000
pnpm dev:web    # http://localhost:5173
pnpm dev:mobile # Expo development server
```

### Production Build
```bash
pnpm build      # Build all apps
pnpm start:api  # Start production API
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/kechita

# Auth
JWT_SECRET=your-secret-key
CORS_ORIGINS=https://app.kechita.com

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass

# SMS
SMS_PROVIDER=africastalking
SMS_API_KEY=your-key

# Storage
STORAGE_DRIVER=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET=kechita-files
```

### Deployment Architecture
- **Load Balancer**: Nginx / AWS ALB
- **API Servers**: 2+ Node.js instances
- **Database**: PostgreSQL with read replica
- **Storage**: S3 / MinIO
- **CDN**: CloudFront / Cloudflare
- **Monitoring**: Prometheus + Grafana

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

---

## 📖 MODULE GUIDES

### Recruitment Module
Comprehensive recruitment workflow from job posting to onboarding.

**Key Features:**
- Job posting management
- Application screening with auto-scoring
- Background & reference checks
- Interview scheduling with calendar integration
- Offer generation with e-signatures
- Onboarding task tracking

**User Roles:** HR Manager, Regional Manager, Department Heads

### Leave Management Module
Dynamic leave approval workflows with conflict detection.

**Key Features:**
- Multiple leave types (Annual, Sick, Emergency, Maternity, etc.)
- Position-based approval chains
- Emergency leave bypass
- Leave balance tracking
- Team calendar view
- Conflict alerts

**User Roles:** All staff (requesters), Managers (approvers), HR (admin)

### Claims Management Module
Streamlined expense claim processing.

**Key Features:**
- Multiple claim types (Per diem, Fuel, Medical, etc.)
- Digital receipt upload
- Multi-stage approval workflow
- Payment tracking
- Monthly reconciliation reports

**User Roles:** All staff (requesters), Managers + Finance (approvers)

### Staff Loans Module
Salary advances and staff loan management.

**Key Features:**
- 14th/15th monthly processing schedule
- Automated amortization calculations
- Salary eligibility checks
- Payroll deduction tracking
- Arrears management

**User Roles:** Staff (requesters), HR + Finance (approvers)

### Petty Cash Module
Imprest-based petty cash management.

**Key Features:**
- 23 expense categories
- Branch-specific float management
- Trigger-based replenishment
- Cash count reconciliation
- Variance tracking

**User Roles:** Branch staff (requesters), BM/RM (approvers), Finance (processors)

### Performance & KPIs Module
Branch performance tracking and reporting.

**Key Features:**
- Daily KPI submission
- CSV/Excel bulk import
- PAR calculation and tracking
- Regional rollups
- Trend analysis
- Threshold alerts

**User Roles:** Branch Managers (reporters), Regional Managers (approvers), Executives (viewers)

---

## 🔧 DEVELOPMENT TOOLS

### Code Quality
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Husky**: Git hooks
- **Commitlint**: Commit message validation

### VS Code Extensions (Recommended)
- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- GitLens
- Thunder Client (API testing)

### Useful Commands
```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm typecheck

# Generate Prisma client
pnpm --filter @kechita/db generate

# Reset database
pnpm --filter @kechita/api prisma:reset

# View database
pnpm --filter @kechita/db studio
```

---

## 📞 SUPPORT

### Documentation
- [Implementation Plan](../IMPLEMENTATION_PLAN.md)
- [API Reference](./API_ENDPOINTS.md)
- [Design System](./DESIGN_SYSTEM.md)

### Issues
Report issues using the GitHub issue tracker with appropriate labels.

### Contributing
See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

### Security
Report security vulnerabilities to security@kechita.com  
See [SECURITY.md](../SECURITY.md) for our security policy.

---

## 📄 LICENSE

Proprietary - Kechita Capital © 2025

---

## 🎯 NEXT STEPS

1. **Review Architecture**: Go through IMPLEMENTATION_PLAN.md
2. **Set Up Environment**: Follow Quick Start guide above
3. **Run Development Servers**: Test the existing recruitment module
4. **Explore Database**: Use Prisma Studio to view schema
5. **Review API**: Test endpoints using Thunder Client or Postman
6. **Start Building**: Begin with Phase 1 implementation

---

**Ready to build?** Start with the [Quick Start](#-quick-start) section above!
