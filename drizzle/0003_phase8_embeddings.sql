CREATE EXTENSION IF NOT EXISTS vector;
ALTER TABLE students ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE students ADD COLUMN IF NOT EXISTS needs_embedding boolean NOT NULL DEFAULT true;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS needs_embedding boolean NOT NULL DEFAULT true;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS contact_email text NOT NULL DEFAULT '';
ALTER TABLE corporates ADD COLUMN IF NOT EXISTS embedding vector(768);
ALTER TABLE corporates ADD COLUMN IF NOT EXISTS needs_embedding boolean NOT NULL DEFAULT true;
ALTER TABLE corporates ADD COLUMN IF NOT EXISTS contact_email text NOT NULL DEFAULT '';