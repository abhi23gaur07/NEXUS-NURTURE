import React from 'react';
import { RoomData } from '../types/iot';
import { 
  Power, 
  Wind, 
  Thermometer, 
  Droplets, 
  Compass, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  Sliders,
  Cpu,
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';

interface SmartACControllerProps {
  room: RoomData;
  onUpdateTemp: (newTarget: number) => void;
  onTogglePower: () => void;
  onUpdateMode: (mode: RoomData['acState']['mode']) => void;
  onUpdateFanSpeed: (fan: RoomData['acState']['fanSpeed']) => void;
  onUpdateServoAngle: (angle: number) => void;
  onToggleEdgeActuation: () => void;
  onOpenSiri?: () => void;
  onFocusHallAC?: () => void;
}

export const SmartACController: React.FC<SmartACControllerProps> = ({
  room,
  onUpdateTemp,
  onTogglePower,
  onUpdateMode,
  onUpdateFanSpeed,
  onUpdateServoAngle,
  onToggleEdgeActuation,
  onOpenSiri,
  onFocusHallAC,
}) => {
  const { acState, temperature, targetTemp, humidity, mmWaveAzimuth, occupancy } = room;

  // Calculate Heat Index approximation (Celsius)
  const heatIndex = Math.round(
    temperature + 0.5555 * ((humidity / 100) * 6.11 * Math.exp(5417.753 * (1 / 273.16 - 1 / (273.15 + temperature))) - 10)
  );

  // Quick preset targets
  const presets = [19, 21, 23, 25];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 flex flex-col gap-6">
      {/* Header bar: Unit ID & Master Power Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            acState.power ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}>
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">
                Spatial AC Unit
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {room.nodeId}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {room.name} · SG90 Servo Actuator Louver System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onOpenSiri && (
            <button
              onClick={onOpenSiri}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-2xs"
              title="Connect Hall AC to Siri & Apple HomeKit"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Connect to Siri</span>
            </button>
          )}

          <button
            onClick={onTogglePower}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              acState.power
                ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{acState.power ? 'Unit Active' : 'Unit Standby'}</span>
          </button>
        </div>
      </div>

      {/* Hall Architectural Highlight Banner (When Hall / Living Room is active) */}
      {room.id === 'living' && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400">
                Architectural Hall Installation
              </span>
              <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30 px-1.5 py-0.2 rounded font-semibold">
                Siri &amp; HomeKit Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Matte pearl floating chassis · Smoked obsidian visor with live LED readout · 3-blade articulated louvers · Ambient wall light-pipe.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onFocusHallAC && (
              <button
                onClick={onFocusHallAC}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
              >
                <span>Inspect in 3D</span>
              </button>
            )}
            {onOpenSiri && (
              <button
                onClick={onOpenSiri}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                Siri Setup
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Environmental Readout: Temperature & Humidity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Ambient & Target Temperature */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Thermometer className="w-3.5 h-3.5 text-emerald-600" />
              Ambient / Target Temp
            </span>
            <span className="font-mono tabular-nums text-slate-500">Feels {heatIndex}°C</span>
          </div>

          <div className="flex items-baseline justify-between my-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                {temperature.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-slate-500">°C</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={!acState.power || targetTemp <= 16}
                onClick={() => onUpdateTemp(targetTemp - 0.5)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center font-bold text-base transition-colors"
                title="Decrease Target Temp"
              >
                -
              </button>
              <div className="text-center min-w-[54px]">
                <div className="text-[10px] uppercase text-slate-400 font-medium">Target</div>
                <div className="text-lg font-bold font-mono text-emerald-700 tabular-nums">
                  {targetTemp.toFixed(1)}°
                </div>
              </div>
              <button
                disabled={!acState.power || targetTemp >= 30}
                onClick={() => onUpdateTemp(targetTemp + 0.5)}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center font-bold text-base transition-colors"
                title="Increase Target Temp"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60">
            <span className="text-[11px] text-slate-400">Presets:</span>
            {presets.map((val) => (
              <button
                key={val}
                disabled={!acState.power}
                onClick={() => onUpdateTemp(val)}
                className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                  Math.round(targetTemp) === val
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {val}°C
              </button>
            ))}
          </div>
        </div>

        {/* Humidity & Air Comfort */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              Relative Humidity
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium">
              Comfort Zone
            </span>
          </div>

          <div className="flex items-baseline justify-between my-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                {humidity.toFixed(1)}
              </span>
              <span className="text-sm font-medium text-slate-500">% RH</span>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-500">Dew Point</div>
              <div className="text-sm font-semibold font-mono text-slate-700 tabular-nums">
                {(temperature - (100 - humidity) / 5).toFixed(1)}°C
              </div>
            </div>
          </div>

          {/* Comfort band progress indicator */}
          <div className="mt-3 pt-2 border-t border-slate-200/60">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Dry (30%)</span>
              <span className="text-emerald-600 font-medium">Optimal (45-55%)</span>
              <span>Humid (70%)</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (humidity / 80) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SG90 SERVO ACTUATOR & LOUVER DEFLECTION CONTROL (From the PDF hardware breakdown!) */}
      <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-semibold text-slate-900">
              SG90 Servo Louver Deflection
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Angle:</span>
            <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 tabular-nums">
              {acState.servoAngle}°
            </span>
          </div>
        </div>

        {/* Visual Animated Mechanical Louver Diagram */}
        <div className="bg-white rounded-lg p-3 border border-slate-200 mb-3 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs font-medium text-slate-700 mb-1">
              {acState.servoAngle < 20 && 'Direct Floor / Low Draft'}
              {acState.servoAngle >= 20 && acState.servoAngle <= 45 && 'Follow-Me Directional Jet (mmWave Tracking)'}
              {acState.servoAngle > 45 && acState.servoAngle <= 75 && 'Indirect Coanda Ceiling Breeze (Gentle)'}
              {acState.servoAngle > 75 && 'Fully Deflected / Eco Idle Shutter'}
            </div>
            <p className="text-[11px] text-slate-500">
              Controls the physical SG90 micro-servo arm attached to the AC register louvers without cloud round trip.
            </p>
          </div>

          {/* SVG Animated Mini Servo Actuator */}
          <div className="w-20 h-16 bg-slate-50 rounded-md border border-slate-200 relative flex items-center justify-center overflow-hidden shrink-0">
            <svg viewBox="0 0 100 80" className="w-full h-full">
              {/* Servo body */}
              <rect x="15" y="25" width="45" height="36" rx="3" fill="#1e293b" />
              <rect x="10" y="33" width="5" height="6" rx="1" fill="#475569" />
              <rect x="60" y="33" width="5" height="6" rx="1" fill="#475569" />
              {/* Output gear */}
              <circle cx="48" cy="40" r="10" fill="#059669" />
              {/* Louver slat line rotating */}
              <line
                x1="48"
                y1="40"
                x2={48 + Math.cos(((acState.servoAngle - 90) * Math.PI) / 180) * 32}
                y2={40 + Math.sin(((acState.servoAngle - 90) * Math.PI) / 180) * 32}
                stroke="#0284c7"
                strokeWidth="4"
                strokeLinecap="round"
                className="transition-all duration-200"
              />
              <circle cx="48" cy="40" r="3" fill="#ffffff" />
            </svg>
            <span className="absolute bottom-1 right-1 text-[9px] font-mono text-slate-400">SG90</span>
          </div>
        </div>

        {/* Louver angle slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-mono w-6">0°</span>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={acState.servoAngle}
            disabled={!acState.power}
            onChange={(e) => onUpdateServoAngle(Number(e.target.value))}
            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:opacity-50"
          />
          <span className="text-xs text-slate-500 font-mono w-6 text-right">90°</span>
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-1">
          <button 
            disabled={!acState.power} 
            onClick={() => onUpdateServoAngle(15)} 
            className="hover:text-emerald-700 transition-colors"
          >
            Direct (15°)
          </button>
          <button 
            disabled={!acState.power} 
            onClick={() => onUpdateServoAngle(45)} 
            className="hover:text-emerald-700 transition-colors"
          >
            Balanced (45°)
          </button>
          <button 
            disabled={!acState.power} 
            onClick={() => onUpdateServoAngle(70)} 
            className="hover:text-emerald-700 transition-colors"
          >
            Indirect Deflect (70°)
          </button>
        </div>
      </div>

      {/* Smart AC Modes */}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-2">
          Operational Mode
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'auto', label: 'Auto Climate', desc: 'Optimal equilibrium' },
            { id: 'follow-me', label: 'Follow-Me', desc: 'mmWave targeting' },
            { id: 'indirect', label: 'Comfort Deflect', desc: 'Zero draft chill' },
            { id: 'eco', label: 'Eco Gate', desc: 'Presence shutdown' },
          ].map((modeItem) => {
            const isSelected = acState.mode === modeItem.id;
            return (
              <button
                key={modeItem.id}
                disabled={!acState.power}
                onClick={() => onUpdateMode(modeItem.id as any)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40'
                }`}
              >
                <div className="text-xs font-semibold truncate">{modeItem.label}</div>
                <div className={`text-[11px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {modeItem.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fan Speed Controls */}
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-2">
          Fan Speed
        </label>
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {(['quiet', 'low', 'med', 'high', 'turbo'] as const).map((speed) => {
            const isSelected = acState.fanSpeed === speed;
            return (
              <button
                key={speed}
                disabled={!acState.power}
                onClick={() => onUpdateFanSpeed(speed)}
                className={`flex-1 py-1.5 text-xs font-medium capitalize rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                }`}
              >
                {speed}
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-Time Engineering HVAC Diagnostics */}
      <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
          <div className="text-[10px] text-slate-400 uppercase font-mono font-medium">Inverter</div>
          <div className="text-sm font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {acState.power ? '48.2 Hz' : '0.0 Hz'}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Variable VFD</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
          <div className="text-[10px] text-slate-400 uppercase font-mono font-medium">Airflow</div>
          <div className="text-sm font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {acState.power ? (acState.fanSpeed === 'turbo' ? '460 CFM' : acState.fanSpeed === 'high' ? '380 CFM' : '340 CFM') : '0 CFM'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">CFM Volume</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
          <div className="text-[10px] text-slate-400 uppercase font-mono font-medium">Power Draw</div>
          <div className="text-sm font-bold font-mono text-slate-900 tabular-nums mt-0.5">
            {acState.power ? (acState.fanSpeed === 'turbo' ? '540 W' : acState.fanSpeed === 'high' ? '430 W' : '385 W') : '3.8 W'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Real-time Watts</div>
        </div>
        <div className="p-2.5 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
          <div className="text-[10px] text-slate-400 uppercase font-mono font-medium">Efficiency</div>
          <div className="text-sm font-bold font-mono text-emerald-700 tabular-nums mt-0.5">
            4.21 COP
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Eco Inverter A+++</div>
        </div>
      </div>

      {/* Instant Edge Actuation Toggle (PDF Principle) */}
      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-950">
                Instant Edge Actuation
              </span>
              <span className="text-[10px] font-mono bg-emerald-200/70 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">
                3.4 ms
              </span>
            </div>
            <p className="text-[11px] text-emerald-800">
              Actuates servo directly on ESP32 node without cloud round trip.
            </p>
          </div>
        </div>

        <button
          onClick={onToggleEdgeActuation}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            acState.instantEdgeActuation ? 'bg-emerald-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              acState.instantEdgeActuation ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
