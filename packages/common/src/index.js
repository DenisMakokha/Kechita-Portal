export const Roles = {
    SUPERADMIN: 'superadmin',
    HR: 'hr',
    MANAGER: 'manager',
    STAFF: 'staff',
    FINANCE: 'finance',
    EXEC: 'exec',
};
export const Events = {
    ANNOUNCEMENT_CREATED: 'announcement.created',
    CLAIM_STATUS_CHANGED: 'claim.status',
    LEAVE_STATUS_CHANGED: 'leave.status',
    RECRUITMENT_EVENT: 'recruitment.event',
};
import { z } from 'zod';
export const JobPostingSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().min(3),
    description: z.string().min(10),
    branch: z.string(),
    region: z.string(),
    deadline: z.string(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']),
    createdById: z.string().uuid().optional()
});
export const ApplicationSchema = z.object({
    id: z.string().uuid().optional(),
    jobId: z.string().uuid(),
    applicantType: z.enum(['INTERNAL', 'EXTERNAL']),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    resumeUrl: z.string().url().optional(),
    status: z.enum(['RECEIVED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED']).default('RECEIVED')
});
//# sourceMappingURL=index.js.map