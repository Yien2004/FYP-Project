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
    specialty: "Consultant Cardiologist",
    rating: 4.9,
    reviewsCount: 203,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
    availability: "Mon, Wed, Fri — 9:00 AM to 4:00 PM",
    hospital: "Pantai Hospital Penang"
  },
  {
    id: "doc-2",
    name: "Dr. Simon Lo",
    specialty: "Interventional Cardiologist",
    rating: 4.9,
    reviewsCount: 289,
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
    availability: "Tue, Thu — 10:00 AM to 3:00 PM",
    hospital: "Gleneagles Hospital Penang"
  },
  {
    id: "doc-3",
    name: "Dr. Siti Aminah",
    specialty: "Senior Paediatrician",
    rating: 4.9,
    reviewsCount: 284,
    image: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300",
    availability: "Mon–Fri — 8:00 AM to 4:30 PM",
    hospital: "Hospital Seberang Jaya"
  },
  {
    id: "doc-4",
    name: "Dr. Sarah Lim",
    specialty: "General Medicine & Dermatologist",
    rating: 4.8,
    reviewsCount: 217,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
    availability: "Mon–Sat — 8:30 AM – 9:00 PM",
    hospital: "O2 Klinik"
  }
];

export const mockClinics: Clinic[] = [
  {
    id: "clinic-1",
    name: "Hospital Pulau Pinang",
    address: "Jalan Residensi, 10990 Georgetown, Penang",
    phone: "04-222 5333",
    hours: "Open 24 hours, 7 days a week",
    distance: "1.2 km away",
    lat: 5.4171,
    lng: 100.3115,
    featured: true,
    zipCode: "10990"
  },
  {
    id: "clinic-2",
    name: "Hospital Seberang Jaya",
    address: "Jalan Tun Hussein Onn, 13700 Seberang Jaya, Penang",
    phone: "04-382 3333",
    hours: "Open 24 hours, 7 days a week",
    distance: "9.8 km away",
    lat: 5.3932,
    lng: 100.3985,
    featured: true,
    zipCode: "13700"
  },
  {
    id: "clinic-3",
    name: "Klinik Kesihatan Jalan Perak",
    address: "Jalan Perak, 10150 Georgetown, Penang",
    phone: "04-261 5266",
    hours: "Mon–Fri: 7:30 AM – 5:00 PM | Sat: 7:30 AM – 1:00 PM",
    distance: "2.1 km away",
    lat: 5.4005,
    lng: 100.3155,
    featured: false,
    zipCode: "10150"
  },
  {
    id: "clinic-4",
    name: "Klinik Kesihatan Bayan Baru",
    address: "Jalan Mahsuri, 11950 Bayan Baru, Penang",
    phone: "04-642 2222",
    hours: "Mon–Fri: 7:30 AM – 5:00 PM | Sat: 7:30 AM – 1:00 PM",
    distance: "10.5 km away",
    lat: 5.3263,
    lng: 100.2848,
    featured: false,
    zipCode: "11950"
  },
  {
    id: "clinic-5",
    name: "Pantai Hospital Penang",
    address: "82 Jalan Tengah, 10450 Bayan Lepas, Penang",
    phone: "04-643 3888",
    hours: "Open 24 hours, 7 days a week",
    distance: "11.0 km away",
    lat: 5.3216,
    lng: 100.2825,
    featured: true,
    zipCode: "10450"
  },
  {
    id: "clinic-6",
    name: "Hospital Lam Wah Ee",
    address: "141 Jalan Tan Sri Teh Ewe Lim, 11600 Georgetown, Penang",
    phone: "04-652 2888",
    hours: "Open 24 hours, 7 days a week",
    distance: "3.4 km away",
    lat: 5.3923,
    lng: 100.3055,
    featured: false,
    zipCode: "11600"
  },
  {
    id: "clinic-7",
    name: "Gleneagles Hospital Penang",
    address: "1 Jalan Pangkor, 10050 Georgetown, Penang",
    phone: "04-222 9111",
    hours: "Open 24 hours, 7 days a week",
    distance: "1.8 km away",
    lat: 5.4267,
    lng: 100.3204,
    featured: true,
    zipCode: "10050"
  },
  {
    id: "clinic-8",
    name: "Island Hospital",
    address: "308 Macalister Road, 10450 Georgetown, Penang",
    phone: "04-228 8222",
    hours: "Open 24 hours, 7 days a week",
    distance: "1.5 km away",
    lat: 5.4230,
    lng: 100.3146,
    featured: false,
    zipCode: "10450"
  },
  {
    id: "clinic-9",
    name: "O2 Klinik",
    address: "35, Jalan Burma, 10050 Georgetown, Penang",
    phone: "04-228 8822",
    hours: "Mon–Sat: 8:30 AM – 9:00 PM",
    distance: "1.9 km away",
    lat: 5.4200,
    lng: 100.3220,
    featured: false,
    zipCode: "10050"
  },
  {
    id: "clinic-10",
    name: "Klinik Singapore",
    address: "Georgetown, Penang",
    phone: "04-263 3388",
    hours: "Mon–Sat: 8:00 AM – 6:00 PM",
    distance: "1.4 km away",
    lat: 5.4120,
    lng: 100.3120,
    featured: false,
    zipCode: "10050"
  },
  {
    id: "clinic-11",
    name: "Poliklinik Perdana",
    address: "Penang (Mainland & Island)",
    phone: "04-399 9922",
    hours: "Mon–Fri: 8:00 AM – 5:30 PM",
    distance: "8.5 km away",
    lat: 5.3850,
    lng: 100.4000,
    featured: false,
    zipCode: "10050"
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
    clinic: "O2 Klinik",
    symptoms: "Allergy follow-up and prescription refill request."
  }
];

export const initialNotifications: AppNotification[] = [
  {
    id: "notif-ai-reminder",
    title: "🤖 AI Appointment Reminder: Tomorrow at 10:30 AM",
    body: "Health Assistant Pre-Consultation Reminder: You have an upcoming consultation with Dr. Sarah Lim at O2 Klinik scheduled for tomorrow at 10:30 AM. Please arrive 5–10 minutes early for on-site queue ticket verification (#Q-124) and reception check-in.",
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
