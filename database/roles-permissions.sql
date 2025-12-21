-- ==========================================
-- SANDBOX DATABASE ROLES & PERMISSIONS
-- CRITICAL: Secure access control
-- ==========================================

-- ==========================================
-- STEP 1: CREATE SCHEMAS (if not exist)
-- ==========================================

-- Create myfdc schema for MyFDC app tables
CREATE SCHEMA IF NOT EXISTS myfdc;

-- Create crm schema for CRM app tables
CREATE SCHEMA IF NOT EXISTS crm;

-- ==========================================
-- STEP 2: CREATE ROLES
-- ==========================================

-- Drop roles if they exist (for clean setup)
DROP ROLE IF EXISTS myfdc_user;
DROP ROLE IF EXISTS crm_user;
DROP ROLE IF EXISTS emergent_dev;

-- Create myfdc_user role
CREATE ROLE myfdc_user WITH LOGIN PASSWORD 'AVNS_p5zBjf0WxY2MrRcRh87';

-- Create crm_user role
CREATE ROLE crm_user WITH LOGIN PASSWORD 'AVNS_mQNcSY7kSRQbq6ruegy';

-- Create emergent_dev role (temporary dev access)
CREATE ROLE emergent_dev WITH LOGIN PASSWORD 'AVNS_XJn5_csT6Xx-dMTvw6_';

-- ==========================================
-- STEP 3: MOVE TABLES TO APPROPRIATE SCHEMAS
-- ==========================================

-- Move MyFDC-related tables to myfdc schema
ALTER TABLE IF EXISTS public.calculations SET SCHEMA myfdc;
ALTER TABLE IF EXISTS public.user_checklists SET SCHEMA myfdc;
ALTER TABLE IF EXISTS public.user_conversations SET SCHEMA myfdc;

-- Move CRM-related tables to crm schema
ALTER TABLE IF EXISTS public.clients SET SCHEMA crm;
ALTER TABLE IF EXISTS public.tasks SET SCHEMA crm;
ALTER TABLE IF EXISTS public.messages SET SCHEMA crm;
ALTER TABLE IF EXISTS public.documents SET SCHEMA crm;
ALTER TABLE IF EXISTS public.email_templates SET SCHEMA crm;
ALTER TABLE IF EXISTS public.knowledge_base SET SCHEMA crm;
ALTER TABLE IF EXISTS public.kb_entries SET SCHEMA crm;

-- ==========================================
-- STEP 4: GRANT SCHEMA USAGE
-- ==========================================

-- myfdc_user: Access to myfdc schema, limited crm access
GRANT USAGE ON SCHEMA myfdc TO myfdc_user;
GRANT USAGE ON SCHEMA crm TO myfdc_user;

-- crm_user: Full access to crm schema, read myfdc
GRANT USAGE ON SCHEMA crm TO crm_user;
GRANT USAGE ON SCHEMA myfdc TO crm_user;

-- emergent_dev: Full myfdc access, limited crm access
GRANT USAGE ON SCHEMA myfdc TO emergent_dev;
GRANT USAGE ON SCHEMA crm TO emergent_dev;

-- ==========================================
-- STEP 5: MYFDC_USER PERMISSIONS
-- Full access to myfdc schema
-- Read-only safe CRM fields only
-- ==========================================

-- Full access to myfdc schema tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA myfdc TO myfdc_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA myfdc TO myfdc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA myfdc GRANT ALL PRIVILEGES ON TABLES TO myfdc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA myfdc GRANT ALL PRIVILEGES ON SEQUENCES TO myfdc_user;

-- Read-only on SAFE crm.clients columns only (via a view)
-- No access to: tfn, abn, acn, eft_account_name, eft_account_number, eft_bsb_number

-- ==========================================
-- STEP 6: CRM_USER PERMISSIONS
-- Full access to crm schema
-- Read-only on myfdc schema
-- ==========================================

-- Full access to crm schema tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA crm TO crm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA crm TO crm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm GRANT ALL PRIVILEGES ON TABLES TO crm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA crm GRANT ALL PRIVILEGES ON SEQUENCES TO crm_user;

-- Read-only on myfdc schema
GRANT SELECT ON ALL TABLES IN SCHEMA myfdc TO crm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA myfdc GRANT SELECT ON TABLES TO crm_user;

-- ==========================================
-- STEP 7: EMERGENT_DEV PERMISSIONS
-- Full access to myfdc schema
-- Read-only safe CRM fields only
-- ==========================================

-- Full access to myfdc schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA myfdc TO emergent_dev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA myfdc TO emergent_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA myfdc GRANT ALL PRIVILEGES ON TABLES TO emergent_dev;
ALTER DEFAULT PRIVILEGES IN SCHEMA myfdc GRANT ALL PRIVILEGES ON SEQUENCES TO emergent_dev;

-- ==========================================
-- STEP 8: CREATE SECURE VIEW FOR CLIENT DATA
-- This view exposes only safe columns
-- ==========================================

-- Create a secure view in myfdc schema for safe client data
CREATE OR REPLACE VIEW myfdc.clients_safe AS
SELECT 
    system_id,
    code,
    type,
    name,
    trading_name,
    first_name,
    middle_name,
    last_name,
    casual_name,
    title,
    gender,
    email,
    phone,
    mobile,
    business_address_line_1,
    business_address_line_2,
    business_address_location,
    business_address_state,
    business_address_postcode,
    business_address_country,
    fdc_start_date,
    entity_name,
    is_sole_trader,
    gst_registered,
    bas_quarter,
    business_name,
    fdc_percent,
    start_date,
    status,
    created_at,
    updated_at
FROM crm.clients;

-- Grant access to the safe view
GRANT SELECT ON myfdc.clients_safe TO myfdc_user;
GRANT SELECT ON myfdc.clients_safe TO emergent_dev;

-- ==========================================
-- STEP 9: REVOKE SENSITIVE ACCESS
-- Explicitly deny access to sensitive tables/columns
-- ==========================================

-- Revoke direct access to crm.clients for myfdc_user and emergent_dev
REVOKE ALL ON crm.clients FROM myfdc_user;
REVOKE ALL ON crm.clients FROM emergent_dev;

-- Only allow access via the safe view
-- myfdc_user and emergent_dev can only see clients_safe view

-- ==========================================
-- STEP 10: GRANT PUBLIC SCHEMA ACCESS
-- For any remaining public tables
-- ==========================================

GRANT USAGE ON SCHEMA public TO myfdc_user;
GRANT USAGE ON SCHEMA public TO crm_user;
GRANT USAGE ON SCHEMA public TO emergent_dev;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- List all roles
-- SELECT rolname FROM pg_roles WHERE rolname IN ('myfdc_user', 'crm_user', 'emergent_dev');

-- Test myfdc_user cannot see TFN:
-- SET ROLE myfdc_user;
-- SELECT tfn FROM crm.clients; -- Should fail
-- SELECT * FROM myfdc.clients_safe; -- Should work
-- RESET ROLE;

-- ==========================================
-- SUCCESS
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Roles created successfully!';
    RAISE NOTICE '✅ myfdc_user - Full myfdc, read-only safe CRM fields';
    RAISE NOTICE '✅ crm_user - Full CRM, read-only myfdc';
    RAISE NOTICE '✅ emergent_dev - Full myfdc, read-only safe CRM fields';
END $$;
