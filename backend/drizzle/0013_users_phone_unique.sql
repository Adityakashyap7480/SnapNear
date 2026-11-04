-- One live account per mobile number. Deleted accounts store phone as '' and stay allowed.
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_unique" ON "users" ("phone") WHERE "phone" <> '';
