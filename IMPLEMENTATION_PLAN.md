# KECHITA STAFF PORTAL — COMPLETE IMPLEMENTATION PLAN

**Version:** 2.0  
**Date:** January 2025  
**Status:** Ready for Implementation  
**Estimated Timeline:** 22 Weeks

---

## EXECUTIVE SUMMARY

The Kechita Staff Portal is a comprehensive Enterprise HR & Operations Management System designed for Fortune 500-grade deployment. This document provides the complete implementation plan covering architecture, database design, API specifications, UI/UX design system, and phased rollout strategy.

### Key Metrics
- **38 Database Models** - Complete data layer
- **200+ API Endpoints** - Full backend coverage
- **9 Core Modules** - All business processes
- **3 Dynamic Builders** - Role, Workflow, Dashboard
- **32 Pre-built Widgets** - Dashboard components
- **22-Week Timeline** - Phased implementation

### Technology Stack
- **Backend:** Node.js 20, TypeScript 5, Express 4, Prisma 5, PostgreSQL 14+
- **Frontend:** React 18, Vite 5, Tailwind CSS 3, Radix UI
- **Mobile:** React Native (Expo 50)
- **Real-time:** Socket.IO 4.6+
- **Storage:** AWS S3 / MinIO
- **Email/SMS:** Nodemailer / Africa's Talking

---

## TABLE OF CONTENTS

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [API Specifications](#api-specifications)
4. [Module Specifications](#module-specifications)
5. [Admin Builders](#admin-builders)
6. [Design System](#design-system)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Deployment Architecture](#deployment-architecture)
9. [Testing Strategy](#testing-strategy)
10. [Security & Compliance](#security--compliance)

---

## SYSTEM ARCHITECTURE

### High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                   Load Balancer                      │
│              (Nginx / AWS ALB)                       │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
  ┌─────▼─────┐        ┌──────▼──────┐
  │ API Node 1│        │ API Node 2  │
  │ (Express) │        │  (Express)  │
  └─────┬─────┘        └──────┬──────┘
        │                     │
        └─────────┬───────────┘
                  │
      ┌───────────▼────────────┐
      │   PostgreSQL Primary   │
      └───────────┬────────────┘
                  │
      ┌───────────▼────────────┐
      │  Read Replica          │
      └────────────────────────┘

┌────────────────────────────────────────────────┐
│     Static Web Hosting (CDN)                   │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│     Object Storage (S3/MinIO)                  │
└────────────────────────────────────────────────┘
```

### Monorepo Structure

```
kechita-staff-portal/
├── apps/
│   ├── api/          # Express API server
│   ├── web/          # React web application
│   └── mobile/       # React Native mobile app
├── packages/
│   ├── common/       # Shared types, schemas, constants
│   ├── db/           # Prisma schema & client
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configurations
└── docs/             # Documentation
```

---

## DATABASE SCHEMA

### Complete Prisma Schema (38 Models)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== CORE MODELS ====================

model Organization {
  id        String   @id @default(uuid())
  name      String
  code      String   @unique
  logo      String?
  settings  Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Department {
  id        String   @id @default(uuid())
  code      String   @unique
  name      String
  headId    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  staff User[]
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String
  lastName  String
  role      String
  
  // Employment Details
  employeeId        String?   @unique
  position          String?
  branch            String?
  region            String?
  departmentId      String?
  department        Department? @relation(fields: [departmentId], references: [id])
  supervisorId      String?
  supervisor        User?     @relation("Supervision", fields: [supervisorId], references: [id])
  subordinates      User[]    @relation("Supervision")
  
  // Personal Details
  dateOfBirth       DateTime?
  nationalId        String?
  taxPin            String?
  nhifNumber        String?
  nssfNumber        String?
  bankAccount       String?
  bankBranch        String?
  emergencyContact  String?
  emergencyPhone    String?
  
  // Employment Status
  startDate         DateTime?
  probationEndDate  DateTime?
  permanentDate     DateTime?
  terminationDate   DateTime?
  status            String    @default("ACTIVE")
  
  // Account Security
  accountLocked     Boolean   @default(false)
  lockReason        String?
  lockedAt          DateTime?
  lockedBy          String?
  passwordResetToken String?
  passwordResetExpiry DateTime?
  passwordChangedAt DateTime?
  mustChangePassword Boolean  @default(false)
  passwordHistory   Json?
  lastLoginAt       DateTime?
  lastLoginIp       String?
  failedLoginAttempts Int     @default(0)
  lastFailedLoginAt DateTime?
  activeSessions    Json?
  mfaEnabled        Boolean   @default(false)
  mfaSecret         String?
  
  orgId             String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  createdJobs          JobPosting[]       @relation("JobCreator")
  applications         Application[]
  leaveApplications    LeaveApplication[] @relation("LeaveApplicant")
  approvedLeaves       LeaveApplication[] @relation("LeaveApprover")
  claims               Claim[]            @relation("ClaimRequester")
  approvedClaims       Claim[]            @relation("ClaimApprover")
  staffLoans           StaffLoan[]        @relation("LoanRequester")
  approvedLoans        StaffLoan[]        @relation("LoanApprover")
  kpiReports           BranchDailyKPI[]
  documents            StaffDocument[]
  policyAcknowledgments PolicyAcknowledgment[]
  announcementsCreated Announcement[]     @relation("AnnouncementCreator")
  announcementReads    AnnouncementRead[]
  pettyCashRequests    PettyCashTransaction[] @relation("PettyCashRequester")
  pettyCashApprovals   PettyCashTransaction[] @relation("PettyCashApprover")
  cashCounts           CashCount[]
  roles                UserRole[]
}

// ==================== RECRUITMENT MODULE ====================

model JobPosting {
  id            String   @id @default(uuid())
  title         String
  description   String
  branch        String
  region        String
  deadline      DateTime
  employmentType String
  status        String   @default("ACTIVE")
  createdById   String
  createdBy     User     @relation("JobCreator", fields: [createdById], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  applications  Application[]
  rules         RecruitmentRuleSet?
  regretTemplates RegretTemplate[]
}

model Application {
  id            String   @id @default(uuid())
  jobId         String
  job           JobPosting @relation(fields: [jobId], references: [id])
  applicantType String
  firstName     String
  lastName      String
  email         String
  phone         String
  resumeUrl     String?
  resumeText    String?
  status        String   @default("RECEIVED")
  score         Int?
  scoringNotes  Json?
  backgroundCheckStatus String? @default("PENDING")
  backgroundCheckNotes  String?
  backgroundCheckDate   DateTime?
  referenceCheckStatus  String? @default("PENDING")
  referenceCheckNotes   String?
  references            Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  interviews    Interview[]
  offers        Offer[]
  onboardingItems OnboardingItem[]
  backgroundChecks BackgroundCheck[]
}

model BackgroundCheck {
  id            String   @id @default(uuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  checkType     String
  provider      String?
  status        String   @default("PENDING")
  result        String?
  notes         String?
  completedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Interview {
  id          String   @id @default(uuid())
  applicationId String
  application Application @relation(fields: [applicationId], references: [id])
  panel       String
  mode        String
  location    String?
  startsAt    DateTime
  endsAt      DateTime
  notes       String?
  feedback    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Offer {
  id            String   @id @default(uuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  title         String
  salary        Int
  currency      String   @default("KES")
  contractText  String?
  contractUrl   String?
  signatureDataUrl String?
  status        String   @default("DRAFT")
  negotiationNotes Json?
  issuedAt      DateTime?
  respondedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ContractTemplate {
  id        String   @id @default(uuid())
  name      String
  body      String
  category  String
  createdBy String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model OnboardingTask {
  id        String   @id @default(uuid())
  code      String   @unique
  label     String
  category  String
  required  Boolean  @default(true)
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  items OnboardingItem[]
}

model OnboardingItem {
  id            String   @id @default(uuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  taskId        String
  task          OnboardingTask @relation(fields: [taskId], references: [id])
  completed     Boolean  @default(false)
  evidenceUrl   String?
  completedBy   String?
  completedAt   DateTime?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model RecruitmentRuleSet {
  id                 String   @id @default(uuid())
  jobId              String   @unique
  job                JobPosting @relation(fields: [jobId], references: [id])
  mustHave           Json
  preferred          Json
  shortlistThreshold Int      @default(35)
  rejectThreshold    Int      @default(15)
  autoRegret         Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

model RegretTemplate {
  id        String   @id @default(uuid())
  name      String
  subject   String
  bodyHtml  String
  bodyText  String
  locale    String   @default("en")
  jobId     String?
  job       JobPosting? @relation(fields: [jobId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ==================== LEAVE MANAGEMENT MODULE ====================

model LeaveType {
  id               String   @id @default(uuid())
  code             String   @unique
  name             String
  daysAllowed      Int
  requiresDocument Boolean  @default(false)
  carryForward     Boolean  @default(true)
  maxCarryForward  Int?
  isPaid           Boolean  @default(true)
  isEmergency      Boolean  @default(false)
  active           Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  applications LeaveApplication[]
  balances     LeaveBalance[]
}

model LeaveApplication {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation("LeaveApplicant", fields: [userId], references: [id])
  leaveTypeId     String
  leaveType       LeaveType @relation(fields: [leaveTypeId], references: [id])
  startDate       DateTime
  endDate         DateTime
  daysRequested   Int
  reason          String
  coveringStaff   String?
  documentUrl     String?
  isEmergency     Boolean  @default(false)
  emergencyReason String?
  status          String   @default("PENDING")
  approvalChain   Json
  approvalHistory Json
  currentApproverPosition String?
  approvedById    String?
  approvedBy      User?    @relation("LeaveApprover", fields: [approvedById], references: [id])
  approvalNotes   String?
  approvedAt      DateTime?
  rejectionReason String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model LeaveBalance {
  id          String   @id @default(uuid())
  userId      String
  year        Int
  leaveTypeId String
  leaveType   LeaveType @relation(fields: [leaveTypeId], references: [id])
  allocated   Int
  used        Int
  balance     Int
  carriedOver Int      @default(0)
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, year, leaveTypeId])
}

model LeaveConflict {
  id              String   @id @default(uuid())
  applicationId1  String
  applicationId2  String
  branch          String
  conflictDate    DateTime
  severity        String
  resolved        Boolean  @default(false)
  resolutionNotes String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// ==================== CLAIMS MANAGEMENT MODULE ====================

model ClaimType {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  category    String
  requiresReceipt Boolean @default(true)
  maxAmount   Decimal?
  pettyCashCategory String?
  requiresPreApproval Boolean @default(false)
  approvalChain Json
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  claims Claim[]
}

model Claim {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation("ClaimRequester", fields: [userId], references: [id])
  claimTypeId     String
  claimType       ClaimType @relation(fields: [claimTypeId], references: [id])
  amount          Decimal
  currency        String   @default("KES")
  description     String
  claimDate       DateTime
  receipts        Json
  status          String   @default("PENDING")
  approvalChain   Json
  approvalHistory Json
  currentApproverId String?
  approvedById    String?
  approvedBy      User?    @relation("ClaimApprover", fields: [approvedById], references: [id])
  approvalNotes   String?
  approvedAt      DateTime?
  paidAt          DateTime?
  paidAmount      Decimal?
  paidBy          String?
  paymentRef      String?
  rejectionReason String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// ==================== STAFF LOANS MODULE ====================

model StaffLoan {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation("LoanRequester", fields: [userId], references: [id])
  type            String
  amount          Decimal
  currency        String   @default("KES")
  reason          String
  requestedDate   DateTime @default(now())
  requestMonth    String
  requestDay      Int
  processingMonth String?
  processingNote  String?
  approvedAmount  Decimal?
  interestRate    Decimal  @default(0)
  installments    Int
  installmentAmount Decimal?
  startDate       DateTime?
  endDate         DateTime?
  status          String   @default("PENDING")
  approvedById    String?
  approvedBy      User?    @relation("LoanApprover", fields: [approvedById], references: [id])
  approvalNotes   String?
  approvedAt      DateTime?
  disbursedAt     DateTime?
  rejectionReason String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  repayments LoanRepayment[]
}

model LoanRepayment {
  id            String   @id @default(uuid())
  loanId        String
  loan          StaffLoan @relation(fields: [loanId], references: [id])
  installmentNumber Int
  dueDate       DateTime
  amount        Decimal
  paidAmount    Decimal  @default(0)
  paidDate      DateTime?
  status        String   @default("PENDING")
  payrollMonth  String?
  arrears       Decimal  @default(0)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// ==================== PETTY CASH MODULE ====================

model PettyCashCategory {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  maxPerTransaction Decimal?
  requiresApproval Boolean @default(true)
  active      Boolean  @default(true)
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  transactions PettyCashTransaction[]
}

model BranchFloatConfig {
  id              String   @id @default(uuid())
  branchId        String   @unique
  tier            String
  baseAmount      Decimal
  minTriggerPct   Decimal  @default(30)
  hardCap         Decimal
  avgWeeklySpend  Decimal?
  activeFrom      DateTime @default(now())
  reviewDate      DateTime
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  ledger PettyCashLedger[]
  replenishments ReplenishmentRequest[]
  counts CashCount[]
}

model PettyCashTransaction {
  id              String   @id @default(uuid())
  ledgerId        String   @unique
  ledger          PettyCashLedger @relation(fields: [ledgerId], references: [id])
  categoryId      String
  category        PettyCashCategory @relation(fields: [categoryId], references: [id])
  amount          Decimal
  currency        String   @default("KES")
  description     String
  receiptUrl      String?
  receiptDuplicate Boolean @default(false)
  transactionDate DateTime
  voucherNumber   String   @unique
  requestedById   String
  requestedBy     User     @relation("PettyCashRequester", fields: [requestedById], references: [id])
  branch          String
  status          String   @default("PENDING")
  approvalChain   Json
  approvalHistory Json
  approvedById    String?
  approvedBy      User?    @relation("PettyCashApprover", fields: [approvedById], references: [id])
  approvedAt      DateTime?
  paidAt          DateTime?
  paidBy          String?
  paymentMethod   String?
  paymentRef      String?
  rejectionReason String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model PettyCashLedger {
  id              String   @id @default(uuid())
  branchId        String
  branch          BranchFloatConfig @relation(fields: [branchId], references: [id])
  entryType       String
  amount          Decimal
  runningBalance  Decimal
  referenceType   String?
  referenceId     String?
  description     String
  entryDate       DateTime @default(now())
  createdBy       String
  lockedPeriod    String?
  createdAt       DateTime @default(now())
  
  transaction PettyCashTransaction?
  
  @@index([branchId, entryDate])
}

model ReplenishmentRequest {
  id              String   @id @default(uuid())
  branchId        String
  branch          BranchFloatConfig @relation(fields: [branchId], references: [id])
  requestedAmount Decimal
  currentBalance  Decimal
  targetBalance   Decimal
  justification   String?
  status          String   @default("PENDING")
  approvalChain   Json
  approvalHistory Json
  approvedById    String?
  approvedAmount  Decimal?
  approvedAt      DateTime?
  paidAt          DateTime?
  paidBy          String?
  paymentMethod   String?
  paymentRef      String?
  receiptUrl      String?
  ledgerEntryId   String?
  rejectionReason String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model CashCount {
  id              String   @id @default(uuid())
  branchId        String
  branch          BranchFloatConfig @relation(fields: [branchId], references: [id])
  countedAmount   Decimal
  systemBalance   Decimal
  variance        Decimal
  variancePct     Decimal
  counterId       String
  counter         User     @relation(fields: [counterId], references: [id])
  witnessId       String?
  photoUrl        String?
  notes           String?
  countType       String
  resolved        Boolean  @default(false)
  resolutionNotes String?
  resolvedAt      DateTime?
  countDate       DateTime @default(now())
  createdAt       DateTime @default(now())
  
  @@index([branchId, countDate])
}

// ==================== PERFORMANCE & KPI MODULE ====================

model BranchDailyKPI {
  id                String   @id @default(uuid())
  branch            String
  region            String
  reportDate        DateTime
  reportedById      String
  reportedBy        User     @relation(fields: [reportedById], references: [id])
  newLoansCount     Int      @default(0)
  disbursedAmount   Decimal  @default(0)
  recoveriesAmount  Decimal  @default(0)
  prepaymentsAmount Decimal  @default(0)
  outstandingPrincipal Decimal @default(0)
  arrearsPrincipal  Decimal  @default(0)
  par1_30           Decimal  @default(0)
  par31_60          Decimal  @default(0)
  par61_90          Decimal  @default(0)
  par90Plus         Decimal  @default(0)
  parTotal          Decimal  @default(0)
  parPercentage     Decimal  @default(0)
  comments          String?
  status            String   @default("DRAFT")
  approvedById      String?
  approvedAt        DateTime?
  rejectionReason   String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([branch, reportDate])
  @@index([region, reportDate])
}

model KPIImportJob {
  id          String   @id @default(uuid())
  filename    String
  fileUrl     String
  uploadedBy  String
  totalRows   Int
  successRows Int      @default(0)
  errorRows   Int      @default(0)
  status      String   @default("PROCESSING")
  startedAt   DateTime @default(now())
  completedAt DateTime?
  
  errors KPIImportError[]
}

model KPIImportError {
  id        String   @id @default(uuid())
  jobId     String
  job       KPIImportJob @relation(fields: [jobId], references: [id])
  rowNumber Int
  errorType String
  field     String?
  message   String
  data      Json
  createdAt DateTime @default(now())
}

// ==================== DOCUMENT MANAGEMENT MODULE ====================

model StaffDocument {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  type          String
  name          String
  fileUrl       String
  fileSize      Int
  mimeType      String
  expiryDate    DateTime?
  reminderSent  Boolean  @default(false)
  reminderDays  Int?
  version       Int      @default(1)
  supersedes    String?
  uploadedById  String
  uploadedAt    DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([userId, expiryDate])
}

model PolicyDocument {
  id          String   @id @default(uuid())
  category    String
  title       String
  description String?
  version     String
  fileUrl     String
  fileSize    Int
  active      Boolean  @default(true)
  mandatory   Boolean  @default(false)
  publishedBy String
  publishedAt DateTime @default(now())
  expiresAt   DateTime?
  changeLog   String?
  previousVersion String?
  updatedAt   DateTime @updatedAt
  
  acknowledgments PolicyAcknowledgment[]
}

model PolicyAcknowledgment {
  id         String   @id @default(uuid())
  policyId   String
  policy     PolicyDocument @relation(fields: [policyId], references: [id])
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  readAt     DateTime @default(now())
  acknowledgedAt DateTime?
  ipAddress  String?
  deviceInfo String?
  
  @@unique([policyId, userId])
  @@index([policyId, acknowledgedAt])
}

// ==================== COMMUNICATION MODULE ====================

model Announcement {
  id        String   @id @default(uuid())
  title     String
  body      String
  bodyHtml  String?
  attachments Json?
  target    String
  targetType String
  priority  String   @default("NORMAL")
  channels  Json
  publishAt DateTime @default(now())
  expiresAt DateTime?
  createdBy String
  creator   User     @relation("AnnouncementCreator", fields: [createdBy], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  reads AnnouncementRead[]
}

model AnnouncementRead {
  id             String   @id @default(uuid())
  announcementId String
  announcement   Announcement @relation(fields: [announcementId], references: [id])
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  readAt         DateTime @default(now())
  acknowledged   Boolean  @default(false)
  acknowledgedAt DateTime?
  
  @@unique([announcementId, userId])
  @@index([userId, readAt])
}

model SmsMessage {
  id          String   @id @default(uuid())
  to          String
  message     String
  provider    String
  status      String   @default("PENDING")
  messageId   String?
  cost        Decimal?
  sentAt      DateTime?
  deliveredAt DateTime?
  errorMessage String?
  contextType String?
  contextId   String?
  createdAt   DateTime @default(now())
  
  @@index([to, createdAt])
  @@index([status, createdAt])
}

// ==================== RBAC & AUDIT MODULE ====================

model Role {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  color       String?
  icon        String?
  permissions Json
  hierarchy   Int
  canDelegateTo Json
  inheritsFrom String?
  dashboardLayout Json
  allowedModules  Json
  dataFilters     Json
  isSystem    Boolean  @default(false)
  active      Boolean  @default(true)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  users UserRole[]
  delegations RoleDelegation[]
  menus NavigationMenu[]
}

model Permission {
  id          String   @id @default(uuid())
  code        String   @unique
  module      String
  resource    String
  action      String
  description String?
  category    String
  risk        String   @default("LOW")
  requires    Json?
  conflicts   Json?
  isSystem    Boolean  @default(false)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model PermissionGroup {
  id          String   @id @default(uuid())
  code        String   @unique
  name        String
  description String?
  permissions Json
  module      String
  order       Int      @default(0)
  createdAt   DateTime @default(now())
}

model UserRole {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  roleId      String
  role        Role     @relation(fields: [roleId], references: [id])
  extraPermissions Json?
  branchRestrictions Json?
  regionRestrictions Json?
  effectiveFrom DateTime @default(now())
  effectiveTo   DateTime?
  assignedBy  String
  assignedAt  DateTime @default(now())
  
  @@unique([userId, roleId])
  @@index([userId, effectiveFrom, effectiveTo])
}

model RoleDelegation {
  id          String   @id @default(uuid())
  fromRoleId  String
  fromRole    Role     @relation(fields: [fromRoleId], references: [id])
  toUserId    String
  reason      String
  permissions Json
  branchScope String?
  regionScope String?
  startDate   DateTime
  endDate     DateTime
  status      String   @default("ACTIVE")
  revokedBy
