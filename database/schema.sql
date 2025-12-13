-- ==========================================
-- FDC TAX CRM - CLIENTS TABLE SCHEMA
-- For fdctax Luna Onboarding Sandbox
-- ==========================================

CREATE TABLE IF NOT EXISTS clients (
    -- Primary Key
    system_id SERIAL PRIMARY KEY,
    
    -- Identifiers
    code TEXT,
    type TEXT DEFAULT 'Individual',  -- 'Individual', 'Company', 'Trust'
    abn TEXT,  -- Australian Business Number (11 digits)
    tfn TEXT,  -- Tax File Number (ENCRYPTED - 9 digits)
    acn TEXT,  -- Australian Company Number
    director_id TEXT,
    industry_code TEXT,
    
    -- Personal Details
    name TEXT,  -- Full name (computed from first + middle + last)
    trading_name TEXT,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    casual_name TEXT,  -- Preferred name
    title TEXT,  -- Mr, Mrs, Miss, Ms, Dr, Prof
    suffix TEXT,
    gender TEXT,  -- Male, Female, Other
    birth_date TEXT,  -- YYYY-MM-DD format
    death_date TEXT,
    
    -- Contact Information
    email TEXT,
    phone TEXT,  -- Home phone
    mobile TEXT,  -- Mobile phone
    fax TEXT,
    
    -- Postal Address
    postal_address_line_1 TEXT,
    postal_address_line_2 TEXT,
    postal_address_location TEXT,  -- Suburb/City
    postal_address_state TEXT,  -- NSW, VIC, QLD, SA, WA, TAS, NT, ACT
    postal_address_postcode TEXT,  -- 4 digits
    postal_address_country TEXT DEFAULT 'Australia',
    
    -- Business Address
    business_address_line_1 TEXT,
    business_address_line_2 TEXT,
    business_address_location TEXT,
    business_address_state TEXT,
    business_address_postcode TEXT,
    business_address_country TEXT DEFAULT 'Australia',
    
    -- Residential Address (Home Address)
    residential_address_line_1 TEXT,
    residential_address_line_2 TEXT,
    residential_address_location TEXT,
    residential_address_state TEXT,
    residential_address_postcode TEXT,
    residential_address_country TEXT DEFAULT 'Australia',
    
    -- Additional Contacts
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    
    -- Banking Details
    eft_account_name TEXT,
    eft_account_number TEXT,
    eft_bsb_number TEXT,  -- Format: 000-000
    
    -- Service Flags
    fee_from_refund TEXT DEFAULT 'N',  -- Y/N
    manage_activity_statements TEXT DEFAULT 'Y',  -- Y/N - BAS/IAS
    manage_tax_returns TEXT DEFAULT 'Y',  -- Y/N
    
    -- Luna Onboarding Specific Fields
    fdc_start_date TEXT,  -- When they started FDC
    entity_name TEXT,  -- If not sole trader
    is_sole_trader TEXT DEFAULT 'Y',  -- Y/N
    
    -- Deductions Profile
    uses_car TEXT,  -- Y/N
    car_method TEXT,  -- logbook/cents_per_km
    uses_home_office TEXT,  -- Y/N
    uses_mobile TEXT,  -- Y/N
    mobile_business_percent TEXT,  -- percentage
    uses_internet TEXT,  -- Y/N
    
    -- Previous Accountant
    used_accountant_previously TEXT,  -- Y/N
    prev_accountant_name TEXT,
    prev_accountant_firm TEXT,
    prev_accountant_email TEXT,
    
    -- Annature Integration
    id_verification_status TEXT,  -- pending/verified/failed
    id_verification_date TIMESTAMP,
    envelope_id TEXT,  -- Annature envelope ID
    engagement_letter_signed TEXT DEFAULT 'N',  -- Y/N
    engagement_letter_signed_date TIMESTAMP,
    
    -- Admin Fields
    client_owner TEXT DEFAULT 'Luna',  -- Assigned staff member
    groups TEXT,  -- Client groups/tags
    has_access TEXT DEFAULT 'N',  -- Y/N - Portal access
    archived TEXT DEFAULT 'N',  -- Y/N - Archived status
    
    -- Resume/Recovery
    uuid TEXT UNIQUE,  -- For resume links
    onboarding_stage INTEGER DEFAULT 1,  -- Current stage (1-9)
    onboarding_data JSONB,  -- Store partial progress
    onboarding_completed TEXT DEFAULT 'N',  -- Y/N
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_casual_name ON clients(casual_name);
CREATE INDEX IF NOT EXISTS idx_clients_abn ON clients(abn);
CREATE INDEX IF NOT EXISTS idx_clients_uuid ON clients(uuid);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Set starting sequence for system_id to 143000
SELECT setval('clients_system_id_seq', 143000, false);

-- ==========================================
-- IMPORTANT NOTES:
-- ==========================================
-- 1. TFN field stores ENCRYPTED data using Fernet (symmetric encryption)
--    Encryption key stored in .env as ENCRYPTION_KEY (32 bytes)
--
-- 2. system_id starts from 143000 and auto-increments
--
-- 3. uuid is used for resume links: https://fdctax.com.au/luna/client/[uuid]
--
-- 4. onboarding_data stores partial progress as JSON for recovery
-- ==========================================
