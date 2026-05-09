ALTER TABLE entries ADD COLUMN path TEXT;
ALTER TABLE entries ADD COLUMN extension TEXT;
CREATE UNIQUE INDEX entries_path_idx ON entries(path);
