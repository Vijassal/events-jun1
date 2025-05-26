-- Migration: Add currency column to account_instances
ALTER TABLE account_instances ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD'; 