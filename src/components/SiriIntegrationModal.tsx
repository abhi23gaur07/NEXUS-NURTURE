import React, { useState } from 'react';
import { RoomData } from '../types/iot';
import { 
  X, 
  Smartphone, 
  Mic, 
  QrCode, 
  Check, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Play, 
  Volume2, 
  ShieldCheck,
  Zap,
  Radio
} from 'lucide-react';

interface SiriIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  hallRoom: RoomData;
  onTriggerSiriCommand: (command: string) => void;
}

export const SiriIntegrationModal: React.FC<SiriIntegrationModalProps> = ({
  isOpen,
  onClose,
  hallRoom,
  onTriggerSiriCommand,
}) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'homekit' | 'webhook'>('shortcuts');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [simulatingCommand, setSimulatingCommand] = useState<string | null>(null);

  if (!isOpen) return null;

  const siriCommands = [
    {
      phrase: 'Hey Siri, set Hall AC to 22',
      action: 'Sets Hall AC target temperature to 22.0°C via ESP32 mesh',
      trigger: 'set temp to 22',
      shortcutUrl: 'shortcuts://run-shortcut?name=Nexus%20Set%20Temp%2022',
    },
    {
      phrase: 'Hey Siri, turn off Hall AC',
      action: 'Shuts down compressor and seals SG90 louvers to 90°',
      trigger: 'turn off living AC',
      shortcutUrl: 'shortcuts://run-shortcut?name=Nexus%20Turn%20Off%20Hall',
    },
    {
      phrase: 'Hey Siri, set Hall AC to Follow-Me',
      action: 'Directs cool airflow towards occupant using HLK-LD2410 mmWave radar',
      trigger: 'set mode to follow-me',
      shortcutUrl: 'shortcuts://run-shortcut?name=Nexus%20Follow%20Me',
    },
    {
      phrase: 'Hey Siri, turn on Hall AC',
      action: 'Activates spatial cooling with instant edge response (<5ms)',
      trigger: 'turn on living AC',
      shortcutUrl: 'shortcuts://run-shortcut?name=Nexus%20Turn%20On%20Hall',
    },
    {
      phrase: 'Hey Siri, set Hall louvers to 45 degrees',
      action: 'Rotates SG90 servo arm to 45° balanced sweep',
      trigger: 'set louvers to 45 degrees',
      shortcutUrl: 'shortcuts://run-shortcut?name=Nexus%20Louvers%2045',
    },
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRunSimulator = (cmd: typeof siriCommands[0]) => {
    setSimulatingCommand(cmd.phrase);
    onTriggerSiriCommand(cmd.trigger);
    setTimeout(() => {
      setSimulatingCommand(null);
    }, 1500);
  };

  const webhookJson = JSON.stringify(
    {
      action: 'set_climate',
      device_id: hallRoom.nodeId,
      room: 'hall_living',
      temperature_target_c: 22.0,
      louver_servo_angle: 45,
      auth_token: 'NEXUS-SIRI-BEARER-9842',
      homekit_matter_id: 'MATTER-ESP32-AC-01',
    },
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple / Siri Ambient Glow in top right */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-full blur-3xl -z-10 pointer-events-none opacity-70" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Siri Animated Orb Graphic */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/40 via-purple-500/60 to-pink-500/50 animate-spin" style={{ animationDuration: '8s' }} />
                <Mic className="w-5 h-5 text-white relative z-10" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Connect Hall AC to Siri &amp; Apple Home
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  HomeKit &amp; Shortcuts
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Native voice commands with zero cloud latency via Matter over Thread / ESP-NOW bridge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Hall AC Status Snapshot */}
        <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="font-semibold text-slate-900">Hall Spatial AC: </span>
              <span className="font-mono text-slate-700">{hallRoom.temperature.toFixed(1)}°C (Target: {hallRoom.targetTemp}°C)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">SG90 Servo:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {hallRoom.acState.servoAngle}°
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 mb-5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'shortcuts'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Siri Shortcuts (Voice Phrases)
          </button>
          <button
            onClick={() => setActiveTab('homekit')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'homekit'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Apple HomeKit / Matter Bridge
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'webhook'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shortcuts Webhook API
          </button>
        </div>

        {/* Tab 1: Siri Shortcuts with Live One-Tap Simulator */}
        {activeTab === 'shortcuts' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Configured Siri Voice Phrases:</span>
              <span className="text-[11px] text-purple-700 font-medium">Click "Test with Siri" to execute live</span>
            </div>

            <div className="space-y-2.5">
              {siriCommands.map((cmd, idx) => (
                <div
                  key={cmd.phrase}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-purple-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 font-mono">
                        "{cmd.phrase}"
                      </span>
                      {simulatingCommand === cmd.phrase && (
                        <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-bold animate-pulse">
                          Siri Executing...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {cmd.action}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleRunSimulator(cmd)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Test with Siri</span>
                    </button>
                    <button
                      onClick={() => handleCopy(cmd.phrase, idx)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                      title="Copy Phrase"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Direct iOS Shortcuts App Link */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 via-indigo-50/70 to-pink-50/70 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Add Nexus Nurture to iOS Shortcuts App
                </div>
                <p className="text-[11px] text-slate-600">
                  Enables hands-free "Hey Siri" on iPhone, Apple Watch, HomePod, and CarPlay.
                </p>
              </div>

              <a
                href="shortcuts://run-shortcut?name=Nexus%20Hall%20Climate"
                onClick={(e) => {
                  e.preventDefault();
                  handleRunSimulator(siriCommands[0]);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Install Siri Shortcut</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>
        )}

        {/* Tab 2: Apple HomeKit / Matter Bridge */}
        {activeTab === 'homekit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              {/* Simulated QR Code for Apple Home App */}
              <div className="w-36 h-36 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Corner positioning boxes */}
                  <rect x="5" y="5" width="28" height="28" fill="#0f172a" />
                  <rect x="9" y="9" width="20" height="20" fill="#ffffff" />
                  <rect x="13" y="13" width="12" height="12" fill="#0f172a" />

                  <rect x="67" y="5" width="28" height="28" fill="#0f172a" />
                  <rect x="71" y="9" width="20" height="20" fill="#ffffff" />
                  <rect x="75" y="13" width="12" height="12" fill="#0f172a" />

                  <rect x="5" y="67" width="28" height="28" fill="#0f172a" />
                  <rect x="9" y="71" width="20" height="20" fill="#ffffff" />
                  <rect x="13" y="75" width="12" height="12" fill="#0f172a" />

                  {/* QR Pattern Data */}
                  <rect x="38" y="10" width="8" height="8" fill="#0f172a" />
                  <rect x="50" y="14" width="8" height="8" fill="#0f172a" />
                  <rect x="42" y="26" width="12" height="6" fill="#0f172a" />
                  <rect x="10" y="38" width="8" height="8" fill="#0f172a" />
                  <rect x="24" y="44" width="14" height="8" fill="#0f172a" />
                  <rect x="44" y="44" width="12" height="12" fill="#059669" />
                  <rect x="62" y="38" width="10" height="8" fill="#0f172a" />
                  <rect x="78" y="44" width="8" height="12" fill="#0f172a" />
                  <rect x="38" y="66" width="8" height="8" fill="#0f172a" />
                  <rect x="50" y="74" width="14" height="8" fill="#0f172a" />
                  <rect x="72" y="66" width="16" height="8" fill="#0f172a" />
                  <rect x="68" y="80" width="8" height="8" fill="#0f172a" />
                </svg>
                <span className="text-[9px] font-mono text-slate-400 mt-1">Scan in Apple Home</span>
              </div>

              {/* HomeKit Pairing Specs */}
              <div className="space-y-2 text-xs w-full">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Accessory Name:</span>
                  <span className="font-semibold text-slate-900">Nexus Hall Spatial AC</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Matter Setup Code:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm tracking-wider bg-white px-2 py-0.5 rounded border border-slate-200">
                    031-45-892
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Transport:</span>
                  <span className="font-mono text-emerald-700 font-semibold">Matter over Thread / Wi-Fi (ESP32)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500">Native Controls:</span>
                  <span className="text-slate-800">Thermostat + Swing Louvers + Fan Speed</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Works with Apple HomeKit &amp; HomePod mini</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-900">How to Pair: </strong>
              Open the <strong>Home</strong> app on your iPhone or iPad, tap <strong>(+) Add Accessory</strong>, scan the Matter QR code or type <code>031-45-892</code>. The Hall AC will instantly appear in your Home dashboard alongside your other smart accessories.
            </div>
          </div>
        )}

        {/* Tab 3: Siri Shortcuts Webhook API */}
        {activeTab === 'webhook' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              For advanced automation, configure the <strong>"Get Contents of URL"</strong> action in Apple Shortcuts to POST to this local edge gateway endpoint:
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-xs">
              <div className="text-emerald-400 mb-1">POST /api/edge/siri-webhook</div>
              <div className="text-[11px] text-slate-400 mb-2">Host: http://nexus-edge-hub.local:3000</div>
              <pre className="text-[11px] text-purple-300 bg-slate-950 p-2.5 rounded-lg overflow-x-auto">
                {webhookJson}
              </pre>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Latency: 3.4ms local execution</span>
              <button
                onClick={() => handleCopy(webhookJson, 99)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                {copiedIndex === 99 ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedIndex === 99 ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Nexus Nurture · Apple HomeKit &amp; Siri Protocol
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
