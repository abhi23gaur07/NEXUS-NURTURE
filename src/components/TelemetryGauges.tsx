import React from 'react';
import { RoomData, TelemetryPoint } from '../types/iot';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity, 
  Radio, 
  ShieldCheck, 
  Weight, 
  Maximize2,
  TrendingDown,
  TrendingUp,
  Clock
} from 'lucide-react';

interface TelemetryGaugesProps {
  room: RoomData;
  history: TelemetryPoint[];
}

export const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ room, history }) => {
  const { temperature, humidity, co2, mmWaveDistance, mmWaveAzimuth, microMotionEnergy, loadCellWeight, isOccupiedSeated } = room;

  // Render SVG mini-sparkline for history
  const tempValues = history.map((h) => h.temperature);
  const minTemp = Math.min(...tempValues, 18);
  const maxTemp = Math.max(...tempValues, 28);
  const tempRange = maxTemp - minTemp || 1;

  const humValues = history.map((h) => h.humidity);
  const minHum = Math.min(...humValues, 30);
  const maxHum = Math.max(...humValues, 70);
  const humRange = maxHum - minHum || 1;

  const svgWidth = 260;
  const svgHeight = 60;

  const tempPoints = history
    .map((h, i) => {
      const x = (i / (history.length - 1)) * svgWidth;
      const y = svgHeight - ((h.temperature - minTemp) / tempRange) * (svgHeight - 12) - 6;
      return `${x},${y}`;
    })
    .join(' ');

  const humPoints = history
    .map((h, i) => {
      const x = (i / (history.length - 1)) * svgWidth;
      const y = svgHeight - ((h.humidity - minHum) / humRange) * (svgHeight - 12) - 6;
      return `${x},${y}`;
    })
    .join(' ');

  // Calculate polar radar target coordinates on a 160x100 canvas
  // Radar sensor is located at center bottom (80, 95)
  // Distance 0 to 6 meters maps to radius 0 to 80
  const maxRadarDist = 5.0;
  const radarRadius = Math.min(80, (mmWaveDistance / maxRadarDist) * 75);
  const radAngle = ((mmWaveAzimuth - 90) * Math.PI) / 180;
  const targetX = 80 + Math.cos(radAngle) * radarRadius;
  const targetY = 90 + Math.sin(radAngle) * radarRadius;

  return (
    <div className="space-y-4">
      {/* 3 Metric Cards Grid: Temp, Humidity, CO2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Real-time Temperature Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-emerald-600" />
              Temperature
            </span>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
              SHT31 Edge
            </span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {temperature.toFixed(1)}
              <span className="text-base font-normal text-slate-400 ml-1">°C</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-400">
                {(temperature * 1.8 + 32).toFixed(1)}°F
              </span>
            </div>
          </div>

          {/* Sparkline */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>24h Trend</span>
              <span className="font-mono text-slate-600">Avg 22.8°C</span>
            </div>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-9 overflow-visible">
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={tempPoints}
              />
            </svg>
          </div>
        </div>

        {/* 2. Real-time Humidity Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-sky-600" />
              Relative Humidity
            </span>
            <span className="text-[11px] font-mono text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-medium">
              Optimal
            </span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {humidity.toFixed(1)}
              <span className="text-base font-normal text-slate-400 ml-1">%</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">
                Target: 45-55%
              </span>
            </div>
          </div>

          {/* Sparkline */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Moisture Trend</span>
              <span className="font-mono text-slate-600">Stable</span>
            </div>
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-9 overflow-visible">
              <polyline
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={humPoints}
              />
            </svg>
          </div>
        </div>

        {/* 3. Indoor Air Quality & CO2 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-emerald-600" />
              Indoor Air & CO2
            </span>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
              Clean Air
            </span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
              {co2}
              <span className="text-base font-normal text-slate-400 ml-1">ppm</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-emerald-700 font-medium">
                Fresh & Focus
              </span>
            </div>
          </div>

          {/* Air Quality Scale Bar */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Good (&lt;800)</span>
              <span>Moderate</span>
              <span>Poor (&gt;1200)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: '60%' }} />
              <div className="h-full bg-amber-400" style={{ width: '25%' }} />
              <div className="h-full bg-rose-400" style={{ width: '15%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Spatial mmWave Radar & Load-Cell Occupancy Telemetry (From the PDF hardware breakdown!) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* HLK-LD2410 mmWave Radar Polar Scope */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  HLK-LD2410 Spatial mmWave Radar
                </h4>
                <p className="text-[11px] text-slate-500">
                  Privacy-first RF spatial presence (No cameras) · ₹250 node
                </p>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
              room.occupancy ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {room.occupancy ? 'Target Detected' : 'Unoccupied'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Visual Polar Radar Screen */}
            <div className="w-36 h-28 bg-slate-900 rounded-xl relative overflow-hidden flex items-end justify-center p-1 shrink-0 border border-slate-800 shadow-inner">
              {/* Radar rings */}
              <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none flex items-end justify-center">
                <div className="w-32 h-32 rounded-full border border-emerald-500/20 translate-y-16" />
                <div className="absolute w-20 h-20 rounded-full border border-emerald-500/30 translate-y-10" />
                <div className="absolute w-10 h-10 rounded-full border border-emerald-500/40 translate-y-5" />
                {/* 60 degree field of view cones */}
                <div className="absolute w-full h-full border-t border-emerald-500/10" style={{ transform: 'rotate(-30deg)' }} />
                <div className="absolute w-full h-full border-t border-emerald-500/10" style={{ transform: 'rotate(30deg)' }} />
              </div>

              {/* Sensor emitter origin point */}
              <div className="absolute bottom-1 w-2 h-2 rounded-full bg-emerald-400 z-10" />

              {/* Detected target blip */}
              {room.occupancy && (
                <div
                  className="absolute w-3.5 h-3.5 -ml-1.5 -mt-1.5 z-20 transition-all duration-300"
                  style={{ left: `${(targetX / 160) * 100}%`, top: `${(targetY / 100) * 100}%` }}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white" />
                </div>
              )}

              <div className="absolute top-2 left-2 text-[9px] font-mono text-emerald-400/80">
                SCAN: 24GHz
              </div>
              <div className="absolute top-2 right-2 text-[9px] font-mono text-emerald-400/80">
                R: 6.0m
              </div>
            </div>

            {/* Radar telemetry details */}
            <div className="flex-1 w-full min-w-0 space-y-1.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2">
                <span className="text-slate-500 text-[11px] whitespace-nowrap">Radial Distance:</span>
                <span className="font-mono font-semibold text-slate-800 tabular-nums">
                  {room.occupancy ? `${mmWaveDistance.toFixed(2)} m` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2">
                <span className="text-slate-500 text-[11px] whitespace-nowrap">Azimuth Angle:</span>
                <span className="font-mono font-semibold text-slate-800 tabular-nums">
                  {room.occupancy ? `${mmWaveAzimuth > 0 ? '+' : ''}${mmWaveAzimuth}°` : '—'}
                </span>
              </div>
              <div className="py-1 border-b border-slate-100">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 text-[11px] whitespace-nowrap">Micro-Motion Energy:</span>
                  <span className="font-mono font-bold text-emerald-600 tabular-nums">
                    {microMotionEnergy}%
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-700 font-mono">
                  <span className="text-slate-400">Vital Voxel:</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 font-semibold whitespace-nowrap">
                    Breathing / Fingers
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">100% On-Device Privacy Guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Load-Cell Seat & Bed Deformation Sensor (From PDF) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Weight className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Deformation Load-Cell Sensor
                </h4>
                <p className="text-[11px] text-slate-500">
                  Strain-gauge pressure tracking for desk/bed posture
                </p>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
              isOccupiedSeated ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {isOccupiedSeated ? 'Occupant Seated' : 'Unloaded'}
            </span>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-xs text-slate-400">Current Measured Load</div>
              <div className="text-3xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                {loadCellWeight.toFixed(1)}
                <span className="text-sm font-normal text-slate-400 ml-1">kg</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Posture Classification</div>
              <div className="text-sm font-semibold text-slate-800">
                {loadCellWeight > 40 ? 'Active Seated Work' : loadCellWeight > 10 ? 'Light Object' : 'Vacant'}
              </div>
            </div>
          </div>

          {/* Weight bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (loadCellWeight / 100) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <span>Dual-validation: mmWave + Load-cell eliminates false triggers</span>
            <span className="font-mono text-emerald-700">99.8% Accuracy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
