import React from 'react';
import { RoomData } from '../types/iot';
import { 
  Wifi, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  RefreshCw, 
  Radio, 
  Signal, 
  Layers,
  Send,
  Zap
} from 'lucide-react';

interface NodeMeshViewerProps {
  rooms: RoomData[];
  onSimulateEvent: (eventType: 'enter-desk' | 'leave-room' | 'heat-spike' | 'cool-down') => void;
}

export const NodeMeshViewer: React.FC<NodeMeshViewerProps> = ({
  rooms,
  onSimulateEvent,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              ESP-NOW Mesh Network Topology
            </h3>
            <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Self-Healing Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            4 Edge nodes interconnected via 2.4GHz low-latency wireless protocol (&lt;5ms mesh hop)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Mesh Sync:</span>
          <span className="font-mono font-semibold text-slate-700 tabular-nums">100% Up</span>
        </div>
      </div>

      {/* Node Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-slate-900">
                  {room.nodeId}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
              <div className="text-xs font-medium text-slate-700 mb-1">{room.name}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <Signal className="w-3 h-3 text-slate-400" />
                <span className="font-mono">{room.rssi} dBm</span>
                <span>·</span>
                <span className="font-mono">ESP32-S3</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Telemetry:</span>
              <span className="font-mono text-slate-800 font-semibold tabular-nums">
                {room.temperature.toFixed(1)}°C / {room.humidity.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Edge Packet Event Injection & Simulation Bar */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-800">Edge Event Simulator:</span>
          <span className="text-[11px] text-slate-500">Inject real-time physical triggers</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onSimulateEvent('enter-desk')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors whitespace-nowrap"
          >
            Occupant Enters Desk
          </button>
          <button
            onClick={() => onSimulateEvent('leave-room')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors whitespace-nowrap"
          >
            Room Vacated
          </button>
          <button
            onClick={() => onSimulateEvent('heat-spike')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors whitespace-nowrap"
          >
            Sun Heat Spike (+2.5°C)
          </button>
          <button
            onClick={() => onSimulateEvent('cool-down')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-sky-50 hover:bg-sky-100 text-sky-700 transition-colors whitespace-nowrap"
          >
            Cool Down Rapid
          </button>
        </div>
      </div>
    </div>
  );
};
