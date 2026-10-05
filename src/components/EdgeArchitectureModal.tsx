import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  Database, 
  Activity, 
  Zap, 
  X, 
  CheckCircle2, 
  Layers, 
  IndianRupee, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  Sliders,
  ExternalLink
} from 'lucide-react';

interface EdgeArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EdgeArchitectureModal: React.FC<EdgeArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'hardware' | 'scalability'>('hardware');

  if (!isOpen) return null;

  const hardwareItems = [
    {
      name: 'ESP32 Node Controller',
      cost: 300,
      description: 'Dual-core Xtensa 32-bit MCU with 2.4GHz Wi-Fi & Bluetooth LE / ESP-NOW mesh.',
      role: 'Core edge compute & sensor aggregation',
    },
    {
      name: 'HLK-LD2410 Spatial mmWave Sensor',
      cost: 250,
      description: '24GHz FMCW radar tracking human distance, azimuth, and micro-motions (breathing).',
      role: 'Privacy-first optical-free occupancy detection',
    },
    {
      name: 'SG90 Micro Servo Actuator',
      cost: 150,
      description: 'High-torque PWM servo driving the mechanical AC register louvers (0° to 90°).',
      role: 'Instant mechanical HVAC louver deflection',
    },
    {
      name: 'Miscellaneous Hardware',
      cost: 100,
      description: '3D printed matte enclosure, JST connectors, DuPont wiring, decouple capacitors.',
      role: 'Mechanical enclosure & signal conditioning',
    },
  ];

  const totalPrototype = hardwareItems.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Nexus Nurture Architecture
              </span>
              <span className="text-xs text-slate-400 font-mono">v2.4-Edge</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Context-Aware Smart Home Edge Architecture
            </h2>
            <p className="text-xs text-slate-500">
              Intelligent Systems. Natural Impact.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 my-5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('hardware')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'hardware'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hardware & BOM Breakdown
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'pipeline'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sense-to-Actuate Pipeline
          </button>
          <button
            onClick={() => setActiveTab('scalability')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'scalability'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Deployment & Scalability
          </button>
        </div>

        {/* Tab 1: Hardware & Bill of Materials Breakdown */}
        {activeTab === 'hardware' && (
          <div className="space-y-5">
            {/* Highlights from PDF */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                  Total Prototype Cost
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-950 mt-1 tabular-nums">
                  ~₹{totalPrototype}
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">Per node prototype</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Broader Production Node
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  ~₹1,500
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Includes full enclosure & PSU</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Rapid Deployment
                </div>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                  &lt;10 Min
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Self-healing wireless mesh</div>
              </div>
            </div>

            {/* Hardware Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Component</th>
                    <th className="py-2.5 px-4 font-semibold hidden sm:table-cell">Role & Purpose</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Cost (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hardwareItems.map((item) => (
                    <tr key={item.name} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500">{item.description}</div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell text-slate-600">
                        {item.role}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ₹{item.cost}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50/40 font-semibold">
                    <td className="py-3 px-4 text-emerald-950">Total Node Prototype Cost</td>
                    <td className="py-3 px-4 hidden sm:table-cell text-emerald-800">Ultra low-cost & accessible</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-900 tabular-nums">
                      ₹{totalPrototype}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">Key Engineering Takeaway: </span>
              Achieving spatial HVAC tracking and privacy-safe human presence without expensive smart home hubs (costing ₹15,000+) or invasive optical cameras.
            </div>
          </div>
        )}

        {/* Tab 2: Sense-to-Actuate Pipeline (Page 2 of PDF) */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Dual-layer Edge Architecture: bottom-up instant physical response paired with top-down cloud analytics.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
                <span className="text-[10px] uppercase font-mono text-emerald-700 font-bold mb-1">01. Sense</span>
                <span className="font-semibold text-slate-900">ESP32 + mmWave</span>
                <span className="text-[11px] text-slate-500 mt-1">LD2410 + Load Cells</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
                <span className="text-[10px] uppercase font-mono text-emerald-700 font-bold mb-1">02. Transmit</span>
                <span className="font-semibold text-slate-900">Wireless Mesh</span>
                <span className="text-[11px] text-slate-500 mt-1">ESP-NOW / 2.4GHz</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
                <span className="text-[10px] uppercase font-mono text-emerald-700 font-bold mb-1">03. Process</span>
                <span className="font-semibold text-slate-900">Local AI Engine</span>
                <span className="text-[11px] text-slate-500 mt-1">Decision Logic & Anomaly</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center">
                <span className="text-[10px] uppercase font-mono text-emerald-700 font-bold mb-1">04. Analyze</span>
                <span className="font-semibold text-slate-900">Web / Mobile UI</span>
                <span className="text-[11px] text-slate-500 mt-1">Live Telemetry & Trends</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col items-center">
                <span className="text-[10px] uppercase font-mono text-emerald-800 font-bold mb-1">05. Actuate</span>
                <span className="font-semibold text-emerald-950">Instant Edge</span>
                <span className="text-[11px] text-emerald-700 mt-1">SG90 Servo Louver</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <h4 className="font-semibold text-slate-900">Why Bottom-Up Edge Automation Matters:</h4>
              <p className="text-slate-600 leading-relaxed">
                Traditional smart home products rely on cloud servers (AWS/Google Cloud) to process sensor triggers. If internet connectivity drops, automations freeze. With Nexus Nurture, spatial HVAC actuates <strong>instantly on the edge node (&lt;5ms)</strong> without any cloud round-trip, ensuring 100% offline autonomy and absolute household privacy.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Deployment & Scalability (Page 4 of PDF) */}
        {activeTab === 'scalability' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="text-xs font-bold text-slate-900 mb-1">Phase 1: Single Desk Hub</div>
                <p className="text-[11px] text-slate-500">
                  1 ESP32 Productivity Hub on workstation + 1 mmWave radar node. Instantly monitors micro-climate and posture.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="text-xs font-bold text-slate-900 mb-1">Phase 2: Multi-Room Nodes</div>
                <p className="text-[11px] text-slate-500">
                  Deploy to Master Bedroom and Living Room. Mesh nodes self-discover and establish automatic routing.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="text-xs font-bold text-slate-900 mb-1">Phase 3: Apartment Mesh</div>
                <p className="text-[11px] text-slate-500">
                  Full spatial HVAC synchronization, whole-apartment load shedding, and 68% optimal energy reduction.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs space-y-2">
              <h4 className="font-semibold text-emerald-950">Built For Who Matters:</h4>
              <ul className="space-y-1.5 text-emerald-900">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Modern Professionals:</strong> Instant responsive climate at the desk without touching remotes.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Renters:</strong> Non-destructive magnetic/adhesive mounts requiring zero architectural rewiring.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Eco-Conscious Homeowners:</strong> Up to 68% reduction in HVAC compressor run-time via presence gating.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Nexus Nurture · Context-Aware Edge Home Solution
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
};
