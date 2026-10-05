/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RoomData, TelemetryPoint, UserProfile } from './types/iot';
import { Navbar } from './components/Navbar';
import { Home3DViewer } from './components/Home3DViewer';
import { SmartACController } from './components/SmartACController';
import { TelemetryGauges } from './components/TelemetryGauges';
import { LoginPortalModal } from './components/LoginPortalModal';
import { EdgeArchitectureModal } from './components/EdgeArchitectureModal';
import { NodeMeshViewer } from './components/NodeMeshViewer';
import { EdgePayloadConsole } from './components/EdgePayloadConsole';
import { VoiceCommandAssistant } from './components/VoiceCommandAssistant';
import { SiriIntegrationModal } from './components/SiriIntegrationModal';
import { 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  Thermometer, 
  Droplets, 
  Wind, 
  ArrowUpRight,
  Layers,
  Info,
  CheckCircle2,
  RefreshCw,
  Activity
} from 'lucide-react';

const initialRooms: RoomData[] = [
  {
    id: 'living',
    name: 'Living Room & Lounge',
    type: 'living',
    temperature: 23.4,
    targetTemp: 22.0,
    humidity: 48.2,
    co2: 580,
    occupancy: true,
    occupantCount: 1,
    mmWaveDistance: 2.15,
    mmWaveAzimuth: -22,
    microMotionEnergy: 64,
    loadCellWeight: 0,
    isOccupiedSeated: false,
    acState: {
      power: true,
      mode: 'follow-me',
      fanSpeed: 'med',
      servoAngle: 45,
      currentAirflowDirection: 'Azimuth -22° (Target Follow)',
      instantEdgeActuation: true,
    },
    nodeId: 'ESP32-LIVING-02',
    nodeStatus: 'online',
    rssi: -54,
  },
  {
    id: 'study',
    name: 'Productivity Hub',
    type: 'study',
    temperature: 24.6, // Matches exact physical prototype in PDF page 3
    targetTemp: 23.5,
    humidity: 48.0,    // Matches exact physical prototype in PDF page 3
    co2: 612,          // Matches exact physical prototype in PDF page 3
    occupancy: true,
    occupantCount: 1,
    mmWaveDistance: 1.18,
    mmWaveAzimuth: 5,
    microMotionEnergy: 88,
    loadCellWeight: 68.4,
    isOccupiedSeated: true,
    acState: {
      power: true,
      mode: 'auto',
      fanSpeed: 'quiet',
      servoAngle: 30,
      currentAirflowDirection: 'Desk Workspace Comfort',
      instantEdgeActuation: true,
    },
    nodeId: 'ESP32-HUB-01',
    nodeStatus: 'online',
    rssi: -48,
  },
  {
    id: 'bedroom',
    name: 'Master Suite',
    type: 'bedroom',
    temperature: 21.8,
    targetTemp: 21.5,
    humidity: 52.4,
    co2: 495,
    occupancy: false,
    occupantCount: 0,
    mmWaveDistance: 0,
    mmWaveAzimuth: 0,
    microMotionEnergy: 0,
    loadCellWeight: 0,
    isOccupiedSeated: false,
    acState: {
      power: false,
      mode: 'indirect',
      fanSpeed: 'quiet',
      servoAngle: 75,
      currentAirflowDirection: 'Ceiling Indirect Coanda',
      instantEdgeActuation: true,
    },
    nodeId: 'ESP32-BED-03',
    nodeStatus: 'low-power',
    rssi: -62,
  },
  {
    id: 'balcony',
    name: 'Balcony & Solar Pergola',
    type: 'balcony',
    temperature: 26.5,
    targetTemp: 24.0,
    humidity: 61.2,
    co2: 412,
    occupancy: false,
    occupantCount: 0,
    mmWaveDistance: 0,
    mmWaveAzimuth: 0,
    microMotionEnergy: 0,
    loadCellWeight: 0,
    isOccupiedSeated: false,
    acState: {
      power: false,
      mode: 'eco',
      fanSpeed: 'low',
      servoAngle: 90,
      currentAirflowDirection: 'Standby Shutter Closed',
      instantEdgeActuation: true,
    },
    nodeId: 'ESP32-BALC-04',
    nodeStatus: 'online',
    rssi: -58,
  },
];

const initialHistory: TelemetryPoint[] = [
  { timestamp: '00:00', temperature: 21.4, humidity: 54, co2: 450, powerUsageWatts: 180 },
  { timestamp: '02:00', temperature: 21.1, humidity: 55, co2: 440, powerUsageWatts: 120 },
  { timestamp: '04:00', temperature: 20.8, humidity: 56, co2: 430, powerUsageWatts: 110 },
  { timestamp: '06:00', temperature: 21.6, humidity: 53, co2: 480, powerUsageWatts: 240 },
  { timestamp: '08:00', temperature: 22.9, humidity: 50, co2: 560, powerUsageWatts: 380 },
  { timestamp: '10:00', temperature: 23.8, humidity: 47, co2: 590, powerUsageWatts: 420 },
  { timestamp: '12:00', temperature: 24.5, humidity: 46, co2: 615, powerUsageWatts: 480 },
  { timestamp: '14:00', temperature: 24.8, humidity: 45, co2: 610, powerUsageWatts: 510 },
  { timestamp: '16:00', temperature: 24.2, humidity: 47, co2: 585, powerUsageWatts: 430 },
  { timestamp: '18:00', temperature: 23.9, humidity: 48, co2: 590, powerUsageWatts: 390 },
  { timestamp: '20:00', temperature: 23.5, humidity: 49, co2: 575, powerUsageWatts: 350 },
  { timestamp: 'Now',   temperature: 23.4, humidity: 48, co2: 580, powerUsageWatts: 320 },
];

export default function App() {
  const [rooms, setRooms] = useState<RoomData[]>(initialRooms);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('living');
  const [activeSection, setActiveSection] = useState<string>('viewer');
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(initialHistory);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: 'guest',
    name: 'Resident Portal',
    email: '',
    role: 'Resident Homeowner',
    avatarInitials: 'NN',
    meshKey: 'NN-GUEST-DEFAULT',
    authenticated: false,
  });

  // Modal dialog toggles
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isSiriOpen, setIsSiriOpen] = useState(false);

  // Active room data
  const currentRoom = rooms.find((r) => r.id === (selectedRoomId === 'all' || selectedRoomId === 'hall-ac' ? 'living' : selectedRoomId)) || rooms[0];

  // Periodic subtle sensor telemetry jitter for organic real-world feel
  useEffect(() => {
    const interval = setInterval(() => {
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          // If AC is on and room temp > targetTemp, slowly cool down
          let newTemp = room.temperature;
          if (room.acState.power) {
            if (newTemp > room.targetTemp) {
              newTemp = Math.max(room.targetTemp, newTemp - 0.04);
            } else if (newTemp < room.targetTemp) {
              newTemp = Math.min(room.targetTemp, newTemp + 0.04);
            }
          }
          // Tiny natural ambient drift +/- 0.02
          newTemp += (Math.random() - 0.5) * 0.03;

          // Tiny humidity drift +/- 0.15%
          const newHum = Math.min(75, Math.max(35, room.humidity + (Math.random() - 0.5) * 0.2));

          // If occupancy is true and follow-me mode is active, slightly update azimuth
          let newAzimuth = room.mmWaveAzimuth;
          if (room.occupancy && room.acState.mode === 'follow-me') {
            newAzimuth = Math.max(-45, Math.min(45, newAzimuth + (Math.random() - 0.5) * 2));
          }

          return {
            ...room,
            temperature: newTemp,
            humidity: newHum,
            mmWaveAzimuth: Math.round(newAzimuth),
            microMotionEnergy: room.occupancy ? Math.min(98, Math.max(40, room.microMotionEnergy + Math.round((Math.random() - 0.5) * 4))) : 0,
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Handler functions for smart AC controls
  const handleUpdateTemp = (newTarget: number) => {
    const clamped = Math.min(30, Math.max(16, Number(newTarget.toFixed(1))));
    setRooms((prev) =>
      prev.map((r) => (r.id === currentRoom.id ? { ...r, targetTemp: clamped } : r))
    );
  };

  const handleTogglePower = () => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === currentRoom.id
          ? {
              ...r,
              acState: {
                ...r.acState,
                power: !r.acState.power,
                servoAngle: !r.acState.power ? 45 : 90, // Open or close louvers
              },
            }
          : r
      )
    );
  };

  const handleUpdateMode = (mode: RoomData['acState']['mode']) => {
    let newAngle = currentRoom.acState.servoAngle;
    if (mode === 'follow-me') newAngle = 35;
    else if (mode === 'indirect') newAngle = 70;
    else if (mode === 'eco') newAngle = 85;
    else if (mode === 'auto') newAngle = 45;

    setRooms((prev) =>
      prev.map((r) =>
        r.id === currentRoom.id
          ? {
              ...r,
              acState: {
                ...r.acState,
                mode,
                servoAngle: newAngle,
              },
            }
          : r
      )
    );
  };

  const handleUpdateFanSpeed = (fanSpeed: RoomData['acState']['fanSpeed']) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === currentRoom.id ? { ...r, acState: { ...r.acState, fanSpeed } } : r
      )
    );
  };

  const handleUpdateServoAngle = (angle: number) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === currentRoom.id ? { ...r, acState: { ...r.acState, servoAngle: angle } } : r
      )
    );
  };

  const handleToggleEdgeActuation = () => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === currentRoom.id
          ? {
              ...r,
              acState: {
                ...r.acState,
                instantEdgeActuation: !r.acState.instantEdgeActuation,
              },
            }
          : r
      )
    );
  };

  // Specific room voice control handlers
  const handleUpdateRoomTemp = (roomId: string, newTarget: number) => {
    const clamped = Math.min(30, Math.max(16, Number(newTarget.toFixed(1))));
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, targetTemp: clamped } : r))
    );
  };

  const handleToggleRoomPower = (roomId: string, forceState?: boolean) => {
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId) return r;
        const nextPower = forceState !== undefined ? forceState : !r.acState.power;
        return {
          ...r,
          acState: {
            ...r.acState,
            power: nextPower,
            servoAngle: nextPower ? 45 : 90,
          },
        };
      })
    );
  };

  const handleUpdateRoomMode = (roomId: string, mode: RoomData['acState']['mode']) => {
    let newAngle = 45;
    if (mode === 'follow-me') newAngle = 35;
    else if (mode === 'indirect') newAngle = 70;
    else if (mode === 'eco') newAngle = 85;

    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              acState: {
                ...r.acState,
                mode,
                servoAngle: newAngle,
              },
            }
          : r
      )
    );
  };

  const handleUpdateRoomServoAngle = (roomId: string, angle: number) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, acState: { ...r.acState, servoAngle: angle } } : r
      )
    );
  };

  const handleUpdateRoomFanSpeed = (roomId: string, fanSpeed: RoomData['acState']['fanSpeed']) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, acState: { ...r.acState, fanSpeed } } : r
      )
    );
  };

  // Siri command execution bridge
  const handleTriggerSiriCommand = (command: string) => {
    const text = command.toLowerCase();
    setSelectedRoomId('living');
    if (text.includes('22') || text.includes('temp to 22')) {
      handleUpdateRoomTemp('living', 22.0);
    } else if (text.includes('turn off')) {
      handleToggleRoomPower('living', false);
    } else if (text.includes('turn on')) {
      handleToggleRoomPower('living', true);
    } else if (text.includes('follow-me') || text.includes('follow me')) {
      handleUpdateRoomMode('living', 'follow-me');
    } else if (text.includes('45') || text.includes('louvers')) {
      handleUpdateRoomServoAngle('living', 45);
    }
  };

  // Event simulator for testing presence and thermal response
  const handleSimulateEvent = (eventType: 'enter-desk' | 'leave-room' | 'heat-spike' | 'cool-down') => {
    if (eventType === 'enter-desk') {
      setSelectedRoomId('study');
      setRooms((prev) =>
        prev.map((r) =>
          r.id === 'study'
            ? {
                ...r,
                occupancy: true,
                occupantCount: 1,
                mmWaveDistance: 1.15,
                mmWaveAzimuth: 0,
                loadCellWeight: 69.2,
                isOccupiedSeated: true,
                microMotionEnergy: 92,
                acState: {
                  ...r.acState,
                  power: true,
                  servoAngle: 35,
                },
              }
            : r
        )
      );
    } else if (eventType === 'leave-room') {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === currentRoom.id
            ? {
                ...r,
                occupancy: false,
                occupantCount: 0,
                mmWaveDistance: 0,
                loadCellWeight: 0,
                isOccupiedSeated: false,
                microMotionEnergy: 0,
                acState: {
                  ...r.acState,
                  mode: 'eco',
                  servoAngle: 85,
                },
              }
            : r
        )
      );
    } else if (eventType === 'heat-spike') {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === currentRoom.id
            ? {
                ...r,
                temperature: r.temperature + 2.5,
                humidity: r.humidity + 5.0,
                acState: {
                  ...r.acState,
                  power: true,
                  fanSpeed: 'turbo',
                  servoAngle: 30,
                },
              }
            : r
        )
      );
    } else if (eventType === 'cool-down') {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === currentRoom.id
            ? {
                ...r,
                temperature: 21.0,
                humidity: 46.0,
                acState: {
                  ...r.acState,
                  fanSpeed: 'quiet',
                  servoAngle: 65,
                },
              }
            : r
        )
      );
    }
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. Header Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenArchitecture={() => setIsArchOpen(true)}
        activeSection={activeSection}
        onSelectSection={scrollToSection}
        voiceControlSlot={
          <VoiceCommandAssistant
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleSelectRoom}
            onUpdateRoomTemp={handleUpdateRoomTemp}
            onToggleRoomPower={handleToggleRoomPower}
            onUpdateRoomMode={handleUpdateRoomMode}
            onUpdateRoomServoAngle={handleUpdateRoomServoAngle}
            onUpdateRoomFanSpeed={handleUpdateRoomFanSpeed}
            onOpenSiriModal={() => setIsSiriOpen(true)}
          />
        }
      />

      {/* 2. Hero Kicker & Editorial Context */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Edge IoT Smart Living</span>
              <span aria-hidden="true">·</span>
              <span>Team Nexus Nurture</span>
              <span aria-hidden="true">·</span>
              <span>₹1,500 Complete Node Deployment</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Context-Aware Smart Living Architecture
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsSiriOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors shadow-2xs"
              title="Connect Hall AC to Apple HomeKit & Siri Shortcuts"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Connect to Siri</span>
            </button>
            <button
              onClick={() => setIsArchOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>Architecture Spec</span>
            </button>
            <button
              onClick={() => setIsLoginOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentUser.authenticated ? 'Resident Account' : 'Resident Portal'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace Viewport */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-8">
        
        {/* SECTION 1: 3D SMART HOME INTERACTIVE CANVAS */}
        <section id="viewer" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                Interactive 3D Smart Home Model
              </h2>
              <span className="text-xs text-slate-400">· WebGL 3D Spatial Geometry</span>
            </div>

            <div className="text-xs text-slate-500">
              Active Zone: <strong className="text-slate-900">{currentRoom.name}</strong>
            </div>
          </div>

          {/* Three.js Interactive 3D Model */}
          <Home3DViewer
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleSelectRoom}
            acActive={currentRoom.acState.power}
            servoAngle={currentRoom.acState.servoAngle}
            acMode={currentRoom.acState.mode}
          />
        </section>

        {/* SECTION 2: SMART AC & REAL-TIME CLIMATE TELEMETRY (Dual Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Smart AC Unit & SG90 Servo Actuator Controller */}
          <section id="climate" className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Spatial AC Unit &amp; Louver Servo
              </h2>
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Instant Edge Actuation
              </span>
            </div>

            <SmartACController
              room={currentRoom}
              onUpdateTemp={handleUpdateTemp}
              onTogglePower={handleTogglePower}
              onUpdateMode={handleUpdateMode}
              onUpdateFanSpeed={handleUpdateFanSpeed}
              onUpdateServoAngle={handleUpdateServoAngle}
              onToggleEdgeActuation={handleToggleEdgeActuation}
              onOpenSiri={() => setIsSiriOpen(true)}
              onFocusHallAC={() => setSelectedRoomId('hall-ac')}
            />
          </section>

          {/* Right Column: Real-time Telemetry, mmWave Radar Scope, Load-Cells */}
          <section id="telemetry" className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Environmental &amp; Spatial Sensing
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                SHT31 · HLK-LD2410 mmWave · Load Cells
              </span>
            </div>

            <TelemetryGauges room={currentRoom} history={telemetryHistory} />
          </section>
        </div>

        {/* SECTION 3: ESP-NOW WIRELESS MESH NETWORK TOPOLOGY & TRIGGER SIMULATOR */}
        <section id="mesh" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Mesh Network Topology &amp; Physical Simulators
            </h2>
            <span className="text-xs text-slate-400">
              Zero cloud transit required for local actuation
            </span>
          </div>

          <NodeMeshViewer
            rooms={rooms}
            onSimulateEvent={handleSimulateEvent}
          />
        </section>

        {/* SECTION 4: LIVE EDGE PACKET STREAM (CONSOLE) */}
        <section className="space-y-3">
          <EdgePayloadConsole room={currentRoom} />
        </section>
      </main>

      {/* 4. Architectural Proof & Hardware Highlights Section */}
      <section className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
              Engineered For Scalability
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
              Affordable, Plug &amp; Play, Highly Scalable
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Context-Aware Homes. Private by Design. Scalable for Real Life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
              <div className="text-2xl font-bold font-mono text-emerald-700 mb-1">
                ~₹1,500
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Per Node Hardware</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                ESP32 + mmWave radar + SG90 micro-servo + 3D enclosure. Accessible for all homes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
              <div className="text-2xl font-bold font-mono text-emerald-700 mb-1">
                &lt;10 Min
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Rapid Deployment</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Self-healing wireless mesh requires no specialized wiring, conduit, or technician tools.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
              <div className="text-2xl font-bold font-mono text-emerald-700 mb-1">
                0 ms Delay
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Instant Edge Actuation</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Spatial HVAC actuates on local ESP32 nodes without round trips to external servers.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200">
              <div className="text-2xl font-bold font-mono text-emerald-700 mb-1">
                100% Privacy
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Optical-Free Sensing</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Zero camera sensors. Spatial mmWave RF + strain load-cells keep personal data in the room.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Minimalist Anti-Slop Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">Nexus Nurture</span>
            <span>·</span>
            <span>Intelligent Systems. Natural Impact.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => setIsArchOpen(true)} className="hover:text-slate-900 transition-colors">
              Architecture Whitepaper
            </button>
            <button onClick={() => setIsLoginOpen(true)} className="hover:text-slate-900 transition-colors">
              Resident Access
            </button>
            <span>&copy; {new Date().getFullYear()} Nexus Nurture Systems</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginPortalModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => setCurrentUser(user)}
        onLogout={() =>
          setCurrentUser({
            id: 'guest',
            name: 'Resident Portal',
            email: '',
            role: 'Resident Homeowner',
            avatarInitials: 'NN',
            meshKey: 'NN-GUEST-DEFAULT',
            authenticated: false,
          })
        }
      />

      <EdgeArchitectureModal
        isOpen={isArchOpen}
        onClose={() => setIsArchOpen(false)}
      />

      <SiriIntegrationModal
        isOpen={isSiriOpen}
        onClose={() => setIsSiriOpen(false)}
        hallRoom={rooms.find((r) => r.id === 'living') || rooms[0]}
        onTriggerSiriCommand={handleTriggerSiriCommand}
      />
    </div>
  );
}
