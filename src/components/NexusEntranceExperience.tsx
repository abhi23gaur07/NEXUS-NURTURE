import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ArrowRight } from 'lucide-react';

interface NexusEntranceExperienceProps {
  onEnter: () => void;
  isOpen: boolean;
}

export const NexusEntranceExperience: React.FC<NexusEntranceExperienceProps> = ({
  onEnter,
  isOpen,
}) => {
  // Phase state: 'active' -> 'sliding' -> 'done'
  const [phase, setPhase] = useState<'active' | 'sliding' | 'done'>('active');

  // Canvas and Three.js references
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Orbit controls state
  const isDragging = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngle = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0.65,
    phi: 1.15,
    radius: 17.5,
  });
  const targetCameraAngle = useRef<{ theta: number; phi: number; radius: number }>({
    theta: 0.65,
    phi: 1.15,
    radius: 17.5,
  });
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 0));

  // Dynamic objects in scene
  const acLouversRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const radarWaveRef = useRef<THREE.Mesh | null>(null);
  const hearthLightRef = useRef<THREE.PointLight | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPhase('done');
      return;
    }
    setPhase('active');
  }, [isOpen]);

  // Handle Enter action (upward slide transition)
  const handleTriggerEnter = () => {
    if (phase === 'sliding' || phase === 'done') return;
    setPhase('sliding');
    setTimeout(() => {
      setPhase('done');
      onEnter();
    }, 1050); // Matches cubic-bezier slide duration
  };

  // Keyboard shortcut: Space or Enter to enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && (e.key === 'Enter' || e.key === ' ')) {
        handleTriggerEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, phase]);

  // Three.js Scene Setup: Atmospheric 3D Residence with Enhanced Visibility
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // A. Scene Setup with Open, Visible Twilight Atmosphere
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#1e293b'); // Medium dark slate (slate-800)
    scene.fog = new THREE.FogExp2('#1e293b', 0.008); // Very soft fog for maximum depth clarity

    const width = container.clientWidth;
    const height = container.clientHeight;

    // B. Camera Setup
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(12, 10, 14);
    cameraRef.current = camera;

    // C. WebGL Renderer with High-Precision Shadows & Boosted Exposure
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.75; // Rich illumination so everything is clearly visible
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // D. Rich, Balanced Lighting
    // 1. Ambient & Hemisphere Fill
    const ambientLight = new THREE.AmbientLight('#cbd5e1', 1.6);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#bfdbfe', '#475569', 1.3);
    scene.add(hemiLight);

    // 2. Clear Directional Sun/Window Light
    const sunLight = new THREE.DirectionalLight('#ffffff', 2.6);
    sunLight.position.set(14, 16, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 40;
    sunLight.shadow.camera.left = -12;
    sunLight.shadow.camera.right = 12;
    sunLight.shadow.camera.top = 12;
    sunLight.shadow.camera.bottom = -12;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // 3. Front/Camera Soft Fill Light (Ensures all front furniture is illuminated)
    const frontFill = new THREE.DirectionalLight('#f1f5f9', 1.4);
    frontFill.position.set(-5, 10, 14);
    scene.add(frontFill);

    // 4. Warm Architectural Ceiling Pendant Chandelier
    const warmChandelier = new THREE.PointLight('#fef08a', 3.4, 26);
    warmChandelier.position.set(0, 3.8, 0);
    scene.add(warmChandelier);

    // 5. Living Lounge Warm Table Lamp
    const loungeLamp = new THREE.PointLight('#fde047', 2.4, 16);
    loungeLamp.position.set(-2.2, 1.8, 0.2);
    scene.add(loungeLamp);

    // 6. Fireplace Hearth Warm Embers (Flickering PointLight)
    const hearthLight = new THREE.PointLight('#f97316', 3.6, 12);
    hearthLight.position.set(0, 0.8, -4.6);
    scene.add(hearthLight);
    hearthLightRef.current = hearthLight;

    // 7. Botanical Conservatory Accent Spotlight
    const plantSpot = new THREE.SpotLight('#10b981', 3.0, 20, Math.PI / 3.5, 0.4);
    plantSpot.position.set(3.8, 3.6, -4.5);
    plantSpot.target.position.set(3.8, 1.0, -4.5);
    scene.add(plantSpot);
    scene.add(plantSpot.target);

    // --- PROCEDURAL CHEVRON OAK PARQUET FLOOR (Clearly Visible Planks) ---
    const createVisibleHerringboneTexture = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#3f3f46'; // Medium smoked oak base
        ctx.fillRect(0, 0, 512, 512);

        const plankW = 32;
        const plankH = 128;
        ctx.lineWidth = 1;

        for (let y = -plankH; y < 512 + plankH; y += plankW * 2) {
          for (let x = -plankW; x < 512 + plankW; x += plankW * 2) {
            const shade = Math.floor(75 + Math.random() * 30);
            ctx.fillStyle = `rgb(${shade + 16}, ${shade + 10}, ${shade})`;
            ctx.fillRect(x, y, plankW, plankH);
            ctx.strokeStyle = '#2d2d34';
            ctx.strokeRect(x, y, plankW, plankH);

            // Fine wood grain lines
            ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.fillRect(x + 4, y, 2, plankH);
            ctx.fillRect(x + 12, y, 1, plankH);
          }
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(6, 6);
      return tex;
    };

    const floorTexture = createVisibleHerringboneTexture();
    const floorMaterial = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.26,
      metalness: 0.05,
    });

    // Floor Mesh (16m x 14m)
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 0.4, 14), floorMaterial);
    floorMesh.position.y = -0.2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Baseboards
    const baseboardMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.5 });
    const backBaseboard = new THREE.Mesh(new THREE.BoxGeometry(16, 0.28, 0.08), baseboardMat);
    backBaseboard.position.set(0, 0.14, -6.95);
    scene.add(backBaseboard);

    const leftBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 14), baseboardMat);
    leftBaseboard.position.set(-7.95, 0.14, 0);
    scene.add(leftBaseboard);

    // --- PARISIAN WALLS & MOULDING PANELS (Slate-700 Architecture) ---
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: '#334155', // Slate-700 visible plaster
      roughness: 0.8,
    });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(16, 4.8, 0.2), wallMaterial);
    backWall.position.set(0, 2.4, -7);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4.8, 14), wallMaterial);
    leftWall.position.set(-8, 2.4, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Raised Moulding Frames (Slate-600 trims catching light clearly)
    const mouldingMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.6 });
    const createWallPanelMoulding = (x: number, y: number, w: number, h: number) => {
      const group = new THREE.Group();
      const thickness = 0.04;
      const depth = 0.04;

      const hGeo = new THREE.BoxGeometry(w, thickness, depth);
      const topStrip = new THREE.Mesh(hGeo, mouldingMat);
      topStrip.position.set(0, h / 2, 0);
      const bottomStrip = new THREE.Mesh(hGeo, mouldingMat);
      bottomStrip.position.set(0, -h / 2, 0);

      const vGeo = new THREE.BoxGeometry(thickness, h, depth);
      const leftStrip = new THREE.Mesh(vGeo, mouldingMat);
      leftStrip.position.set(-w / 2, 0, 0);
      const rightStrip = new THREE.Mesh(vGeo, mouldingMat);
      rightStrip.position.set(w / 2, 0, 0);

      group.add(topStrip, bottomStrip, leftStrip, rightStrip);
      group.position.set(x, y, -6.88);
      return group;
    };

    scene.add(createWallPanelMoulding(-5.0, 2.6, 2.4, 2.8));
    scene.add(createWallPanelMoulding(5.0, 2.6, 2.4, 2.8));
    scene.add(createWallPanelMoulding(-5.0, 0.6, 2.4, 0.7));
    scene.add(createWallPanelMoulding(5.0, 0.6, 2.4, 0.7));

    // --- ARCHED FRENCH WINDOW ---
    const windowFrameMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.4,
      roughness: 0.35,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.35,
      roughness: 0.08,
      metalness: 0.2,
      clearcoat: 0.9,
    });

    const windowGroup = new THREE.Group();
    const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 3.8, 4.0), glassMat);
    glassMesh.position.set(0, 1.9, 0);
    windowGroup.add(glassMesh);

    const windowFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.0, 0.08), windowFrameMat);
    windowFrameL.position.set(0, 2.0, -2.0);
    const windowFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.0, 0.08), windowFrameMat);
    windowFrameR.position.set(0, 2.0, 2.0);
    const windowFrameT = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 4.08), windowFrameMat);
    windowFrameT.position.set(0, 4.0, 0);

    const mullionH1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 4.0), windowFrameMat);
    mullionH1.position.set(0, 1.3, 0);
    const mullionH2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 4.0), windowFrameMat);
    mullionH2.position.set(0, 2.6, 0);
    const mullionV1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.0, 0.05), windowFrameMat);
    mullionV1.position.set(0, 2.0, 0);

    windowGroup.add(windowFrameL, windowFrameR, windowFrameT, mullionH1, mullionH2, mullionV1);
    windowGroup.position.set(7.9, 0, 0);
    scene.add(windowGroup);

    // Garden Sky Backdrop
    const gardenBackdrop = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 8),
      new THREE.MeshBasicMaterial({ color: '#172554' })
    );
    gardenBackdrop.position.set(8.5, 3.0, 0);
    gardenBackdrop.rotation.y = -Math.PI / 2;
    scene.add(gardenBackdrop);

    // --- CARVED TRAVERTINE STONE FIREPLACE MANTEL ---
    const fireplaceGroup = new THREE.Group();
    const mantelStoneMat = new THREE.MeshStandardMaterial({
      color: '#44403c', // Warm stone
      roughness: 0.6,
    });
    const hearthSlab = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.12, 0.8), mantelStoneMat);
    hearthSlab.position.set(0, 0.06, 0.2);
    const mantelColL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, 0.4), mantelStoneMat);
    mantelColL.position.set(-1.1, 0.9, 0);
    const mantelColR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, 0.4), mantelStoneMat);
    mantelColR.position.set(1.1, 0.9, 0);
    const mantelShelf = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 0.55), mantelStoneMat);
    mantelShelf.position.set(0, 1.9, 0.08);

    const fireboxMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.9 });
    const firebox = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 0.2), fireboxMat);
    firebox.position.set(0, 0.8, -0.05);

    fireplaceGroup.add(hearthSlab, mantelColL, mantelColR, mantelShelf, firebox);
    fireplaceGroup.position.set(0, 0, -6.7);
    scene.add(fireplaceGroup);

    // Minimalist Framed Mirror above fireplace
    const mirrorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 2.2, 0.06),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.85, roughness: 0.25 })
    );
    mirrorFrame.position.set(0, 3.3, -6.82);
    const mirrorGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.0),
      new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.1, metalness: 0.85 })
    );
    mirrorGlass.position.set(0, 3.3, -6.78);
    scene.add(mirrorFrame, mirrorGlass);

    // --- CURVED BOUCLE DESIGNER SOFA (Clearly Visible Form & Cushions) ---
    const sofaGroup = new THREE.Group();
    const boucleMat = new THREE.MeshStandardMaterial({
      color: '#475569', // Slate-600 boucle
      roughness: 0.8,
    });

    const seatCenter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.42, 1.3), boucleMat);
    seatCenter.position.set(0, 0.25, 0);
    seatCenter.castShadow = true;
    seatCenter.receiveShadow = true;

    const seatWingL = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.42, 1.1), boucleMat);
    seatWingL.position.set(-1.6, 0.25, 0.2);
    seatWingL.rotation.y = 0.28;
    seatWingL.castShadow = true;

    const seatWingR = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.42, 1.1), boucleMat);
    seatWingR.position.set(1.6, 0.25, 0.2);
    seatWingR.rotation.y = -0.28;
    seatWingR.castShadow = true;

    const backRestCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.4, 16), boucleMat);
    backRestCenter.rotation.z = Math.PI / 2;
    backRestCenter.position.set(0, 0.72, -0.48);
    backRestCenter.castShadow = true;

    const backRestL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16), boucleMat);
    backRestL.rotation.z = Math.PI / 2;
    backRestL.rotation.y = 0.28;
    backRestL.position.set(-1.6, 0.72, -0.32);
    backRestL.castShadow = true;

    const backRestR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16), boucleMat);
    backRestR.rotation.z = Math.PI / 2;
    backRestR.rotation.y = -0.28;
    backRestR.position.set(1.6, 0.72, -0.32);
    backRestR.castShadow = true;

    sofaGroup.add(seatCenter, seatWingL, seatWingR, backRestCenter, backRestL, backRestR);
    sofaGroup.position.set(-2.0, 0, -1.8);
    scene.add(sofaGroup);

    // Sculptural Coffee Table (Smoked Walnut)
    const coffeeTableGroup = new THREE.Group();
    const darkOakMat = new THREE.MeshStandardMaterial({ color: '#57534e', roughness: 0.4 });
    const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 0.12, 32), darkOakMat);
    tableTop.position.set(0, 0.38, 0);
    tableTop.castShadow = true;
    const tableLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.38, 16), darkOakMat);
    tableLeg1.position.set(-0.5, 0.19, -0.3);
    const tableLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.38, 16), darkOakMat);
    tableLeg2.position.set(0.5, 0.19, -0.3);
    const tableLeg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.38, 16), darkOakMat);
    tableLeg3.position.set(0, 0.19, 0.5);

    coffeeTableGroup.add(tableTop, tableLeg1, tableLeg2, tableLeg3);
    coffeeTableGroup.position.set(-2.0, 0, 0.2);
    scene.add(coffeeTableGroup);

    // --- NERO MARQUINA BLACK MARBLE DINING TABLE & MODERN CHAIRS ---
    const diningGroup = new THREE.Group();
    const marbleMat = new THREE.MeshStandardMaterial({
      color: '#18181b',
      roughness: 0.15,
      metalness: 0.2,
    });
    const brassPedestalMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b', // Bright golden brass
      metalness: 0.85,
      roughness: 0.25,
    });

    const diningTop = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.08, 48), marbleMat);
    diningTop.position.set(0, 0.86, 0);
    diningTop.castShadow = true;
    diningTop.receiveShadow = true;

    const diningPedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 0.82, 32), brassPedestalMat);
    diningPedestal.position.set(0, 0.43, 0);
    diningPedestal.castShadow = true;

    diningGroup.add(diningTop, diningPedestal);

    const chairMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.65 });
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + 0.4;
      const chair = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 24), chairMat);
      seat.position.y = 0.5;
      const back = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.45, 16, 1, false, 0, Math.PI), chairMat);
      back.position.set(0, 0.72, -0.2);
      chair.add(seat, back);
      chair.position.set(Math.cos(angle) * 1.85, 0, Math.sin(angle) * 1.85);
      chair.lookAt(0, 0.5, 0);
      chair.castShadow = true;
      diningGroup.add(chair);
    }

    diningGroup.position.set(3.6, 0, 2.4);
    scene.add(diningGroup);

    // --- INDOOR BOTANICAL ATRIUM WITH ARCHITECTURAL CACTI ---
    const conservatoryGroup = new THREE.Group();
    const atriumGlass = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.4, 0.06), glassMat);
    atriumGlass.position.set(0, 2.2, 0);
    const atriumFrame = new THREE.Mesh(new THREE.BoxGeometry(3.7, 4.42, 0.08), windowFrameMat);
    atriumFrame.position.set(0, 2.2, 0);

    const planterBox = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.5, 1.2),
      new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 })
    );
    planterBox.position.set(0, 0.25, -0.8);
    planterBox.castShadow = true;

    const cactusMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.65 });
    const saguaro = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.1, 16), cactusMat);
    saguaro.position.set(-0.7, 1.5, -0.8);
    saguaro.castShadow = true;

    const saguaroArm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12), cactusMat);
    saguaroArm.position.set(-0.4, 1.8, -0.8);
    saguaroArm.rotation.z = -0.4;

    const barrelCactus = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), cactusMat);
    barrelCactus.position.set(0.6, 0.75, -0.7);
    barrelCactus.scale.set(1, 1.3, 1);
    barrelCactus.castShadow = true;

    const foliageMat = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.45 });
    const palmLeaf1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 1.0), foliageMat);
    palmLeaf1.position.set(0, 1.4, -0.9);
    palmLeaf1.rotation.set(0.4, 0.2, 0.3);

    const palmLeaf2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.9), foliageMat);
    palmLeaf2.position.set(0.1, 1.2, -0.7);
    palmLeaf2.rotation.set(-0.3, -0.4, -0.2);

    conservatoryGroup.add(
      atriumGlass,
      atriumFrame,
      planterBox,
      saguaro,
      saguaroArm,
      barrelCactus,
      palmLeaf1,
      palmLeaf2
    );
    conservatoryGroup.position.set(3.8, 0, -4.5);
    scene.add(conservatoryGroup);

    // --- SMART LIVING WALL AC WITH NEON CYAN LIGHT BAR ---
    const acUnitGroup = new THREE.Group();
    const acBodyMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.3,
      metalness: 0.1,
    });
    const acChassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.72, 0.45), acBodyMat);
    acChassis.castShadow = true;

    const ledStripMat = new THREE.MeshBasicMaterial({ color: '#06b6d4' });
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 0.02), ledStripMat);
    ledStrip.position.set(0, -0.15, 0.23);

    const louversGroup = new THREE.Group();
    const louverMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.4 });
    const louver1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 0.25), louverMat);
    louver1.position.set(0, -0.32, 0.1);
    const louver2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 0.25), louverMat);
    louver2.position.set(0, -0.38, 0.1);
    louversGroup.add(louver1, louver2);
    acLouversRef.current = louversGroup;

    acUnitGroup.add(acChassis, ledStrip, louversGroup);
    acUnitGroup.position.set(-5.5, 3.4, -6.7);
    scene.add(acUnitGroup);

    // --- LUMINOUS COOL AIRFLOW PARTICLES ---
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = -5.5 + (Math.random() - 0.5) * 2.0;
      positions[i * 3 + 1] = 3.2 - Math.random() * 2.5;
      positions[i * 3 + 2] = -6.4 + Math.random() * 6.5;

      colors[i * 3 + 0] = 0.05 + Math.random() * 0.1;
      colors[i * 3 + 1] = 0.75 + Math.random() * 0.25;
      colors[i * 3 + 2] = 0.95 + Math.random() * 0.05;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.11,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // --- CEILING MMWAVE RADAR OCCUPANCY SENSOR & WAVE RING ---
    const radarGroup = new THREE.Group();
    const sensorPuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.4 })
    );
    const sensorLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 12),
      new THREE.MeshBasicMaterial({ color: '#10b981' })
    );
    sensorLed.position.set(0, -0.05, 0);
    radarGroup.add(sensorPuck, sensorLed);
    radarGroup.position.set(-2.0, 4.3, -1.8);
    scene.add(radarGroup);

    const waveMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.45, 32),
      new THREE.MeshBasicMaterial({
        color: '#10b981',
        transparent: true,
        opacity: 0.5,
        wireframe: true,
      })
    );
    waveMesh.rotation.x = Math.PI / 2;
    waveMesh.position.set(-2.0, 4.25, -1.8);
    scene.add(waveMesh);
    radarWaveRef.current = waveMesh;

    // --- POINTER DRAG & ORBIT CONTROLS ---
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      previousMousePosition.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - previousMousePosition.current.x;
      const deltaY = clientY - previousMousePosition.current.y;

      targetCameraAngle.current.theta -= deltaX * 0.005;
      targetCameraAngle.current.phi = Math.max(
        0.3,
        Math.min(1.45, targetCameraAngle.current.phi - deltaY * 0.004)
      );

      previousMousePosition.current = { x: clientX, y: clientY };
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetCameraAngle.current.radius = Math.max(
        6.0,
        Math.min(26.0, targetCameraAngle.current.radius + e.deltaY * 0.015)
      );
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    domElement.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- ANIMATION LOOP (60 FPS) ---
    let animationFrameId: number;
    let lastTime = performance.now();
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      const time = (now - startTime) / 1000;

      // Auto gentle orbit rotation
      if (!isDragging.current) {
        targetCameraAngle.current.theta += delta * 0.06;
      }

      // Smooth camera interpolation (damping)
      cameraAngle.current.theta += (targetCameraAngle.current.theta - cameraAngle.current.theta) * 0.08;
      cameraAngle.current.phi += (targetCameraAngle.current.phi - cameraAngle.current.phi) * 0.08;
      cameraAngle.current.radius += (targetCameraAngle.current.radius - cameraAngle.current.radius) * 0.08;

      currentLookAt.current.lerp(targetLookAt.current, 0.08);

      const theta = cameraAngle.current.theta;
      const phi = cameraAngle.current.phi;
      const radius = cameraAngle.current.radius;

      camera.position.x = currentLookAt.current.x + radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = currentLookAt.current.y + radius * Math.cos(phi);
      camera.position.z = currentLookAt.current.z + radius * Math.sin(phi) * Math.cos(theta);
      camera.lookAt(currentLookAt.current);

      // Subtle Fireplace hearth flame flicker
      if (hearthLightRef.current) {
        hearthLightRef.current.intensity = 3.6 + Math.sin(time * 8) * 0.4 + (Math.random() - 0.5) * 0.2;
      }

      // Animate AC Louver oscillation
      if (acLouversRef.current) {
        acLouversRef.current.rotation.x = Math.sin(time * 1.5) * 0.15 + 0.35;
      }

      // Animate Cooling Airflow Particles
      if (particlesRef.current) {
        const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const array = posAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          array[i * 3 + 1] -= delta * 0.65;
          array[i * 3 + 2] += delta * 1.2;

          if (array[i * 3 + 2] > 5.0 || array[i * 3 + 1] < 0.2) {
            array[i * 3 + 0] = -5.5 + (Math.random() - 0.5) * 2.0;
            array[i * 3 + 1] = 3.2;
            array[i * 3 + 2] = -6.4;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Animate Radar Ring pulse expanding
      if (radarWaveRef.current) {
        const waveScale = ((time * 0.8) % 1) * 6.5;
        radarWaveRef.current.scale.set(waveScale, waveScale, waveScale);
        (radarWaveRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.5 - waveScale * 0.06);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      domElement.removeEventListener('mousedown', handlePointerDown);
      domElement.removeEventListener('touchstart', handlePointerDown);
      domElement.removeEventListener('wheel', handleWheel);

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div
      className={`fixed inset-0 w-full h-screen z-[100000] flex flex-col items-center justify-between overflow-hidden transition-transform duration-[1050ms] will-change-transform select-none bg-[#1e293b] ${
        phase === 'sliding' ? '-translate-y-full' : 'translate-y-0'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.76, 0, 0.24, 1)',
      }}
    >
      {/* 1. Fullscreen Interactive 3D Canvas Background */}
      <div 
        ref={mountRef} 
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
      />

      {/* Subtle Soft Vignette Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(circle at center, transparent 65%, rgba(15, 23, 42, 0.3) 100%)',
        }}
      />

      {/* Top spacer */}
      <div className="relative z-20 w-full pt-8" />

      {/* 2. Center Minimalist Branding: Clean 3D House & Refined Title */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 my-auto pointer-events-none">
        
        {/* Compact, Refined Title Size */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[0.3em] uppercase text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.4)] font-sans select-none">
          NEXUS NURTURE
        </h1>

        {/* Minimalist Enter Button */}
        <div className="mt-5 pointer-events-auto">
          <button
            onClick={handleTriggerEnter}
            className="group flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 hover:border-emerald-400 backdrop-blur-md text-white hover:text-emerald-300 text-xs font-mono tracking-widest uppercase transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-xl"
          >
            <span>Enter</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>

      {/* 3. Minimalist Bottom Hint */}
      <footer className="relative z-20 w-full px-6 pb-6 flex items-center justify-center pointer-events-none">
        <p className="text-[11px] font-mono tracking-widest text-slate-300/80 uppercase">
          Drag to rotate 360° · Scroll to zoom
        </p>
      </footer>
    </div>
  );
};
