import React, { useState } from "react";
import { UserCheck, ShieldCheck, HeartPulse, CreditCard, ArrowRight, ArrowLeft, RefreshCw, Plus, Check } from "lucide-react";
import { PatientProfile } from "../types";

interface PatientRegistrationProps {
  currentProfile: PatientProfile;
  onUpdateProfile: (updated: PatientProfile) => void;
  onSetScreen: (screen: string) => void;
}

export default function PatientRegistration({ currentProfile, onUpdateProfile, onSetScreen }: PatientRegistrationProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<PatientProfile>({ ...currentProfile });
  const [tempAllergy, setTempAllergy] = useState("");
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const handleAddField = (field: 'allergies' | 'chronicConditions', value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value) ? prev[field] : [...prev[field], value]
    }));
  };

  const handleRemoveField = (field: 'allergies' | 'chronicConditions', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setShowSavedMsg(true);
    setTimeout(() => {
      setShowSavedMsg(false);
      onSetScreen("dashboard");
    }, 1800);
  };

  return (
    <div id="registration-view" className="py-6 space-y-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">Patient Registry & MyKad Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain your universal medical authentication indexes, critical allergies records, and insurance policy parameters.
          </p>
        </div>

        {showSavedMsg && (
          <div className="bg-emerald-500 text-white font-mono text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4" /> SECURE PROFILE SYNCED!
          </div>
        )}
      </div>

      {/* Step Indicator Train bar */}
      <div className="grid grid-cols-3 max-w-3xl mx-auto gap-4">
        <button 
          onClick={() => setStep(1)}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
            step === 1 ? 'border-teal-600 bg-teal-50/20 text-teal-800' : 'border-slate-100 hover:bg-slate-50 text-slate-400'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <div className="hidden sm:block">
            <span className="text-[10px] font-bold block leading-none">Step 1</span>
            <span className="text-xs font-semibold block mt-1">Personal Details</span>
          </div>
        </button>

        <button 
          onClick={() => setStep(2)}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
            step === 2 ? 'border-teal-600 bg-teal-50/20 text-teal-800' : 'border-slate-100 hover:bg-slate-50 text-slate-400'
          }`}
        >
          <HeartPulse className="w-5 h-5" />
          <div className="hidden sm:block">
            <span className="text-[10px] font-bold block leading-none">Step 2</span>
            <span className="text-xs font-semibold block mt-1">Medical Profile</span>
          </div>
        </button>

        <button 
          onClick={() => setStep(3)}
          className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ... ${
            step === 3 ? 'border-teal-600 bg-teal-50/20 text-teal-800' : 'border-slate-100 hover:bg-slate-50 text-slate-400'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <div className="hidden sm:block">
            <span className="text-[10px] font-bold block leading-none">Step 3</span>
            <span className="text-xs font-semibold block mt-1">Insurance & Bill</span>
          </div>
        </button>
      </div>

      <form onSubmit={handleUpdate} className="max-w-3xl mx-auto bg-white border border-slate-150 rounded-3xl p-8 shadow-sm space-y-6">
        
        {/* STEP 1: PERSONAL INFORMATION */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">National Identity & Profile</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Patients Full Name</label>
                <input 
                  type="text" 
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                  placeholder="Insert name matching MyKad..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">MyKad or Passport Ticket</label>
                <input 
                  type="text" 
                  value={formData.myKadOrPassport}
                  onChange={(e) => setFormData({ ...formData, myKadOrPassport: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                  placeholder="e.g. 940822-14-5543"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Primary Contact Number</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                  placeholder="+60 12-xxxxxxx"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Registered Email Address</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                  placeholder="patient@gmail.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Primary Blood Type</label>
                <select 
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                >
                  <option value="O+">O Positive (O+)</option>
                  <option value="O-">O Negative (O-)</option>
                  <option value="A+">A Positive (A+)</option>
                  <option value="A-">A Negative (A-)</option>
                  <option value="B+">B Positive (B+)</option>
                  <option value="AB+">AB Positive (AB+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Gender</label>
                <select 
                  value={formData.gender || "Male"}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Nationality</label>
                <input 
                  type="text" 
                  value={formData.nationality || "Malaysian"}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                  placeholder="e.g. Malaysian"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Emergency Contact Name</label>
                <input 
                  type="text" 
                  value={formData.emergencyContactName || ""}
                  onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                  placeholder="e.g. Razali Bin Ahmad"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Emergency Contact Phone</label>
                <input 
                  type="text" 
                  value={formData.emergencyContactPhone || ""}
                  onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                  placeholder="e.g. +60 12-987 6543 (Father)"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition flex items-center gap-2 cursor-pointer"
              >
                Proceed to Medical Profile <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: MEDICAL SUMMARY PROFILE */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Attending Medical Summaries</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Declare Custom Allergies</label>
                <div className="flex gap-2.5">
                  <input 
                    type="text" 
                    value={tempAllergy}
                    onChange={(e) => setTempAllergy(e.target.value)}
                    placeholder="e.g. Aspirin, Sea food..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-semibold font-mono"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      if(tempAllergy.trim()){
                        handleAddField('allergies', tempAllergy.trim());
                        setTempAllergy("");
                      }
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.allergies.map(alg => (
                    <span key={alg} className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold py-1 px-3 rounded-full flex items-center gap-1.5 font-mono">
                      {alg}
                      <button 
                        type="button"
                        onClick={() => handleRemoveField('allergies', alg)}
                        className="text-red-400 hover:text-red-700 font-extrabold focus:outline-none"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Chronic Medical Conditions (Check appropriate filters)</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Asthma (Mild)", "Seasonal Rhinitis", "Hypertension", "Diabetes Typ-2", "None"].map(cond => {
                    const active = formData.chronicConditions.includes(cond);
                    return (
                      <div 
                        key={cond}
                        onClick={() => {
                          if (cond === "None") {
                            setFormData(prev => ({ ...prev, chronicConditions: ["None"] }));
                          } else {
                            const withoutNone = formData.chronicConditions.filter(c => c !== "None");
                            const next = withoutNone.includes(cond) 
                              ? withoutNone.filter(c => c !== cond) 
                              : [...withoutNone, cond];
                            setFormData(prev => ({ ...prev, chronicConditions: next.length > 0 ? next : ["None"] }));
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold font-mono cursor-pointer transition text-center ${
                          active ? 'border-teal-600 bg-teal-50/20 text-teal-800' : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {cond}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Personal info
              </button>
              
              <button 
                type="button"
                onClick={() => setStep(3)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition flex items-center gap-2 cursor-pointer"
              >
                Go to Insurance & Billing <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: INSURANCE & BILLING */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Insurance coverage & Corporate Billing</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Primary Insurance Provider</label>
                <select 
                  value={formData.insuranceProvider}
                  onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                >
                  <option value="Allianz Health Malaysia">Allianz Health Malaysia</option>
                  <option value="Great Eastern Assurance">Great Eastern Assurance</option>
                  <option value="Etiqa Takaful">Etiqa Takaful</option>
                  <option value="Prudential BSN">Prudential BSN</option>
                  <option value="AIA Healthcare">AIA Healthcare</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Policy/Co-pay Card Reference ID</label>
                <input 
                  type="text" 
                  value={formData.insurancePolicyNumber}
                  onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium font-mono"
                  placeholder="e.g. ALZ-88942-004"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Registered General Practitioner</label>
                <input 
                  type="text" 
                  value={formData.primaryPhysician}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-400 font-medium font-mono cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Locked by hospital index to chief medical officer.</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Medical summary
              </button>
              
              <button 
                type="submit"
                className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs py-3.5 px-8 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-slate-900/10 uppercase tracking-widest-pro"
              >
                Verify & Sync Database <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
}
