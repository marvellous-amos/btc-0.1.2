'''sql

CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tin TEXT UNIQUE NOT NULL CHECK (tin ~ '^[0-9]{8}-[0-9]{4}$'),
    business_name TEXT NOT NULL,
    incorporation_date DATE NOT NULL,
    industry_classfication TEXT NOT NULL,

    -- Address
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state_name TEXT NOT NULL CHECK (state_name IN (SELECT name FROM states)),
    postal_code TEXT,

    -- Classification Inputs
    annulal_turnover DECIMAL(15,2) DEFAULT 0 CHECK (annulal_turnover >= 0),
    total_fixed_assets DECIMAL(15,2) DEFAULT 0 CHECK (total_fixed_assets >= 0),
    is_professional_services BOOLEAN DEFAULT FALSE,

    -- Computed Classification
    entity_class TEXT NOT NULL DEFAULT 'STANDARD' CHECK (entity_class IN ('SMALL', 'STANDARD')),
    exampt_from_cit BOOLEAN GENERATED ALWAYS AS (entity_class = 'SMALL') STORED,
    subject_to_dev_levy BOOLEAN GENERATED ALWAYS AS (entity_class = 'STANDARD') STORED,
    classfication_timestamp TIMESTAMPTZ,
    classication_reasoning JSONB,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    -- Audit 
    version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE states (
    code CHAR(2) PRIMARY KEY,
    name TEXT NOT NULL
);

INSERT INTO states (code, name) VALUES
('AB','Abia'), ('AD','Adamawa'), ('AK','Akwa Ibom'), ('AN','Anambra'),
('BA','Bauchi'), ('BY','Bayelsa'), ('BE','Benue'), ('BO','Borno'),
('CR','Cross River'), ('DE','Delta'), ('EB','Ebonyi'), ('ED','Edo'),
('EK','Ekiti'), ('EN','Enugu'), ('GO','Gombe'), ('IM','Imo'),
('JI','Jigawa'), ('KD','Kaduna'), ('KN','Kano'), ('KT','Katsina'),
('KE','Kebbi'), ('KO','Kogi'), ('KW','Kwara'), ('LA','Lagos'),
('NA','Nasarawa'), ('NI','Niger'), ('OG','Ogun'), ('ON','Ondo'),
('OS','Osun'), ('OY','Oyo'), ('PL','Plateau'), ('RI','Rivers'),
('SO','Sokoto'), ('TA','Taraba'), ('YO','Yobe'), ('ZA','Zamfara'),
('FC','FCT');

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);


''';