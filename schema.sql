DROP TABLE IF EXISTS admin_messages;
DROP TABLE IF EXISTS hot_notes;
DROP TABLE IF EXISTS attachee_progress;
DROP TABLE IF EXISTS competencies;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_emoji TEXT DEFAULT '🤓',
    password TEXT NOT NULL, -- Plain text or hashed for demo/production simplicity
    role TEXT CHECK(role IN ('attachee', 'admin')) NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE competencies (
    id TEXT PRIMARY KEY,
    module_name TEXT NOT NULL,
    category TEXT NOT NULL,
    skill_title TEXT NOT NULL,
    growth_pointer TEXT NOT NULL,
    architecture_note TEXT NOT NULL
);

CREATE TABLE attachee_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    competency_id TEXT NOT NULL,
    rating INTEGER CHECK(rating BETWEEN 0 AND 3) DEFAULT 0,
    mastered BOOLEAN DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(competency_id) REFERENCES competencies(id) ON DELETE CASCADE
);

CREATE TABLE hot_notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    note_content TEXT NOT NULL,
    logged_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE admin_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    sender_type TEXT CHECK(sender_type IN ('attachee', 'admin')) NOT NULL,
    message_text TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed Default Admin Account
INSERT INTO users (id, username, avatar_emoji, password, role, status, first_name, last_name, email)
VALUES ('admin-01', 'admin', '🛡️', 'minda!mw', 'admin', 'approved', 'System', 'Administrator', 'admin@rugedo.org');

-- Seed Sample Competencies
INSERT INTO competencies (id, module_name, category, skill_title, growth_pointer, architecture_note) VALUES
('net-1', 'networking', 'Infrastructure', 'Structured Cabling & VLANs', 'Practice Cat6 keystone punch-downs and configure port-based VLAN trunking on a managed switch.', 'Hardware brands dictate syntax, but protocols dictate truth. Cisco offers deterministic CLI throughput, MikroTik gives low-cost scriptability, and Ubiquiti abstracts complexity.'),
('net-2', 'networking', 'Monitoring', 'LibreNMS & SNMP Polling', 'Deploy a LibreNMS instance, configure SNMPv3 community strings, and set up real-time CPU/link drop alerts.', 'Centralized log aggregation and SNMP polling prevent invisible bottlenecks before they cascade into outages.'),
('sys-1', 'business_systems', 'Databases', 'Relational DB Design & Backups', 'Write complex SQL JOIN queries and automate daily local database backup cron jobs with restoration drills.', 'Enterprise monolithic suites (SAP, Oracle) offer rigid compliance, while modular open-source or custom Python/PostgreSQL stacks offer rapid adaptability.'),
('hlp-1', 'help_desk', 'Support Operations', 'Ticketing Lifecycle & RCA', 'Log incidents with 5-digit indexing, assign P1-P4 severity matrices, and write executive Root-Cause Analysis summaries.', 'A ticket without a root-cause classification is just delayed future noise. Standardize triage and close loops.'),
('wrk-1', 'workshop', 'Hardware Repair', 'Component Diagnostics & Wiping', 'Use multimeters to test motherboard rails, clean thermal loops, and execute DoD-grade secure data wiping on drives.', 'Enterprise servers (Dell PowerEdge, HPE) feature iDRAC and redundant power for 99.999% uptime. Workshop precision separates pros from hobbyists.');