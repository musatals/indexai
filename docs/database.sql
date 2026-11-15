-- Atlas IA | PostgreSQL target schema for the authenticated future backend.
-- Not required by the statically deployed v1 (v1 uses JSON).
-- Nullable attributes mean unknown, NOT false / unavailable.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_fr text NOT NULL,
  name_en text,
  parent_id uuid REFERENCES category(id) ON DELETE SET NULL,
  family text NOT NULL,
  description_fr text,
  description_en text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tool (
  id text PRIMARY KEY, -- stable IDs e.g. AI-0001
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  publisher text,
  summary_fr text,
  summary_en text,
  details_fr text,
  details_en text,
  official_url text,
  nature text NOT NULL,
  pricing_model text, -- NULL if unknown
  license text, -- NULL if unknown
  api_available boolean, -- NULL if unknown
  verified_at timestamptz, -- NULL until individually verified
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','in_review','verified','stale','discontinued')),
  inventory_date date,
  publish_status text NOT NULL DEFAULT 'draft'
    CHECK (publish_status IN ('draft','published','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tool_category (
  tool_id text NOT NULL REFERENCES tool(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (tool_id,category_id)
);
CREATE UNIQUE INDEX one_primary_category_per_tool ON tool_category(tool_id) WHERE is_primary;
CREATE INDEX category_tools_lookup ON tool_category(category_id,tool_id);
CREATE TABLE tag (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_fr text NOT NULL,
  name_en text
);
CREATE TABLE tool_tag (
  tool_id text REFERENCES tool(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY(tool_id,tag_id)
);
CREATE TABLE use_case (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name_fr text NOT NULL,
  name_en text,
  description_fr text,
  description_en text
);
CREATE TABLE tool_use_case (
  tool_id text REFERENCES tool(id) ON DELETE CASCADE,
  use_case_id uuid REFERENCES use_case(id) ON DELETE CASCADE,
  justification text, -- why this tool matches; require sourcing before publish
  verified_at timestamptz,
  PRIMARY KEY(tool_id,use_case_id)
);
CREATE TABLE source (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text,
  title text,
  publisher text,
  retrieved_at timestamptz,
  source_kind text NOT NULL DEFAULT 'discovery',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE tool_source (
  tool_id text REFERENCES tool(id) ON DELETE CASCADE,
  source_id uuid REFERENCES source(id) ON DELETE CASCADE,
  claim text,
  evidence_date timestamptz,
  PRIMARY KEY(tool_id,source_id)
);
CREATE TABLE tool_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL REFERENCES tool(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK(media_type IN ('official_logo','favicon','verified_screenshot','other')),
  storage_url text NOT NULL,
  alt_fr text,
  alt_en text,
  rights_note text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE data_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text NOT NULL REFERENCES tool(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','verified','rejected','stale')),
  source_id uuid REFERENCES source(id),
  reviewed_by text,
  reviewed_at timestamptz,
  note text
);
CREATE TABLE user_collection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  title text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE user_collection_tool (
  collection_id uuid REFERENCES user_collection(id) ON DELETE CASCADE,
  tool_id text REFERENCES tool(id) ON DELETE CASCADE,
  ordinal integer NOT NULL DEFAULT 0,
  PRIMARY KEY(collection_id,tool_id)
);
CREATE TABLE user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id text REFERENCES tool(id) ON DELETE SET NULL,
  feedback_kind text NOT NULL,
  description text NOT NULL,
  source_url text,
  status text NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE TABLE import_batch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file text NOT NULL,
  sha256 text NOT NULL,
  imported_by text NOT NULL,
  inserted_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  conflict_count integer NOT NULL DEFAULT 0,
  imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit_event (
  id bigserial PRIMARY KEY,
  actor_id text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tools_last_verification ON tool(verified_at);
CREATE INDEX tools_status_index ON tool(verification_status,publish_status);
CREATE INDEX tool_name_search ON tool USING gin(to_tsvector('simple',coalesce(name,'') || ' ' || coalesce(summary_fr,'') || ' ' || coalesce(summary_en,'')));
CREATE INDEX feedback_status_index ON user_feedback(status,submitted_at DESC);
CREATE INDEX audit_entity_index ON audit_event(entity_type,entity_id,recorded_at DESC);
-- Enforce authentication & authorization at API/service layer; never expose service DB credentials to browser.
