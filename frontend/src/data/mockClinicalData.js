// Comprehensive mock clinical data for the platform

export const mockPatients = [
    {
        id: 1,
        mrn: 'MRN-2024-001',
        name: 'Rajesh Kumar',
        age: 67,
        gender: 'Male',
        ward: 'ICU-A',
        bed: '12',
        admissionDate: '2024-01-28T08:30:00Z',
        diagnosis: 'Pneumonia, Sepsis Risk',
        riskLevel: 'HIGH',
        riskScore: 0.78,
        qSofaScore: 2,
        news2Score: 7,
        riskTypes: ['Sepsis', 'Respiratory Failure'],
        lastVitalsUpdate: new Date(Date.now() - 300000).toISOString(), // 5 min ago
        status: 'active',
        assignedDoctor: 'Dr. Vivek Mehra'
    },
    {
        id: 2,
        mrn: 'MRN-2024-002',
        name: 'Amit Sharma',
        age: 54,
        gender: 'Male',
        ward: 'Ward-3B',
        bed: '08',
        admissionDate: '2024-01-29T14:15:00Z',
        diagnosis: 'Post-operative monitoring',
        riskLevel: 'MEDIUM',
        riskScore: 0.45,
        qSofaScore: 0,
        news2Score: 3,
        riskTypes: ['AKI'],
        lastVitalsUpdate: new Date(Date.now() - 600000).toISOString(), // 10 min ago
        status: 'active',
        assignedDoctor: 'Dr. Vivek Mehra'
    },
    {
        id: 3,
        mrn: 'MRN-2024-003',
        name: 'Priya Patel',
        age: 42,
        gender: 'Female',
        ward: 'Ward-2A',
        bed: '15',
        admissionDate: '2024-01-30T10:00:00Z',
        diagnosis: 'Diabetic ketoacidosis',
        riskLevel: 'CRITICAL',
        riskScore: 0.89,
        qSofaScore: 3,
        news2Score: 11,
        riskTypes: ['Sepsis', 'AKI', 'Shock'],
        lastVitalsUpdate: new Date(Date.now() - 120000).toISOString(), // 2 min ago
        status: 'active',
        assignedDoctor: 'Dr. Vivek Mehra'
    },
    {
        id: 4,
        mrn: 'MRN-2024-004',
        name: 'Vikram Singh',
        age: 71,
        gender: 'Male',
        ward: 'ICU-B',
        bed: '03',
        admissionDate: '2024-01-27T16:45:00Z',
        diagnosis: 'COPD exacerbation',
        riskLevel: 'HIGH',
        riskScore: 0.72,
        riskTypes: ['Respiratory Failure'],
        lastVitalsUpdate: new Date(Date.now() - 180000).toISOString(), // 3 min ago
        status: 'active',
        assignedDoctor: 'Dr. Vivek Mehra'
    },
    {
        id: 5,
        mrn: 'MRN-2024-005',
        name: 'Anjali Reddy',
        age: 38,
        gender: 'Female',
        ward: 'Ward-1C',
        bed: '22',
        admissionDate: '2024-01-31T09:20:00Z',
        diagnosis: 'Appendicitis post-op',
        riskLevel: 'LOW',
        riskScore: 0.18,
        riskTypes: [],
        lastVitalsUpdate: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        status: 'active',
        assignedDoctor: 'Dr. Vivek Mehra'
    }
];

// Vitals time series data
export const generateVitalsData = (patientId, hours = 24) => {
    const data = [];
    const now = Date.now();
    const interval = (hours * 60 * 60 * 1000) / 48; // 48 data points

    const baseValues = {
        1: { hr: 95, sbp: 105, dbp: 65, rr: 22, spo2: 94, temp: 38.2 },
        2: { hr: 78, sbp: 128, dbp: 82, rr: 16, spo2: 97, temp: 37.1 },
        3: { hr: 112, sbp: 92, dbp: 58, rr: 26, spo2: 91, temp: 38.8 },
        4: { hr: 88, sbp: 118, dbp: 75, rr: 24, spo2: 89, temp: 37.4 },
        5: { hr: 72, sbp: 122, dbp: 78, rr: 14, spo2: 98, temp: 36.8 }
    };

    const base = baseValues[patientId] || baseValues[1];

    for (let i = 0; i < 48; i++) {
        const timestamp = new Date(now - (47 - i) * interval);
        data.push({
            timestamp: timestamp.toISOString(),
            time: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            hr: base.hr + Math.random() * 10 - 5,
            sbp: base.sbp + Math.random() * 15 - 7,
            dbp: base.dbp + Math.random() * 10 - 5,
            map: ((base.sbp + 2 * base.dbp) / 3) + Math.random() * 8 - 4,
            rr: base.rr + Math.random() * 4 - 2,
            spo2: Math.min(100, base.spo2 + Math.random() * 3 - 1),
            temp: base.temp + Math.random() * 0.4 - 0.2
        });
    }

    return data;
};

// Lab results time series
export const generateLabData = (patientId) => {
    const data = [];
    const now = Date.now();
    const intervals = [0, 6, 12, 18, 24]; // hours ago

    const baseValues = {
        1: { lactate: 3.2, creatinine: 1.8, wbc: 14.5, platelets: 145 },
        2: { lactate: 1.8, creatinine: 1.4, wbc: 9.2, platelets: 220 },
        3: { lactate: 4.1, creatinine: 2.2, wbc: 18.3, platelets: 98 },
        4: { lactate: 2.1, creatinine: 1.1, wbc: 11.8, platelets: 185 },
        5: { lactate: 1.2, creatinine: 0.9, wbc: 7.5, platelets: 245 }
    };

    const base = baseValues[patientId] || baseValues[1];

    intervals.forEach((hoursAgo, idx) => {
        const timestamp = new Date(now - hoursAgo * 60 * 60 * 1000);
        const trend = idx / intervals.length; // improving over time

        data.push({
            timestamp: timestamp.toISOString(),
            time: hoursAgo === 0 ? 'Now' : `${hoursAgo}h ago`,
            lactate: Math.max(0.5, base.lactate - trend * 0.5 + Math.random() * 0.3),
            creatinine: Math.max(0.6, base.creatinine - trend * 0.2 + Math.random() * 0.1),
            wbc: Math.max(4, base.wbc - trend * 2 + Math.random() * 1),
            platelets: Math.min(400, base.platelets + trend * 20 + Math.random() * 10)
        });
    });

    return data.reverse();
};

// Risk predictions with confidence
export const getRiskPredictions = (patientId) => {
    const predictions = {
        1: {
            sepsis: { probability: 0.78, confidence: 0.85, timeWindow: '6-12h' },
            aki: { probability: 0.45, confidence: 0.72, timeWindow: '12-24h' },
            respiratory: { probability: 0.68, confidence: 0.88, timeWindow: '6-12h' },
            shock: { probability: 0.32, confidence: 0.65, timeWindow: '12-24h' }
        },
        2: {
            sepsis: { probability: 0.22, confidence: 0.78, timeWindow: '12-24h' },
            aki: { probability: 0.58, confidence: 0.82, timeWindow: '6-12h' },
            respiratory: { probability: 0.15, confidence: 0.70, timeWindow: '24h+' },
            shock: { probability: 0.18, confidence: 0.68, timeWindow: '24h+' }
        },
        3: {
            sepsis: { probability: 0.89, confidence: 0.92, timeWindow: '0-6h' },
            aki: { probability: 0.76, confidence: 0.88, timeWindow: '6-12h' },
            respiratory: { probability: 0.42, confidence: 0.75, timeWindow: '12-24h' },
            shock: { probability: 0.81, confidence: 0.90, timeWindow: '0-6h' }
        },
        4: {
            sepsis: { probability: 0.35, confidence: 0.80, timeWindow: '12-24h' },
            aki: { probability: 0.28, confidence: 0.72, timeWindow: '24h+' },
            respiratory: { probability: 0.72, confidence: 0.90, timeWindow: '6-12h' },
            shock: { probability: 0.25, confidence: 0.70, timeWindow: '24h+' }
        },
        5: {
            sepsis: { probability: 0.12, confidence: 0.85, timeWindow: '24h+' },
            aki: { probability: 0.18, confidence: 0.78, timeWindow: '24h+' },
            respiratory: { probability: 0.08, confidence: 0.82, timeWindow: '24h+' },
            shock: { probability: 0.10, confidence: 0.75, timeWindow: '24h+' }
        }
    };

    return predictions[patientId] || predictions[1];
};

// SHAP feature importance
export const getShapExplanation = (patientId) => {
    const explanations = {
        1: [
            { feature: 'Lactate Level', value: '3.2 mmol/L', importance: 0.28, direction: 'increase' },
            { feature: 'Heart Rate', value: '95 bpm', importance: 0.22, direction: 'increase' },
            { feature: 'Temperature', value: '38.2°C', importance: 0.18, direction: 'increase' },
            { feature: 'WBC Count', value: '14.5 K/μL', importance: 0.15, direction: 'increase' },
            { feature: 'Respiratory Rate', value: '22/min', importance: 0.12, direction: 'increase' },
            { feature: 'MAP', value: '78 mmHg', importance: 0.05, direction: 'decrease' }
        ],
        3: [
            { feature: 'Lactate Level', value: '4.1 mmol/L', importance: 0.32, direction: 'increase' },
            { feature: 'MAP', value: '69 mmHg', importance: 0.25, direction: 'decrease' },
            { feature: 'Heart Rate', value: '112 bpm', importance: 0.20, direction: 'increase' },
            { feature: 'Creatinine', value: '2.2 mg/dL', importance: 0.15, direction: 'increase' },
            { feature: 'Platelets', value: '98 K/μL', importance: 0.08, direction: 'decrease' }
        ]
    };

    return explanations[patientId] || explanations[1];
};

// Guideline citations (RAG output)
export const getGuidelineCitations = (riskType) => {
    const guidelines = {
        Sepsis: [
            {
                source: 'Surviving Sepsis Campaign 2021',
                section: 'Early Recognition and Management',
                citation: 'Sepsis should be recognized early through screening of patients with suspected infection. qSOFA criteria (altered mental status, SBP ≤100 mmHg, RR ≥22/min) can identify patients at higher risk.',
                relevance: 0.95
            },
            {
                source: 'NICE Guideline NG51',
                section: 'Risk Stratification',
                citation: 'High-risk criteria include lactate ≥2 mmol/L, systolic BP <90 mmHg, heart rate >130 bpm, respiratory rate ≥25/min, or new altered mental status.',
                relevance: 0.92
            },
            {
                source: 'WHO Guidelines 2023',
                section: 'Sepsis Management',
                citation: 'Immediate resuscitation with IV fluids and early antibiotic administration within 1 hour of recognition significantly improves outcomes.',
                relevance: 0.88
            }
        ],
        AKI: [
            {
                source: 'KDIGO Clinical Practice Guideline',
                section: 'AKI Definition and Staging',
                citation: 'AKI is defined by increase in serum creatinine by ≥0.3 mg/dL within 48 hours or increase to ≥1.5 times baseline within 7 days.',
                relevance: 0.94
            },
            {
                source: 'NICE Guideline NG148',
                section: 'AKI Detection',
                citation: 'Monitor urine output and serum creatinine in at-risk patients. Consider nephrotoxic medications and optimize fluid balance.',
                relevance: 0.90
            }
        ],
        'Respiratory Failure': [
            {
                source: 'BTS Guidelines 2023',
                section: 'Acute Respiratory Failure',
                citation: 'Monitor SpO2, respiratory rate, and work of breathing. Consider escalation if SpO2 <90% despite oxygen therapy or RR >25/min.',
                relevance: 0.93
            }
        ]
    };

    return guidelines[riskType] || [];
};

// Uncertainty flags
export const getUncertaintyFlags = (patientId) => {
    const flags = {
        1: [
            { type: 'missing_data', severity: 'medium', message: 'Urine output not recorded in last 4 hours' },
            { type: 'stale_data', severity: 'low', message: 'Last blood culture: 18 hours ago' }
        ],
        3: [
            { type: 'missing_data', severity: 'high', message: 'Blood pressure measurement gap of 2 hours' },
            { type: 'conflicting_values', severity: 'medium', message: 'Manual BP differs from automated reading by >15 mmHg' },
            { type: 'stale_data', severity: 'medium', message: 'Last lactate measurement: 6 hours ago' }
        ]
    };

    return flags[patientId] || [];
};

// Alerts
export const mockAlerts = [
    {
        id: 1,
        patientId: 3,
        patientName: 'Priya Patel',
        mrn: 'MRN-2024-003',
        riskType: 'Sepsis',
        riskLevel: 'CRITICAL',
        probability: 0.89,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'pending',
        acknowledged: false,
        acknowledgedBy: null,
        escalated: true,
        deliveryStatus: { dashboard: true, sms: true, email: true }
    },
    {
        id: 2,
        patientId: 1,
        patientName: 'Rajesh Kumar',
        mrn: 'MRN-2024-001',
        riskType: 'Respiratory Failure',
        riskLevel: 'HIGH',
        probability: 0.68,
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        status: 'acknowledged',
        acknowledged: true,
        acknowledgedBy: 'Dr. Vivek Mehra',
        acknowledgedAt: new Date(Date.now() - 600000).toISOString(),
        escalated: false,
        deliveryStatus: { dashboard: true, sms: true, email: false }
    },
    {
        id: 3,
        patientId: 4,
        patientName: 'Vikram Singh',
        mrn: 'MRN-2024-004',
        riskType: 'Respiratory Failure',
        riskLevel: 'HIGH',
        probability: 0.72,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        status: 'resolved',
        acknowledged: true,
        acknowledgedBy: 'Dr. Aditi Rao',
        feedback: 'true_positive',
        escalated: true,
        deliveryStatus: { dashboard: true, sms: true, email: true }
    }
];

// System health metrics
export const systemHealth = {
    modelUptime: 99.8,
    avgLatency: 245, // ms
    requestsToday: 8432,
    failureRate: 0.2,
    dataFreshness: {
        vitals: 95, // % fresh within 15 min
        labs: 78,   // % fresh within 6 hours
        ehr: 88
    }
};
