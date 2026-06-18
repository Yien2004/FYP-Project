import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  Building, 
  Mail, 
  ShieldAlert,
  Trash2
} from 'lucide-react';

interface Ticket {
  id: string;
  timestamp: string;
  level: string;
  rawMessage: string;
  senderName: string;
  senderEmail: string;
  clinicName: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  subject: string;
  description: string;
}

export default function ProblemInboxSection() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'Critical' | 'High' | 'Medium' | 'Low'>('ALL');
  
  // Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const parseTicket = (log: any): Ticket => {
    const msg = log.message || '';
    
    // Parse using regex helper
    const fromMatch = msg.match(/From\s+(.+?)\s*\((.+?)\)/i);
    const clinicMatch = msg.match(/Clinic:\s*(.+?)(?=\s*\|)/i);
    const categoryMatch = msg.match(/Category:\s*(.+?)(?=\s*\|)/i);
    const severityMatch = msg.match(/Severity:\s*(.+?)(?=\s*\|)/i);
    const subjectMatch = msg.match(/Subject:\s*(.+?)(?=\s*\|)/i);
    const descMatch = msg.match(/Description:\s*(.+)/i);

    const severity = (severityMatch ? severityMatch[1].trim() : 'Medium') as any;

    return {
      id: log.id,
      timestamp: log.timestamp || new Date().toISOString(),
      level: log.level,
      rawMessage: msg,
      senderName: fromMatch ? fromMatch[1].trim() : 'Unknown Staff',
      senderEmail: fromMatch ? fromMatch[2].trim() : 'unknown@carepoint.com',
      clinicName: clinicMatch ? clinicMatch[1].trim() : 'General Facility',
      category: categoryMatch ? categoryMatch[1].trim() : 'System Issue',
      severity: ['Critical', 'High', 'Medium', 'Low'].includes(severity) ? severity : 'Medium',
      subject: subjectMatch ? subjectMatch[1].trim() : 'Clinician Support Ticket',
      description: descMatch ? descMatch[1].trim() : msg
    };
  };

  const fetchTickets = () => {
    setLoading(true);
    fetch("/api/logs")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Filter only logs that represent support tickets
          const supportLogs = data
            .filter((l: any) => l.message && l.message.startsWith('[SUPPORT TICKET]'))
            .map(parseTicket);
          setTickets(supportLogs);
        }
      })
      .catch(err => console.error("Failed to load support tickets", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleResolve = async (id: string) => {
    if (!window.confirm("Mark this problem report as resolved? This will delete the ticket log permanently.")) return;
    try {
      const res = await fetch(`/api/logs/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        alert("Problem report successfully resolved and archived!");
        setSelectedTicket(null);
        fetchTickets();
      } else {
        const err = await res.json();
        alert(`Failed to resolve ticket: ${err.error || "Server error"}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.clinicName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'ALL' || t.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Search & Filter Header */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets by subject, clinician, clinic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-700 outline-none focus:bg-white focus:ring-1 focus:ring-teal-400 h-9 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button 
            onClick={fetchTickets}
            className="h-9 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ml-auto sm:ml-0"
          >
            Refresh Inbox
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-neutral-900">Clinician Problem Report Inbox</h3>
            <p className="text-xs text-neutral-500 mt-0.5 font-medium">Review and resolve technical and module issues reported by on-duty clinical staff.</p>
          </div>
          <span className="text-xs bg-red-50 border border-red-100 text-red-750 font-extrabold px-3 py-1 rounded-xl">
            {filteredTickets.length} Active Tickets
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-neutral-500 font-mono">
            Loading problem ticket buffers...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-450 bg-neutral-50/50">
            Problem inbox is clear. No active tickets logged.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredTickets.map((t) => {
              const sevColors = {
                Critical: 'bg-red-50 text-red-750 border-red-200/50',
                High: 'bg-orange-50 text-orange-700 border-orange-200/50',
                Medium: 'bg-amber-50 text-amber-700 border-amber-200/50',
                Low: 'bg-blue-50 text-blue-700 border-blue-200/50'
              };

              return (
                <div 
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors cursor-pointer"
                >
                  <div className="space-y-1.5 min-w-0 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${sevColors[t.severity]}`}>
                        {t.severity}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{t.category}</span>
                    </div>

                    <h4 className="font-extrabold text-sm text-neutral-900 truncate">{t.subject}</h4>
                    <p className="text-[11px] text-neutral-500 font-medium truncate">{t.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[10px] text-neutral-400">
                      <span className="inline-flex items-center gap-1 font-bold text-neutral-600">
                        <Building className="w-3.5 h-3.5 text-neutral-400" /> {t.clinicName}
                      </span>
                      <span>Reporter: {t.senderName}</span>
                      <span className="font-mono">Logged: {new Date(t.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleResolve(t.id); }}
                      className="px-3.5 py-2 border border-emerald-200 hover:bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve Ticket
                    </button>
                    <ChevronRight className="w-4 h-4 text-neutral-350" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl max-w-xl w-full mx-4 space-y-4">
            <div className="border-b border-neutral-100 pb-3 flex items-start justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-neutral-450 tracking-wider">Clinician Support Ticket Details</span>
                <h4 className="font-extrabold text-base text-neutral-900 mt-1">{selectedTicket.subject}</h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                selectedTicket.severity === 'Critical' ? 'bg-red-50 text-red-750 border-red-200/50 animate-pulse' : 'bg-neutral-50 text-neutral-700 border-neutral-200/50'
              }`}>
                {selectedTicket.severity} Severity
              </span>
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-2 gap-4 text-xs font-medium text-neutral-600 bg-neutral-50 p-4 border border-neutral-150 rounded-2xl">
              <div>
                <span className="text-[9px] font-bold text-neutral-450 uppercase tracking-wider block">Submitting Clinician</span>
                <span className="text-neutral-900 font-bold block mt-0.5">{selectedTicket.senderName}</span>
                <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">{selectedTicket.senderEmail}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-neutral-450 uppercase tracking-wider block">Clinical Facility</span>
                <span className="text-neutral-900 font-bold block mt-0.5">{selectedTicket.clinicName}</span>
                <span className="text-[10px] text-neutral-500 block mt-0.5 font-mono">Category: {selectedTicket.category}</span>
              </div>
            </div>

            {/* Ticket Description */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-neutral-450 uppercase tracking-widest pl-0.5">Problem Description</span>
              <div className="bg-neutral-50 border border-neutral-150 rounded-2xl p-4 min-h-24 max-h-48 overflow-y-auto">
                <p className="text-xs text-neutral-800 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              </div>
            </div>

            {/* Severity Alarm Notice */}
            {selectedTicket.severity === 'Critical' && (
              <div className="bg-red-50/50 border border-red-150 rounded-xl p-3.5 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-800 leading-relaxed font-medium">
                  <strong>CRITICAL FAULT WARNING:</strong> This issue requires immediate resolution to avoid clinical scheduling or network service disruption.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Ticket View
              </button>
              
              <button
                onClick={() => handleResolve(selectedTicket.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-emerald-500/10 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
