CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER REFERENCES contacts(id),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_contact_timestamp 
  ON messages(contact_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_name_phone 
  ON contacts(name, phone_number);

CREATE INDEX IF NOT EXISTS idx_messages_content 
  ON messages(content);
