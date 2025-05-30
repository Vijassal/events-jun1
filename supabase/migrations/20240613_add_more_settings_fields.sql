-- Migration: Add more configuration fields to settings table
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS currency text,
ADD COLUMN IF NOT EXISTS theme text,
ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_private boolean NOT NULL DEFAULT false; 