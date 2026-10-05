import React, { useState } from 'react';
import { UserProfile } from '../types/iot';
import { 
  ShieldCheck, 
  Fingerprint, 
  KeyRound, 
  Lock, 
  Cpu, 
  User, 
  CheckCircle2, 
  X, 
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface LoginPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const LoginPortalModal: React.FC<LoginPortalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserProfile['role']>('Resident Homeowner');
  const [emailInput, setEmailInput] = useState('resident@nexusnurture.io');
  const [meshToken, setMeshToken] = useState('NN-NODE-8842-ESP32');
  const [isScanningBiometric, setIsScanningBiometric] = useState(false);
  const [authSuccessNotice, setAuthSuccessNotice] = useState(false);

  if (!isOpen) return null;

  const handleRoleSelect = (role: UserProfile['role']) => {
    setSelectedRole(role);
    if (role === 'Resident Homeowner') {
      setEmailInput('resident@nexusnurture.io');
      setMeshToken('NN-HOME-9912-ESP32');
    } else if (role === 'Systems Architect') {
      setEmailInput('architect@nexusnurture.io');
      setMeshToken('NN-ROOT-DEBUG-EDGE-77');
    } else {
      setEmailInput('guest@nexusnurture.io');
      setMeshToken('NN-GUEST-VIEW-READONLY');
    }
  };

  const handleBiometricAuth = () => {
    setIsScanningBiometric(true);
    setTimeout(() => {
      setIsScanningBiometric(false);
      setAuthSuccessNotice(true);
      setTimeout(() => {
        setAuthSuccessNotice(false);
        onLogin({
          id: 'user-' + Date.now(),
          name: selectedRole === 'Systems Architect' ? 'Dr. Elena Rostova' : selectedRole === 'Resident Homeowner' ? 'Alex Mercer' : 'Guest Visitor',
          email: emailInput,
          role: selectedRole,
          avatarInitials: selectedRole === 'Systems Architect' ? 'ER' : selectedRole === 'Resident Homeowner' ? 'AM' : 'GV',
          meshKey: meshToken,
          authenticated: true,
        });
        onClose();
      }, 700);
    }, 1200);
  };

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      id: 'user-' + Date.now(),
      name: selectedRole === 'Systems Architect' ? 'Lead Systems Architect' : 'Resident Homeowner',
      email: emailInput,
      role: selectedRole,
      avatarInitials: 'NN',
      meshKey: meshToken,
      authenticated: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow in corner */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser.authenticated ? (
          /* Profile active state */
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center shadow-sm">
                {currentUser.avatarInitials}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{currentUser.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {currentUser.role}
                  </span>
                  <span>·</span>
                  <span>{currentUser.email}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Hardware Mesh Token:</span>
                <span className="font-mono font-medium text-slate-800">{currentUser.meshKey}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Edge Gateway Auth:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Node Latency:</span>
                <span className="font-mono text-slate-700">3.4 ms (Local ESP32)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onLogout();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
              >
                Sign Out / Disconnect
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Login Form */
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-3 border border-emerald-100">
                <Fingerprint className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Nexus Nurture Edge Portal
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Context-Aware Smart Living Architecture · Intelligent Systems
              </p>
            </div>

            {/* Role Quick Selector */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Access Level & Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Resident Homeowner', 'Systems Architect', 'Guest Observer'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      selectedRole === role
                        ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs truncate">{role.split(' ')[0]}</div>
                    <div className="text-[10px] text-slate-400 truncate">{role.split(' ')[1] || 'View'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Biometric One-Tap Passkey (Top aesthetic feature) */}
            <button
              onClick={handleBiometricAuth}
              disabled={isScanningBiometric}
              className={`w-full relative overflow-hidden py-3 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 mb-4 ${
                authSuccessNotice
                  ? 'bg-emerald-600 text-white'
                  : isScanningBiometric
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
              }`}
            >
              {isScanningBiometric ? (
                <>
                  <Fingerprint className="w-4 h-4 animate-pulse text-emerald-400" />
                  <span>Verifying Hardware Key & Biometrics...</span>
                </>
              ) : authSuccessNotice ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Mesh Authenticated · Redirecting</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  <span>Authenticate with Touch ID / Passkey</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-mono">
                or mesh credentials
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Standard Credentials Form */}
            <form onSubmit={handleStandardSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Resident Email / Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    placeholder="name@nexusnurture.io"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ESP32 Mesh Node Security Token
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={meshToken}
                    onChange={(e) => setMeshToken(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    placeholder="NN-XXXX-XXXX"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Authorize & Connect Node</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Bottom Security Assurance */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Zero-Trust Edge Encryption
              </span>
              <span>Local Mesh Auth</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
