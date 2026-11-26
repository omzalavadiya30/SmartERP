CREATE TABLE IF NOT EXISTS companies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES users,
 name text NOT NULL, address text NOT NULL, state text NOT NULL, gstin text NOT NULL DEFAULT '',
 contact text NOT NULL DEFAULT '', year_start date NOT NULL, unique(owner_id,name)
);
CREATE TABLE IF NOT EXISTS members (
 company_id uuid REFERENCES companies ON DELETE CASCADE, user_id uuid REFERENCES users,
 role text NOT NULL CHECK(role IN ('operator','viewer')), PRIMARY KEY(company_id,user_id)
);
CREATE TABLE IF NOT EXISTS masters (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES companies ON DELETE CASCADE,
 kind text NOT NULL, name text NOT NULL, category text NOT NULL DEFAULT '', system_key text,
 details jsonb NOT NULL DEFAULT '{}', UNIQUE(company_id,kind,name), UNIQUE(company_id,system_key),
 UNIQUE(company_id,id)
);
CREATE UNIQUE INDEX IF NOT EXISTS item_sku ON masters(company_id,lower(details->>'sku')) WHERE kind='item';
CREATE TABLE IF NOT EXISTS vouchers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL REFERENCES companies ON DELETE CASCADE,
 number text NOT NULL, kind text NOT NULL, date date NOT NULL, request_id uuid NOT NULL,
 details jsonb NOT NULL, total numeric(16,2) NOT NULL DEFAULT 0, author_id uuid NOT NULL REFERENCES users,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id,number), UNIQUE(company_id,request_id), UNIQUE(company_id,id)
);
CREATE TABLE IF NOT EXISTS postings (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, company_id uuid NOT NULL,
 voucher_id uuid NOT NULL, ledger_id uuid NOT NULL, amount numeric(16,2) NOT NULL,
 cleared_on date, cheque text NOT NULL DEFAULT '',
 FOREIGN KEY(company_id,voucher_id) REFERENCES vouchers(company_id,id) ON DELETE CASCADE,
 FOREIGN KEY(company_id,ledger_id) REFERENCES masters(company_id,id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED
);
CREATE TABLE IF NOT EXISTS movements (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, company_id uuid NOT NULL, voucher_id uuid NOT NULL,
 item_id uuid NOT NULL, location text NOT NULL, bucket text NOT NULL, qty numeric(16,3) NOT NULL, value numeric(16,2) NOT NULL,
 FOREIGN KEY(company_id,voucher_id) REFERENCES vouchers(company_id,id) ON DELETE CASCADE,
 FOREIGN KEY(company_id,item_id) REFERENCES masters(company_id,id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX IF NOT EXISTS voucher_period ON vouchers(company_id,date);
CREATE INDEX IF NOT EXISTS party_statement ON postings(company_id,ledger_id);
CREATE INDEX IF NOT EXISTS stock_history ON movements(company_id,item_id);
CREATE TABLE IF NOT EXISTS audit_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, company_id uuid NOT NULL REFERENCES companies ON DELETE CASCADE,
 actor uuid NOT NULL REFERENCES users, action text NOT NULL, description text NOT NULL, at timestamptz DEFAULT now()
);
-- The Express server connects through a dedicated trusted PostgreSQL role. Disable public table access via PostgREST.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS revoked_sessions (session_id uuid PRIMARY KEY,expires_at timestamptz NOT NULL);
ALTER TABLE revoked_sessions ENABLE ROW LEVEL SECURITY;
