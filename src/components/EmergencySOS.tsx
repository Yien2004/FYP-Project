import React, { useState } from "react";
import { PhoneCall, AlertOctagon, MapPin, Copy, Check, X, ShieldAlert } from "lucide-react";
import { PatientProfile } from "../types";

interface EmergencySOSProps {
  patientProfile: PatientProfile;
}

export default function EmergencySOS({ patientProfile }: EmergencySOSProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Stable, static location details
  const defaultCoords = "5.4164° N, 100.3327° E";
  const defaultAddress = "128, Jalan Macalister, 10400 George Town, Pulau Pinang, Malaysia";

  const handleCopyLocation = () => {
    const text = `Coordinates: ${defaultCoords} | Address: ${defaultAddress}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      {/* Floating Red SOS Trigger Button - Static, no dynamic animations */}
      <aside aria-label="Emergency SOS Quick Action" className="fixed bottom-6 right-6 z-50 flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-full shadow-md border border-red-500 cursor-pointer"
          title="Emergency SOS (Call 999)"
        >
          <AlertOctagon className="w-4 h-4 text-white" />
          <span>SOS Emergency</span>
        </button>
      </aside>

      {/* Emergency Modal - Clean, professional, static */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl text-slate-800 relative space-y-5 font-sans">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 cursor-pointer"
              title="Close SOS Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100 inline-block">
                  National Emergency Services (MERS 999)
                </span>
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Emergency Medical Assistance
                </h2>
                <p className="text-xs text-slate-500 leading-normal">
                  For sudden severe chest pain, stroke signs, acute breathing difficulty, or serious trauma.
                </p>
              </div>
            </div>

            {/* Calling Option: Call 999 */}
            <div className="space-y-2.5">
              <a
                href="tel:999"
                className="block w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-2xl shadow-md shadow-red-600/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base">Call 999 (National Emergency)</span>
                      </div>
                      <p className="text-[11px] text-red-100 mt-0.5">
                        Prefills 999 in phone dialer (tap call in your phone app to place)
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-white/80">➔</span>
                </div>
              </a>
            </div>

            {/* Stable GPS Location Readout */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>Current Location (Provide to 999 Operator)</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLocation}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? "Copied" : "Copy Location"}</span>
                </button>
              </div>

              <div className="bg-white rounded-xl p-3 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">GPS Coordinates:</span>
                  <span className="text-slate-900 font-mono font-bold">{defaultCoords}</span>
                </div>
                <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-medium shrink-0">Estimated Address:</span>
                  <span className="text-right text-slate-800 font-medium text-[11px]">{defaultAddress}</span>
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl cursor-pointer text-center"
            >
              Cancel & Return
            </button>
          </div>
        </div>
      )}
    </>
  );
}
