# RISE HR Portal

A minimalist, high-performance HR Management System built with **Next.js 15**, designed for modern teams who value visual excellence and seamless automation.

![RISE HR Banner](https://github.com/Akshvt/RISE-HR-Portal/raw/master/rise-hr-app/public/favicon.png)

## 🚀 Overview

RISE HR is a production-ready portal that streamlines administrative workflows, including leave management, internal communications, and system auditing. It features a "Glassmorphism" inspired UI, robust role-based access control, and deep integration with external data sources like Airtable and Supabase.

## ✨ Features by Role

### 👤 For Every Employee
- **Secure Authentication**: Instant login via Google OAuth, automatically linked to your corporate profile.
- **Personal Leave Dashboard**: Track your leave history, pending requests, and upcoming holidays in one place.
- **Smart Leave Requests**: Apply for PTO, Sick Days, WFH, or Planned Leaves with a sleek, interactive modal.
- **Team Calendar**: Stay updated with team-wide holidays, birthdays, and anniversaries.
- **Engagement Board**: Stay connected with company announcements and express yourself with emoji reactions.
- **Automated Alerts**: Get notified via email the moment your leave is submitted, approved, or reverted.

### 🛡 For HR & Admins
- **Global Oversight**: Access a centralized dashboard to manage every leave request across the entire organization.
- **One-Click Decisions**: Approve or reject requests instantly. Need more info? Revert a request back to pending.
- **Self-Approval**: Streamlined workflow allowing HR and Admins to manage their own requests without blockers.
- **Corporate Announcements**: Create, edit, and manage global posts to keep the team informed.
- **Audit Logging**: A complete, unchangeable record of every system event for compliance and transparency.
- **Operational Insights**: High-level metrics on team availability and system activity with CSV export support.

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Authentication**: NextAuth.js (Google OAuth 2.0)
- **Primary Database**: Supabase (PostgreSQL)
- **Team Registry**: Airtable API
- **Styling**: Vanilla CSS with Design Tokens & Glassmorphism
- **Email Service**: Nodemailer with Google OAuth2 (Gmail)
- **Deployment**: Vercel

---

## 🔄 Application Flow

### 1. Authentication & Onboarding
Users sign in via Google. The system verifies their email against the **Airtable Team Registry**. If found, the user is assigned their specific role (Admin, HR, or Employee) and granted access to the portal.

### 2. Leave Lifecycle
- **Submission**: Employee requests leave via an interactive modal.
- **Notification**: Admins and HR receive instant emails and in-app alerts.
- **Action**: Admins can Approve, Reject (with reason), or Revert requests.
- **Confirmation**: Employees receive automated emails once their request is processed.

### 3. Automated Reporting
Every morning at 9:00 AM UTC, a Vercel Cron job triggers the **Daily Digest**, sending a summary of today's leaves, birthdays, and pending requests to the HR team.

---

## 💻 Local Setup Guide

Follow these steps to get a local instance of the RISE HR Portal running on your machine.

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

### 2. Clone the Repository
Open your terminal and run:
```bash
git clone https://github.com/Akshvt/RISE-HR-Portal.git
cd RISE-HR-Portal
```

### 3. Install Dependencies
Navigate into the application folder and install the required packages:
```bash
cd rise-hr-app
npm install
```

### 4. Database & API Configuration
The portal requires connections to Supabase, Airtable, and Google.
1. Create a `.env.local` file in the `rise-hr-app` directory.
2. Use the provided `.env.example` as a template:
   ```bash
   cp .env.example .env.local
   ```
3. Fill in your specific keys for:
   - **Supabase**: URL and Service Role Key (for administrative actions).
   - **Airtable**: Personal Access Token, Base ID, and Table ID for your Team registry.
   - **Google OAuth**: Client ID and Secret for the "Sign in with Google" flow.
   - **Gmail SMTP**: Your email and a Refresh Token to enable automated notifications.

### 5. Launch the Portal
Start the development server:
```bash
npm run dev
```
The app will be available at **`http://localhost:3000`**.

---

## 🛡 License

Distributed under the MIT License. See `LICENSE` for more information.

Developed by **Akshat Singh**.
