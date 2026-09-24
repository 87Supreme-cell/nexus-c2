'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ShieldCheck, Compass, Radio, Activity, Sparkles } from 'lucide-react';

interface TacticalHoloSphereProps {
  airgapStrict?: boolean;
  totalModels?: number;
  activeAccounts?: number;
}

export const TacticalHoloSphere: React.FC<TacticalHoloSphereProps> = ({
  airgapStrict = true,
  totalModels = 4,
  activeAccounts = 2,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [telemetry, setTelemetry] = useState({
    azimuth: 247.4,
    elevation: 42.1,
    nodesLocked: 6,
    signalStrength: 99.8,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 300;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 240;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for entire rotating tactical assembly
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Inner Tactical Wireframe Globe
    const globeGeo = new THREE.SphereGeometry(65, 24, 24);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    rootGroup.add(globeMesh);

    // 2. High-Density Core Sphere (Faint Glow)
    const coreGeo = new THREE.SphereGeometry(58, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x0d2238,
      transparent: true,
      opacity: 0.65,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    rootGroup.add(coreMesh);

    // 3. Latitude & Longitude Accent Rings
    const ringGeo = new THREE.RingGeometry(64.5, 65.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const equator = new THREE.Mesh(ringGeo, ringMat);
    equator.rotation.x = Math.PI / 2;
    rootGroup.add(equator);

    // 4. Orbital Tactical Tilted Rings
    const orbit1Geo = new THREE.TorusGeometry(82, 0.6, 8, 80);
    const orbit1Mat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.5,
    });
    const orbit1 = new THREE.Mesh(orbit1Geo, orbit1Mat);
    orbit1.rotation.x = 1.1;
    orbit1.rotation.y = 0.4;
    rootGroup.add(orbit1);

    const orbit2Geo = new THREE.TorusGeometry(95, 0.5, 8, 80);
    const orbit2Mat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.4,
    });
    const orbit2 = new THREE.Mesh(orbit2Geo, orbit2Mat);
    orbit2.rotation.x = -0.7;
    orbit2.rotation.z = 0.8;
    rootGroup.add(orbit2);

    // 5. Tactical Satellites / Nodes (Particles on orbits)
    const particleCount = 48;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const theta = (i / particleCount) * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      const rad = 65 + (Math.random() * 20);

      particlePos[i * 3] = rad * Math.cos(phi) * Math.cos(theta);
      particlePos[i * 3 + 1] = rad * Math.sin(phi);
      particlePos[i * 3 + 2] = rad * Math.cos(phi) * Math.sin(theta);
      particleSizes[i] = Math.random() * 3 + 2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x00f3ff,
      size: 2.5,
      transparent: true,
      opacity: 0.85,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    rootGroup.add(particleSystem);

    // 6. CAANG / DoD Landmark Marker (34.1° N, 119.1° W)
    const markerGeo = new THREE.SphereGeometry(3.5, 8, 8);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const caangMarker = new THREE.Mesh(markerGeo, markerMat);
    // Spherical to Cartesian coords on globe surface
    const caangLat = (34.1 * Math.PI) / 180;
    const caangLon = (-119.1 * Math.PI) / 180;
    caangMarker.position.x = 65 * Math.cos(caangLat) * Math.sin(caangLon);
    caangMarker.position.y = 65 * Math.sin(caangLat);
    caangMarker.position.z = 65 * Math.cos(caangLat) * Math.cos(caangLon);
    rootGroup.add(caangMarker);

    // Mouse Interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      rootGroup.rotation.y += deltaX * 0.008;
      rootGroup.rotation.x += deltaY * 0.008;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let reqId: number;
    let angle = 0;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      angle += 0.008;

      if (!isDragging) {
        rootGroup.rotation.y += 0.0035;
        rootGroup.rotation.x = Math.sin(angle * 0.4) * 0.12;
      }

      orbit1.rotation.z += 0.006;
      orbit2.rotation.y -= 0.005;
      particleSystem.rotation.y += 0.002;

      // Pulse marker scale
      const pulse = 1 + Math.sin(angle * 3) * 0.35;
      caangMarker.scale.set(pulse, pulse, pulse);

      renderer.render(scene, camera);
    };

    animate();

    // Telemetry ticker
    const telemetryInterval = setInterval(() => {
      setTelemetry((prev) => ({
        azimuth: Number((prev.azimuth + (Math.random() - 0.5) * 0.8).toFixed(1)),
        elevation: Number((prev.elevation + (Math.random() - 0.5) * 0.4).toFixed(1)),
        nodesLocked: totalModels + activeAccounts,
        signalStrength: Number((99.5 + Math.random() * 0.5).toFixed(1)),
      }));
    }, 2000);

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      clearInterval(telemetryInterval);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [totalModels, activeAccounts]);

  return (
    <div className="relative w-full h-[320px] rounded-2xl bg-gradient-to-b from-c2-surface/90 via-c2-bg to-c2-bg border border-c2-border/80 overflow-hidden shadow-2xl flex flex-col justify-between group">
      {/* Top Hologram Status HUD */}
      <div className="relative z-10 p-3.5 flex items-center justify-between font-mono text-[11px] border-b border-c2-border/60 bg-c2-bg/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-c2-cyan animate-pulse shadow-cyan-glow" />
          <span className="font-bold text-white tracking-widest uppercase">
            ORBITAL DEFENSE TELEMETRY &bull; 3D C2
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-c2-cyan/15 text-c2-cyan border border-c2-cyan/30 hidden sm:inline">
            CAANG 146TH AIRLIFT WING
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-c2-green font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-c2-green" /> ZERO-TRUST AIRGAP
          </span>
          <span className="text-c2-textMuted hidden md:inline">|</span>
          <span className="text-c2-textMuted font-mono hidden md:inline">
            AZ: <span className="text-white">{telemetry.azimuth}°</span> EL:{' '}
            <span className="text-white">{telemetry.elevation}°</span>
          </span>
        </div>
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        title="Interactive 3D Tactical HoloSphere - Click and drag to rotate"
      />

      {/* Floating Tactical Overlay Crosshairs & Corner Brackets */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4">
        {/* Top-left coordinate readouts */}
        <div className="font-mono text-[10px] text-c2-textMuted space-y-0.5 bg-c2-bg/70 backdrop-blur-sm p-2 rounded-lg border border-c2-border/50 max-w-[190px]">
          <div className="text-c2-cyan font-bold flex items-center gap-1">
            <Radio className="w-3 h-3 text-c2-cyan animate-spin" style={{ animationDuration: '4s' }} />
            NODE: CHANNEL ISLANDS ANGS
          </div>
          <div>LAT: 34° 08&apos; 00&quot; N</div>
          <div>LON: 119° 05&apos; 00&quot; W</div>
          <div className="text-c2-green">DEFCON LEVEL: 3 (ROUND HOUSE)</div>
        </div>

        {/* Bottom HUD details */}
        <div className="flex items-end justify-between font-mono text-[10px] text-c2-textMuted">
          <div className="bg-c2-bg/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-c2-border/50">
            <span>SOCKET: </span>
            <span className="text-white font-bold">127.0.0.1:3030 [STRICT LOOPBACK]</span>
          </div>

          <div className="bg-c2-bg/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-c2-border/50 flex items-center gap-2">
            <span>NODES: <strong className="text-c2-cyan">{telemetry.nodesLocked} ACTIVE</strong></span>
            <span>&bull;</span>
            <span>LINK: <strong className="text-c2-green">{telemetry.signalStrength}%</strong></span>
          </div>
        </div>
      </div>

      {/* Bottom Hint Banner */}
      <div className="relative z-10 px-3 py-1 bg-c2-bg/80 border-t border-c2-border/50 text-[10px] font-mono text-c2-textMuted flex items-center justify-between">
        <span className="flex items-center gap-1 text-c2-textMuted">
          <Sparkles className="w-3 h-3 text-c2-cyan" />
          Click &amp; drag sphere to inspect orbital vector
        </span>
        <span className="text-[9px] text-c2-cyan font-bold tracking-wider">
          TACTICAL REAL-TIME ENGINE
        </span>
      </div>
    </div>
  );
};
