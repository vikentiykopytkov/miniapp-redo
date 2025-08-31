CREATE TABLE IF NOT EXISTS users (
id SERIAL PRIMARY KEY,
telegram_id BIGINT UNIQUE NOT NULL,
username TEXT,
first_name TEXT,
last_name TEXT,
created_at BIGINT NOT NULL,
last_free_spin_at BIGINT
);


CREATE TABLE IF NOT EXISTS prizes (
id SERIAL PRIMARY KEY,
title TEXT NOT NULL,
image_url TEXT,
value_stars INTEGER NOT NULL,
weight_base REAL NOT NULL DEFAULT 1.0,
tier_mask INTEGER NOT NULL DEFAULT 15,
active BOOLEAN NOT NULL DEFAULT TRUE
);


CREATE TABLE IF NOT EXISTS spins (
id BIGSERIAL PRIMARY KEY,
user_id INTEGER NOT NULL REFERENCES users(id),
tier INTEGER NOT NULL,
stake_stars INTEGER NOT NULL,
prize_id INTEGER REFERENCES prizes(id),
payout_stars INTEGER NOT NULL DEFAULT 0,
created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_spins_user ON spins(user_id);


CREATE TABLE IF NOT EXISTS rtp_bank (
id INTEGER PRIMARY KEY,
total_stakes BIGINT NOT NULL,
total_payouts BIGINT NOT NULL,
CONSTRAINT rtp_bank_single CHECK (id = 1)
);
INSERT INTO rtp_bank (id, total_stakes, total_payouts)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;