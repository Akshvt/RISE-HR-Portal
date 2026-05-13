# RISE HR Portal - Requirements Document (PRD)

## 1. Project Goal
Create a minimalist yet powerful HR portal for the RISE team to manage internal workflows, boost connectivity, and automate administrative tasks.

## 2. Target Audience
- **Employees**: To request leaves, see holidays, and stay updated.
- **HR/Admins**: To manage requests, post announcements, and monitor system activity.

## 3. Functional Requirements

### Phase 1: Foundation & Auth
- **Google OAuth**: Mandatory login using corporate Google accounts.
- **Role System**: Distinguish between Admin, HR, and Employee based on an Airtable registry.
- **Branding**: Minimalist "Glassmorphism" UI with dark mode support.

### Phase 2: Leave Management
- **Dashboard**: View personal leave balance and upcoming holidays.
- **Requests**: Submit PTO, Sick Leave, and WFH requests.
- **Admin Panel**: Centralized view for HR/Admins to approve or reject requests.
- **Notifications**: Automatic email alerts for every step of the leave lifecycle.

### Phase 3: Connectivity & Insights
- **Announcement Board**: A social wall for team updates with interactive emoji reactions.
- **Team Calendar**: Visual grid showing holidays, birthdays, and anniversaries.
- **Audit Logs**: Track every administrative action for accountability.
- **Export**: Ability for HR to download leave data in CSV format.

## 4. Non-Functional Requirements
- **Performance**: Page load times under 1.5s.
- **Accessibility**: High-contrast support for both light and dark modes.
- **Security**: Environment variables for all sensitive keys; no secrets in version control.
- **Scalability**: Designed to handle 100+ team members with ease.
