-- =============================================================================
-- Lucid-Lab Chat Bot — Initial Schema
-- =============================================================================
-- New dedicated Supabase project. All timestamps UTC.
-- Run this in Supabase SQL editor or via `supabase db push`.

-- =============================================
-- CORE TABLES
-- =============================================

CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid UNIQUE NOT NULL,                    -- anonymous visitor identifier (set by bot, stored in localStorage)
  email text,
  first_name text,
  last_name text,
  company text,
  language text DEFAULT 'fr',                         -- 'fr' | 'en'
  source text NOT NULL DEFAULT 'chat_widget',         -- 'chat_widget' | 'website_form' | 'direct_api'
  visitor_ip_hash text,                               -- sha256(ip + salt) — never store raw IP
  user_agent text,
  marketing_consent boolean DEFAULT false,
  marketing_consent_at timestamptz,
  privacy_notice_shown boolean DEFAULT false,
  privacy_notice_shown_at timestamptz,
  deletion_requested_at timestamptz,
  deletion_completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'active',              -- 'active' | 'escalated' | 'closed'
  escalation_reason text,
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  escalated_at timestamptz,
  closed_at timestamptz
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  direction text NOT NULL,                            -- 'inbound' | 'outbound_bot'
  content_type text NOT NULL DEFAULT 'text',          -- 'text' | 'tool_result' | 'interactive'
  content jsonb NOT NULL,
  ai_metadata jsonb,                                  -- { model, tokens, tool_calls, cost_eur }
  created_at timestamptz DEFAULT now()
);

CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'new',                 -- 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  project_brief text,                                 -- free-text summary captured by bot
  interest jsonb,                                     -- structured fields { services:[], urgency, team_size, budget_range }
  notes text,
  follow_up_at timestamptz,
  last_followup_sent_at timestamptz,
  followup_step integer DEFAULT 0,                    -- 0 = none, 1 = 24h, 2 = 72h, 3 = 7d
  marketing_consent boolean DEFAULT false,
  marketing_consent_source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE ai_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,                             -- 'services' | 'methodology' | 'case_studies' | 'pricing' | 'faq' | 'about' | 'tech_stack'
  topic text NOT NULL,
  content text NOT NULL,
  language text NOT NULL DEFAULT 'fr',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (category, topic, language)
);

CREATE TABLE tidycal_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  tidycal_booking_id bigint UNIQUE,                   -- returned by TidyCal API
  booking_type_id bigint,
  starts_at timestamptz NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  timezone text DEFAULT 'Europe/Paris',
  status text DEFAULT 'confirmed',                    -- 'confirmed' | 'cancelled'
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- SECURITY / OPERATIONS TABLES
-- =============================================

CREATE TABLE rate_limit_buckets (
  id bigserial PRIMARY KEY,
  bucket_key text NOT NULL,                           -- 'ip:<hash>' | 'session:<uuid>' | 'global:<name>'
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  UNIQUE (bucket_key, window_start)
);

CREATE TABLE security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  event_type text NOT NULL,                           -- 'rate_limit_breach' | 'origin_rejected' | 'turnstile_failed' | 'erasure_requested' | 'admin_access'
  details jsonb NOT NULL,
  ip_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE daily_ai_budget (
  date date PRIMARY KEY,
  spent_eur numeric(10,4) NOT NULL DEFAULT 0,
  tokens_used bigint NOT NULL DEFAULT 0,
  requests_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_contacts_session_id ON contacts(session_id);
CREATE INDEX idx_contacts_email ON contacts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_conversations_contact ON conversations(contact_id, started_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_followup ON leads(follow_up_at) WHERE status IN ('new', 'contacted', 'qualified');
CREATE INDEX idx_kb_category_lang ON ai_knowledge_base(category, language) WHERE active = true;
CREATE INDEX idx_kb_topic_trgm ON ai_knowledge_base USING gin (topic gin_trgm_ops);
CREATE INDEX idx_kb_content_trgm ON ai_knowledge_base USING gin (content gin_trgm_ops);
CREATE INDEX idx_rate_limit_lookup ON rate_limit_buckets(bucket_key, window_start DESC);
CREATE INDEX idx_tidycal_contact ON tidycal_bookings(contact_id);
CREATE INDEX idx_audit_event_date ON security_audit_log(event_type, created_at);

-- Required for trigram indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update conversations.last_message_at on new messages
CREATE OR REPLACE FUNCTION touch_conversation_last_message()
RETURNS trigger AS $$
BEGIN
  UPDATE conversations
     SET last_message_at = NEW.created_at
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_touch_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION touch_conversation_last_message();

-- Auto-update contacts.updated_at
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();

-- =============================================
-- RPC helpers
-- =============================================

-- Atomic increment for rate-limit buckets.
-- Returns the new request_count for the (bucket_key, window_start) row.
CREATE OR REPLACE FUNCTION increment_rate_limit(
  p_bucket_key text,
  p_window_start timestamptz
) RETURNS json AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO rate_limit_buckets (bucket_key, window_start, request_count)
  VALUES (p_bucket_key, p_window_start, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET request_count = rate_limit_buckets.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN json_build_object('count', v_count);
END;
$$ LANGUAGE plpgsql;

-- Atomic increment for daily AI budget.
CREATE OR REPLACE FUNCTION increment_daily_ai_budget(
  p_date date,
  p_tokens bigint,
  p_cost numeric
) RETURNS void AS $$
BEGIN
  INSERT INTO daily_ai_budget (date, tokens_used, spent_eur, requests_count, updated_at)
  VALUES (p_date, p_tokens, p_cost, 1, now())
  ON CONFLICT (date)
  DO UPDATE SET
    tokens_used = daily_ai_budget.tokens_used + p_tokens,
    spent_eur = daily_ai_budget.spent_eur + p_cost,
    requests_count = daily_ai_budget.requests_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- RLS — deny-all by default; bot uses service role (which bypasses RLS)
-- =============================================

ALTER TABLE contacts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tidycal_bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_buckets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_ai_budget       ENABLE ROW LEVEL SECURITY;

-- No policies = deny all access to anon/authenticated roles.
-- The service_role key bypasses RLS entirely — only the bot server uses it.
