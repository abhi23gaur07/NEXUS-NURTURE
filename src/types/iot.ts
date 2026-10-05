export interface RoomData {
  id: string;
  name: string;
  type: 'living' | 'study' | 'bedroom' | 'balcony';
  temperature: number; // in Celsius
  targetTemp: number;
  humidity: number; // % RH
  co2: number; // ppm
  occupancy: boolean;
  occupantCount: number;
  mmWaveDistance: number; // in meters (0.5m - 6.0m)
  mmWaveAzimuth: number; // in degrees (-60° to +60°)
  microMotionEnergy: number; // 0 - 100
  loadCellWeight: number; // kg on chair/bed
  isOccupiedSeated: boolean;
  acState: {
    power: boolean;
    mode: 'auto' | 'follow-me' | 'indirect' | 'eco' | 'sleep';
    fanSpeed: 'quiet' | 'low' | 'med' | 'high' | 'turbo';
    servoAngle: number; // 0 to 90 degrees
    currentAirflowDirection: string;
    instantEdgeActuation: boolean; // Bottom-up instantaneous response
  };
  nodeId: string;
  nodeStatus: 'online' | 'mesh-sync' | 'low-power';
  rssi: number; // dBm
}

export interface TelemetryPoint {
  timestamp: string;
  temperature: number;
  humidity: number;
  co2: number;
  powerUsageWatts: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Resident Homeowner' | 'Systems Architect' | 'Guest Observer';
  avatarInitials: string;
  meshKey: string;
  authenticated: boolean;
}

export interface HardwareNodeSpec {
  name: string;
  costInr: number;
  description: string;
  role: string;
  keyFeature: string;
}
