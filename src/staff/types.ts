export interface Patient {
  id: string;
  dbId?: string;
  name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  avatar?: string;
  history: string[];
  prescriptions: Prescription[];
  attachments: Attachment[];
  lastVisited: string;
  condition: string;
}

export interface Prescription {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  date: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  type: string;
  data?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  dateTime: string;
  specialty: string;
  doctorName: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'Approved' | 'Pending' | 'Rescheduled' | 'Rejected' | 'Done' | 'Missing';
  remarks: string;
  checked?: boolean;
  clinic?: string;
  hospital?: string;
  date?: string;
  timeSlot?: string;
  shareHistory?: boolean;
  requestRide?: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  service: string;
  event: string;
  execTime: string;
}

export interface Facility {
  id: string;
  name: string;
  bedsTotal: number;
  bedsOccupied: number;
  type: string;
  status: 'Normal' | 'Near Capacity' | 'Critical';
}

export interface Clinician {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'Active' | 'On Call' | 'Off Duty';
  patientsActive: number;
}

export interface ChatThread {
  id: string;
  senderName: string;
  senderAvatar?: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: ChatMessage[];
  symptoms?: string[];
  clinicalContext?: {
    bp: string;
    pulse: string;
    temp: string;
  };
}

export interface ChatMessage {
  id: string;
  sender: 'patient' | 'doctor';
  text: string;
  timestamp: string;
}

export interface RoutingRule {
  id: string;
  trigger: string;
  destination: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Active' | 'Inactive';
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'Doctor' | 'Patient' | 'Nurse' | 'Admin';
  status: 'Active' | 'Suspended';
}

export type PortalType = 'staff' | 'admin';

export type StaffTab = 'dashboard' | 'appointments' | 'patients' | 'schedule' | 'communication' | 'notifications' | 'send_notifications' | 'settings' | 'analytics';
export type AdminTab = 'dashboard' | 'staff' | 'patients' | 'appointments' | 'chats' | 'reports' | 'problems' | 'notifications' | 'settings';
