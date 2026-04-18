-- DASHLY Dashboard Builder - PostgreSQL Schema
-- Migration: Initial schema

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- 1. users
-- ─────────────────────────────────────────
CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    name          TEXT        NOT NULL,
    plan          TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);

-- ─────────────────────────────────────────
-- 2. workspaces
-- ─────────────────────────────────────────
CREATE TABLE workspaces (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id   UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name       TEXT        NOT NULL,
    plan       TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner_id ON workspaces (owner_id);

-- ─────────────────────────────────────────
-- 3. workspace_members
-- ─────────────────────────────────────────
CREATE TABLE workspace_members (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID        NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role         TEXT        NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace_id ON workspace_members (workspace_id);
CREATE INDEX idx_workspace_members_user_id      ON workspace_members (user_id);

-- ─────────────────────────────────────────
-- 4. connectors  (before dashboards / queries — referenced by queries)
-- ─────────────────────────────────────────
CREATE TABLE connectors (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID        NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    type         TEXT        NOT NULL CHECK (type IN ('stripe', 'postgres', 'mysql', 'bigquery', 'mongodb', 'redshift', 'snowflake', 'csv', 'rest_api', 'other')),
    config       JSONB       NOT NULL DEFAULT '{}',  -- store encrypted at app layer
    status       TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_connectors_workspace_id ON connectors (workspace_id);

-- ─────────────────────────────────────────
-- 5. dashboards
-- ─────────────────────────────────────────
CREATE TABLE dashboards (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID        NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    name         TEXT        NOT NULL,
    description  TEXT,
    template     TEXT,
    created_by   UUID        NOT NULL REFERENCES users (id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dashboards_workspace_id ON dashboards (workspace_id);
CREATE INDEX idx_dashboards_created_by   ON dashboards (created_by);

-- ─────────────────────────────────────────
-- 6. queries
-- ─────────────────────────────────────────
CREATE TABLE queries (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID        NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    connector_id UUID        REFERENCES connectors (id) ON DELETE SET NULL,
    query_text   TEXT        NOT NULL,
    type         TEXT        NOT NULL DEFAULT 'simple' CHECK (type IN ('simple', 'sql')),
    cache_ttl    INTEGER     NOT NULL DEFAULT 300 CHECK (cache_ttl >= 0),  -- seconds
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_queries_workspace_id  ON queries (workspace_id);
CREATE INDEX idx_queries_connector_id  ON queries (connector_id);

-- ─────────────────────────────────────────
-- 7. tiles
-- ─────────────────────────────────────────
CREATE TABLE tiles (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID        NOT NULL REFERENCES dashboards (id) ON DELETE CASCADE,
    query_id     UUID        REFERENCES queries (id) ON DELETE SET NULL,
    viz_type     TEXT        NOT NULL CHECK (viz_type IN ('bar', 'line', 'pie', 'table', 'number', 'area', 'scatter', 'heatmap', 'funnel', 'gauge', 'text', 'other')),
    config       JSONB       NOT NULL DEFAULT '{}',
    position_x   INTEGER     NOT NULL DEFAULT 0 CHECK (position_x >= 0),
    position_y   INTEGER     NOT NULL DEFAULT 0 CHECK (position_y >= 0),
    width        INTEGER     NOT NULL DEFAULT 4  CHECK (width  > 0),
    height       INTEGER     NOT NULL DEFAULT 4  CHECK (height > 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tiles_dashboard_id ON tiles (dashboard_id);
CREATE INDEX idx_tiles_query_id     ON tiles (query_id);

-- ─────────────────────────────────────────
-- 8. usage_tracking
-- ─────────────────────────────────────────
CREATE TABLE usage_tracking (
    id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id       UUID    NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
    month              DATE    NOT NULL,                              -- first day of month, e.g. 2026-04-01
    dashboards_created INTEGER NOT NULL DEFAULT 0 CHECK (dashboards_created >= 0),
    queries_executed   INTEGER NOT NULL DEFAULT 0 CHECK (queries_executed   >= 0),
    tiles_created      INTEGER NOT NULL DEFAULT 0 CHECK (tiles_created      >= 0),
    api_calls          INTEGER NOT NULL DEFAULT 0 CHECK (api_calls          >= 0),
    UNIQUE (workspace_id, month)
);

CREATE INDEX idx_usage_tracking_workspace_id ON usage_tracking (workspace_id);
CREATE INDEX idx_usage_tracking_month        ON usage_tracking (month);

-- ─────────────────────────────────────────
-- 9. share_tokens
-- ─────────────────────────────────────────
CREATE TABLE share_tokens (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID        NOT NULL REFERENCES dashboards (id) ON DELETE CASCADE,
    token        TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ
);

CREATE INDEX idx_share_tokens_dashboard_id ON share_tokens (dashboard_id);
CREATE INDEX idx_share_tokens_token        ON share_tokens (token);

-- ─────────────────────────────────────────
-- 10. alerts
-- ─────────────────────────────────────────
CREATE TABLE alerts (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID        NOT NULL REFERENCES dashboards (id) ON DELETE CASCADE,
    condition    TEXT        NOT NULL,
    threshold    NUMERIC     NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_dashboard_id ON alerts (dashboard_id);

-- ─────────────────────────────────────────
-- Auto-update updated_at via trigger
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users','workspaces','connectors','dashboards','queries','tiles'] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%I_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
            t, t
        );
    END LOOP;
END;
$$;

COMMIT;
