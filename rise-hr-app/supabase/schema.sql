-- =============================================================
-- RISE HR Portal — Schema Migration
-- Run this in: Supabase Dashboard → SQL Editor → Run
-- This is SAFE to run even if tables already exist (idempotent)
-- =============================================================

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('full','half','sick','planned','wfh')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  half_session TEXT CHECK (half_session IN ('AM','PM')),
  reason TEXT,
  days_deducted NUMERIC(4,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ADD MISSING COLUMN if the table already existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'half_session'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN half_session TEXT CHECK (half_session IN ('AM','PM'));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN rejection_reason TEXT;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leave_requests' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN approved_by TEXT;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_leave_user ON leave_requests(user_email);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'Member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Announcement replies
CREATE TABLE IF NOT EXISTS announcement_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES announcement_replies(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL DEFAULT 'Member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reactions
CREATE TABLE IF NOT EXISTS announcement_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES announcement_replies(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('love','knowledge')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_email, announcement_id, reaction_type),
  UNIQUE(user_email, reply_id, reaction_type),
  CHECK ((announcement_id IS NOT NULL AND reply_id IS NULL) OR (announcement_id IS NULL AND reply_id IS NOT NULL))
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_email TEXT,
  actor_name TEXT,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_email, is_read);

-- Row Level Security
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: service_role bypasses RLS, so these just prevent anon access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_requests' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON leave_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON announcements FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'announcement_replies' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON announcement_replies FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'announcement_reactions' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON announcement_reactions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'service_role_all') THEN
    CREATE POLICY service_role_all ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END$$;

-- Force Supabase PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
