import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Clean existing data (in development only)
  console.log('🧹 Cleaning existing data...')
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.announcementRead.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.policyAcknowledgment.deleteMany(),
    prisma.policyDocument.deleteMany(),
    prisma.staffDocument.deleteMany(),
    prisma.kPIImportError.deleteMany(),
    prisma.kPIImportJob.deleteMany(),
    prisma.branchDailyKPI.deleteMany(),
    prisma.cashCount.deleteMany(),
    prisma.replenishmentRequest.deleteMany(),
    prisma.pettyCashTransaction.deleteMany(),
    prisma.pettyCashLedger.deleteMany(),
    prisma.branchFloatConfig.deleteMany(),
    prisma.pettyCashCategory.deleteMany(),
    prisma.loanRepayment.deleteMany(),
    prisma.staffLoan.deleteMany(),
    prisma.claim.deleteMany(),
    prisma.claimType.deleteMany(),
    prisma.leaveConflict.deleteMany(),
    prisma.leaveBalance.deleteMany(),
    prisma.leaveApplication.deleteMany(),
    prisma.leaveType.deleteMany(),
    prisma.onboardingItem.deleteMany(),
    prisma.onboardingTask.deleteMany(),
    prisma.regretTemplate.deleteMany(),
    prisma.recruitmentRuleSet.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.interview.deleteMany(),
    prisma.backgroundCheck.deleteMany(),
    prisma.application.deleteMany(),
    prisma.jobPosting.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.role.deleteMany(),
    prisma.user.deleteMany(),
    prisma.department.deleteMany(),
    prisma.organization.deleteMany(),
  ])
  console.log('✅ Existing data cleaned\n')

  // 1. Create Organization
  console.log('📊 Creating organization...')
  const org = await prisma.organization.create({
    data: {
      code: 'KECHITA',
      name: 'Kechita Capital',
      logo: 'https://example.com/logo.png',
      settings: {
        timezone: 'Africa/Nairobi',
        currency: 'KES',
        dateFormat: 'DD/MM/YYYY',
      },
    },
  })
  console.log(`✅ Organization created: ${org.name}\n`)

  // 2. Create Departments
  console.log('🏢 Creating departments...')
  const departments = await Promise.all([
    prisma.department.create({
      data: { code: 'HR', name: 'Human Resources' },
    }),
    prisma.department.create({
      data: { code: 'FIN', name: 'Finance' },
    }),
    prisma.department.create({
      data: { code: 'OPS', name: 'Operations' },
    }),
    prisma.department.create({
      data: { code: 'IT', name: 'Information Technology' },
    }),
  ])
  console.log(`✅ Created ${departments.length} departments\n`)

  // 3. Create Roles
  console.log('🛡️ Creating roles...')
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        code: 'ceo',
        name: 'Chief Executive Officer',
        description: 'Executive leadership with full system access',
        hierarchy: 1,
        permissions: ['*'], // All permissions
        canDelegateTo: [],
        allowedModules: ['*'],
        dataFilters: { scope: 'all' },
        isSystem: true,
        createdBy: 'system',
      },
    }),
    prisma.role.create({
      data: {
        code: 'hr_manager',
        name: 'HR Manager',
        description: 'Human resources management',
        hierarchy: 2,
        permissions: ['recruitment.*', 'leave.*', 'documents.*', 'users.read'],
        canDelegateTo: [],
        allowedModules: ['recruitment', 'leave', 'documents', 'communication'],
        dataFilters: { scope: 'organization' },
        isSystem: true,
        createdBy: 'system',
      },
    }),
    prisma.role.create({
      data: {
        code: 'regional_manager',
        name: 'Regional Manager',
        description: 'Manages multiple branches in a region',
        hierarchy: 3,
        permissions: ['leave.approve', 'claims.approve', 'loans.approve', 'performance.read'],
        canDelegateTo: ['branch_manager'],
        allowedModules: ['leave', 'claims', 'loans', 'performance'],
        dataFilters: { scope: 'region' },
        isSystem: true,
        createdBy: 'system',
      },
    }),
    prisma.role.create({
      data: {
        code: 'branch_manager',
        name: 'Branch Manager',
        description: 'Manages branch operations',
        hierarchy: 4,
        permissions: ['leave.approve', 'claims.approve', 'pettycash.approve', 'performance.submit'],
        canDelegateTo: [],
        allowedModules: ['leave', 'claims', 'pettycash', 'performance'],
        dataFilters: { scope: 'branch' },
        isSystem: true,
        createdBy: 'system',
      },
    }),
    prisma.role.create({
      data: {
        code: 'staff',
        name: 'Staff Member',
        description: 'Regular staff member',
        hierarchy: 5,
        permissions: ['leave.create', 'claims.create', 'loans.request'],
        canDelegateTo: [],
        allowedModules: ['leave', 'claims', 'loans', 'documents'],
        dataFilters: { scope: 'own' },
        isSystem: true,
        createdBy: 'system',
      },
    }),
  ])
  console.log(`✅ Created ${roles.length} roles\n`)

  // 4. Create Users
  console.log('👥 Creating users...')
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const ceoUser = await prisma.user.create({
    data: {
      email: 'ceo@kechita.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Kimani',
      role: 'ceo',
      employeeId: 'EMP-001',
      position: 'Chief Executive Officer',
      branch: 'HQ',
      region: 'Nairobi',
      departmentId: departments[2].id,
      status: 'ACTIVE',
      startDate: new Date('2020-01-01'),
    },
  })

  const hrManager = await prisma.user.create({
    data: {
      email: 'hr@kechita.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Wanjiku',
      role: 'hr_manager',
      employeeId: 'EMP-002',
      position: 'HR Manager',
      branch: 'HQ',
      region: 'Nairobi',
      departmentId: departments[0].id,
      status: 'ACTIVE',
      startDate: new Date('2020-06-01'),
    },
  })

  const regionalManager = await prisma.user.create({
    data: {
      email: 'rm.nairobi@kechita.com',
      password: hashedPassword,
      firstName: 'Peter',
      lastName: 'Mwangi',
      role: 'regional_manager',
      employeeId: 'EMP-003',
      position: 'Regional Manager',
      branch: 'Nairobi Region',
      region: 'Nairobi',
      departmentId: departments[2].id,
      status: 'ACTIVE',
      startDate: new Date('2021-03-15'),
    },
  })

  const branchManager = await prisma.user.create({
    data: {
      email: 'bm.nairobi@kechita.com',
      password: hashedPassword,
      firstName: 'Mary',
      lastName: 'Akinyi',
      role: 'branch_manager',
      employeeId: 'EMP-004',
      position: 'Branch Manager',
      branch: 'Nairobi Central',
      region: 'Nairobi',
      departmentId: departments[2].id,
      supervisorId: regionalManager.id,
      status: 'ACTIVE',
      startDate: new Date('2021-09-01'),
    },
  })

  const staffMember = await prisma.user.create({
    data: {
      email: 'staff@kechita.com',
      password: hashedPassword,
      firstName: 'David',
      lastName: 'Omondi',
      role: 'staff',
      employeeId: 'EMP-005',
      position: 'Relationship Officer',
      branch: 'Nairobi Central',
      region: 'Nairobi',
      departmentId: departments[2].id,
      supervisorId: branchManager.id,
      status: 'ACTIVE',
      startDate: new Date('2022-01-15'),
    },
  })

  console.log(`✅ Created 5 users\n`)

  // 5. Assign Roles to Users
  console.log('🔐 Assigning roles to users...')
  await Promise.all([
    prisma.userRole.create({
      data: {
        userId: ceoUser.id,
        roleId: roles[0].id,
        assignedBy: 'system',
      },
    }),
    prisma.userRole.create({
      data: {
        userId: hrManager.id,
        roleId: roles[1].id,
        assignedBy: 'system',
      },
    }),
    prisma.userRole.create({
      data: {
        userId: regionalManager.id,
        roleId: roles[2].id,
        assignedBy: 'system',
      },
    }),
    prisma.userRole.create({
      data: {
        userId: branchManager.id,
        roleId: roles[3].id,
        assignedBy: 'system',
      },
    }),
    prisma.userRole.create({
      data: {
        userId: staffMember.id,
        roleId: roles[4].id,
        assignedBy: 'system',
      },
    }),
  ])
  console.log(`✅ Roles assigned\n`)

  // 6. Create Leave Types
  console.log('🏖️ Creating leave types...')
  const leaveTypes = await Promise.all([
    prisma.leaveType.create({
      data: {
        code: 'ANNUAL',
        name: 'Annual Leave',
        daysAllowed: 21,
        carryForward: true,
        maxCarryForward: 10,
        isPaid: true,
      },
    }),
    prisma.leaveType.create({
      data: {
        code: 'SICK',
        name: 'Sick Leave',
        daysAllowed: 14,
        requiresDocument: true,
        carryForward: false,
        isPaid: true,
      },
    }),
    prisma.leaveType.create({
      data: {
        code: 'EMERGENCY',
        name: 'Emergency Leave',
        daysAllowed: 3,
        carryForward: false,
        isPaid: true,
        isEmergency: true,
      },
    }),
    prisma.leaveType.create({
      data: {
        code: 'MATERNITY',
        name: 'Maternity Leave',
        daysAllowed: 90,
        requiresDocument: true,
        carryForward: false,
        isPaid: true,
      },
    }),
  ])
  console.log(`✅ Created ${leaveTypes.length} leave types\n`)

  // 7. Create Claim Types
  console.log('💰 Creating claim types...')
  const claimTypes = await Promise.all([
    prisma.claimType.create({
      data: {
        code: 'PERDIEM',
        name: 'Per Diem',
        category: 'TRAVEL',
        requiresReceipt: false,
        maxAmount: 5000,
        approvalChain: ['supervisor', 'finance'],
      },
    }),
    prisma.claimType.create({
      data: {
        code: 'FUEL',
        name: 'Fuel Reimbursement',
        category: 'TRAVEL',
        requiresReceipt: true,
        maxAmount: 10000,
        approvalChain: ['supervisor', 'finance'],
      },
    }),
    prisma.claimType.create({
      data: {
        code: 'MEDICAL',
        name: 'Medical Expenses',
        category: 'MEDICAL',
        requiresReceipt: true,
        approvalChain: ['hr', 'finance'],
      },
    }),
  ])
  console.log(`✅ Created ${claimTypes.length} claim types\n`)

  // 8. Create Petty Cash Categories
  console.log('💵 Creating petty cash categories...')
  const pettyCashCategories = await Promise.all([
    prisma.pettyCashCategory.create({
      data: {
        code: 'STATIONERY',
        name: 'Office Stationery',
        maxPerTransaction: 5000,
        order: 1,
      },
    }),
    prisma.pettyCashCategory.create({
      data: {
        code: 'TRANSPORT',
        name: 'Local Transport',
        maxPerTransaction: 3000,
        order: 2,
      },
    }),
    prisma.pettyCashCategory.create({
      data: {
        code: 'POSTAGE',
        name: 'Postage & Courier',
        maxPerTransaction: 2000,
        order: 3,
      },
    }),
  ])
  console.log(`✅ Created ${pettyCashCategories.length} petty cash categories\n`)

  // 9. Create Onboarding Tasks
  console.log('📋 Creating onboarding tasks...')
  const onboardingTasks = await Promise.all([
    prisma.onboardingTask.create({
      data: {
        code: 'ID_SUBMISSION',
        label: 'Submit National ID Copy',
        category: 'DOCUMENTS',
        required: true,
        order: 1,
      },
    }),
    prisma.onboardingTask.create({
      data: {
        code: 'PIN_SUBMISSION',
        label: 'Submit KRA PIN Certificate',
        category: 'DOCUMENTS',
        required: true,
        order: 2,
      },
    }),
    prisma.onboardingTask.create({
      data: {
        code: 'CONTRACT_SIGN',
        label: 'Sign Employment Contract',
        category: 'HR',
        required: true,
        order: 3,
      },
    }),
    prisma.onboardingTask.create({
      data: {
        code: 'ORIENTATION',
        label: 'Complete Orientation Program',
        category: 'TRAINING',
        required: true,
        order: 4,
      },
    }),
  ])
  console.log(`✅ Created ${onboardingTasks.length} onboarding tasks\n`)

  // 10. Create Sample Job Posting
  console.log('💼 Creating sample job posting...')
  const job = await prisma.jobPosting.create({
    data: {
      title: 'Relationship Officer',
      description: 'We are seeking a dynamic Relationship Officer to join our team...',
      branch: 'Nairobi Central',
      region: 'Nairobi',
      employmentType: 'PERMANENT',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'ACTIVE',
      createdById: hrManager.id,
    },
  })
  console.log(`✅ Created job posting: ${job.title}\n`)

  // 11. Create Permissions
  console.log('🔒 Creating permissions...')
  const permissions = await Promise.all([
    prisma.permission.create({
      data: {
        code: 'recruitment.jobs.create',
        module: 'recruitment',
        resource: 'jobs',
        action: 'create',
        description: 'Create job postings',
        category: 'RECRUITMENT',
        isSystem: true,
      },
    }),
    prisma.permission.create({
      data: {
        code: 'leave.approve',
        module: 'leave',
        resource: 'applications',
        action: 'approve',
        description: 'Approve leave applications',
        category: 'LEAVE',
        risk: 'MEDIUM',
        isSystem: true,
      },
    }),
    prisma.permission.create({
      data: {
        code: 'users.delete',
        module: 'admin',
        resource: 'users',
        action: 'delete',
        description: 'Delete user accounts',
        category: 'ADMIN',
        risk: 'HIGH',
        isSystem: true,
      },
    }),
  ])
  console.log(`✅ Created ${permissions.length} permissions\n`)

  console.log('✅ Database seeded successfully!\n')
  console.log('📊 Summary:')
  console.log(`   - 1 Organization`)
  console.log(`   - ${departments.length} Departments`)
  console.log(`   - ${roles.length} Roles`)
  console.log(`   - 5 Users (login with any user, password: password123)`)
  console.log(`   - ${leaveTypes.length} Leave Types`)
  console.log(`   - ${claimTypes.length} Claim Types`)
  console.log(`   - ${pettyCashCategories.length} Petty Cash Categories`)
  console.log(`   - ${onboardingTasks.length} Onboarding Tasks`)
  console.log(`   - 1 Active Job Posting`)
  console.log(`   - ${permissions.length} Permissions`)
  console.log('\n🔑 Test Credentials:')
  console.log('   CEO: ceo@kechita.com / password123')
  console.log('   HR Manager: hr@kechita.com / password123')
  console.log('   Regional Manager: rm.nairobi@kechita.com / password123')
  console.log('   Branch Manager: bm.nairobi@kechita.com / password123')
  console.log('   Staff: staff@kechita.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
