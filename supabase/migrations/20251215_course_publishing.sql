-- Add granular publishing fields to courses
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS published_for_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS published_for_user BOOLEAN DEFAULT FALSE;

-- Migrate existing data (Optional: Assume active courses should be visible to admins?)
-- UPDATE courses SET published_for_admin = isActive, published_for_user = isActive;
