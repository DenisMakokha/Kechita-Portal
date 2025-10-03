# KECHITA STAFF PORTAL — API ENDPOINTS REFERENCE

**Complete API Documentation**  
**Version:** 2.0  
**Base URL:** `http://localhost:4000` (development)

---

## TABLE OF CONTENTS

1. [Authentication](#authentication)
2. [Admin Module](#admin-module)
3. [Recruitment Module](#recruitment-module)
4. [Leave Management](#leave-management)
5. [Claims Management](#claims-management)
6. [Staff Loans](#staff-loans)
7. [Petty Cash](#petty-cash)
8. [Performance & KPIs](#performance--kpis)
9. [Documents](#documents)
10. [Communication](#communication)

---

## AUTHENTICATION

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "staff"
}

Response: 201 Created
{
  "id": "uuid",
  "email": "user@example.com"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
Set-Cookie: token=jwt_token; HttpOnly
{
  "ok": true,
  "role": "staff"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "staff"
}
```

### Logout
```http
POST /auth/logout

Response: 200 OK
{
  "ok": true
}
```

### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response: 200 OK
{
  "message": "Password reset link sent to email"
}
```

### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "password": "NewSecurePass123!"
}

Response: 200 OK
{
  "message": "Password reset successful"
}
```

### Change Password
```http
POST /auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}

Response: 200 OK
{
  "message": "Password changed successfully"
}
```

---

## ADMIN MODULE

### User Management

#### List Users
```http
GET /admin/users?page=1&limit=20&status=ACTIVE&role=staff&branch=Nairobi
Authorization: Bearer {token}
Permissions: admin.users.read

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "staff",
      "branch": "Nairobi",
      "status": "ACTIVE",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 127,
    "pages": 7
  }
}
```

#### Create User
```http
POST /admin/users
Authorization: Bearer {token}
Permissions: admin.users.create
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "TempPass123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "staff",
  "position": "Relationship Officer",
  "branch": "Nairobi",
  "region": "Nairobi",
  "departmentId": "uuid",
  "startDate": "2025-01-15",
  "mustChangePassword": true
}

Response: 201 Created
{
  "id": "uuid",
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

#### Update User
```http
PUT /admin/users/:id
Authorization: Bearer {token}
Permissions: admin.users.update
Content-Type: application/json

{
  "position": "Senior Relationship Officer",
  "branch": "Kisumu"
}

Response: 200 OK
{
  "id": "uuid",
  "email": "user@example.com",
  "position": "Senior Relationship Officer",
  "branch": "Kisumu"
}
```

#### Lock User Account
```http
POST /admin/users/:id/lock
Authorization: Bearer {token}
Permissions: admin.users.lock
Content-Type: application/json

{
  "reason": "Security investigation"
}

Response: 200 OK
{
  "message": "Account locked successfully"
}
```

#### Reset User Password
```http
POST /admin/users/:id/reset-password
Authorization: Bearer {token}
Permissions: admin.users.reset-password
Content-Type: application/json

{
  "method": "generate",
  "sendVia": ["email", "sms"],
  "requireChange": true
}

Response: 200 OK
{
  "message": "Password reset successful",
  "temporaryPassword": "TempPass123!" // only if method=generate
}
```

#### Assign Role to User
```http
POST /admin/users/:id/assign-role
Authorization: Bearer {token}
Permissions: admin.users.assign-role
Content-Type: application/json

{
  "roleId": "uuid",
  "effectiveFrom": "2025-01-01",
  "effectiveTo": null,
  "branchRestrictions": ["Nairobi"],
  "regionRestrictions": ["Nairobi"]
}

Response: 200 OK
{
  "message": "Role assigned successfully"
}
```

#### Bulk Import Users
```http
POST /admin/users/bulk-import
Authorization: Bearer {token}
Permissions: admin.users.create
Content-Type: multipart/form-data

file: users.csv

Response: 200 OK
{
  "total": 50,
  "success": 48,
  "errors": 2,
  "errorDetails": [
    {
      "row": 15,
      "email": "invalid@example.com",
      "error": "Email already exists"
    }
  ]
}
```

### Role Management

#### List Roles
```http
GET /admin/roles?active=true
Authorization: Bearer {token}
Permissions: admin.roles.read

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "code": "branch_manager",
      "name": "Branch Manager",
      "hierarchy": 4,
      "active": true,
      "userCount": 12
    }
  ]
}
```

#### Create Role
```http
POST /admin/roles
Authorization: Bearer {token}
Permissions: admin.roles.create
Content-Type: application/json

{
  "code": "senior_officer",
  "name": "Senior Officer",
  "description": "Senior relationship officer",
  "permissions": ["leave.create", "claims.create", "loans.request"],
  "hierarchy": 5,
  "dataFilters": {
    "branch": "own",
    "region": "own"
  },
  "dashboardLayout": {...},
  "allowedModules": ["leave", "claims", "loans"]
}

Response: 201 Created
{
  "id": "uuid",
  "code": "senior_officer",
  "name": "Senior Officer"
}
```

#### Get Role Templates
```http
GET /admin/roles/templates
Authorization: Bearer {token}
Permissions: admin.roles.read

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "code": "template_manager",
      "name": "Manager Template",
      "category": "MANAGEMENT",
      "usageCount": 15
    }
  ]
}
```

### Workflow Management

#### List Workflows
```http
GET /admin/workflows?module=leave&active=true
Authorization: Bearer {token}
Permissions: admin.workflows.read

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "code": "leave_approval_standard",
      "name": "Standard Leave Approval",
      "module": "leave",
      "version": "1.0",
      "active": true
    }
  ]
}
```

#### Create Workflow
```http
POST /admin/workflows
Authorization: Bearer {token}
Permissions: admin.workflows.create
Content-Type: application/json

{
  "code": "loan_approval_high_value",
  "name": "High Value Loan Approval",
  "module": "loans",
  "entityType": "StaffLoan",
  "definition": {
    "version": "1.0",
    "startNode": "node1",
    "nodes": [
      {
        "id": "node1",
        "type": "decision",
        "condition": {
          "field": "amount",
          "operator": ">",
          "value": 100000
        },
        "onTrue": "node2",
        "onFalse": "node3"
      }
    ]
  },
  "triggers": {...},
  "conditions": {...}
}

Response: 201 Created
{
  "id": "uuid",
  "code": "loan_approval_high_value",
  "version
