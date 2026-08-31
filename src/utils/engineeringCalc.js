export const GRAVITY = 9.81;

/**
 * คำนวณตำแหน่ง Bolt ที่กระจายตามแนวขอบคาน
 * @param {number} w Width (X axis length)
 * @param {number} l Length (Z axis length)
 * @param {number} spacing ระยะห่างระหว่าง Bolt (เมตร)
 */
// calculateBoltPositions removed, logic moved inline to calculateBoltForces
import { KATE_BOLTS } from '../store/forceStore';

export const calculateBoltForces = (units, getUnitDataFn, forces, boltCapacityN = 50000) => {
  const { windPressure, seismicCoeff, liveLoad, windUplift, windDirection = '-Z' } = forces;
  
  let totalMassKg = 0;
  let totalFloorArea = 0;
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  let maxH = 0;

  let allBolts = [];

  units.forEach(u => {
      const { w, l, h, massKg } = getUnitDataFn(u.tsmaType, u.kateType);
      const angle = u.angle || 0;
      const effW = (angle === 90 || angle === 270) ? l : w;
      const effL = (angle === 90 || angle === 270) ? w : l;

      totalMassKg += massKg;
      totalFloorArea += (w * l);
      maxH = Math.max(maxH, h);

      const left = u.x - effW/2;
      const right = u.x + effW/2;
      const front = u.z - effL/2;
      const back = u.z + effL/2;

      minX = Math.min(minX, left);
      maxX = Math.max(maxX, right);
      minZ = Math.min(minZ, front);
      maxZ = Math.max(maxZ, back);
  });

  // Calculate bolts globally
  for (const u of units) {
      const { w, l, h } = getUnitDataFn(u.tsmaType, u.kateType);
      const angle = u.angle || 0;
      const numBoltsPerSide = KATE_BOLTS[u.kateType] || 2; // Default to 2 per side (4 total) if not found
      
      const startX = -w / 2;
      const endX = w / 2;
      
      // ถอยจากหัวเสา 219.5mm (0.2195m) ทั้ง 2 ด้าน
      const boltOffsetZ = 0.2195;
      const startZ = (-l / 2) + boltOffsetZ;
      const endZ = (l / 2) - boltOffsetZ;
      
      const spanZ = endZ - startZ;
      const spacing = (numBoltsPerSide > 1) ? spanZ / (numBoltsPerSide - 1) : 0;

      for (let localX of [startX, endX]) {
        for (let i = 0; i < numBoltsPerSide; i++) {
          const localZ = startZ + (i * spacing);
          
          let rX = localX, rZ = localZ;
          if (angle === 90) { rX = localZ; rZ = -localX; }
          else if (angle === 180) { rX = -localX; rZ = -localZ; }
          else if (angle === 270) { rX = -localZ; rZ = localX; }

          allBolts.push({ 
            id: `bolt-${(rX+u.x).toFixed(3)}-${(rZ+u.z).toFixed(3)}`, 
            x: rX + u.x, 
            z: rZ + u.z, 
            h: h
          });
        }
      }
  }

  let uniqueBolts = [];
  const map = new Set();
  for (const b of allBolts) {
      const key = `${b.x.toFixed(3)},${b.z.toFixed(3)}`;
      if (!map.has(key)) {
          map.add(key);
          uniqueBolts.push(b);
      }
  }
  
  // Merge bolts that are very close (<= 0.46m apart, such as the 450mm KATE gap)
  let mergedBolts = [];
  for (const b of uniqueBolts) {
      let found = false;
      for (const mb of mergedBolts) {
          const dist = Math.sqrt(Math.pow(b.x - mb.x, 2) + Math.pow(b.z - mb.z, 2));
          if (dist <= 0.46) {
              mb.x = (mb.x + b.x) / 2;
              mb.z = (mb.z + b.z) / 2;
              found = true;
              break;
          }
      }
      if (!found) {
          mergedBolts.push({ ...b });
      }
  }
  uniqueBolts = mergedBolts;
  
  const boltTies = [];

  const bolts = uniqueBolts;

  // Gravity Loads
  const deadLoadN = totalMassKg * GRAVITY;
  const liveLoadN = (liveLoad * totalFloorArea) * GRAVITY;
  const totalGravityN = deadLoadN + liveLoadN;
  
  // Lateral Loads (Projected Area based on Wind Direction)
  const projectedWidthX = (maxX === -Infinity) ? 0 : (maxX - minX);
  const projectedWidthZ = (maxZ === -Infinity) ? 0 : (maxZ - minZ);
  
  const isWindZ = windDirection.includes('Z');
  const areaW = isWindZ ? (projectedWidthX * maxH) : (projectedWidthZ * maxH);
  const windForceN = windPressure * areaW; 
  
  // Seismic
  const seismicForceN = seismicCoeff * totalGravityN;
  const totalLateralForceN = windForceN + seismicForceN;
  const overturningMomentNm = totalLateralForceN * (maxH / 2);

  // Uplift Load
  const upliftForceN = windUplift * totalFloorArea;
  const netDownwardForceN = totalGravityN - upliftForceN;

  const numBolts = bolts.length;
  const shearPerBoltN = numBolts > 0 ? totalLateralForceN / numBolts : 0;
  const gravityPerBoltN = numBolts > 0 ? netDownwardForceN / numBolts : 0;

  // Center of Rigidity (X, Z)
  let cgX = 0, cgZ = 0;
  if (numBolts > 0) {
      cgX = bolts.reduce((sum, b) => sum + b.x, 0) / numBolts;
      cgZ = bolts.reduce((sum, b) => sum + b.z, 0) / numBolts;
  }

  let sumX2 = 0, sumZ2 = 0;
  bolts.forEach(b => {
    const dx = b.x - cgX;
    const dz = b.z - cgZ;
    sumX2 += (dx * dx);
    sumZ2 += (dz * dz);
  });

  const boltsWithForces = bolts.map(b => {
    const dx = b.x - cgX;
    const dz = b.z - cgZ;
    let overturningTensionN = 0;

    if (windDirection === '-Z') {
        // Wind pushes from +Z to -Z. Tipping edge is -Z. Lifts +Z side.
        overturningTensionN = sumZ2 > 0 ? (overturningMomentNm * dz) / sumZ2 : 0;
    } else if (windDirection === '+Z') {
        // Wind pushes from -Z to +Z. Tipping edge is +Z. Lifts -Z side.
        overturningTensionN = sumZ2 > 0 ? (overturningMomentNm * -dz) / sumZ2 : 0;
    } else if (windDirection === '-X') {
        // Wind pushes from +X to -X. Tipping edge is -X. Lifts +X side.
        overturningTensionN = sumX2 > 0 ? (overturningMomentNm * dx) / sumX2 : 0;
    } else if (windDirection === '+X') {
        // Wind pushes from -X to +X. Tipping edge is +X. Lifts -X side.
        overturningTensionN = sumX2 > 0 ? (overturningMomentNm * -dx) / sumX2 : 0;
    }

    const netTensionN = overturningTensionN - gravityPerBoltN;
    const isFailing = netTensionN > boltCapacityN || shearPerBoltN > boltCapacityN;
    
    return {
      ...b,
      shearN: shearPerBoltN,
      tensionN: netTensionN > 0 ? netTensionN : 0, 
      netTensionN: netTensionN,
      isFailing
    };
  });

  // Calculate exact structural connections (Top Ties and Cross Beams)
  let structuralConnections = { ties: 0, struts: 0 };
  const strutsPerUnit = units.map(() => new Set());
  
  for (let i = 0; i < units.length; i++) {
      for (let j = i + 1; j < units.length; j++) {
          const u1 = units[i];
          const u2 = units[j];
          
          const d1 = getUnitDataFn(u1.tsmaType, u1.kateType);
          const d2 = getUnitDataFn(u2.tsmaType, u2.kateType);
          
          const a1 = u1.angle || 0;
          const a2 = u2.angle || 0;
          
          const w1 = (a1 === 90 || a1 === 270) ? d1.l : d1.w;
          const l1 = (a1 === 90 || a1 === 270) ? d1.w : d1.l;
          const w2 = (a2 === 90 || a2 === 270) ? d2.l : d2.w;
          const l2 = (a2 === 90 || a2 === 270) ? d2.w : d2.l;
          
          // X-axis check (Side-by-side gap)
          const gapX = Math.max(0, Math.max(u1.x - w1/2, u2.x - w2/2) - Math.min(u1.x + w1/2, u2.x + w2/2));
          // Z-axis overlap
          const overlapZMin = Math.max(u1.z - l1/2, u2.z - l2/2);
          const overlapZMax = Math.min(u1.z + l1/2, u2.z + l2/2);
          const overlapZ = overlapZMax - overlapZMin;
          
          if (gapX > 0.005 && gapX < 0.05 && overlapZ > 0.1) {
              // They touch in X-axis (side-by-side)
              // A strut (Cross Beam) is only needed if a unit's corner terminates mid-span of the adjacent unit.
              const tol = 0.05;
              const formatZ = (val) => val.toFixed(3);
              
              // Corners of u2 landing in u1
              if ((u2.z - l2/2) > (u1.z - l1/2) + tol && (u2.z - l2/2) < (u1.z + l1/2) - tol) strutsPerUnit[i].add(formatZ(u2.z - l2/2));
              if ((u2.z + l2/2) > (u1.z - l1/2) + tol && (u2.z + l2/2) < (u1.z + l1/2) - tol) strutsPerUnit[i].add(formatZ(u2.z + l2/2));
              
              // Corners of u1 landing in u2
              if ((u1.z - l1/2) > (u2.z - l2/2) + tol && (u1.z - l1/2) < (u2.z + l2/2) - tol) strutsPerUnit[j].add(formatZ(u1.z - l1/2));
              if ((u1.z + l1/2) > (u2.z - l2/2) + tol && (u1.z + l1/2) < (u2.z + l2/2) - tol) strutsPerUnit[j].add(formatZ(u1.z + l1/2));
              
              // Add Top Ties based on Bolt Positions within the overlap
              const midX = (Math.max(u1.x - w1/2, u2.x - w2/2) + Math.min(u1.x + w1/2, u2.x + w2/2)) / 2;
              
              // Find all bolts from uniqueBolts that are near midX and within overlapZ
              const validBolts = uniqueBolts.filter(b => 
                  Math.abs(b.x - midX) < 0.1 && 
                  b.z >= overlapZMin - 0.05 && 
                  b.z <= overlapZMax + 0.05
              );
              
              // Group by Z to avoid duplicates
              validBolts.forEach(b => {
                  let exists = false;
                  for (const tie of boltTies) {
                      if (tie.dir === 'x' && Math.abs(tie.x - midX) < 0.05 && Math.abs(tie.z - b.z) < 0.05) {
                          exists = true;
                          break;
                      }
                  }
                  if (!exists) {
                      boltTies.push({ id: `tie-${midX.toFixed(3)}-${b.z.toFixed(3)}`, x: midX, z: b.z, dir: 'x', h: Math.max(d1.h, d2.h) });
                  }
              });
          }
          
          // Z-axis check (End-to-End gap)
          const gapZ = Math.max(0, Math.max(u1.z - l1/2, u2.z - l2/2) - Math.min(u1.z + l1/2, u2.z + l2/2));
          // X-axis overlap
          const overlapXMin = Math.max(u1.x - w1/2, u2.x - w2/2);
          const overlapXMax = Math.min(u1.x + w1/2, u2.x + w2/2);
          const overlapX = overlapXMax - overlapXMin;
          
          if (gapZ > 0.005 && gapZ < 0.05 && overlapX > 0.1) {
              // They touch in Z-axis
              // End-to-end only has ties, no struts
              const midZ = (Math.max(u1.z - l1/2, u2.z - l2/2) + Math.min(u1.z + l1/2, u2.z + l2/2)) / 2;
                
              if (overlapXMin < overlapXMax - 0.3) {
                  const tx1 = overlapXMin + 0.05;
                  const tx2 = overlapXMax - 0.05;
                  boltTies.push({ id: `tie-${tx1.toFixed(3)}-${midZ.toFixed(3)}`, x: tx1, z: midZ, dir: 'z', h: Math.max(d1.h, d2.h) });
                  boltTies.push({ id: `tie-${tx2.toFixed(3)}-${midZ.toFixed(3)}`, x: tx2, z: midZ, dir: 'z', h: Math.max(d1.h, d2.h) });
              } else {
                  const tx = (overlapXMin + overlapXMax) / 2;
                  boltTies.push({ id: `tie-${tx.toFixed(3)}-${midZ.toFixed(3)}`, x: tx, z: midZ, dir: 'z', h: Math.max(d1.h, d2.h) });
              }
          }
      }
  }

  structuralConnections.struts = strutsPerUnit.reduce((sum, set) => sum + set.size, 0);
  structuralConnections.ties += boltTies.length;
  
  const estimatedTieForceN = structuralConnections.ties > 0 ? (totalLateralForceN * 0.5) / structuralConnections.ties : 0; 
  const estimatedStrutForceN = structuralConnections.struts > 0 ? (totalLateralForceN * 0.5) / structuralConnections.struts : 0;

  return {
    totalLateralForceN,
    overturningMomentNm,
    deadLoadN,
    liveLoadN,
    upliftForceN,
    netDownwardForceN,
    bolts: boltsWithForces,
    globalBox: { minX, maxX, minZ, maxZ, maxH },
    estimatedTieForceN,
    estimatedStrutForceN,
    structuralConnections,
    windDirection,
    boltTies
  };
};
