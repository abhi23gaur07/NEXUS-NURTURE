import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomData } from '../types/iot';
import { 
  Maximize2, 
  RotateCcw, 
  Sun, 
  Moon, 
  Flame, 
  Wind, 
  Radio, 
  Eye, 
  Layers,
  Sparkles
} from 'lucide-react';

interface Home3DViewerProps {
  rooms: RoomData[];
  selectedRoomId: string;
  onSelectRoom: (roomId: string) => void;
  acActive: boolean;
  servoAngle: number;
  acMode: string;
}

type LightingMode = 'day' | 'evening' | 'night' | 'thermal';

export const Home3DViewer: React.FC<Home3DViewerProps> = ({
  rooms,
  selectedRoomId,
  onSelectRoom,
  acActive,
  servoAngle,
  acMode,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');
  const [showAirflowParticles, setShowAirflowParticles] = useState<boolean>(true);
  const [showRadarPulses, setShowRadarPulses] = useState<boolean>(true);
  const [isRotatingAuto, setIsRotatingAuto] = useState<boolean>(false);
  const [webglAvailable, setWebglAvailable] = useState<boolean>(true);

  // References for Three.js scene objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(14, 13, 16));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 1, 0));
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const roomMeshesRef = useRef<{ [key: string]: THREE.Group }>({});
  const radarRingsRef = useRef<THREE.Mesh[]>([]);

  // Camera targets for each room
  const cameraFocuses: { [key: string]: { pos: THREE.Vector3; look: THREE.Vector3 } } = {
    all: { pos: new THREE.Vector3(14, 13, 16), look: new THREE.Vector3(0, 1, 0) },
    living: { pos: new THREE.Vector3(-4, 7, 7), look: new THREE.Vector3(-3.5, 1, 2.5) },
    'hall-ac': { pos: new THREE.Vector3(-4.6, 2.8, 3.5), look: new THREE.Vector3(-6.7, 2.4, 2.5) },
    study: { pos: new THREE.Vector3(7, 6, 7), look: new THREE.Vector3(4.5, 1, 2.5) },
    bedroom: { pos: new THREE.Vector3(-4, 7, -6), look: new THREE.Vector3(-3.5, 1, -3.5) },
    balcony: { pos: new THREE.Vector3(7, 6, -6), look: new THREE.Vector3(4.5, 1, -3.5) },
  };

  useEffect(() => {
    const target = cameraFocuses[selectedRoomId] || cameraFocuses.all;
    targetCamPos.current.copy(target.pos);
    targetLookAt.current.copy(target.look);
  }, [selectedRoomId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglAvailable(false);
        return;
      }
    } catch {
      setWebglAvailable(false);
      return;
    }

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#f8fafc');

    // Soft fog for clean depth
    scene.fog = new THREE.FogExp2('#f8fafc', 0.022);

    // 2. Camera setup
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(14, 13, 16);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // Clear previous children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.3);
    sunLight.position.set(16, 22, 14);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    const d = 14;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.45);
    fillLight.position.set(-14, 10, -10);
    scene.add(fillLight);

    // Ground platform & garden foundation
    const groundGeo = new THREE.BoxGeometry(26, 0.4, 24);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.85,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle perimeter architectural ground grid
    const grid = new THREE.GridHelper(24, 24, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = 0.01;
    scene.add(grid);

    // House Floor Base
    const houseBaseGeo = new THREE.BoxGeometry(17, 0.3, 15);
    const houseBaseMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.1,
    });
    const houseBase = new THREE.Mesh(houseBaseGeo, houseBaseMat);
    houseBase.position.set(0.5, 0.15, 0);
    houseBase.receiveShadow = true;
    scene.add(houseBase);

    // Helper material creators
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.05,
    });

    const woodFloorMat = new THREE.MeshStandardMaterial({
      color: 0xf7ede2,
      roughness: 0.7,
      metalness: 0.02,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xdbeafe,
      transmission: 0.85,
      opacity: 0.6,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      ior: 1.5,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x059669, // Emerald accent
      roughness: 0.3,
      metalness: 0.2,
    });

    // ----------------------------------------------------
    // BUILD ROOMS & SMART NODES
    // ----------------------------------------------------

    // 1. LIVING ROOM (Zone: -3.5, 0, 2.5)
    const livingGroup = new THREE.Group();
    livingGroup.name = 'living';

    // Parquet floor inlay
    const livingFloor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.05, 6.4), woodFloorMat);
    livingFloor.position.set(-3.5, 0.32, 2.5);
    livingFloor.receiveShadow = true;
    livingGroup.add(livingFloor);

    // 1. Woven Wool Designer Area Rug
    const rugMat = new THREE.MeshStandardMaterial({ color: 0xede8e1, roughness: 0.95 });
    const livingRug = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.02, 3.8), rugMat);
    livingRug.position.set(-3.8, 0.33, 2.6);
    livingRug.receiveShadow = true;
    livingGroup.add(livingRug);

    // 2. Low modular sectional sofa
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.45, 1.6), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 }));
    sofaBase.position.set(-3.8, 0.55, 3.2);
    sofaBase.castShadow = true;
    sofaBase.receiveShadow = true;
    livingGroup.add(sofaBase);

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 0.4), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85 }));
    sofaBack.position.set(-3.8, 0.9, 4.0);
    sofaBack.castShadow = true;
    livingGroup.add(sofaBack);

    // Decorative throw pillows
    const pillowGeo = new THREE.BoxGeometry(0.5, 0.45, 0.2);
    const pillowTerracotta = new THREE.Mesh(pillowGeo, new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.9 }));
    pillowTerracotta.position.set(-4.9, 0.9, 3.8);
    pillowTerracotta.rotation.y = 0.2;
    const pillowSage = new THREE.Mesh(pillowGeo, new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.9 }));
    pillowSage.position.set(-2.7, 0.9, 3.8);
    pillowSage.rotation.y = -0.2;
    livingGroup.add(pillowTerracotta, pillowSage);

    // 3. Coffee table with travertine stone top
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 32), new THREE.MeshStandardMaterial({ color: 0xe8e4de, roughness: 0.4, metalness: 0.05 }));
    tableTop.position.set(-3.8, 0.65, 1.8);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    livingGroup.add(tableTop);

    // 4. Floating Walnut Media Credenza below the AC wall
    const credenzaMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.45 });
    const credenza = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 0.55), credenzaMat);
    credenza.position.set(-6.6, 0.52, 2.5);
    credenza.rotation.y = Math.PI / 2;
    credenza.castShadow = true;
    credenza.receiveShadow = true;
    livingGroup.add(credenza);

    // 5. Architectural Floor Lamp with real warm PointLight
    const lampStand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 2.3, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
    );
    lampStand.position.set(-1.8, 1.4, 4.3);
    lampStand.castShadow = true;
    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.45, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.85 })
    );
    lampShade.position.set(-1.8, 2.45, 4.3);
    livingGroup.add(lampStand, lampShade);

    // Real warm ambient lamp glow
    const lampLight = new THREE.PointLight(0xffecd2, 0.75, 5.5);
    lampLight.position.set(-1.8, 2.35, 4.3);
    livingGroup.add(lampLight);

    // 6. Indoor Potted Fig Plant (Lush greenery in hall corner)
    const planter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.26, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 })
    );
    planter.position.set(-1.6, 0.62, 1.1);
    planter.castShadow = true;
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 })
    );
    foliage.position.set(-1.6, 1.15, 1.1);
    foliage.castShadow = true;
    livingGroup.add(planter, foliage);

    // LUXURY ARCHITECTURAL SPATIAL HVAC UNIT on Living Room / Main Hall Wall
    const acUnit = new THREE.Group();
    acUnit.name = 'ac-living';

    // 1. Sleek Matte Pearl White Chassis with subtle rounded bevel feel
    const chassisGeo = new THREE.BoxGeometry(1.65, 0.52, 0.34);
    const chassisMat = new THREE.MeshStandardMaterial({ 
      color: 0xfafafa, 
      roughness: 0.15, 
      metalness: 0.08 
    });
    const acChassis = new THREE.Mesh(chassisGeo, chassisMat);
    acChassis.position.set(-6.8, 2.4, 2.5);
    acChassis.rotation.y = Math.PI / 2;
    acChassis.castShadow = true;
    acUnit.add(acChassis);

    // 2. Smoked Obsidian Glass Visor Strip
    const visorGeo = new THREE.BoxGeometry(1.52, 0.22, 0.03);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: 0x090d16,
      roughness: 0.1,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const acVisor = new THREE.Mesh(visorGeo, visorMat);
    acVisor.position.set(-6.62, 2.42, 2.5);
    acVisor.rotation.y = Math.PI / 2;
    acUnit.add(acVisor);

    // 3. Digital Glowing LED Readout on Obsidian Visor (e.g. "22°")
    const ledDisplayGeo = new THREE.PlaneGeometry(0.35, 0.12);
    const ledDisplayMat = new THREE.MeshBasicMaterial({ 
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9
    });
    const ledDisplay = new THREE.Mesh(ledDisplayGeo, ledDisplayMat);
    ledDisplay.position.set(-6.60, 2.42, 2.75);
    ledDisplay.rotation.y = Math.PI / 2;
    acUnit.add(ledDisplay);

    // 4. Top Micro-Louver Intake Grille (Black anodized aluminum fins)
    const intakeGeo = new THREE.BoxGeometry(1.45, 0.04, 0.22);
    const intakeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const intakeGrille = new THREE.Mesh(intakeGeo, intakeMat);
    intakeGrille.position.set(-6.8, 2.67, 2.5);
    intakeGrille.rotation.y = Math.PI / 2;
    acUnit.add(intakeGrille);

    // 5. Multi-Blade Articulated Precision Louvers (3 blades driven by SG90 servo)
    const louverGeo = new THREE.BoxGeometry(1.4, 0.025, 0.12);
    const louverMat = new THREE.MeshStandardMaterial({ 
      color: 0x059669, 
      roughness: 0.2, 
      metalness: 0.3 
    });

    const louverBlades: THREE.Mesh[] = [];
    [-0.07, 0, 0.07].forEach((zOffset, idx) => {
      const blade = new THREE.Mesh(louverGeo, louverMat);
      blade.name = `louver-blade-${idx}`;
      blade.position.set(-6.64, 2.22, 2.5 + zOffset);
      blade.rotation.y = Math.PI / 2;
      blade.rotation.x = THREE.MathUtils.degToRad(servoAngle);
      acUnit.add(blade);
      louverBlades.push(blade);
    });

    // 6. Ambient Architectural Glow Light-Pipe (Casts glowing mood light along the wall)
    const lightPipeGeo = new THREE.BoxGeometry(1.5, 0.02, 0.04);
    const lightPipeMat = new THREE.MeshBasicMaterial({ 
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85
    });
    const lightPipe = new THREE.Mesh(lightPipeGeo, lightPipeMat);
    lightPipe.name = 'ac-ambient-light';
    lightPipe.position.set(-6.66, 2.12, 2.5);
    lightPipe.rotation.y = Math.PI / 2;
    acUnit.add(lightPipe);

    // 7. Visible SG90 Micro-Servo Motor & Linkage on chassis side
    const servoBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.16, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 })
    );
    servoBox.position.set(-6.8, 2.22, 1.68);
    const servoArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.08, 0.02),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    servoArm.position.set(-6.72, 2.22, 1.68);
    acUnit.add(servoBox, servoArm);

    // Green/Cyan Power status LED on AC
    const acLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    acLed.position.set(-6.61, 2.42, 2.0);
    acUnit.add(acLed);
    livingGroup.add(acUnit);

    // HLK-LD2410 mmWave Radar Node on Living Room Wall
    const radarNode = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.08), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    radarNode.position.set(-6.85, 1.8, 4.2);
    radarNode.rotation.y = Math.PI / 2;
    livingGroup.add(radarNode);

    // Radar pulse wave indicator ring
    const radarRingGeo = new THREE.RingGeometry(0.4, 0.48, 32);
    const radarRingMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    const radarRing = new THREE.Mesh(radarRingGeo, radarRingMat);
    radarRing.position.set(-6.75, 1.8, 4.2);
    radarRing.rotation.y = Math.PI / 2;
    radarRingsRef.current.push(radarRing);
    livingGroup.add(radarRing);

    // Occupant Presence Marker in living room
    const occupantL = new THREE.Group();
    const occBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.65, 8, 16), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 }));
    occBody.position.set(-3.8, 1.0, 3.2);
    occBody.castShadow = true;
    occupantL.add(occBody);
    livingGroup.add(occupantL);

    scene.add(livingGroup);
    roomMeshesRef.current.living = livingGroup;

    // ----------------------------------------------------
    // 2. PRODUCTIVITY HUB / STUDY (Zone: 4.5, 0, 2.5)
    // ----------------------------------------------------
    const studyGroup = new THREE.Group();
    studyGroup.name = 'study';

    const studyFloor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.05, 6.4), new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.8 }));
    studyFloor.position.set(4.5, 0.32, 2.5);
    studyFloor.receiveShadow = true;
    studyGroup.add(studyFloor);

    // Productivity Desk
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.4), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 }));
    deskTop.position.set(4.8, 1.2, 2.5);
    deskTop.castShadow = true;
    studyGroup.add(deskTop);

    // Desk legs
    const legGeo = new THREE.BoxGeometry(0.08, 0.88, 0.08);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(3.6, 0.76, 2.0);
    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(6.0, 0.76, 2.0);
    const leg3 = new THREE.Mesh(legGeo, legMat);
    leg3.position.set(3.6, 0.76, 3.0);
    const leg4 = new THREE.Mesh(legGeo, legMat);
    leg4.position.set(6.0, 0.76, 3.0);
    studyGroup.add(leg1, leg2, leg3, leg4);

    // Curved Ultra-wide Monitor on Desk
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 0.06), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 }));
    monitor.position.set(4.8, 1.6, 2.1);
    studyGroup.add(monitor);

    // Screen glowing display showing telemetry
    const screenDisplay = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.48), new THREE.MeshBasicMaterial({ color: 0x065f46 }));
    screenDisplay.position.set(4.8, 1.6, 2.14);
    studyGroup.add(screenDisplay);

    // Ergonomic Chair with Load-Cell Sensor Base
    const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 16), new THREE.MeshStandardMaterial({ color: 0x059669 }));
    chairBase.position.set(4.8, 0.4, 3.3);
    studyGroup.add(chairBase);

    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    chairSeat.position.set(4.8, 0.9, 3.3);
    chairSeat.castShadow = true;
    studyGroup.add(chairSeat);

    // Productivity Hub Desktop Node with tiny glowing OLED indicator (as in PDF: Temp 24.6°C, Hum 48%, CO2 612 ppm)
    const hubNode = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.25), new THREE.MeshStandardMaterial({ color: 0x09090b }));
    hubNode.position.set(3.7, 1.34, 2.3);
    const hubScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    hubScreen.position.set(3.7, 1.34, 2.43);
    studyGroup.add(hubNode, hubScreen);

    // Productivity Study mmWave Sensor on wall
    const studyRadar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.08), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    studyRadar.position.set(7.9, 1.8, 2.5);
    studyRadar.rotation.y = -Math.PI / 2;
    studyGroup.add(studyRadar);

    const studyRadarRing = new THREE.Mesh(radarRingGeo, radarRingMat);
    studyRadarRing.position.set(7.8, 1.8, 2.5);
    studyRadarRing.rotation.y = -Math.PI / 2;
    radarRingsRef.current.push(studyRadarRing);
    studyGroup.add(studyRadarRing);

    scene.add(studyGroup);
    roomMeshesRef.current.study = studyGroup;

    // ----------------------------------------------------
    // 3. MASTER BEDROOM (Zone: -3.5, 0, -3.5)
    // ----------------------------------------------------
    const bedGroup = new THREE.Group();
    bedGroup.name = 'bedroom';

    const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.05, 6.4), woodFloorMat);
    bedFloor.position.set(-3.5, 0.32, -3.5);
    bedFloor.receiveShadow = true;
    bedGroup.add(bedFloor);

    // King Size Floating Platform Bed
    const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 3.6), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 }));
    bedFrame.position.set(-3.5, 0.52, -3.5);
    bedFrame.castShadow = true;
    bedGroup.add(bedFrame);

    // Mattress & White Linen
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.35, 3.3), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }));
    mattress.position.set(-3.5, 0.88, -3.5);
    mattress.castShadow = true;
    bedGroup.add(mattress);

    // Pillows
    const pillow1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.6), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
    pillow1.position.set(-4.2, 1.1, -4.7);
    const pillow2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 0.6), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
    pillow2.position.set(-2.8, 1.1, -4.7);
    bedGroup.add(pillow1, pillow2);

    // In-ceiling indirect climate diffuser
    const diffuser = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 24), new THREE.MeshStandardMaterial({ color: 0x059669 }));
    diffuser.position.set(-3.5, 3.2, -3.5);
    bedGroup.add(diffuser);

    scene.add(bedGroup);
    roomMeshesRef.current.bedroom = bedGroup;

    // ----------------------------------------------------
    // 4. BALCONY & ECO SOLAR PERGOLA (Zone: 4.5, 0, -3.5)
    // ----------------------------------------------------
    const balconyGroup = new THREE.Group();
    balconyGroup.name = 'balcony';

    // Decking floor
    const balconyFloor = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.05, 6.4), new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.9 }));
    balconyFloor.position.set(4.5, 0.32, -3.5);
    balconyFloor.receiveShadow = true;
    balconyGroup.add(balconyFloor);

    // Glass railing perimeter
    const railGeo = new THREE.BoxGeometry(0.08, 1.1, 6.2);
    const rail1 = new THREE.Mesh(railGeo, glassMat);
    rail1.position.set(8.0, 0.9, -3.5);
    balconyGroup.add(rail1);

    const railBackGeo = new THREE.BoxGeometry(7.0, 1.1, 0.08);
    const rail2 = new THREE.Mesh(railBackGeo, glassMat);
    rail2.position.set(4.5, 0.9, -6.6);
    balconyGroup.add(rail2);

    // Planter pots with lush green plants
    const potGeo = new THREE.CylinderGeometry(0.4, 0.3, 0.6, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0x78716c });
    const pot1 = new THREE.Mesh(potGeo, potMat);
    pot1.position.set(7.2, 0.65, -5.8);
    const plant1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 }));
    plant1.position.set(7.2, 1.15, -5.8);
    balconyGroup.add(pot1, plant1);

    // Outdoor weather & solar ambient station node
    const weatherStation = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    weatherStation.position.set(7.5, 1.4, -1.2);
    balconyGroup.add(weatherStation);

    scene.add(balconyGroup);
    roomMeshesRef.current.balcony = balconyGroup;

    // ----------------------------------------------------
    // ARCHITECTURAL WALLS & CORRIDORS
    // ----------------------------------------------------
    // Exterior perimeter low wall dividers
    const wallLowGeo = new THREE.BoxGeometry(0.25, 2.8, 14.5);
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(16.5, 2.8, 0.25), wallMat);
    backWall.position.set(0.5, 1.7, -6.8);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(wallLowGeo, wallMat);
    leftWall.position.set(-7.1, 1.7, 0);
    leftWall.castShadow = true;
    scene.add(leftWall);

    // Center dividing wall with doorway cutouts
    const centerWallZ = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 13.5), wallMat);
    centerWallZ.position.set(0.5, 1.55, 0);
    scene.add(centerWallZ);

    const centerWallX = new THREE.Mesh(new THREE.BoxGeometry(14.5, 2.5, 0.2), wallMat);
    centerWallX.position.set(0.5, 1.55, -0.5);
    scene.add(centerWallX);

    // ----------------------------------------------------
    // AIRFLOW STREAM PARTICLES (Visualizing Smart AC)
    // ----------------------------------------------------
    const particleCount = 280;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: { x: number; y: number; z: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Start near living room AC unit (-6.6, 2.3, 2.5)
      particlePositions[i * 3] = -6.5 + (Math.random() - 0.5) * 0.3;
      particlePositions[i * 3 + 1] = 2.2 + (Math.random() - 0.5) * 0.3;
      particlePositions[i * 3 + 2] = 2.5 + (Math.random() - 0.5) * 0.8;

      particleVelocities.push({
        x: 0.05 + Math.random() * 0.04,
        y: (Math.random() - 0.5) * 0.015,
        z: (Math.random() - 0.5) * 0.03,
      });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.12,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    particleSystemRef.current = particles;

    // ----------------------------------------------------
    // INTERACTION (Mouse drag to orbit, Click to select room)
    // ----------------------------------------------------
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let spherical = new THREE.Spherical(22, Math.PI / 3.2, Math.PI / 4);

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      spherical.theta -= deltaX * 0.007;
      spherical.phi = Math.max(0.2, Math.min(Math.PI / 2.1, spherical.phi - deltaY * 0.007));

      targetCamPos.current.setFromSpherical(spherical).add(targetLookAt.current);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(8, Math.min(32, spherical.radius + e.deltaY * 0.02));
      targetCamPos.current.setFromSpherical(spherical).add(targetLookAt.current);
    };

    // Touch handlers for mobile devices
    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;

        spherical.theta -= deltaX * 0.007;
        spherical.phi = Math.max(0.2, Math.min(Math.PI / 2.1, spherical.phi - deltaY * 0.007));

        targetCamPos.current.setFromSpherical(spherical).add(targetLookAt.current);
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = touchStartDist - dist;
        spherical.radius = Math.max(8, Math.min(32, spherical.radius + diff * 0.04));
        targetCamPos.current.setFromSpherical(spherical).add(targetLookAt.current);
        touchStartDist = dist;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    // Raycaster for clicking rooms directly in 3D
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check intersections with room groups
      const clickableRooms = [
        { id: 'living', obj: livingGroup },
        { id: 'study', obj: studyGroup },
        { id: 'bedroom', obj: bedGroup },
        { id: 'balcony', obj: balconyGroup },
      ];

      for (const roomItem of clickableRooms) {
        const intersects = raycaster.intersectObjects(roomItem.obj.children, true);
        if (intersects.length > 0) {
          onSelectRoom(roomItem.id);
          break;
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    dom.addEventListener('click', onClick);

    // Resize listener
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ----------------------------------------------------
    // ANIMATION LOOP
    // ----------------------------------------------------
    let animationFrameId: number;
    let lastTime = performance.now();
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const elapsedTime = (now - startTime) / 1000;

      // Smooth camera interpolation
      camera.position.lerp(targetCamPos.current, 0.05);
      currentLookAt.current.lerp(targetLookAt.current, 0.05);
      camera.lookAt(currentLookAt.current);

      // Auto rotation if enabled
      if (isRotatingAuto) {
        spherical.theta += 0.004;
        targetCamPos.current.setFromSpherical(spherical).add(targetLookAt.current);
      }

      // Update radar wave rings
      radarRingsRef.current.forEach((ring, idx) => {
        const scale = 1 + ((elapsedTime * 1.5 + idx * 0.7) % 2.5);
        ring.scale.set(scale, scale, scale);
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, 0.7 - scale * 0.25);
      });

      // Update AC multi-blade louvers synchronized to SG90 servo
      [0, 1, 2].forEach((bladeIdx) => {
        const blade = acUnit.getObjectByName(`louver-blade-${bladeIdx}`) as THREE.Mesh;
        if (blade) {
          const targetAngleRad = THREE.MathUtils.degToRad(servoAngle);
          blade.rotation.x = THREE.MathUtils.lerp(blade.rotation.x, targetAngleRad, 0.1);
        }
      });

      // Animate ambient light pipe underneath Hall AC
      const ambientLight = acUnit.getObjectByName('ac-ambient-light') as THREE.Mesh;
      if (ambientLight) {
        const mat = ambientLight.material as THREE.MeshBasicMaterial;
        mat.opacity = acActive ? 0.75 + Math.sin(elapsedTime * 2.5) * 0.15 : 0.15;
      }

      // Update airflow particles
      if (particleSystemRef.current && showAirflowParticles) {
        const positions = particleSystemRef.current.geometry.attributes.position.array as Float32Array;
        const speedMultiplier = acActive ? 1.0 : 0.05;
        const currentAngleRad = THREE.MathUtils.degToRad(servoAngle);

        for (let i = 0; i < particleCount; i++) {
          const idx = i * 3;
          // Apply directional deflection based on servoAngle
          // 0° = straight downward, 45° = direct stream, 90° = ceiling deflect
          const pitch = THREE.MathUtils.mapLinear(servoAngle, 0, 90, -0.02, 0.03);

          positions[idx] += particleVelocities[i].x * speedMultiplier;
          positions[idx + 1] += (particleVelocities[i].y + pitch) * speedMultiplier;
          positions[idx + 2] += particleVelocities[i].z * speedMultiplier;

          // Reset particle if it travels too far across room
          if (positions[idx] > 1.5 || positions[idx + 1] < 0.4 || positions[idx + 1] > 3.2) {
            positions[idx] = -6.5 + (Math.random() - 0.5) * 0.3;
            positions[idx + 1] = 2.2 + (Math.random() - 0.5) * 0.3;
            positions[idx + 2] = 2.5 + (Math.random() - 0.5) * 0.8;
          }
        }
        particleSystemRef.current.geometry.attributes.position.needsUpdate = true;
        particleMaterial.opacity = acActive ? 0.75 : 0.08;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      dom.removeEventListener('click', onClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  // Update lighting mode & thermal heatmap dynamically
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (lightingMode === 'day') {
      scene.background = new THREE.Color('#f8fafc');
      if (scene.fog) scene.fog.color = new THREE.Color('#f8fafc');
    } else if (lightingMode === 'evening') {
      scene.background = new THREE.Color('#fed7aa');
      if (scene.fog) scene.fog.color = new THREE.Color('#fed7aa');
    } else if (lightingMode === 'night') {
      scene.background = new THREE.Color('#090d16');
      if (scene.fog) scene.fog.color = new THREE.Color('#090d16');
    } else if (lightingMode === 'thermal') {
      scene.background = new THREE.Color('#0f172a');
      if (scene.fog) scene.fog.color = new THREE.Color('#0f172a');
    }
  }, [lightingMode]);

  // Update particle visibility toggle
  useEffect(() => {
    if (particleSystemRef.current) {
      particleSystemRef.current.visible = showAirflowParticles;
    }
  }, [showAirflowParticles]);

  const resetView = () => {
    onSelectRoom('all');
  };

  return (
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[580px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing select-none" />

      {/* Fallback if WebGL is unavailable */}
      {!webglAvailable && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 p-8 text-center">
          <div className="max-w-md">
            <h4 className="text-base font-semibold text-slate-900 mb-2">3D Acceleration Notice</h4>
            <p className="text-sm text-slate-600 mb-4">
              WebGL context is initializing or suspended on this browser. Interactive telemetry and smart AC controls remain active below.
            </p>
          </div>
        </div>
      )}

      {/* Floating HUD: Room Navigator & 3D Interaction Control Zone */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 p-1 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-sm">
        <button
          onClick={() => onSelectRoom('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            selectedRoomId === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Villa
        </button>
        {rooms.map((room) => (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              selectedRoomId === room.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{room.name}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                room.occupancy ? 'bg-emerald-400' : 'bg-slate-300'
              }`}
            />
          </button>
        ))}

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        <button
          onClick={() => onSelectRoom('hall-ac')}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            selectedRoomId === 'hall-ac'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
          }`}
          title="Inspect architectural Hall AC unit up close"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hall AC View</span>
        </button>
      </div>

      {/* Top Right Floating HUD: Lighting & Environmental Mode Switcher */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 p-1 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-sm">
        <button
          onClick={() => setLightingMode('day')}
          title="Daylight Mode"
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            lightingMode === 'day' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setLightingMode('night')}
          title="Night Mode"
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            lightingMode === 'night' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setLightingMode('thermal')}
          title="Thermal Heatmap View"
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            lightingMode === 'thermal' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-0.5" />
        <button
          onClick={() => setShowAirflowParticles(!showAirflowParticles)}
          title="Toggle Airflow Simulation"
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            showAirflowParticles ? 'bg-sky-50 text-sky-700' : 'text-slate-400 hover:bg-slate-100'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setIsRotatingAuto(!isRotatingAuto)}
          title="Toggle 360° Auto Rotation"
          className={`p-1.5 rounded-lg text-xs transition-colors ${
            isRotatingAuto ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetView}
          title="Reset Camera View"
          className="p-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Floating Bar: Active 3D State Overlay with Realistic HVAC Metrics */}
      <div className="absolute bottom-4 inset-x-4 z-10 flex flex-wrap items-center justify-between gap-3 p-3 bg-white/92 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-sm text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>ESP32 Spatial Mesh</span>
          </div>
          <span className="hidden sm:inline text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <span>SG90 Servo:</span>
            <span className="font-mono font-bold text-slate-900 tabular-nums">{servoAngle}°</span>
          </div>
          <span className="hidden md:inline text-slate-300">|</span>
          <div className="hidden md:flex items-center gap-1">
            <span>Airflow:</span>
            <span className="font-mono font-semibold text-emerald-700 tabular-nums">
              {acActive ? '340 CFM' : '0 CFM (Standby)'}
            </span>
          </div>
          <span className="hidden lg:inline text-slate-300">|</span>
          <div className="hidden lg:flex items-center gap-1">
            <span>Compressor:</span>
            <span className="font-mono text-slate-800 tabular-nums">
              {acActive ? '48.2 Hz (Inverter)' : '0 Hz'}
            </span>
          </div>
          <span className="hidden xl:inline text-slate-300">|</span>
          <div className="hidden xl:flex items-center gap-1">
            <span>COP Efficiency:</span>
            <span className="font-mono text-emerald-700 font-semibold tabular-nums">4.21</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Drag to rotate 360° · Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
};
