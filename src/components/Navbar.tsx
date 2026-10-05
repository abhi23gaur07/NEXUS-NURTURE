import React from 'react';
import { UserProfile } from '../types/iot';
import { ShieldCheck, User, Radio, Cpu, LogIn, SlidersHorizontal, Compass } from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile;
  onOpenLogin: () => void;
  onOpenArchitecture: () => void;
  onOpenEntrance?: () => void;
  activeSection: string;
  onSelectSection: (section: string) => void;
  voiceControlSlot?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenLogin,
  onOpenArchitecture,
  onOpenEntrance,
  activeSection,
  onSelectSection,
  voiceControlSlot,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand title wordmark */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onSelectSection('viewer')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              Nexus Nurture
            </span>
          </button>
          <span className="hidden sm:inline-block text-[11px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            Edge IoT Platform
          </span>
        </div>

        {/* Zone 2: 4-6 text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectSection('viewer')}
            className={`transition-colors whitespace-nowrap ${
              activeSection === 'viewer' ? 'text-emerald-700 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            3D Living
          </button>
          <button
            onClick={() => onSelectSection('climate')}
            className={`transition-colors whitespace-nowrap ${
              activeSection === 'climate' ? 'text-emerald-700 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Spatial AC
          </button>
          <button
            onClick={() => onSelectSection('telemetry')}
            className={`transition-colors whitespace-nowrap ${
              activeSection === 'telemetry' ? 'text-emerald-700 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            IoT Telemetry
          </button>
          <button
            onClick={() => onSelectSection('sleep-biometrics')}
            className={`transition-colors whitespace-nowrap ${
              activeSection === 'sleep-biometrics' ? 'text-emerald-700 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            Sleep mmWave
          </button>
          <button
            onClick={onOpenArchitecture}
            className="hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Architecture
          </button>
          <button
            onClick={() => onSelectSection('mesh')}
            className={`transition-colors whitespace-nowrap ${
              activeSection === 'mesh' ? 'text-emerald-700 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            ESP32 Mesh
          </button>
        </nav>

        {/* Zone 3: Actions + Voice Command + Login */}
        <div className="flex items-center gap-2.5">
          {voiceControlSlot}

          {/* Live Edge Sync Status Marker */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-slate-800 font-medium">Edge: 3.4ms</span>
          </div>

          {/* 3D Starting Interface Portal Trigger */}
          {onOpenEntrance && (
            <button
              onClick={onOpenEntrance}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 rounded-xl transition-colors shadow-2xs"
              title="Return to 3D Starting Interface"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">3D Entrance</span>
            </button>
          )}

          {/* Login Portal Trigger Button */}
          <button
            onClick={onOpenLogin}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              currentUser.authenticated
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
            }`}
          >
            {currentUser.authenticated ? (
              <>
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {currentUser.avatarInitials}
                </span>
                <span className="max-w-[120px] truncate">{currentUser.name}</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Resident Portal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
