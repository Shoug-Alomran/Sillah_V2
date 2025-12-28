PRAGMA foreign_keys = ON;

-- ============================
-- 1. USERS
-- ============================
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,

    -- FIXED: roles now match your app (citizen = patient)
    role TEXT NOT NULL CHECK (role IN ('citizen', 'provider', 'admin')),

    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 2. FAMILY MEMBERS
-- ============================
CREATE TABLE family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,

    name TEXT NOT NULL,
    relation TEXT NOT NULL,
    gender TEXT,
    birth_year INTEGER,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================
-- 3. HEALTH EVENTS
-- ============================
CREATE TABLE health_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_member_id INTEGER NOT NULL,

    condition TEXT NOT NULL,
    age_of_onset INTEGER,
    severity TEXT,
    notes TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (family_member_id) REFERENCES family_members(id) ON DELETE CASCADE
);

-- ============================
-- 4. RISK ALERTS
-- ============================
CREATE TABLE risk_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,

    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high')),
    message TEXT NOT NULL,
    viewed INTEGER DEFAULT 0,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================
-- 5. CLINICS
-- ============================
CREATE TABLE clinics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,
    city TEXT NOT NULL,
    phone TEXT,
    address TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 6. APPOINTMENTS
-- ============================
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    clinic_id INTEGER NOT NULL,

    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,

    status TEXT DEFAULT 'upcoming'
        CHECK (status IN ('upcoming', 'completed', 'cancelled')),

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

-- ============================
-- 7. AWARENESS CONTENT
-- ============================
CREATE TABLE awareness_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT,

    created_by INTEGER,
    approved INTEGER DEFAULT 0,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ============================
-- 8. NOTIFICATIONS
-- ============================
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,

    type TEXT NOT NULL,
    content TEXT NOT NULL,

    delivered INTEGER DEFAULT 0,
    delivered_at TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================
-- 9. AUDIT LOGS
-- ============================
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,

    action TEXT NOT NULL,
    ip_address TEXT,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================
-- 10. CONSENT RECORDS
-- ============================
CREATE TABLE consent_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,

    consent_given INTEGER NOT NULL,

    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
