-- Migration: Create global settings table for feature toggles
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  religion_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  floorplan_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one row exists (enforced in app logic) 