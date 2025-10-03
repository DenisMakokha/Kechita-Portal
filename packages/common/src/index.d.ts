export declare const Roles: {
    readonly SUPERADMIN: "superadmin";
    readonly HR: "hr";
    readonly MANAGER: "manager";
    readonly STAFF: "staff";
    readonly FINANCE: "finance";
    readonly EXEC: "exec";
};
export type Role = typeof Roles[keyof typeof Roles];
export declare const Events: {
    readonly ANNOUNCEMENT_CREATED: "announcement.created";
    readonly CLAIM_STATUS_CHANGED: "claim.status";
    readonly LEAVE_STATUS_CHANGED: "leave.status";
    readonly RECRUITMENT_EVENT: "recruitment.event";
};
import { z } from 'zod';
export declare const JobPostingSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodString;
    branch: z.ZodString;
    region: z.ZodString;
    deadline: z.ZodString;
    employmentType: z.ZodEnum<["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"]>;
    createdById: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    branch: string;
    region: string;
    deadline: string;
    employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
    id?: string | undefined;
    createdById?: string | undefined;
}, {
    title: string;
    description: string;
    branch: string;
    region: string;
    deadline: string;
    employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
    id?: string | undefined;
    createdById?: string | undefined;
}>;
export declare const ApplicationSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    jobId: z.ZodString;
    applicantType: z.ZodEnum<["INTERNAL", "EXTERNAL"]>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    resumeUrl: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["RECEIVED", "SHORTLISTED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]>>;
}, "strip", z.ZodTypeAny, {
    status: "RECEIVED" | "SHORTLISTED" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED";
    jobId: string;
    applicantType: "INTERNAL" | "EXTERNAL";
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    id?: string | undefined;
    resumeUrl?: string | undefined;
}, {
    jobId: string;
    applicantType: "INTERNAL" | "EXTERNAL";
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    id?: string | undefined;
    status?: "RECEIVED" | "SHORTLISTED" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED" | undefined;
    resumeUrl?: string | undefined;
}>;
//# sourceMappingURL=index.d.ts.map