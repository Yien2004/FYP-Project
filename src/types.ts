export interface PatientProfile {
  fullName: string;
  myKadOrPassport: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  nationality: string;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  insuranceProvider: string;
  insurancePolicyNumber: string;
  primaryPhysician: string;
  avatarUrl: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  passwordHash?: string;
  resetToken?: string;
  resetExpiry?: string;
  prescriptions?: PatientPrescription[];
  language?: string;
  defaultRegion?: string;
  emailAlerts?: boolean;
  smsAlerts?: boolean;
  inAppAlerts?: boolean;
  attachments?: any[];
  consentedClinics?: string[];
}

export interface PatientPrescription {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  date: string;
  foodTiming?: string;
  instructions?: string;
  scheduledTimes?: string;
}

export interface VitalSign {
  timestamp: string;
  heartRate: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  temperature: number;
  weight: number;
  oxygenSaturation: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewsCount: number;
  image: string;
  availability: string;
  hospital: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  doctorImage: string;
  date: string;
  timeSlot: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'Approved' | 'Pending' | 'Rescheduled' | 'Rejected' | 'Done' | 'Missing';
  type: 'In-Clinic' | 'Video Consultation';
  clinic?: string;
  symptoms: string;
  clinicalNotes?: string;
  prescription?: string;
  checkedIn?: boolean;
  shareHistory?: boolean;
  requestRide?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  distance: string;
  lat: number;
  lng: number;
  featured: boolean;
  zipCode: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'doctor' | 'assistant';
  senderName: string;
  content: string;
  timestamp: string;
  attachmentName?: string;
  attachmentType?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  category: 'alert' | 'medication' | 'lab' | 'general';
  read: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  triageData?: {
    department: string;
    doctors: any[];
  };
}
