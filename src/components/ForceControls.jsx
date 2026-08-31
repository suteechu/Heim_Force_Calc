import React from 'react';
import { useForceStore, getUnitData, UNIT_COLORS } from '../store/forceStore';
import { calculateBoltForces } from '../utils/engineeringCalc';

export default function ForceControls() {
  const {
    placedUnits, addUnit, updateUnit, removeUnit,
    windPressure, setWindPressure,
    windDirection, setWindDirection,
    windUplift, setWindUplift,
    seismicCoeff, setSeismicCoeff,
    liveLoad, setLiveLoad,
    boltCapacityN
  } = useForceStore();

  const results = React.useMemo(() => {
    if (placedUnits.length === 0) return { bolts: [], deadLoadN: 0, liveLoadN: 0, upliftForceN: 0, netDownwardForceN: 0, totalLateralForceN: 0, overturningMomentNm: 0 };
    return calculateBoltForces(
      placedUnits,
      getUnitData,
      { windPressure, windDirection, seismicCoeff, liveLoad, windUplift }, 
      boltCapacityN
    );
  }, [placedUnits, windPressure, windDirection, windUplift, seismicCoeff, liveLoad, boltCapacityN]);

  const isAnyBoltFailing = results.bolts && results.bolts.some(b => b.isFailing);

  const handleExport = () => {
    const exportData = { placedUnits, windPressure, windDirection, windUplift, seismicCoeff, liveLoad, boltCapacityN };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Create timestamp string
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}`;
    
    link.href = url;
    link.download = `heim-project_${dateStr}_${timeStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.placedUnits) {
          useForceStore.getState().loadState(data);
        }
      } catch (err) {
        alert("Invalid project file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex flex-col gap-3 border-b pb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Heim Sandbox</h2>
          <div className="flex gap-2">
            <button onClick={handleExport} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold hover:bg-slate-200 border border-slate-300 shadow-sm" title="Save Project">
              Save
            </button>
            <label className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-semibold hover:bg-slate-200 border border-slate-300 shadow-sm cursor-pointer" title="Load Project">
              Load
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>
        <button 
          onClick={addUnit}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow flex items-center justify-center w-full gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add New Unit
        </button>
      </div>

      <div className="space-y-4">
        {/* Unit Manager */}
        <div className="space-y-3">
          {placedUnits.length === 0 && <div className="text-sm text-slate-500">No units placed. Add a unit to begin.</div>}
          
          {placedUnits.map((u, index) => {
            const colorHex = UNIT_COLORS[index % UNIT_COLORS.length];
            return (
              <div 
                key={u.id} 
                className="bg-slate-50 p-2.5 rounded border shadow-sm relative transition-all"
                style={{ borderLeft: `4px solid ${colorHex}`, borderColor: `${colorHex}40` }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colorHex }}>Unit {index + 1}</span>
                  {placedUnits.length > 1 && (
                    <button onClick={() => removeUnit(u.id)} className="text-slate-400 hover:text-red-500 text-[10px] font-bold">✕ Remove</button>
                  )}
                </div>
                            <details className="group mb-2">
                  <summary className="text-[10px] font-bold text-slate-400 cursor-pointer hover:text-slate-600 list-none flex items-center gap-1 select-none">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    Size Model (TSMA x KATE)
                  </summary>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5 pl-4">
                    <div>
                      <select value={u.tsmaType} onChange={(e) => updateUnit(u.id, { tsmaType: e.target.value })} className="w-full bg-white border-slate-200 rounded px-1.5 py-1 border text-[10px] font-medium text-slate-600 outline-none">
                        <option value="Full">TSMA: Full (2.4m)</option>
                        <option value="Sub">TSMA: Sub (1.3m)</option>
                      </select>
                    </div>
                    <div>
                      <select value={u.kateType} onChange={(e) => updateUnit(u.id, { kateType: e.target.value })} className="w-full bg-white border-slate-200 rounded px-1.5 py-1 border text-[10px] font-medium text-slate-600 outline-none">
                        <option value="U36">KATE: U36 (3.8m)</option>
                        <option value="U45">KATE: U45 (4.7m)</option>
                        <option value="U47">KATE: U47 (4.9m)</option>
                        <option value="U54">KATE: U54 (5.6m)</option>
                        <option value="U59">KATE: U59 (6.0m)</option>
                        <option value="U63">KATE: U63 (6.5m)</option>
                      </select>
                    </div>
                  </div>
                </details>
              
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[9px] font-bold text-red-600 mb-0.5">X ซ้าย/ขวา (m)</label>
                  <input type="number" step="0.225" value={u.x} onChange={(e) => updateUnit(u.id, { x: Number(e.target.value) })} className="w-full border-slate-300 rounded px-1 py-0.5 border text-[11px] focus:ring-red-500 focus:border-red-500"/>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-green-600 mb-0.5">Z หน้า/หลัง (m)</label>
                  <input type="number" step="0.225" value={u.z} onChange={(e) => updateUnit(u.id, { z: Number(e.target.value) })} className="w-full border-slate-300 rounded px-1 py-0.5 border text-[11px] focus:ring-green-500 focus:border-green-500"/>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-slate-500 mb-0.5">Rotate</label>
                  <select value={u.angle || 0} onChange={(e) => updateUnit(u.id, { angle: Number(e.target.value) })} className="w-full border-slate-300 rounded px-1 py-0.5 border text-[11px]">
                    <option value="0">0°</option>
                    <option value="90">90°</option>
                    <option value="180">180°</option>
                    <option value="270">270°</option>
                  </select>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
