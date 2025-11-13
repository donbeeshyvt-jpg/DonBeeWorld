-- Make accounts.password_plain nullable
ALTER TABLE accounts
  ALTER COLUMN password_plain DROP NOT NULL;

