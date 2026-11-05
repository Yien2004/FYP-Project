import { Clinic, Doctor, PatientProfile, Appointment, AppNotification, VitalSign } from "./types";

export const initialPatientProfile: PatientProfile = {
  fullName: "Ahmad Danish Bin Razali",
  myKadOrPassport: "940822-14-5543",
  dateOfBirth: "1994-08-22",
  gender: "Male",
  phone: "+60 12-345 6789",
  email: "ahmad.danish@gmail.com",
  nationality: "Malaysian",
  bloodType: "O+",
  allergies: ["Penicillin", "Peanuts"],
  chronicConditions: ["Asthma (Mild)", "Seasonal Rhinitis"],
  insuranceProvider: "Allianz Health Malaysia",
  insurancePolicyNumber: "ALZ-88942-004",
  primaryPhysician: "Dr. Sarah Mitchell",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
};

export const mockDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Ainol Shareha Binti Sahar",
    specialty: "Resident Consultant - Internal Medicine",
    rating: 4.9,
    reviewsCount: 203,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
    availability: "Mon, Wed, Fri — 9:00 AM to 4:00 PM",
    hospital: "Pantai Hospital Penang (Main Hospital)"
  },
  {
    id: "doc-2",
    name: "Dr. Simon Lo",
    specialty: "Interventional Cardiologist",
    rating: 4.9,
    reviewsCount: 289,
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
    availability: "Tue, Thu — 10:00 AM to 3:00 PM",
    hospital: "Pantai Heart & Wellness Pavilion"
  },
  {
    id: "doc-3",
    name: "Dr. Siti Aminah",
    specialty: "Senior Paediatrician",
    rating: 4.9,
    reviewsCount: 284,
    image: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300",
    availability: "Mon–Fri — 8:00 AM to 4:30 PM",
    hospital: "Pantai Specialist Centre"
  },
  {
    id: "doc-4",
    name: "Dr. Sarah Lim",
    specialty: "General Medicine & Dermatologist",
    rating: 4.8,
    reviewsCount: 217,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    availability: "Mon–Sat — 8:30 AM – 9:00 PM",
    hospital: "Pantai Premier Clinic & Day Surgery"
  }
];

export const mockClinics: Clinic[] = [
  {
    id: "ph-penang",
    name: "Pantai Hospital Penang (Main Hospital)",
    address: "82, Jalan Tengah, Bandar Bayan Baru, 11950 Bayan Lepas, Pulau Pinang",
    phone: "04-643 3888",
    hours: "Open 24 hours, 7 days a week (Tertiary Inpatient & 24/7 A&E)",
    distance: "1.2 km away",
    lat: 5.321389,
    lng: 100.284722,
    featured: true,
    zipCode: "11950"
  },
  {
    id: "pantai-pavilion",
    name: "Pantai Heart & Wellness Pavilion",
    address: "128, Jalan Burma, 10050 Georgetown, Pulau Pinang",
    phone: "04-222 7888",
    hours: "Mon–Fri: 8:30 AM – 5:30 PM | Sat: 8:30 AM – 1:00 PM",
    distance: "3.5 km away",
    lat: 5.420800,
    lng: 100.320100,
    featured: true,
    zipCode: "10050"
  },
  {
    id: "pantai-premier",
    name: "Pantai Premier Clinic & Day Surgery",
    address: "1-1-15, Tingkat Mahsuri, 11950 Bayan Baru, Pulau Pinang",
    phone: "04-641 2888",
    hours: "Mon–Sat: 8:00 AM – 9:00 PM | Sun: 9:00 AM – 1:00 PM",
    distance: "1.8 km away",
    lat: 5.326200,
    lng: 100.290500,
    featured: true,
    zipCode: "11950"
  },
  {
    id: "pantai-specialist",
    name: "Pantai Specialist Centre",
    address: "588, Jalan Air Itam, 11500 Ayer Itam, Pulau Pinang",
    phone: "04-828 5888",
    hours: "Mon–Sat: 8:00 AM – 8:00 PM | Sun: Closed",
    distance: "4.2 km away",
    lat: 5.405100,
    lng: 100.282900,
    featured: true,
    zipCode: "11500"
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: "apt-101",
    doctorId: "doc-4",
    doctorName: "Dr. Sarah Lim",
    specialty: "General Medicine & Dermatologist",
    doctorImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    date: "2026-10-12",
    timeSlot: "10:30 AM",
    status: "Upcoming",
    type: "In-Clinic",
    clinic: "Pantai Premier Clinic & Day Surgery",
    symptoms: "Allergy follow-up and prescription refill request."
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: "notif-ai-reminder",
    title: "Appointment Reminder: Tomorrow at 10:30 AM",
    body: "Health Assistant Pre-Consultation Reminder: You have an upcoming consultation with Dr. Sarah Lim at Pantai Premier Clinic & Day Surgery scheduled for tomorrow at 10:30 AM. Please arrive 5–10 minutes early for reception check-in.",
    time: "Today, 8:00 AM",
    category: "reminder",
    read: false
  },
  {
    id: "notif-1",
    title: "Urgent Lab Results Ready",
    body: "Your comprehensive biochemical and blood screening tests from June 1st have been processed. Report and clinical feedback are compiled.",
    time: "Today, 10:45 AM",
    category: "lab",
    read: false
  },
  {
    id: "notif-2",
    title: "Medication Renewal Alert",
    body: "Your Ventolin Inhaler prescription is down to its final scheduled refill. Please renew via Health Assistant or schedule a physical consultation.",
    time: "Yesterday, 3:30 PM",
    category: "medication",
    read: false
  },
  {
    id: "notif-3",
    title: "Annual Health Screening Complete",
    body: "Dr. Sarah Mitchell has published clinical diagnostics regarding your preventive annual screening checkup.",
    time: "2 days ago",
    category: "general",
    read: true
  },
  {
    id: "notif-4",
    title: "Upcoming Appointment Confirm",
    body: "Your consultation with Dr. Mitchell is confirmed for Tuesday, Oct 12 at 10:30 AM at Pantai Hospital Penang.",
    time: "3 days ago",
    category: "general",
    read: true
  }
];

export const clinicalVitals: VitalSign[] = [
  {
    timestamp: "June 04, 2026",
    heartRate: 72,
    bloodPressureSys: 118,
    bloodPressureDia: 79,
    temperature: 36.6,
    weight: 74.5,
    oxygenSaturation: 99
  },
  {
    timestamp: "May 14, 2026",
    heartRate: 69,
    bloodPressureSys: 115,
    bloodPressureDia: 75,
    temperature: 36.5,
    weight: 74.2,
    oxygenSaturation: 98
  },
  {
    timestamp: "Nov 20, 2025",
    heartRate: 78,
    bloodPressureSys: 122,
    bloodPressureDia: 81,
    temperature: 36.8,
    weight: 75.0,
    oxygenSaturation: 99
  }
];
