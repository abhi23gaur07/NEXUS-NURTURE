import React, { useState } from 'react';
import { RoomData } from '../types/iot';
import { Terminal, Copy, Check, Send, ChevronDown, ChevronUp } from 'lucide-react';

interface EdgePayloadConsoleProps {
  room: RoomData;
}

export const EdgePayloadConsole: React.FC<EdgePayloadConsoleProps> = ({ room }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const payload = {
    event: 'telemetry_push',
    timestamp: new Date().toISOString(),
    node_id: room.nodeId,
    room_type: room.type,
    environmental: {
      temperature_c: Number(room.temperature.toFixed(2)),
      relative_humidity_pct: Number(room.humidity.toFixed(1)),
      co2_ppm: room.co2,
      target_setpoint_c: room.targetTemp,
    },
    spatial_presence: {
      mmwave_sensor: 'HLK-LD2410',
      target_present: room.occupancy,
      radial_distance_meters: Number(room.mmWaveDistance.toFixed(2)),
      azimuth_degrees: room.mmWaveAzimuth,
      micromotion_energy: room.microMotionEnergy,
      load_cell_seated_kg: Number(room.loadCellWeight.toFixed(1)),
    },
    actuation_edge: {
      actuator: 'SG90_Servo',
      louver_angle_deg: room.acState.servoAngle,
      mode: room.acState.mode,
      power: room.acState.power,
      fan_speed: room.acState.fanSpeed,
      edge_latency_ms: 3.4,
      cloud_bypass: room.acState.instantEdgeActuation,
    },
    mesh_metadata: {
      rssi_dbm: room.rssi,
      topology_hop: 1,
      firmware: 'Nexus-ESP32-v2.4-Edge',
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-semibold text-slate-100">
            Live Edge Packet Stream ({room.nodeId})
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied JSON' : 'Copy Payload'}</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-200"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <pre className="text-[11px] font-mono leading-relaxed bg-slate-950 p-3 rounded-xl overflow-x-auto text-emerald-400/90 max-h-56">
            {jsonString}
          </pre>
          <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>Protocol: ESP-NOW binary mapped to JSON gateway</span>
            <span>Zero cloud transit required for local actuation</span>
          </div>
        </div>
      )}
    </div>
  );
};
