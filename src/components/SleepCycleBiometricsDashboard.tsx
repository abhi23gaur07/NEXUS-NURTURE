import React, { useState, useEffect, useRef } from 'react';
import { RoomData } from '../types/iot';
import { 
  Moon, 
  Activity, 
  Heart, 
  Wind, 
  Thermometer, 
  ShieldCheck, 
  Bed, 
  Sparkles, 
  Clock, 
  Zap, 
  Sliders, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Waves, 
  EyeOff, 
  Cpu,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';

interface SleepCycleBiometricsDashboardProps {
  room: RoomData;
  onUpdateACTemp?: (temp: number) => void;
  onUpdateACMode?: (mode: RoomData['acState']['mode']) => void;
  onUpdateServoAngle?: (angle: number) => void;
}

type SleepStage = 'deep' | 'rem' | 'light' | 'awake';

interface HypnogramEpoch {
  time: string;
  stage: SleepStage;
  durationMin: number;
  heartRate: number;
  breathingRate: number;
  tempSetpoint: number;
  louverAngle: number;
}

const mockHypnogram: HypnogramEpoch[] = [
  { time: '23:00', stage: 'awake', durationMin: 20, heartRate: 74, breathingRate: 17.5, tempSetpoint: 21.0, louverAngle: 45 },
  { time: '23:20', stage: 'light', durationMin: 45, heartRate: 67, breathingRate: 15.8, tempSetpoint: 21.5, louverAngle: 55 },
  { time: '00:05', stage: 'deep',  durationMin: 70, heartRate: 59, breathingRate: 12.8, tempSetpoint: 22.8, louverAngle: 75 },
  { time: '01:15', stage: 'light', durationMin: 35, heartRate: 64, breathingRate: 14.5, tempSetpoint: 22.5, louverAngle: 70 },
  { time: '01:50', stage: 'rem',   durationMin: 30, heartRate: 68, breathingRate: 16.2, tempSetpoint: 22.2, louverAngle: 75 },
  { time: '02:20', stage: 'deep',  durationMin: 55, heartRate: 58, breathingRate: 12.4, tempSetpoint: 22.8, louverAngle: 80 },
  { time: '03:15', stage: 'light', durationMin: 40, heartRate: 63, breathingRate: 14.2, tempSetpoint: 22.5, louverAngle: 75 },
  { time: '03:55', stage: 'rem',   durationMin: 45, heartRate: 69, breathingRate: 16.8, tempSetpoint: 22.2, louverAngle: 75 },
  { time: '04:40', stage: 'deep',  durationMin: 35, heartRate: 60, breathingRate: 13.0, tempSetpoint: 22.8, louverAngle: 80 },
  { time: '05:15', stage: 'light', durationMin: 50, heartRate: 65, breathingRate: 14.8, tempSetpoint: 23.2, louverAngle: 65 },
  { time: '06:05', stage: 'rem',   durationMin: 40, heartRate: 71, breathingRate: 17.0, tempSetpoint: 23.5, louverAngle: 60 },
  { time: '06:45', stage: 'awake', durationMin: 15, heartRate: 76, breathingRate: 18.2, tempSetpoint: 24.0, louverAngle: 45 },
];

export const SleepCycleBiometricsDashboard: React.FC<SleepCycleBiometricsDashboardProps> = ({
  room,
  onUpdateACTemp,
  onUpdateACMode,
  onUpdateServoAngle,
}) => {
  // Live State
  const [currentStage, setCurrentStage] = useState<SleepStage>('deep');
  const [respirationRate, setRespirationRate] = useState<number>(13.4);
  const [heartRate, setHeartRate] = useState<number>(61);
  const [hrvValue, setHrvValue] = useState<number>(62);
  const [chestDisplacementMm, setChestDisplacementMm] = useState<number>(0.34);
  const [bedPosture, setBedPosture] = useState<'Supine (Back)' | 'Left Lateral' | 'Right Lateral' | 'Prone'>('Supine (Back)');
  const [inBedOccupancy, setInBedOccupancy] = useState<boolean>(true);
  const [autoCircadianSync, setAutoCircadianSync] = useState<boolean>(true);
  const [hoveredEpoch, setHoveredEpoch] = useState<HypnogramEpoch | null>(null);

  // Canvas for Live FMCW Raw Phase Waveform
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live Waveform Animation (FMCW Doppler Phase Shift of Chest Wall)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      phase += 0.045;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw subtle grid lines
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 30) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y < h; y += 20) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // In-Bed check
      if (!inBedOccupancy) {
        // Flatline
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
        return;
      }

      // Draw live compound chest-wall waveform:
      // Respiration (low freq ~0.25Hz) + Cardiac pulse ripple (higher freq ~1.0Hz)
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = currentStage === 'deep' 
        ? '#10b981' 
        : currentStage === 'rem' 
        ? '#8b5cf6' 
        : currentStage === 'light' 
        ? '#06b6d4' 
        : '#f43f5e';

      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const t = (x / w) * 12 + phase;
        // Respiration component
        const respFreq = currentStage === 'deep' ? 1.4 : currentStage === 'rem' ? 1.9 : 1.6;
        const respAmp = (h / 3.4) * (chestDisplacementMm / 0.35);
        const respWave = Math.sin(t * respFreq) * respAmp;

        // Cardiac BCG pulse harmonic
        const cardiacWave = Math.sin(t * 5.8) * (h * 0.08);

        const y = h / 2 + respWave + cardiacWave;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Glowing leading scan point
      const lastX = w - 4;
      const lastT = (lastX / w) * 12 + phase;
      const respFreq = currentStage === 'deep' ? 1.4 : currentStage === 'rem' ? 1.9 : 1.6;
      const respAmp = (h / 3.4) * (chestDisplacementMm / 0.35);
      const headY = h / 2 + Math.sin(lastT * respFreq) * respAmp + Math.sin(lastT * 5.8) * (h * 0.08);

      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(lastX, headY, 4, 0, Math.PI * 2);
      ctx.fill();
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [currentStage, inBedOccupancy, chestDisplacementMm]);

  // Subtle live physiological jitter
  useEffect(() => {
    const interval = setInterval(() => {
      if (!inBedOccupancy) return;

      // Realistic micro-variations
      setRespirationRate((prev) => {
        const target = currentStage === 'deep' ? 12.8 : currentStage === 'rem' ? 16.2 : currentStage === 'light' ? 14.5 : 17.8;
        return Number((target + (Math.random() - 0.5) * 0.4).toFixed(1));
      });

      setHeartRate((prev) => {
        const target = currentStage === 'deep' ? 58 : currentStage === 'rem' ? 68 : currentStage === 'light' ? 63 : 75;
        return Math.round(target + (Math.random() - 0.5) * 2);
      });

      setHrvValue((prev) => {
        const target = currentStage === 'deep' ? 66 : currentStage === 'rem' ? 54 : 58;
        return Math.round(target + (Math.random() - 0.5) * 3);
      });

      setChestDisplacementMm((prev) => {
        const target = currentStage === 'deep' ? 0.38 : currentStage === 'rem' ? 0.28 : 0.32;
        return Number((target + (Math.random() - 0.5) * 0.03).toFixed(2));
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [currentStage, inBedOccupancy]);

  // Handle stage simulator
  const handleSimulateStage = (stage: SleepStage) => {
    setCurrentStage(stage);
    setInBedOccupancy(stage !== 'awake');

    if (stage === 'deep') {
      setRespirationRate(12.4);
      setHeartRate(57);
      setHrvValue(68);
      setChestDisplacementMm(0.39);
      setBedPosture('Supine (Back)');
      if (autoCircadianSync) {
        onUpdateACTemp?.(22.8);
        onUpdateServoAngle?.(80); // Ceiling Coanda indirect
        onUpdateACMode?.('indirect');
      }
    } else if (stage === 'rem') {
      setRespirationRate(16.5);
      setHeartRate(69);
      setHrvValue(52);
      setChestDisplacementMm(0.26);
      setBedPosture('Right Lateral');
      if (autoCircadianSync) {
        onUpdateACTemp?.(22.2);
        onUpdateServoAngle?.(75);
        onUpdateACMode?.('auto');
      }
    } else if (stage === 'light') {
      setRespirationRate(14.8);
      setHeartRate(64);
      setHrvValue(59);
      setChestDisplacementMm(0.33);
      setBedPosture('Left Lateral');
      if (autoCircadianSync) {
        onUpdateACTemp?.(22.0);
        onUpdateServoAngle?.(65);
      }
    } else if (stage === 'awake') {
      setRespirationRate(18.2);
      setHeartRate(78);
      setHrvValue(44);
      setChestDisplacementMm(0.12);
      if (autoCircadianSync) {
        onUpdateACTemp?.(24.0); // Gentle wake up warm
        onUpdateServoAngle?.(45);
        onUpdateACMode?.('eco');
      }
    }
  };

  const getStageColor = (s: SleepStage) => {
    switch (s) {
      case 'deep': return { text: 'text-emerald-700', bg: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'rem': return { text: 'text-purple-700', bg: 'bg-purple-500', pill: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'light': return { text: 'text-cyan-700', bg: 'bg-cyan-500', pill: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      case 'awake': return { text: 'text-rose-700', bg: 'bg-rose-500', pill: 'bg-rose-50 text-rose-800 border-rose-200' };
    }
  };

  const stageMeta = {
    deep: {
      label: 'Deep Sleep (N3 Slow-Wave)',
      desc: 'Cellular repair, growth hormone synthesis, and physical recovery. Brain activity slowed to 0.5–2Hz Delta waves.',
      climateAction: '22.8°C Target · Ceiling Coanda Louver 80° · Whisper Quiet 18dB',
      phaseTime: '48m active in stage',
    },
    rem: {
      label: 'REM Sleep (Rapid Eye Movement)',
      desc: 'Cognitive memory consolidation, dreaming, and mental rejuvenation. Autonomic thermoregulation is suspended.',
      climateAction: '22.2°C Locked Thermal Core (±0.2°C) · Indirect Shutter 75°',
      phaseTime: '32m active in stage',
    },
    light: {
      label: 'Light Sleep (N1 / N2 Transition)',
      desc: 'Synchronizing sleep spindles and K-complexes. Heart rate and muscle tone gradually decreasing.',
      climateAction: '22.0°C Target · Gentle Ambient Airflow 65°',
      phaseTime: '24m active in stage',
    },
    awake: {
      label: 'Micro-Wake / Circadian Transition',
      desc: 'Brief nocturnal repositioning or morning wake-up sequence initialized.',
      climateAction: '24.0°C Circadian Morning Ramp · Suppressing Melatonin naturally',
      phaseTime: 'Just detected',
    },
  };

  return (
    <section id="sleep-biometrics" className="space-y-4">
      {/* 1. Header Bar with Prototype Badges */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 mb-1">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
              <Moon className="w-3.5 h-3.5 text-indigo-600" />
              Autonomous mmWave Sleep Intelligence
            </span>
            <span aria-hidden="true">·</span>
            <span>Master Suite Prototype</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500">60GHz FMCW Radar</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Contactless Sleep Cycle Detector &amp; Measurer</span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Camera-Free
            </span>
          </h2>
        </div>

        {/* Circadian Closed-Loop Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs text-xs">
            <span className="text-slate-500 font-medium">Circadian AC Sync:</span>
            <button
              onClick={() => setAutoCircadianSync(!autoCircadianSync)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                autoCircadianSync
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {autoCircadianSync ? 'ACTIVE (Closed-Loop)' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards (Contactless Biometrics & Posture) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Respiratory Waveform & Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wind className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Respiration Rate</span>
            </div>
            <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Chest ±{chestDisplacementMm}mm
            </span>
          </div>

          <div className="py-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                {respirationRate}
              </span>
              <span className="text-xs text-slate-500 font-medium">BPM</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Normal resting respiratory rhythm (12–18 BPM)
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Apnea / Hypopnea:</span>
            <span className="font-mono font-semibold text-emerald-600">0.2 AHI (Zero Disruption)</span>
          </div>
        </div>

        {/* Card 2: Contactless Heart Rate & HRV */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Ballistocardio (BCG)</span>
            </div>
            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              HRV: {hrvValue}ms
            </span>
          </div>

          <div className="py-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
                {heartRate}
              </span>
              <span className="text-xs text-slate-500 font-medium">BPM</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Parasympathetic tone active (Deep Recovery)
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Autonomic State:</span>
            <span className="font-mono font-semibold text-emerald-600">Restorative Vagus Dominance</span>
          </div>
        </div>

        {/* Card 3: Live Sleep Stage Classification */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Moon className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Active Sleep Stage</span>
            </div>
            <span className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded border ${getStageColor(currentStage).pill}`}>
              {currentStage}
            </span>
          </div>

          <div className="py-2.5">
            <div className="text-base font-bold text-slate-900 leading-tight">
              {stageMeta[currentStage].label}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
              {stageMeta[currentStage].desc}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Duration in Phase:</span>
            <span className="font-mono font-semibold text-slate-700">{stageMeta[currentStage].phaseTime}</span>
          </div>
        </div>

        {/* Card 4: Bed Deformation & Body Posture */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Bed className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Bed Posture Sensor</span>
            </div>
            <span className="text-[10px] font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              68.4 kg Load
            </span>
          </div>

          <div className="py-2.5">
            <div className="text-base font-bold text-slate-900">
              {bedPosture}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Restlessness Index: <strong className="text-emerald-700 font-semibold">Low (2 shifts/hr)</strong>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Bed State:</span>
            <span className="font-mono font-semibold text-emerald-600">
              {inBedOccupancy ? 'Occupant In Bed' : 'Bed Vacant'}
            </span>
          </div>
        </div>

      </div>

      {/* 3. Main Dual Panel: Left Hypnogram Sleep Architecture + Right Closed-Loop AC Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column: Full 8-Hour Hypnogram Sleep Architecture (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Polysomnographic Hypnogram Architecture</span>
                <span className="text-[11px] font-mono font-normal text-slate-500">· 8-Hour Night Profile</span>
              </h3>
              <p className="text-xs text-slate-500">
                Derived via 60GHz FMCW radar micro-motion spectral decomposition
              </p>
            </div>

            {/* Sleep Score Pill */}
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl self-start sm:self-auto">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-900">Sleep Score: 94/100 (Optimal)</span>
            </div>
          </div>

          {/* Hypnogram Stepped Graph Canvas Area */}
          <div className="relative pt-2">
            
            {/* Stage Y-Axis Labels */}
            <div className="flex">
              <div className="w-16 shrink-0 flex flex-col justify-between h-44 text-[10px] font-mono text-slate-500 pr-2 border-r border-slate-200">
                <span className="text-rose-600 font-semibold">Awake</span>
                <span className="text-purple-600 font-semibold">REM</span>
                <span className="text-cyan-600 font-semibold">Light</span>
                <span className="text-emerald-600 font-semibold">Deep N3</span>
              </div>

              {/* Stepped Hypnogram Wave Blocks */}
              <div className="flex-1 h-44 relative bg-slate-50/70 rounded-r-xl overflow-hidden flex items-end">
                {/* Horizontal guide lines */}
                <div className="absolute inset-x-0 top-0 border-b border-slate-200/60" />
                <div className="absolute inset-x-0 top-1/3 border-b border-slate-200/60" />
                <div className="absolute inset-x-0 top-2/3 border-b border-slate-200/60" />

                {/* Timeline Epoch Bars */}
                <div className="w-full h-full flex items-stretch">
                  {mockHypnogram.map((epoch, idx) => {
                    const stageHeight = 
                      epoch.stage === 'deep' ? 'h-full bg-emerald-500' :
                      epoch.stage === 'light' ? 'h-2/3 bg-cyan-400' :
                      epoch.stage === 'rem' ? 'h-5/6 bg-purple-500' :
                      'h-1/4 bg-rose-400';

                    const isCurrent = epoch.stage === currentStage && idx === 2;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredEpoch(epoch)}
                        onMouseLeave={() => setHoveredEpoch(null)}
                        className="flex-1 flex flex-col justify-end group relative cursor-pointer hover:opacity-85 transition-opacity px-0.5"
                      >
                        <div className={`w-full rounded-t-sm transition-all ${stageHeight} ${isCurrent ? 'ring-2 ring-emerald-600 ring-offset-1' : ''}`} />
                        
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-lg z-30 whitespace-nowrap">
                          <div className="font-bold">{epoch.time} — {epoch.stage.toUpperCase()} ({epoch.durationMin}m)</div>
                          <div>HR: {epoch.heartRate} BPM · Resp: {epoch.breathingRate} BPM</div>
                          <div className="text-emerald-400">AC Auto-Set: {epoch.tempSetpoint}°C (Louver {epoch.louverAngle}°)</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis Time Markers */}
            <div className="flex justify-between pl-16 text-[10px] font-mono text-slate-400 mt-2">
              <span>23:00 (Onset)</span>
              <span>01:00 (Deep Cycle 1)</span>
              <span>03:00 (REM Peak)</span>
              <span>05:00 (Deep Cycle 3)</span>
              <span>07:00 (Wake)</span>
            </div>
          </div>

          {/* Sleep Architecture Breakdown Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100/80">
              <div className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">Deep Sleep N3</div>
              <div className="text-base font-bold text-emerald-950 font-mono">1h 48m</div>
              <div className="text-[10px] text-emerald-700">23% (Target: 20-25%)</div>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100/80">
              <div className="text-[10px] font-semibold text-purple-800 uppercase tracking-wide">REM Stage</div>
              <div className="text-base font-bold text-purple-950 font-mono">1h 55m</div>
              <div className="text-[10px] text-purple-700">25% (Target: 20-25%)</div>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-100/80">
              <div className="text-[10px] font-semibold text-cyan-800 uppercase tracking-wide">Light Sleep N2</div>
              <div className="text-base font-bold text-cyan-950 font-mono">3h 44m</div>
              <div className="text-[10px] text-cyan-700">48% (Target: 45-55%)</div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100/80">
              <div className="text-[10px] font-semibold text-rose-800 uppercase tracking-wide">Awake / Latency</div>
              <div className="text-base font-bold text-rose-950 font-mono">15m</div>
              <div className="text-[10px] text-rose-700">4% (Efficiency 96.8%)</div>
            </div>
          </div>

        </div>

        {/* Right Column: Closed-Loop Sleep-to-Climate Edge Actuation (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Closed-Loop Thermal Actuation Engine
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time SG90 micro-servo &amp; inverter regulation
                </p>
              </div>
            </div>
          </div>

          {/* Current Live Stage Action Card */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">ACTIVE STAGE AUTOMATION</span>
              <span className="flex items-center gap-1 font-mono text-emerald-400 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                LIVE SYNC
              </span>
            </div>

            <div className="text-sm font-semibold text-emerald-400">
              {stageMeta[currentStage].climateAction}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentStage === 'deep' 
                ? 'Core body temperature is at nocturnal nadir. AC raises setpoint to 22.8°C to prevent shivering and directs SG90 louvers to 80° for ceiling Coanda distribution.'
                : currentStage === 'rem'
                ? 'Muscular thermoregulation is paralyzed during REM. System enters ±0.2°C thermal lock to prevent nighttime awakenings.'
                : currentStage === 'light'
                ? 'Preparing for deep sleep cycle with stabilized 22.0°C and quiet 35dB fan circulation.'
                : 'Circadian warming sequence initialized (24.0°C) to gently suppress melatonin and stimulate morning cortisol.'}
            </p>
          </div>

          {/* Live FMCW Raw Waveform Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
              <span className="flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-emerald-600" />
                Raw mmWave FMCW Chest Displacement
              </span>
              <span className="text-[10px] font-mono text-slate-400">20Hz Phase FFT</span>
            </div>

            <div className="w-full h-24 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={360}
                height={96}
                className="w-full h-full block"
              />
              <div className="absolute top-1.5 right-2 text-[9px] font-mono text-slate-400">
                Range: 0.1Hz–2.5Hz Bandpass
              </div>
            </div>
          </div>

          {/* Interactive Prototype Stage Simulator */}
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-semibold text-slate-800 mb-2 flex items-center justify-between">
              <span>Prototype Test Simulator:</span>
              <span className="text-[10px] text-slate-400 font-normal">Click to trigger local edge response</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleSimulateStage('deep')}
                className={`px-3 py-2 rounded-xl font-medium border text-left transition-all cursor-pointer ${
                  currentStage === 'deep'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-semibold text-emerald-700">Simulate Deep</div>
                <div className="text-[10px] text-slate-500 font-mono">12 BPM · 22.8°C</div>
              </button>

              <button
                onClick={() => handleSimulateStage('rem')}
                className={`px-3 py-2 rounded-xl font-medium border text-left transition-all cursor-pointer ${
                  currentStage === 'rem'
                    ? 'bg-purple-50 text-purple-900 border-purple-300 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-semibold text-purple-700">Simulate REM</div>
                <div className="text-[10px] text-slate-500 font-mono">16.5 BPM · ±0.2°C Lock</div>
              </button>

              <button
                onClick={() => handleSimulateStage('light')}
                className={`px-3 py-2 rounded-xl font-medium border text-left transition-all cursor-pointer ${
                  currentStage === 'light'
                    ? 'bg-cyan-50 text-cyan-900 border-cyan-300 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-semibold text-cyan-700">Simulate Light</div>
                <div className="text-[10px] text-slate-500 font-mono">14.8 BPM · Spindles</div>
              </button>

              <button
                onClick={() => handleSimulateStage('awake')}
                className={`px-3 py-2 rounded-xl font-medium border text-left transition-all cursor-pointer ${
                  currentStage === 'awake'
                    ? 'bg-rose-50 text-rose-900 border-rose-300 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-[11px] font-semibold text-rose-700">Simulate Wake</div>
                <div className="text-[10px] text-slate-500 font-mono">18 BPM · 24°C Ramp</div>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* 4. Privacy & Hardware Architecture Footer Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900">
              100% Privacy-Preserving Biological Telemetry
            </div>
            <div className="text-slate-600 text-[11px]">
              No optical cameras or microphones · Operates completely in pitch darkness · Sub-milliwatt RF exposure (1,000× safer than typical smartphone Wi-Fi)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-emerald-800 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs">
          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
          <span>Local ESP32 FFT Processing</span>
        </div>
      </div>
    </section>
  );
};
