# RISE HR Portal - Technical Design

## 1. System Overview
The RISE HR Portal is a centralized platform for managing employee leaves, company announcements, and team connectivity. It is designed to replace manual processes with a streamlined, automated, and visually premium experience.

## 2. Core Architecture
- **Frontend**: Next.js 15 (App Router) for high performance and SEO.
- **Backend**: Next.js API Routes for server-side logic and Airtable/Supabase integration.
- **Database**: 
  - **Airtable**: Primary source of truth for employee data and team hierarchy.
  - **Supabase**: Relational storage for leave requests, audit logs, and social reactions.
- **Authentication**: NextAuth.js with Google OAuth 2.0 provider.
- **Notifications**: Nodemailer with Gmail OAuth2 for automated email alerts.

## 3. Data Schema (Supabase)

### Table: `leave_requests`
- `id`: UUID (Primary Key)
- `employee_email`: Text (Foreign link to Airtable)
- `type`: Enum (pto, sick, wfh, birthday, anniversary)
- `start_date`: Date
- `end_date`: Date
- `status`: Enum (pending, approved, rejected)
- `reason`: Text
- `rejection_reason`: Text
- `created_at`: Timestamp

### Table: `posts`
- `id`: UUID (Primary Key)
- `author_email`: Text
- `content`: Text
- `reactions`: JSONB (Stores emoji reaction counts)
- `created_at`: Timestamp

### Table: `audit_log`
- `id`: UUID (Primary Key)
- `actor_email`: Text
- `action`: Text
- `details`: Text
- `timestamp`: Timestamp

## 4. Key Workflows

### Authentication
1. User logs in via Google.
2. System fetches employee record from Airtable using the email.
3. If user exists, session is created with assigned role (Admin, HR, Employee).
4. If not found, login is rejected.

### Leave Submission & Approval
1. Employee submits request via modal.
2. Record is created in Supabase (`pending`).
3. Admin/HR receives email notification.
4. Admin/HR approves/rejects via dashboard.
5. Record is updated in Supabase.
6. Employee receives confirmation email.

### Daily Digest (Cron Job)
1. Vercel Cron triggers the `/api/cron/daily-digest` endpoint.
2. System fetches today's birthdays/anniversaries from Airtable.
3. System fetches today's approved leaves from Supabase.
4. System compiles and sends a summary email to the HR team.
