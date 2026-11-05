-- ============================================================
-- Migration 006: Facility Holidays, Dynamic Departments, Approvals & Clinic Inquiries
-- ============================================================

-- 1. 院区假期表 (自动阻断预约号源)
CREATE TABLE IF NOT EXISTS facility_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id INT NOT NULL,
  holiday_date DATE NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(facility_id, holiday_date)
);

-- 2. 科室动态表 (支持前台/医生申请，Admin 审批)
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  facility_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED'
  requested_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 初始化 4 处院区的核心科室（直接设为 ACTIVE）
INSERT INTO departments (facility_id, name, status) VALUES
  (1, 'Emergency A&E', 'ACTIVE'),
  (1, 'General Surgery', 'ACTIVE'),
  (1, 'Internal Medicine', 'ACTIVE'),
  (1, 'Respiratory Medicine', 'ACTIVE'),
  (2, 'Cardiology', 'ACTIVE'),
  (2, 'Health Screening & Wellness', 'ACTIVE'),
  (3, 'Gastroenterology & Hepatology', 'ACTIVE'),
  (3, 'Dermatology', 'ACTIVE'),
  (4, 'Orthopaedic Surgery', 'ACTIVE'),
  (4, 'Ear, Nose & Throat (Otorhinolaryngology)', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- 3. profiles 表完善医生状态与审批流
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE', -- 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED'
ADD COLUMN IF NOT EXISTS mmc_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT 'RESIDENT', -- 'RESIDENT', 'SESSIONAL'
ADD COLUMN IF NOT EXISTS nominated_by UUID REFERENCES profiles(id);

-- 4. 患者咨询留言表 (Patient-to-Staff Inquiries)
CREATE TABLE IF NOT EXISTS clinic_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id),
  facility_id INT NOT NULL,
  department VARCHAR(100) NOT NULL,
  doctor_id UUID REFERENCES profiles(id), -- 可选，指派具体医生
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'OPEN',     -- 'OPEN', 'REPLIED', 'RESOLVED'
  reply_text TEXT,
  replied_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
