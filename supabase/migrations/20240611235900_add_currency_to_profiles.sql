-- Migration: Add currency column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD'; 