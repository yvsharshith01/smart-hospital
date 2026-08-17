'use client';

import React, { useState, useEffect, useMemo } from 'react';

type UserSession = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export default function SmartHospital() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [email, setEmail] = useState('doctor@hospital.com');
  const [password, setPassword] = useState('doctor123');
  const [activeTab, setActiveTab] = useState<string>('DOCTOR');
  const [data, setData] = useState<any>({
    appointments: [],
    records: [],
    prescriptions: [],
    labRequests: [],
    bills: [],
    auditLogs: [],
  });

  // Clinical Consultation State
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicineInput, setMedicineInput] = useState('Amoxicillin 500mg (1-0-1)');
  const [labInput, setLabInput] = useState('Complete Blood Count (CBC)');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Telemedicine State
  const [inCall, setInCall] = useState(false);

  // Triage State
  const [triagePriority, setTriagePriority] = useState('NORMAL');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/workflow');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Allowed tabs per role for strict RBAC
  const allowedTabs = useMemo(() => {
    if (!currentUser) return [];
    switch (currentUser.role) {
      case 'DOCTOR':
        return ['DOCTOR', 'TELEMEDICINE'];
      case 'PATIENT':
        return ['PATIENT', 'TELEMEDICINE'];
      case 'RECEPTIONIST':
        return ['RECEPTIONIST'];
      case 'LABORATORY':
        return ['LABORATORY'];
      case 'PHARMACY':
        return ['PHARMACY'];
      case 'ADMIN':
        return ['ADMIN', 'DOCTOR', 'PATIENT', 'RECEPTIONIST', 'LABORATORY', 'PHARMACY', 'TELEMEDICINE'];
      default:
        return [currentUser.role];
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (res.ok) {
      setCurrentUser(json.user);
      setActiveTab(json.user.role);
    } else {
      alert(json.error);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setEmail('doctor@hospital.com');
    setPassword('doctor123');
  };

  const executeAction = async (action: string, payload: any) => {
    await fetch('/api/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        payload,
        userId: currentUser ? currentUser.id : 1,
      }),
    });
    fetchData();
  };

  const runAiAssistant = (symptomText: string) => {
    setAiLoading(true);
    setAiSuggestion(null);
    setTimeout(() => {
      setAiLoading(false);
      if (symptomText.toLowerCase().includes('chest') || symptomText.toLowerCase().includes('heart')) {
        setAiSuggestion('AI Co-pilot Suggestion: Rule out Acute Coronary Syndrome (ICD-10 I20.9). Recommend ECG + Troponin T Lab panel.');
      } else {
        setAiSuggestion('AI Co-pilot Suggestion: Symptoms match Acute Upper Respiratory Infection (ICD-10 J06.9). Recommended standard: Amoxicillin / Paracetamol.');
      }
    }, 600);
  };

  // Metrics calculation
  const totalRevenue = (data.bills || [])
    .filter((b: any) => b.status === 'PAID')
    .reduce((acc: number, curr: any) => acc + Number(curr.total_amount || 0), 0);

  const pendingAppointments = (data.appointments || []).filter((a: any) => a.status === 'SCHEDULED').length;
  const pendingLabs = (data.labRequests || []).filter((l: any) => l.status === 'REQUESTED').length;
  const pendingRx = (data.prescriptions || []).filter((p: any) => p.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 py-3.5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-cyan-500 flex items-center justify-center font-black text-slate-950 text-lg">
            +
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              NEXUS SMART HEALTHCARE
              <span className="text-[10px] bg-cyan-950 border border-cyan-700 text-cyan-400 font-semibold px-2 py-0.5 rounded">
                v2.4 Live
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Integrated Enterprise Clinical & Operations Architecture</p>
          </div>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{currentUser.name}</p>
              <p className="text-[10px] text-cyan-400 font-mono tracking-wider">{currentUser.role} ACCESS</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs bg-slate-800 hover:bg-red-950 hover:text-red-400 border border-slate-700 hover:border-red-800 px-3 py-1.5 rounded transition font-medium"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-500 font-mono">SYSTEM_LOCKED</span>
        )}
      </header>

      {!currentUser ? (
        <div className="max-w-md mx-auto mt-16 p-6 bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl backdrop-blur">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Clinical Portal Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">Select an identity or provide access credentials.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                Portal Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded p-2.5 text-sm text-white outline-none transition"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs uppercase tracking-wider font-semibold text-slate-...">
              </label>
              <input
  id="password"
  name="password"
  autoComplete="current-password"
  type="password"
  value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded p-2.5 text-sm text-white outline-none transition"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 py-2.5 rounded font-semibold text-sm transition shadow-lg shadow-cyan-600/20"
            >
              Authenticate to Operational Cluster
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1.5 font-mono">
            <p className="font-semibold text-slate-300 uppercase">Pre-Configured System Accounts:</p>
            <p className="hover:text-cyan-400 cursor-pointer" onClick={() => { setEmail('doctor@hospital.com'); setPassword('doctor123'); }}>
              • Doctor: doctor@hospital.com (doctor123)
            </p>
            <p className="hover:text-cyan-400 cursor-pointer" onClick={() => { setEmail('patient@hospital.com'); setPassword('patient123'); }}>
              • Patient: patient@hospital.com (patient123)
            </p>
            <p className="hover:text-cyan-400 cursor-pointer" onClick={() => { setEmail('reception@hospital.com'); setPassword('reception123'); }}>
              • Reception: reception@hospital.com (reception123)
            </p>
            <p className="hover:text-cyan-400 cursor-pointer" onClick={() => { setEmail('lab@hospital.com'); setPassword('lab123'); }}>
              • Laboratory: lab@hospital.com (lab123)
            </p>
            <p className="hover:text-cyan-400 cursor-pointer" onClick={() => { setEmail('pharmacy@hospital.com'); setPassword('pharmacy123'); }}>
              • Pharmacy: pharmacy@hospital.com (pharmacy123)
            </p>
            <p className="hover:text-cyan-400 cursor-pointer" onClick={() => { setEmail('admin@hospital.com'); setPassword('admin123'); }}>
              • Admin: admin@hospital.com (admin123)
            </p>
          </div>
        </div>
      ) : (
        <main className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Executive Metrics HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Pending Triage Queue</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{pendingAppointments} Patients</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Lab Diagnostics Active</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{pendingLabs} Pending</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Pharmacy Orders</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{pendingRx} Unfulfilled</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Settled Revenue</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          {/* RBAC-Filtered Navigation Tabs */}
          <nav className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs">
            {allowedTabs.map((role) => (
              <button
                key={role}
                onClick={() => setActiveTab(role)}
                className={`px-4 py-2 rounded-md font-semibold tracking-wider transition uppercase ${
                  activeTab === role
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {role} {currentUser.role === 'ADMIN' ? 'MODULE' : 'PORTAL'}
              </button>
            ))}
          </nav>

          {/* 1. DOCTOR VIEW */}
          {activeTab === 'DOCTOR' && allowedTabs.includes('DOCTOR') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-cyan-400 text-sm">Active Patient Queue & Clinical Desk</h3>
                    <span className="text-xs bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded text-slate-300 font-mono">
                      Queue: {pendingAppointments}
                    </span>
                  </div>

                  {data.appointments && data.appointments.filter((a: any) => a.status === 'SCHEDULED').length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-800 rounded-lg">
                      <p className="text-sm text-slate-400">All registered consultations completed.</p>
                      <button
                        onClick={() => executeAction('CREATE_APPOINTMENT', { patientId: 1, doctorId: 1 })}
                        className="mt-3 text-xs bg-cyan-600/80 hover:bg-cyan-600 px-3 py-1.5 rounded transition"
                      >
                        + Summon Next Patient
                      </button>
                    </div>
                  ) : (
                    data.appointments
                      .filter((a: any) => a.status === 'SCHEDULED')
                      .map((app: any) => (
                        <div key={app.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                            <div>
                              <p className="font-semibold text-slate-100 text-sm">Patient: {app.patient_name}</p>
                              <p className="text-xs text-slate-400">Appointment #{app.id} • Scheduled</p>
                            </div>
                            <button
                              onClick={() => runAiAssistant(diagnosis || 'chest pain')}
                              className="text-xs bg-purple-950 border border-purple-800 hover:bg-purple-900 text-purple-300 px-2.5 py-1 rounded transition flex items-center gap-1.5"
                            >
                              {aiLoading ? 'Analyzing...' : 'Run AI Diagnostic Assistant'}
                            </button>
                          </div>

                          {aiSuggestion && (
                            <div className="p-3 bg-purple-950/40 border border-purple-800 rounded text-xs text-purple-200">
                              {aiSuggestion}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-slate-400 mb-1 font-semibold">Primary Diagnosis (ICD-10)</label>
                              <input
                                type="text"
                                placeholder="e.g. Acute Bronchitis"
                                value={diagnosis}
                                onChange={(e) => setDiagnosis(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 mb-1 font-semibold">Prescription (Rx Details)</label>
                              <input
                                type="text"
                                placeholder="e.g. Amoxicillin 500mg (1-0-1)"
                                value={medicineInput}
                                onChange={(e) => setMedicineInput(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 mb-1 font-semibold">Diagnostic Lab Order</label>
                              <input
                                type="text"
                                placeholder="e.g. Complete Blood Count (CBC)"
                                value={labInput}
                                onChange={(e) => setLabInput(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 mb-1 font-semibold">Clinical Examination Notes</label>
                              <input
                                type="text"
                                placeholder="Observations, vitals, allergies..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              executeAction('COMPLETE_CONSULTATION', {
                                appointmentId: app.id,
                                patientId: app.patient_id,
                                doctorId: app.doctor_id,
                                diagnosis: diagnosis || 'Acute Pharyngitis',
                                notes: notes || 'Vitals normal. Advised rest.',
                                medicines: [{ name: medicineInput, dosage: '1-0-1', days: 5 }],
                                labTest: labInput,
                              })
                            }
                            className="w-full bg-cyan-600 hover:bg-cyan-500 py-2 rounded text-xs font-semibold uppercase tracking-wider transition"
                          >
                            Finalize Consultation & Broadcast Orders
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Patient History Preview */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
                <h3 className="font-semibold text-cyan-400 text-sm">Patient EMR Records</h3>
                <div className="space-y-3 max-h-[460px] overflow-y-auto">
                  {data.records && data.records.length > 0 ? (
                    data.records.map((r: any) => (
                      <div key={r.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded text-xs space-y-1">
                        <p className="font-semibold text-slate-200">{r.patient_name} - EMR #{r.id}</p>
                        <p className="text-cyan-300 font-medium">Dx: {r.diagnosis}</p>
                        <p className="text-slate-400">{r.clinical_notes}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {new Date(r.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No previous records logged.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. PATIENT VIEW */}
          {activeTab === 'PATIENT' && allowedTabs.includes('PATIENT') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
                <h3 className="font-semibold text-cyan-400 text-sm">Self-Service Appointment Booking</h3>
                <p className="text-xs text-slate-400">
                  Instant registration with on-duty Cardiologist Dr. Sarah Connor.
                </p>
                <button
                  onClick={() => executeAction('CREATE_APPOINTMENT', { patientId: 1, doctorId: 1 })}
                  className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2.5 rounded text-xs font-semibold transition"
                >
                  Book Instant Clinical Visit
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
                <h3 className="font-semibold text-cyan-400 text-sm">Patient Billing & Digital Invoices</h3>
                <div className="space-y-3">
                  {data.bills && data.bills.length > 0 ? (
                    data.bills.map((bill: any) => (
                      <div
                        key={bill.id}
                        className="p-3 bg-slate-950 border border-slate-800 rounded flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">Invoice #{bill.id} - ${bill.total_amount}</p>
                          <p className="text-slate-400">
                            Consult ($500) + Lab ($200) + Pharmacy ($100)
                          </p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              bill.status === 'PAID'
                                ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                                : 'bg-amber-950 border border-amber-800 text-amber-300'
                            }`}
                          >
                            {bill.status}
                          </span>
                        </div>
                        {bill.status === 'PENDING' && (
                          <button
                            onClick={() => executeAction('PAY_BILL', { billId: bill.id })}
                            className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded text-xs font-semibold"
                          >
                            Pay Online
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No bills generated.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 3. RECEPTIONIST VIEW */}
          {activeTab === 'RECEPTIONIST' && allowedTabs.includes('RECEPTIONIST') && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
              <h3 className="font-semibold text-cyan-400 text-sm">Front-Desk Triage & Queue Dispatch</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <select
                  value={triagePriority}
                  onChange={(e) => setTriagePriority(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white"
                >
                  <option value="NORMAL">Standard Walk-in Queue</option>
                  <option value="EMERGENCY">Emergency Priority (Code Red)</option>
                </select>
                <button
                  onClick={() => executeAction('CREATE_APPOINTMENT', { patientId: 1, doctorId: 1 })}
                  className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded text-xs font-semibold"
                >
                  Issue Token & Route to Dr. Sarah Connor
                </button>
              </div>
            </div>
          )}

          {/* 4. LABORATORY VIEW */}
          {activeTab === 'LABORATORY' && allowedTabs.includes('LABORATORY') && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
              <h3 className="font-semibold text-cyan-400 text-sm">Diagnostic & Pathology Orders</h3>
              <div className="space-y-3">
                {data.labRequests && data.labRequests.length > 0 ? (
                  data.labRequests.map((req: any) => (
                    <div
                      key={req.id}
                      className="p-3.5 bg-slate-950 border border-slate-800 rounded flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-200">
                          {req.test_name} (Patient: {req.patient_name})
                        </p>
                        <p className="text-slate-400">Order #{req.id} • Status: {req.status}</p>
                        {req.report_url && (
                          <a
                            href={req.report_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline text-[11px] block mt-1"
                          >
                            View Diagnostic Attachment
                          </a>
                        )}
                      </div>
                      {req.status === 'REQUESTED' && (
                        <button
                          onClick={() => executeAction('UPDATE_LAB_REPORT', { labRequestId: req.id })}
                          className="bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 rounded text-xs font-semibold"
                        >
                          Publish Verified Report
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No laboratory requests pending.</p>
                )}
              </div>
            </div>
          )}

          {/* 5. PHARMACY VIEW */}
          {activeTab === 'PHARMACY' && allowedTabs.includes('PHARMACY') && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
                <h3 className="font-semibold text-cyan-400 text-sm">Prescription Dispensation Queue</h3>
                <div className="space-y-3">
                  {data.prescriptions && data.prescriptions.length > 0 ? (
                    data.prescriptions.map((rx: any) => (
                      <div
                        key={rx.id}
                        className="p-3.5 bg-slate-950 border border-slate-800 rounded flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-semibold text-slate-200">
                            Prescription #{rx.id} - Patient: {rx.patient_name}
                          </p>
                          <p className="text-slate-400 font-mono mt-0.5">
                            Items: {typeof rx.medicines === 'string' ? rx.medicines : JSON.stringify(rx.medicines)}
                          </p>
                        </div>
                        {rx.status === 'PENDING' ? (
                          <button
                            onClick={() => executeAction('DISPENSE_PRESCRIPTION', { prescriptionId: rx.id })}
                            className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded text-xs font-semibold"
                          >
                            Dispense
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-semibold uppercase text-[10px]">FULFILLED</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No prescriptions found.</p>
                  )}
                </div>
              </div>

              {/* Live Drug Stock */}
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-3 text-xs">
                <h3 className="font-semibold text-cyan-400 text-sm">Pharmacy Inventory</h3>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
                  <span>Paracetamol 500mg</span>
                  <span className="text-emerald-400 font-mono font-bold">98 in stock</span>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
                  <span>Amoxicillin 250mg</span>
                  <span className="text-amber-400 font-mono font-bold">14 in stock (Low)</span>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex justify-between items-center">
                  <span>Cetirizine 10mg</span>
                  <span className="text-emerald-400 font-mono font-bold">185 in stock</span>
                </div>
              </div>
            </div>
          )}

          {/* 6. TELEMEDICINE VIEW */}
          {activeTab === 'TELEMEDICINE' && allowedTabs.includes('TELEMEDICINE') && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-cyan-400 text-sm">Encrypted Video Consultation Suite</h3>
                  <p className="text-xs text-slate-400">WebRTC Session ID: #SEC-RTC-8823</p>
                </div>
                <button
                  onClick={() => setInCall(!inCall)}
                  className={`px-4 py-1.5 rounded text-xs font-semibold ${
                    inCall ? 'bg-red-700 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {inCall ? 'Disconnect Call' : 'Start Secure Session'}
                </button>
              </div>

              <div className="h-64 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500">
                {inCall ? (
                  <div className="text-center space-y-2">
                    <div className="h-4 w-4 bg-emerald-500 rounded-full mx-auto animate-ping" />
                    <p className="text-sm font-semibold text-slate-200">Secure Consultation Stream Live</p>
                    <p className="text-xs text-slate-400">Doctor: Dr. Sarah Connor | Patient: John Doe</p>
                  </div>
                ) : (
                  <p className="text-xs">Camera & Audio channel in standby mode</p>
                )}
              </div>
            </div>
          )}

          {/* 7. ADMIN AUDIT TRAIL */}
          {activeTab === 'ADMIN' && allowedTabs.includes('ADMIN') && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-lg space-y-4">
              <h3 className="font-semibold text-cyan-400 text-sm">Security & Audit Log Trail</h3>
              <div className="divide-y divide-slate-800/80 max-h-96 overflow-y-auto font-mono text-xs">
                {data.auditLogs && data.auditLogs.length > 0 ? (
                  data.auditLogs.map((log: any) => (
                    <div key={log.id} className="py-2 flex justify-between items-center text-slate-300">
                      <span>• {log.action}</span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No logs recorded yet.</p>
                )}
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}