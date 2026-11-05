-- ============================================================
-- Migration 005: Admin Operations, Doctor Leaves & Red-Flag Logs
-- ============================================================

-- 1. profiles 表扩充医生在岗状态
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS duty_status VARCHAR(20) DEFAULT 'ON_DUTY', -- 'ON_DUTY', 'ON_BREAK', 'ON_LEAVE', 'OFF_DUTY'
ADD COLUMN IF NOT EXISTS default_room VARCHAR(50);

-- 2. 医生请假与停诊记录表 (Doctor Leave & Schedule Blocks)
CREATE TABLE IF NOT EXISTS doctor_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  facility_id INT,
  leave_type VARCHAR(30) NOT NULL, -- 'MC' (病假), 'ANNUAL_LEAVE', 'EMERGENCY'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'CANCELLED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Carey AI 急危重症红旗拦截日志表 (Red-Flag Intercept Logs)
CREATE TABLE IF NOT EXISTS emergency_intercept_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES profiles(id),
  raw_symptoms TEXT NOT NULL,         -- 患者输入的原始主诉
  matched_keywords TEXT[] NOT NULL,    -- 触发拦截的危险词，如 ['severe chest tightness', 'crushing pain']
  severity_score INT NOT NULL,         -- 严重度评分 (9-10)
  intercept_action VARCHAR(50) DEFAULT 'REDIRECT_999_A&E',
  facility_id INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 敏感操作合规审计日志表 (System Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  actor_email VARCHAR(100) NOT NULL,
  actor_role VARCHAR(20) NOT NULL,     -- 'admin', 'staff', 'doctor'
  action_type VARCHAR(50) NOT NULL,    -- 'QUEUE_CHECK_IN', 'STATUS_CHANGE', 'PASSWORD_RESET', 'LEAVE_SUBMIT'
  facility_id INT,
  target_id VARCHAR(100),              -- 操作目标（如排队号 'ORT-001'，医生 ID）
  description TEXT NOT NULL,           -- 具体日志描述
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
