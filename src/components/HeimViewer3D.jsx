import React, { useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Edges, Text, Billboard, PerspectiveCamera, OrthographicCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useForceStore, getUnitData, UNIT_COLORS, KATE_BOLTS } from '../store/forceStore';
import { calculateBoltForces } from '../utils/engineeringCalc';

const CrossBeamInteractive = ({ posVal, w, l, h, forceN, dir = 'x' }) => {
  const [hovered, setHover] = useState(false);
  
  const isX = dir === 'x';
  const posX = isX ? 0 : posVal;
  const posZ = isX ? posVal : 0;
  
  const args = isX ? [w - 0.15, 0.15, 0.075] : [0.075, 0.15, l - 0.15];
  const baseColor = isX ? "#ef4444" : "#22c55e"; // Red for X-axis spanning, Green for Z-axis spanning
  const hoverColor = isX ? "#f87171" : "#4ade80";
  const borderColor = isX ? "border-red-500/50" : "border-green-500/50";
  const textColor = isX ? "text-red-400" : "text-green-400";
  
  return (
    <mesh 
       position={[posX, h - 0.15/2, posZ]}
       onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
       onPointerOut={() => { setHover(false); document.body.style.cursor = 'default'; }}
    >
       <boxGeometry args={args} />
       <meshStandardMaterial color={hovered ? hoverColor : baseColor} />
       
       {hovered && (
         <Html position={[0, 0.2, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
            <div className={`bg-slate-900/95 text-white p-2.5 rounded-lg shadow-2xl text-[11px] w-48 flex flex-col gap-1.5 border ${borderColor}`}>
              <div className={`font-bold border-b border-slate-700 pb-1 ${textColor}`}>
                 Cross Beam {isX ? '(X-Axis)' : '(Z-Axis)'}
              </div>
              <div className="flex justify-between">
                 <span className="text-slate-400">Position:</span>
                 <span className="font-mono">{posVal.toFixed(2)}m</span>
              </div>
              <div className="flex justify-between font-bold">
                 <span className="text-slate-400">Strut Force:</span>
                 <span className="text-amber-400">{Math.round(forceN).toLocaleString()} N</span>
              </div>
            </div>
         </Html>
       )}
    </mesh>
  );
};

const TopTieInteractive = ({ tie, h, forceN }) => {
  const [hovered, setHover] = useState(false);
  const isZ = tie.dir === 'z';
  const args = isZ ? [0.08, hovered ? 0.03 : 0.02, 0.15] : [0.15, hovered ? 0.03 : 0.02, 0.08];
  
  return (
    <mesh 
       position={[tie.x, (tie.h || h) + 0.01 + (tie.yOffset || 0), tie.z]}
       onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
       onPointerOut={() => { setHover(false); document.body.style.cursor = 'default'; }}
    >
       <boxGeometry args={args} />
       <meshStandardMaterial color={hovered ? "#60a5fa" : "#2563eb"} metalness={0.5} roughness={0.4} />
       
       {hovered && (
         <Html position={[0, 0.2, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
            <div className="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-2xl text-[11px] w-48 flex flex-col gap-1.5 border border-blue-500/50">
              <div className="font-bold border-b border-slate-700 pb-1 text-blue-400">
                Top Tie Connection
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-slate-400">Transferred Shear</span>
                <span className="font-mono font-bold text-white">{Math.round(forceN).toLocaleString()} N</span>
              </div>
            </div>
         </Html>
       )}
    </mesh>
  );
};

const UnitFrame = ({ unit, allUnits, index, results }) => {
  const [hovered, setHover] = useState(false);
  const { w, l, h, x, z, angle = 0 } = unit;
  const position = [x, 0, z];
  const colW = 0.1;
  const bBeamH = 0.15;
  const bBeamW = 0.075;
  const tBeamH = 0.20;
  const tBeamW = 0.075;

  const zamColor = "#cbd5e1"; // Light silver ZAM steel (slate-300)
  const zamProps = { color: zamColor, metalness: 0.6, roughness: 0.3 };
  
  const unitColor = UNIT_COLORS[index % UNIT_COLORS.length];

  const px = w/2 - colW/2;
  const pz = l/2 - colW/2;
  const colY = h/2;

  // Dynamic Cross Beams (เหล็กรับแรง 75x150 สีแดง)
  const crossBeams = [];
  const topTies = [];
  const rad = angle * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  allUnits.forEach(other => {
    if (other.id === unit.id) return;
    
    const otherAngle = other.angle || 0;
    const otherEffW = (otherAngle === 90 || otherAngle === 270) ? other.l : other.w;
    const otherEffL = (otherAngle === 90 || otherAngle === 270) ? other.w : other.l;
    
    // Global vector from this unit to 'other' unit
    const dx = other.x - x;
    const dz = other.z - z;
    
    // Rotate vector to this unit's local coordinate space
    const localDx = dx * cos + dz * sin;
    const localDz = -dx * sin + dz * cos;

    const relativeAngle = Math.abs((angle || 0) - (otherAngle || 0)) % 180;
    const isPerp = relativeAngle === 90;
    
    // other's X-span in this unit's local space
    const otherMinX = localDx - otherEffW / 2;
    const otherMaxX = localDx + otherEffW / 2;
    const myMinX = -w / 2;
    const myMaxX = w / 2;

    // Check if they touch or overlap in X (with 50mm tolerance for gaps)
    const touchX = (otherMinX <= myMaxX + 0.05) && (otherMaxX >= myMinX - 0.05);

    if (touchX) {
        // Calculate other's Z-span in this unit's local space
        const sizeZ = isPerp ? other.w : other.l;
        const z1 = localDz - sizeZ / 2;
        const z2 = localDz + sizeZ / 2;
        
        const myMinZ = -l / 2;
        const myMaxZ = l / 2;
        const tol = 0.05; // 50mm tolerance to avoid rendering inside the outer frame

        if (z1 > myMinZ + tol && z1 < myMaxZ - tol) crossBeams.push({ pos: z1, dir: 'x' });
        if (z2 > myMinZ + tol && z2 < myMaxZ - tol) crossBeams.push({ pos: z2, dir: 'x' });
    }

    // Check if they touch or overlap in Z (End-to-End connection)
    const otherMinZ = localDz - otherEffL / 2;
    const otherMaxZ = localDz + otherEffL / 2;
    const myMinZ = -l / 2;
    const myMaxZ = l / 2;
    const touchZ = (otherMinZ <= myMaxZ + 0.05) && (otherMaxZ >= myMinZ - 0.05);

    if (touchZ) {
        const sizeX = isPerp ? other.l : other.w;
        const x1 = localDx - sizeX / 2;
        const x2 = localDx + sizeX / 2;
        
        const gapZ = Math.min(Math.abs(otherMinZ - myMaxZ), Math.abs(otherMaxZ - myMinZ));
        if (gapZ > 0.005 && gapZ < 0.02) {
            const overlapMin = Math.max(myMinX, x1);
            const overlapMax = Math.min(myMaxX, x2);
            
            if (overlapMax > overlapMin + 0.1) {
                // Put ties along the X overlap, just 2 near the edges
                if (unit.id < other.id) {
                    const signZ = localDz > 0 ? 1 : -1;
                    const plateZ = signZ * (l / 2 + gapZ / 2);
                    const offset = 0.2; // 20cm from edge
                    const t1X = overlapMin + offset;
                    const t2X = overlapMax - offset;
                    if (t1X < t2X) {
                        topTies.push({ x: t1X, z: plateZ, dir: 'z' });
                        topTies.push({ x: t2X, z: plateZ, dir: 'z' });
                    } else {
                        topTies.push({ x: (overlapMin + overlapMax)/2, z: plateZ, dir: 'z' });
                    }
                }
            }
        }
    }
  });

  // Convert unit rotation to radians for Three.js (Counter-clockwise around Y is positive)
  const groupRotation = [0, -rad, 0];

  // Rough estimation for sandbox: distribute half of lateral force to roof ties, half to base struts
  const totalLateralForceN = results?.totalLateralForceN || 0;
  const unitLateralForce = allUnits.length > 0 ? totalLateralForceN / allUnits.length : 0;
  const forcePerTie = topTies.length > 0 ? (unitLateralForce * 0.5) / topTies.length : 0;
  const forcePerBeam = crossBeams.length > 0 ? (unitLateralForce * 0.5) / crossBeams.length : 0;

  return (
    <group 
      position={position} 
      rotation={groupRotation}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'default'; }}
    >
      {hovered && (
        <Html position={[0, h + 0.3, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bg-slate-900/90 text-white px-3 py-1.5 rounded shadow-xl text-xs font-bold border border-slate-700 whitespace-nowrap">
            Unit {index + 1} ({unit.tsmaType} {unit.kateType})
          </div>
        </Html>
      )}
      {/* 4 Columns (เสา 100x100) */}
      <mesh position={[-px, colY, -pz]}><boxGeometry args={[colW, h, colW]}/><meshStandardMaterial {...zamProps}/></mesh>
      <mesh position={[px, colY, -pz]}><boxGeometry args={[colW, h, colW]}/><meshStandardMaterial {...zamProps}/></mesh>
      <mesh position={[-px, colY, pz]}><boxGeometry args={[colW, h, colW]}/><meshStandardMaterial {...zamProps}/></mesh>
      <mesh position={[px, colY, pz]}><boxGeometry args={[colW, h, colW]}/><meshStandardMaterial {...zamProps}/></mesh>
      
      {/* Base Beams (คานล่าง 75x150) */}
      <mesh position={[0, bBeamH/2, -l/2 + bBeamW/2]}><boxGeometry args={[w, bBeamH, bBeamW]}/><meshStandardMaterial {...zamProps}/></mesh>
      <mesh position={[0, bBeamH/2, l/2 - bBeamW/2]}><boxGeometry args={[w, bBeamH, bBeamW]}/><meshStandardMaterial {...zamProps}/></mesh>
      <mesh position={[-w/2 + bBeamW/2, bBeamH/2, 0]}><boxGeometry args={[bBeamW, bBeamH, l]}/><meshStandardMaterial {...zamProps}/></mesh>
      <mesh position={[w/2 - bBeamW/2, bBeamH/2, 0]}><boxGeometry args={[bBeamW, bBeamH, l]}/><meshStandardMaterial {...zamProps}/></mesh>

      {/* Top Beams (คานบน 75x200) */}
      <mesh position={[0, h - tBeamH/2, -l/2 + tBeamW/2]}><boxGeometry args={[w, tBeamH, tBeamW]}/><meshStandardMaterial {...zamProps}/></mesh>
      <mesh position={[0, h - tBeamH/2, l/2 - tBeamW/2]}><boxGeometry args={[w, tBeamH, tBeamW]}/><meshStandardMaterial {...zamProps}/></mesh>
      <mesh position={[-w/2 + tBeamW/2, h - tBeamH/2, 0]}><boxGeometry args={[tBeamW, tBeamH, l]}/><meshStandardMaterial {...zamProps}/></mesh>
      <mesh position={[w/2 - tBeamW/2, h - tBeamH/2, 0]}><boxGeometry args={[tBeamW, tBeamH, l]}/><meshStandardMaterial {...zamProps}/></mesh>
      {/* Unit Floor */}
      <mesh position={[0, -0.15/2, 0]}>
        <boxGeometry args={[w, 0.15, l]} />
        <meshStandardMaterial color="#475569" metalness={0.2} roughness={0.8} />
        <Edges scale={1} threshold={15} color="#1e293b" opacity={0.5} transparent />
      </mesh>
      
      {/* Dynamic Cross Beams (Interactive) */}
      {crossBeams.map((cb, i) => (
         <CrossBeamInteractive key={`cb-${i}`} posVal={cb.pos} w={w} l={l} h={h} forceN={forcePerBeam} dir={cb.dir} />
      ))}

      {/* Top Ties (Interactive) */}
      {topTies.map((tie, i) => (
         <TopTieInteractive key={`tie-${i}`} tie={tie} h={h} forceN={forcePerTie} />
      ))}

      {/* Translucent Glass Box (Tinted by Unit Index) */}
      <mesh position={[0, h/2, 0]}>
        <boxGeometry args={[w, h, l]} />
        <meshStandardMaterial color={unitColor} transparent opacity={0.2} />
        <Edges scale={1} threshold={15} color={unitColor} opacity={0.8} transparent />
      </mesh>
    </group>
  );
};

const Bolt = ({ boltData }) => {
  const [hovered, setHover] = useState(false);
  const color = boltData.isFailing ? '#ef4444' : '#22c55e'; // Red if fail, Green if pass

  return (
    <mesh 
      position={[boltData.x, 0.1, boltData.z]} 
      castShadow
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'default'; }}
    >
      <cylinderGeometry args={[hovered ? 0.15 : 0.08, hovered ? 0.15 : 0.08, 0.25, 16]} />
      <meshStandardMaterial color={hovered ? (boltData.isFailing ? '#f87171' : '#4ade80') : color} />
      
      {hovered && (
        <Html position={[0, 0.4, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bg-slate-900/95 text-white p-2.5 rounded-lg shadow-2xl text-[11px] w-40 flex flex-col gap-1.5 border border-slate-700">
            <div className="font-bold border-b border-slate-700 pb-1 flex justify-between items-center">
              <span>Bolt Joint</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] ${boltData.isFailing ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {boltData.isFailing ? 'FAIL' : 'SAFE'}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-slate-400">Tension</span>
              <span className="font-mono font-bold text-amber-400">{Math.round(boltData.netTensionN).toLocaleString()} N</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Shear</span>
              <span className="font-mono font-bold text-blue-400">{Math.round(boltData.shearN).toLocaleString()} N</span>
            </div>
          </div>
        </Html>
      )}
    </mesh>
  );
};

const CameraController = () => {
  const { cameraView, isOrthographic } = useForceStore();
  const controlsRef = useRef();

  // Determine target position based on view mode
  let pos = [10, 10, 10]; // Perfect architectural isometric angle
  if (cameraView === 'top') pos = [0, 15, 0.01];
  else if (cameraView === 'front') pos = [0, 2, 12];

  // Force orbit controls to reset target when view changes
  React.useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [cameraView]);

  return (
    <>
      {isOrthographic ? (
        <OrthographicCamera makeDefault position={pos} zoom={60} near={-100} far={100} />
      ) : (
        <PerspectiveCamera makeDefault position={pos} fov={45} near={0.1} far={1000} />
      )}
      <OrbitControls ref={controlsRef} makeDefault />
    </>
  );
};

const ForceArrow = ({ globalBox, totalForceN, windDirection }) => {
    if (!globalBox || totalForceN < 0.1) return null;
    
    const arrowLen = Math.min(totalForceN / 10000, 3); // Scale arrow length visually
    
    const cx = (globalBox.minX + globalBox.maxX) / 2;
    const cz = (globalBox.minZ + globalBox.maxZ) / 2;
    
    let pos = new THREE.Vector3(cx, globalBox.maxH / 2, globalBox.maxZ + arrowLen + 0.5);
    let dir = new THREE.Vector3(0, 0, -1);
    
    if (windDirection === '-Z') {
        pos = new THREE.Vector3(cx, globalBox.maxH / 2, globalBox.maxZ + arrowLen + 0.5);
        dir = new THREE.Vector3(0, 0, -1);
    } else if (windDirection === '+Z') {
        pos = new THREE.Vector3(cx, globalBox.maxH / 2, globalBox.minZ - arrowLen - 0.5);
        dir = new THREE.Vector3(0, 0, 1);
    } else if (windDirection === '-X') {
        pos = new THREE.Vector3(globalBox.maxX + arrowLen + 0.5, globalBox.maxH / 2, cz);
        dir = new THREE.Vector3(-1, 0, 0);
    } else if (windDirection === '+X') {
        pos = new THREE.Vector3(globalBox.minX - arrowLen - 0.5, globalBox.maxH / 2, cz);
        dir = new THREE.Vector3(1, 0, 0);
    }

    return (
        <group>
            <arrowHelper key={`${windDirection}-${arrowLen}`} args={[dir, pos, arrowLen, 0x3b82f6, 0.5, 0.3]} />
            <Billboard position={[pos.x, pos.y + 0.6, pos.z]}>
                <Text
                    fontSize={0.4}
                    color="#2563eb"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                    outlineColor="#ffffff"
                    fontWeight="bold"
                >
                    {`${(totalForceN / 1000).toFixed(1)} kN`}
                </Text>
            </Billboard>
        </group>
    );
};

const AxisGuide = () => {
  return (
    <group position={[0, 0.05, 0]}>
      {/* X Axis (Red - Left/Right) */}
      <mesh position={[0, 0, 0]}><boxGeometry args={[18, 0.02, 0.02]} /><meshBasicMaterial color="#ef4444" /></mesh>
      <Text position={[9.2, 0.2, 0]} color="#ef4444" fontSize={0.6} fontStyle="bold" anchorX="center" anchorY="middle">X</Text>
      
      {/* Z Axis (Green - Front/Back) */}
      <mesh position={[0, 0, 0]}><boxGeometry args={[0.02, 0.02, 18]} /><meshBasicMaterial color="#22c55e" /></mesh>
      <Text position={[0, 0.2, 9.2]} color="#22c55e" fontSize={0.6} fontStyle="bold" anchorX="center" anchorY="middle">Z</Text>
      
      {/* Y Axis (Blue - Up/Down) */}
      <mesh position={[0, 4, 0]}><boxGeometry args={[0.02, 8, 0.02]} /><meshBasicMaterial color="#3b82f6" /></mesh>
      <Text position={[0, 8.3, 0]} color="#3b82f6" fontSize={0.6} fontStyle="bold" anchorX="center" anchorY="middle">Y</Text>
    </group>
  );
};

export const Scene = () => {
  const {
    placedUnits,
    windPressure,
    windDirection,
    windUplift,
    seismicCoeff,
    liveLoad,
    boltCapacityN
  } = useForceStore();

  const results = React.useMemo(() => {
    if (placedUnits.length === 0) return { bolts: [], globalBox: null, totalLateralForceN: 0 };
    return calculateBoltForces(
      placedUnits, 
      getUnitData,
      { windPressure, windDirection, seismicCoeff, liveLoad, windUplift }, 
      boltCapacityN
    );
  }, [placedUnits, windPressure, windDirection, windUplift, seismicCoeff, liveLoad, boltCapacityN]);

  const isAnyBoltFailing = results.bolts && results.bolts.some(b => b.isFailing);

    // Auto-size ground and grid based on placed units
    let cx = 0, cz = 0;
    let floorSize = 18;
    let floorDivisions = 80;

    if (results.globalBox && placedUnits.length > 0) {
        const box = results.globalBox;
        const w = box.maxX - box.minX;
        const l = box.maxZ - box.minZ;
        
        // Increase padding significantly so units don't look like they are falling off the edge
        const maxDim = Math.max(w, l) + 16; // Add 16 meters padding (8m each side)
        
        const segmentsPair = Math.ceil(maxDim / 0.45);
        floorDivisions = segmentsPair * 2;
        floorSize = floorDivisions * 0.225;
        
        const exactCx = (box.minX + box.maxX) / 2;
        const exactCz = (box.minZ + box.maxZ) / 2;
        
        // Snap center to the nearest 0.225 grid intersection to prevent grid lines from shifting
        cx = Math.round(exactCx / 0.225) * 0.225;
        cz = Math.round(exactCz / 0.225) * 0.225;
        
        if (floorSize < 18) {
            floorSize = 18;
            floorDivisions = 80;
            cx = 0;
            cz = 0;
        }
    }

    return (
      <group>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1} castShadow shadow-mapSize={[2048, 2048]} />
        
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.1, cz]} receiveShadow>
          <planeGeometry args={[floorSize, floorSize]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>

        {/* Grid: Auto-sized and perfectly aligned to 0.225m snap increments */}
        <gridHelper args={[floorSize, floorDivisions, 0x888888, 0xcccccc]} position={[cx, -0.09, cz]} />
      
      {/* Visual Axes */}
      <AxisGuide />

      {placedUnits.map((u, index) => {
        const fullUnit = { ...u, ...getUnitData(u.tsmaType, u.kateType) };
        const allFullUnits = placedUnits.map(pu => ({ ...pu, ...getUnitData(pu.tsmaType, pu.kateType) }));
        
        return (
          <UnitFrame 
            key={u.id} 
            unit={fullUnit} 
            allUnits={allFullUnits}
            index={index}
            results={results}
          />
        );
      })}
      
      {results.bolts && results.bolts.map((b) => (
        <Bolt key={b.id} boltData={b} />
      ))}
      
      {results.boltTies && results.boltTies.map((tie) => (
        <TopTieInteractive key={tie.id} tie={tie} forceN={results.estimatedTieForceN || 0} />
      ))}

      <ForceArrow globalBox={results.globalBox} totalForceN={results.totalLateralForceN} windDirection={windDirection} />
    </group>
  );
};

export default function HeimViewer3D() {
  const { cameraView, setCameraView, isOrthographic, setOrthographic } = useForceStore();

  return (
    <div className="w-full h-full min-h-[500px] bg-slate-900 rounded-lg overflow-hidden shadow-inner relative">
      <Canvas shadows>
        <CameraController />
        <Scene />
      </Canvas>

      {/* Floating View Controls */}
      <div className="absolute top-4 right-4 bg-slate-800/80 p-1 rounded-lg flex gap-1 shadow-lg border border-slate-600">
        <button 
          onClick={() => setCameraView('iso')}
          className={`px-3 py-1.5 text-xs font-medium rounded ${cameraView === 'iso' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          ISO
        </button>
        <button 
          onClick={() => setCameraView('top')}
          className={`px-3 py-1.5 text-xs font-medium rounded ${cameraView === 'top' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          TOP
        </button>
        <button 
          onClick={() => setCameraView('front')}
          className={`px-3 py-1.5 text-xs font-medium rounded ${cameraView === 'front' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          FRONT
        </button>
        <div className="w-px h-6 bg-slate-600 self-center mx-1"></div>
        <button 
          onClick={() => setOrthographic(!isOrthographic)}
          className={`px-3 py-1.5 text-xs font-medium rounded ${isOrthographic ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          title="Toggle Parallel Projection"
        >
          {isOrthographic ? '2D (Parallel)' : '3D (Persp)'}
        </button>
      </div>
    </div>
  );
}
