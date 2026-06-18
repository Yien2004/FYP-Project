import React, { useState } from 'react';
import { 
  GitBranch, 
  Users, 
  PlusCircle, 
  Trash2, 
  Sparkles, 
  UserPlus, 
  ShieldAlert, 
  Activity, 
  Check, 
  SlidersHorizontal,
  FolderTree
} from 'lucide-react';
import { mockRoutingRules, mockUserAccounts } from '../../data/mockData';
import { RoutingRule, UserAccount } from '../../types';

export default function SettingsAndRouting() {
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<'routing' | 'users'>('routing');

  // Rule State Managers
  const [rules, setRules] = useState<RoutingRule[]>(mockRoutingRules);
  const [triggerInput, setTriggerInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [priorityInput, setPriorityInput] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');

  // Account State Managers
  const [accounts, setAccounts] = useState<UserAccount[]>(mockUserAccounts);
  const [accName, setAccName] = useState('');
  const [accEmail, setAccEmail] = useState('');
  const [accRole, setAccRole] = useState<'Doctor' | 'Patient' | 'Nurse' | 'Admin'>('Patient');

  // Rule feedback messages
  const [ruleSuccessMsg, setRuleSuccessMsg] = useState('');
  const [ruleErrorMsg, setRuleErrorMsg] = useState('');

  // Account feedback messages
  const [accSuccessMsg, setAccSuccessMsg] = useState('');
  const [accErrorMsg, setAccErrorMsg] = useState('');

  // Handle Create Routing Rule
  const handleCreateRoutingRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerInput.trim() || !destinationInput.trim()) {
      setRuleErrorMsg('Please fulfill both Trigger statement and Destination unit.');
      setTimeout(() => setRuleErrorMsg(''), 4000);
      return;
    }

    const newRule: RoutingRule = {
      id: `rule_sim_${Date.now()}`,
      trigger: triggerInput,
      destination: destinationInput,
      priority: priorityInput,
      status: 'Active'
    };

    setRules(prev => [...prev, newRule]);
    setTriggerInput('');
    setDestinationInput('');
    setPriorityInput('Medium');
    setRuleSuccessMsg('New routing pathway established successfully!');
    setTimeout(() => setRuleSuccessMsg(''), 4000);
  };

  // Toggle Rule Status
  const handleToggleRuleStatus = (id: string) => {
    setRules(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return r;
    }));
  };

  // Create User Account
  const handleCreateUserAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim() || !accEmail.trim()) {
      setAccErrorMsg('Please fulfill both Account Name and Email.');
      setTimeout(() => setAccErrorMsg(''), 4000);
      return;
    }

    const newAcc: UserAccount = {
      id: `usr_sim_${Date.now()}`,
      name: accName,
      email: accEmail,
      role: accRole,
      status: 'Active'
    };

    setAccounts(prev => [newAcc, ...prev]);
    setAccName('');
    setAccEmail('');
    setAccRole('Patient');
    setAccSuccessMsg('Authorized user provisioned successfully in directory database!');
    setTimeout(() => setAccSuccessMsg(''), 4000);
  };

  // Suspend User Account
  const handleToggleAccountStatus = (id: string) => {
    setAccounts(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'Active' ? 'Suspended' : 'Active' };
      }
      return a;
    }));
  };

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Sub-Tabs Selector */}
      <div className="flex border-b border-neutral-200">
        <button
          onClick={() => setActiveSettingsSubTab('routing')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSettingsSubTab === 'routing'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Rule-Based Routing Setup
        </button>
        <button
          onClick={() => setActiveSettingsSubTab('users')}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeSettingsSubTab === 'users'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Users className="w-4 h-4" />
          System User Directory
        </button>
      </div>

      {/* RENDER RULE-BASED ROUTING */}
      {activeSettingsSubTab === 'routing' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Smart Insights banner */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wide">Routing Precision Core</h4>
                <p className="text-xs text-amber-800 mt-1">Smart algorithms parse symptoms in inbound HL7 packages to detour beds and clinics efficiently.</p>
              </div>
            </div>

            <div className="flex gap-4 text-xs font-bold leading-none py-1 text-amber-800">
              <div className="px-3 py-2 bg-white rounded-lg border border-amber-205/60">
                Precision Ratio: <strong className="text-neutral-950 font-extrabold text-xs">98.4%</strong>
              </div>
              <div className="px-3 py-2 bg-white rounded-lg border border-amber-205/60">
                Rules Executed today: <strong className="text-neutral-950 font-extrabold text-xs">482 times</strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Logic Pathways Config Table */}
            <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-base text-neutral-900">Configured Logic Pathways</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Edit status parameters or toggle state overrides to suspend detours.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider pb-2">
                      <th className="pb-3 pl-1">Symptoms Query (Trigger)</th>
                      <th className="pb-3">Detour Destination (Triage Unit)</th>
                      <th className="pb-3 text-center">Priority</th>
                      <th className="pb-3 text-center">Rule State</th>
                      <th className="pb-3 text-right">Switch State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-sans">
                    {rules.map((rule) => {
                      const isActive = rule.status === 'Active';
                      const isCrit = rule.priority === 'Critical';
                      const isHigh = rule.priority === 'High';
                      const prioBadge = isCrit 
                        ? 'bg-red-50 text-red-700 border-red-100' 
                        : isHigh 
                          ? 'bg-amber-50 text-amber-700 border-amber-100' 
                          : 'bg-neutral-105 text-neutral-600 border-neutral-200';
                      
                      return (
                        <tr key={rule.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3.5 pl-1">
                            <span className="font-bold text-sm text-neutral-900 text-xs">{rule.trigger}</span>
                          </td>
                          <td className="py-3.5 font-semibold text-neutral-600">{rule.destination}</td>
                          <td className="py-3.5 text-center">
                            <span className={`text-[9px] px-2 py-0.5 border font-extrabold rounded uppercase ${prioBadge}`}>
                              {rule.priority}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isActive 
                                ? 'bg-emerald-55 bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-neutral-100 text-neutral-500'
                            }`}>
                              {rule.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-semibold">
                            <button
                              id={`toggle-rule-${rule.id}`}
                              onClick={() => handleToggleRuleStatus(rule.id)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors text-neutral-700"
                            >
                              Toggle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rule Builder Panel */}
            <div className="bg-white border-2 border-dashed border-neutral-200 rounded-2xl p-6 shadow-xs self-start">
              <div className="border-b border-neutral-100 pb-3 mb-4">
                <h4 className="font-bold text-sm text-neutral-900">Routing Logic Builder</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">Assemble binary detour triggers based on incoming diagnostic symptoms.</p>
              </div>

              <form onSubmit={handleCreateRoutingRule} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Trigger symptoms (If patient presents with...)</label>
                  <input
                    type="text"
                    id="rule-input-trigger"
                    placeholder="e.g. respiratory symptoms, chest pain"
                    value={triggerInput}
                    onChange={(e) => setTriggerInput(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Route destination (Direct immediately to...)</label>
                  <input
                    type="text"
                    id="rule-input-destination"
                    placeholder="e.g. Cardiovascular CCU Unit"
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5 font-sans">Priority severity tier</label>
                  <select
                    value={priorityInput}
                    onChange={(e) => setPriorityInput(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9"
                  >
                    <option value="Low">Low Priority Tier</option>
                    <option value="Medium">Medium Priority Tier</option>
                    <option value="High">High Priority Tier</option>
                    <option value="Critical">Critical Priority Tier</option>
                  </select>
                </div>

                {/* Messages feedback */}
                {ruleErrorMsg && (
                  <p className="text-[11px] text-red-650 bg-red-50 border border-red-100 p-2 rounded-lg">{ruleErrorMsg}</p>
                )}

                {ruleSuccessMsg && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2 rounded-lg">{ruleSuccessMsg}</p>
                )}

                <button
                  type="submit"
                  id="rule-submit-btn"
                  className="w-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Establish Routines Pathway
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* RENDER SYSTEM USER DIRECTORY */}
      {activeSettingsSubTab === 'users' && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* User Directory Table */}
            <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-base text-neutral-900">Provisioned User Profiles</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Audit role permissions or suspend access parameters for active clinical and patient logins.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-100 text-neutral-400 font-bold uppercase tracking-wider pb-2">
                      <th className="pb-3 pl-1">Full Authorized Name</th>
                      <th className="pb-3">Email coordinate</th>
                      <th className="pb-3 text-center">Permitted Role</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Restrict access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {accounts.map((acc) => {
                      const isActive = acc.status === 'Active';
                      return (
                        <tr key={acc.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3 pl-1">
                            <span className="font-bold text-sm text-neutral-900 text-xs">{acc.name}</span>
                          </td>
                          <td className="py-3 text-neutral-500 font-medium font-mono">{acc.email}</td>
                          <td className="py-3 text-center">
                            <span className="text-[10px] px-2.5 py-0.5 font-bold rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 text-center font-sans">
                              {acc.role}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isActive 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-red-50 text-red-700 border border-red-100'
                            }`}>
                              {acc.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              id={`toggle-user-${acc.id}`}
                              onClick={() => handleToggleAccountStatus(acc.id)}
                              className={`text-xs font-semibold px-2 py-1.5 rounded-lg border transition-colors ${
                                isActive 
                                  ? 'hover:bg-red-50 hover:text-red-700 border-neutral-200 text-neutral-700' 
                                  : 'hover:bg-emerald-50 hover:text-emerald-700 border-neutral-200 text-neutral-700'
                              }`}
                            >
                              {isActive ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Account Creation panel */}
            <div className="bg-white border-2 border-dashed border-neutral-200 rounded-2xl p-6 shadow-xs self-start">
              <div className="border-b border-neutral-100 pb-3 mb-4">
                <h4 className="font-bold text-sm text-neutral-900">Provision User Profile</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">Fulfill account credentials directory profiles under centralized server records.</p>
              </div>

              <form onSubmit={handleCreateUserAccount} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Full Name</label>
                  <input
                    type="text"
                    id="user-input-name"
                    placeholder="e.g. Dr. Arthur Dent"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Primary Organization Email</label>
                  <input
                    type="email"
                    id="user-input-email"
                    placeholder="doctor@lifelink.org"
                    value={accEmail}
                    onChange={(e) => setAccEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9"
                  />
                </div>

                <div className="space-y-1 font-sans">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest pl-0.5">Permitted Access Role</label>
                  <select
                    value={accRole}
                    onChange={(e) => setAccRole(e.target.value as any)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 outline-none focus:bg-white focus:ring-1 focus:ring-neutral-400 h-9"
                  >
                    <option value="Patient">Patient</option>
                    <option value="Doctor">Doctor (Licensed Specialist)</option>
                    <option value="Nurse">Nurse (Clinical practitioner)</option>
                    <option value="Admin">Admin (Core operator)</option>
                  </select>
                </div>

                {accErrorMsg && (
                  <p className="text-[11px] text-red-650 bg-red-50 border border-red-100 p-2 rounded-lg">{accErrorMsg}</p>
                )}

                {accSuccessMsg && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2 rounded-lg">{accSuccessMsg}</p>
                )}

                <button
                  type="submit"
                  id="user-submit-btn"
                  className="w-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Provision Workspace Access
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
