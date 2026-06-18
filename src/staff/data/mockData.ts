import { Patient, Appointment, SystemLog, Facility, Clinician, ChatThread, RoutingRule, UserAccount } from '../types';

export const mockPatients: Patient[] = [
  {
    id: 'p1',
    name: 'Eleanor Thompson',
    dob: '1976-08-14',
    gender: 'Female',
    phone: '+1 (555) 382-9901',
    email: 'eleanor.t@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    condition: 'Chronic Hypertension & Mild Asthma',
    lastVisited: '2026-06-02',
    history: [
      'Diagnosed with Stage 1 Essential Hypertension in Dec 2023.',
      'Active exercise stress test completed in May 2025; no high-risk ischemia noted.',
      'History of seasonal allergic asthma triggers. Monitored closely during winter.',
      'Consistently maintains active sodium restriction protocols in dietary regimen.'
    ],
    prescriptions: [
      {
        id: 'rx1',
        drugName: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once Daily',
        duration: '90 Days',
        prescribedBy: 'Dr. Sarah Jenkins',
        date: '2026-05-15'
      },
      {
        id: 'rx2',
        drugName: 'Albuterol HFA Inhaler',
        dosage: '90mcg / spray',
        frequency: 'As needed for wheezing',
        duration: '365 Days',
        prescribedBy: 'Dr. Sarah Jenkins',
        date: '2026-02-10'
      }
    ],
    attachments: [
      {
        id: 'att1',
        name: 'Complete_Hemogram_E_Thompson_May2026.pdf',
        size: '1.4 MB',
        uploadedAt: '2026-05-12',
        type: 'pdf'
      },
      {
        id: 'att2',
        name: 'Electrocardiogram_Waveform_Baseline.png',
        size: '4.8 MB',
        uploadedAt: '2026-05-15',
        type: 'image'
      }
    ]
  },
  {
    id: 'p2',
    name: 'David Brown',
    dob: '1962-11-23',
    gender: 'Male',
    phone: '+1 (555) 472-8812',
    email: 'dbrown@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    condition: 'Type 2 Diabetes',
    lastVisited: '2026-06-04',
    history: [
      'Type 2 Diabetes diagnosed in 2021. Managed via Metformin and diet adjustments.',
      'Retinal diabetic neuropathy screening clear as of Jan 2026.'
    ],
    prescriptions: [
      {
        id: 'rx3',
        drugName: 'Metformin HCl',
        dosage: '500mg',
        frequency: 'Twice Daily with meals',
        duration: '180 Days',
        prescribedBy: 'Dr. Julian Vance',
        date: '2026-04-01'
      }
    ],
    attachments: []
  },
  {
    id: 'p3',
    name: 'Alice Miller',
    dob: '1991-04-05',
    gender: 'Female',
    phone: '+1 (555) 233-1289',
    email: 'amiller@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    condition: 'Acute Sinusitis',
    lastVisited: '2026-06-03',
    history: [
      'Recurrent allergic rhinitis.',
      'Presented with mid-facial pressure, nasal congestion, and mild fatigue on June 3.'
    ],
    prescriptions: [
      {
        id: 'rx4',
        drugName: 'Fluticasone Propionate Nasal Spray',
        dosage: '50mcg',
        frequency: '2 sprays in each nostril daily',
        duration: '30 Days',
        prescribedBy: 'Dr. Sarah Jenkins',
        date: '2026-06-03'
      }
    ],
    attachments: []
  },
  {
    id: 'p4',
    name: 'Robert Sullivan',
    dob: '1984-02-18',
    gender: 'Male',
    phone: '+1 (555) 901-2093',
    email: 'robert.s@example.com',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    condition: 'Post-Cardiac Catheterization Monitor',
    lastVisited: '2026-06-01',
    history: [
      'Elective transradial cardiac catheterization safely completed on May 29, 2026.',
      'Mild single vessel CAD managed medically.'
    ],
    prescriptions: [
      {
        id: 'rx5',
        drugName: 'Atorvastatin',
        dosage: '40mg',
        frequency: 'Once Daily at night',
        duration: '90 Days',
        prescribedBy: 'Dr. Sarah Jenkins',
        date: '2026-05-29'
      }
    ],
    attachments: []
  },
  {
    id: 'p5',
    name: 'James Wilson',
    dob: '1955-09-30',
    gender: 'Male',
    phone: '+1 (555) 345-0987',
    email: 'jwilson@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    condition: 'Chronic Heart Failure - NYHA Class II',
    lastVisited: '2026-05-28',
    history: [
      'EF calculated at 42% on last echo (Mar 2026).',
      'Requires daily logs of body weight to monitor volume accumulation.'
    ],
    prescriptions: [
      {
        id: 'rx6',
        drugName: 'Carvedilol',
        dosage: '12.5mg',
        frequency: 'Twice Daily',
        duration: '90 Days',
        prescribedBy: 'Dr. Sarah Jenkins',
        date: '2026-05-28'
      }
    ],
    attachments: []
  },
  {
    id: 'p6',
    name: 'Martha G. Williams',
    dob: '1968-12-04',
    gender: 'Female',
    phone: '+1 (555) 890-4456',
    email: 'martha.williams@example.com',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200',
    condition: 'Angina Pectoris Evaluation',
    lastVisited: '2026-05-20',
    history: [
      'History of exertional chest pressure and palpitations.',
      'Undergoing outpatient workup with mobile telemetry logs.'
    ],
    prescriptions: [
      {
        id: 'rx7',
        drugName: 'Amlodipine Besylate',
        dosage: '5mg',
        frequency: 'Once Daily',
        duration: '180 Days',
        prescribedBy: 'Dr. Sarah Jenkins',
        date: '2026-05-20'
      }
    ],
    attachments: []
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: 'apt1',
    patientId: 'p2',
    patientName: 'David Brown',
    patientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    dateTime: '2026-06-04 09:30 AM',
    specialty: 'Internal Medicine',
    doctorName: 'Dr. Julian Vance',
    status: 'Approved',
    remarks: 'Routine metabolic control check and diabetic review.'
  },
  {
    id: 'apt2',
    patientId: 'p3',
    patientName: 'Alice Miller',
    patientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    dateTime: '2026-06-04 11:15 AM',
    specialty: 'Family Medicine',
    doctorName: 'Dr. Sarah Jenkins',
    status: 'Pending',
    remarks: 'Evaluation for chronic sinus pressure and rhinitis.'
  },
  {
    id: 'apt3',
    patientId: 'p1',
    patientName: 'Eleanor Thompson',
    patientAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    dateTime: '2026-06-04 02:00 PM',
    specialty: 'Cardiovascular Care',
    doctorName: 'Dr. Sarah Jenkins',
    status: 'Approved',
    remarks: 'Follow-up for chronic hypertension titration and labs.'
  },
  {
    id: 'apt4',
    patientId: 'p4',
    patientName: 'Robert Sullivan',
    patientAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    dateTime: '2026-06-04 04:30 PM',
    specialty: 'Cardiovascular Care',
    doctorName: 'Dr. Sarah Jenkins',
    status: 'Rescheduled',
    remarks: 'Lab results collection and review of catheter site.'
  },
  {
    id: 'apt5',
    patientId: 'p5',
    patientName: 'James Wilson',
    patientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    dateTime: '2026-06-05 10:00 AM',
    specialty: 'Cardiology Support',
    doctorName: 'Dr. Sarah Jenkins',
    status: 'Pending',
    remarks: 'CHF volume evaluation and titration of diuretics.'
  }
];

export const mockSystemLogs: SystemLog[] = [
  {
    id: 'log1',
    timestamp: '2026-06-04 12:45:12',
    level: 'INFO',
    service: 'API-Gateway',
    event: 'Auth check passed for account julian.vance@lifelink.org.',
    execTime: '12ms'
  },
  {
    id: 'log2',
    timestamp: '2026-06-04 12:44:39',
    level: 'CRITICAL',
    service: 'DB-Replica-02',
    event: 'Query timeout on heavy audit logs read database connection.',
    execTime: '5200ms'
  },
  {
    id: 'log3',
    timestamp: '2026-06-04 12:41:05',
    level: 'SUCCESS',
    service: 'HL7-Parser',
    event: 'HL7 lab test package parsed successfully (ID: LAB-190302).',
    execTime: '88ms'
  },
  {
    id: 'log4',
    timestamp: '2026-06-04 12:35:19',
    level: 'WARNING',
    service: 'PushNotificationSvc',
    event: 'Delayed response from external standard device notification provider.',
    execTime: '310ms'
  },
  {
    id: 'log5',
    timestamp: '2026-06-04 12:28:44',
    level: 'INFO',
    service: 'AdminService',
    event: 'Routing trigger modified: Category Emergency Cardiac rerouted to West Gate triage.',
    execTime: '15ms'
  }
];

export const mockFacilities: Facility[] = [
  {
    id: 'fac1',
    name: 'General Cardiology Ward A',
    bedsTotal: 25,
    bedsOccupied: 22,
    type: 'Inpatient Ward',
    status: 'Near Capacity'
  },
  {
    id: 'fac2',
    name: 'Intensive Cardiac Care (ICCU)',
    bedsTotal: 10,
    bedsOccupied: 5,
    type: 'Highly Intensive',
    status: 'Normal'
  },
  {
    id: 'fac3',
    name: 'Day-Surgical Recovery Wing',
    bedsTotal: 30,
    bedsOccupied: 29,
    type: 'Outpatient Bedding',
    status: 'Critical'
  },
  {
    id: 'fac4',
    name: 'General Diagnostics Room 4',
    bedsTotal: 4,
    bedsOccupied: 1,
    type: 'Diagnostic Station',
    status: 'Normal'
  }
];

export const mockClinicians: Clinician[] = [
  {
    id: 'c1',
    name: 'Dr. Sarah Jenkins',
    role: 'Lead Cardiologist',
    department: 'Cardiovascular Care',
    status: 'On Call',
    patientsActive: 12
  },
  {
    id: 'c2',
    name: 'Dr. Julian Vance',
    role: 'Chief Medical Officer',
    department: 'Internal Medicine / Admin',
    status: 'Active',
    patientsActive: 4
  },
  {
    id: 'c3',
    name: 'Nurse Roberto Santos',
    role: 'Head Nurse ICU',
    department: 'Intensive Cardiac Care',
    status: 'Active',
    patientsActive: 8
  },
  {
    id: 'c4',
    name: 'Dr. Amanda Lee',
    role: 'Associate Lab Director',
    department: 'Pathology & Hematology',
    status: 'Off Duty',
    patientsActive: 0
  }
];

export const mockChatThreads: ChatThread[] = [
  {
    id: 'chat1',
    senderName: 'Martha G. Williams',
    senderAvatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200',
    lastMessage: 'I felt some mild chest pressure when walking up the driveway stairs about an hour ago. Should I take another Nitro?',
    time: '12:40 PM',
    unread: true,
    symptoms: ['Chest pressure', 'Palpitations', 'Exertional pain'],
    clinicalContext: {
      bp: '143 / 88 mmHg',
      pulse: '84 bpm',
      temp: '98.4 °F'
    },
    messages: [
      {
        id: 'cl1',
        sender: 'patient',
        text: 'Hi Dr. Jenkins, I completed the morning weight logs, weight is stable at 162 lbs.',
        timestamp: '08:15 AM'
      },
      {
        id: 'cl2',
        sender: 'doctor',
        text: 'Excellent, Martha. Fluid recovery looks stable. Continue with current dosage.',
        timestamp: '09:00 AM'
      },
      {
        id: 'cl3',
        sender: 'patient',
        text: 'I felt some mild chest pressure when walking up the driveway stairs about an hour ago. Should I take another Nitro?',
        timestamp: '12:40 PM'
      }
    ]
  },
  {
    id: 'chat2',
    senderName: 'David Chen',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    lastMessage: 'Thank you for sending the asthma plan update. It makes perfect sense now.',
    time: 'Yesterday',
    unread: false,
    symptoms: ['Mild Wheezing'],
    clinicalContext: {
      bp: '124 / 76 mmHg',
      pulse: '72 bpm',
      temp: '98.9 °F'
    },
    messages: [
      {
        id: 'cl4',
        sender: 'doctor',
        text: 'Ensure you take the Albuterol 15 minutes before jog exercises.',
        timestamp: 'Yesterday 03:00 PM'
      },
      {
        id: 'cl5',
        sender: 'patient',
        text: 'Thank you for sending the asthma plan update. It makes perfect sense now.',
        timestamp: 'Yesterday 04:15 PM'
      }
    ]
  },
  {
    id: 'chat3',
    senderName: 'Sarah Jenkins',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    lastMessage: 'Wait times at triage are stabilizing around 14 minutes now. Standardized shifts are successfully active.',
    time: 'Jun 2',
    unread: false,
    messages: []
  },
  {
    id: 'chat4',
    senderName: 'Roberto Santos',
    senderAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    lastMessage: 'Lab samples for Sullivan have been safely delivered to Hematology central terminal.',
    time: 'Jun 1',
    unread: false,
    messages: []
  }
];

export const mockRoutingRules: RoutingRule[] = [
  {
    id: 'rule1',
    trigger: 'If patient presents with Chest Pain or Angina Symptoms',
    destination: 'Direct to Cardiovascular Triage Unit (CCU Gate A)',
    priority: 'Critical',
    status: 'Active'
  },
  {
    id: 'rule2',
    trigger: 'If respiratory symptom presents and age is senior',
    destination: 'Route to Geriatric Pulmonology Express Clinic',
    priority: 'High',
    status: 'Active'
  },
  {
    id: 'rule3',
    trigger: 'Inbound laboratory results critical alarm triggered',
    destination: 'Immediate push notification dispatcher to Attending Doctor',
    priority: 'Critical',
    status: 'Active'
  },
  {
    id: 'rule4',
    trigger: 'Routine check-ups scheduled with Specialist Consult',
    destination: 'Assign clinical buffer desk index 3-C',
    priority: 'Low',
    status: 'Inactive'
  }
];

export const mockUserAccounts: UserAccount[] = [
  {
    id: 'usr1',
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@lifelink.org',
    role: 'Doctor',
    status: 'Active'
  },
  {
    id: 'usr2',
    name: 'Dr. Julian Vance',
    email: 'julian.vance@lifelink.org',
    role: 'Admin',
    status: 'Active'
  },
  {
    id: 'usr3',
    name: 'Nurse Roberto Santos',
    email: 'roberto.santos@lifelink.org',
    role: 'Nurse',
    status: 'Active'
  },
  {
    id: 'usr4',
    name: 'Eleanor Thompson',
    email: 'eleanor.t@example.com',
    role: 'Patient',
    status: 'Active'
  },
  {
    id: 'usr5',
    name: 'David Brown',
    email: 'dbrown@example.com',
    role: 'Patient',
    status: 'Suspended'
  }
];
