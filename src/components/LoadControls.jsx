import React, { useState } from 'react';
import { useForceStore, getUnitData } from '../store/forceStore';
import { calculateBoltForces } from '../utils/engineeringCalc';
import DetailedAnalysisModal from './DetailedAnalysisModal';

export default function LoadControls() {
  const {
    placedUnits,
    windPressure, setWindPressure,
    windDirection, setWindDirection,
    windUplift, setWindUplift,
    seismicCoeff, setSeismicCoeff,
    liveLoad, setLiveLoad,
    boltCapacityN
  } = useForceStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const StatRow = ({ label, value, unit, highlight }) => (
    <div className={`flex justify-between items-end py-1.5 border-b border-slate-100 last:border-0 ${highlight ? 'mt-1 pt-2 border-t-2 border-t-slate-200' : ''}`}>
      <span className={`text-xs ${highlight ? 'font-bold text-slate-700' : 'text-slate-500'}`}>{label}</span>
      <div>
        <span className={`${highlight ? 'text-base font-bold text-blue-600' : 'text-sm font-semibold text-slate-700'}`}>{value}</span>
        <span className="text-[10px] text-slate-400 ml-1 font-medium">{unit}</span>
      </div>
    </div>
  );

  return (
    <>
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 h-full flex flex-col overflow-hidden w-80 flex-shrink-0 print:hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Analysis Settings
          </h2>
          <p className="text-xs text-slate-300 mt-1 opacity-80">Configure environmental loads & view physics results</p>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          
          {/* External Loads */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">External Loads</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">WIND PRESSURE</label>
                  <div className="flex items-end gap-1">
                    <input type="number" step="10" value={windPressure} onChange={(e) => setWindPressure(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 text-slate-700"/>
                    <span className="text-[10px] text-slate-400 font-medium mb-0.5">Pa</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">DIRECTION</label>
                  <select value={windDirection} onChange={(e) => setWindDirection(e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 text-slate-700 cursor-pointer">
                    <option value="-Z">N ➔ S (-Z)</option>
                    <option value="+Z">S ➔ N (+Z)</option>
                    <option value="-X">E ➔ W (-X)</option>
                    <option value="+X">W ➔ E (+X)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">WIND UPLIFT</label>
                  <div className="flex items-end gap-1">
                    <input type="number" step="10" value={windUplift} onChange={(e) => setWindUplift(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 text-slate-700"/>
                    <span className="text-[10px] text-slate-400 font-medium mb-0.5">Pa</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">LIVE LOAD</label>
                  <div className="flex items-end gap-1">
                    <input type="number" step="10" value={liveLoad} onChange={(e) => setLiveLoad(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 text-slate-700"/>
                    <span className="text-[10px] text-slate-400 font-medium mb-0.5">kg/m²</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <label className="block text-[10px] font-bold text-slate-500 mb-1">SEISMIC COEFFICIENT (Cs)</label>
                <div className="flex items-end gap-1">
                  <input type="number" step="0.05" value={seismicCoeff} onChange={(e) => setSeismicCoeff(Number(e.target.value))} className="w-full bg-transparent border-none p-0 text-sm font-semibold focus:ring-0 text-slate-700"/>
                  <span className="text-[10px] text-slate-400 font-medium mb-0.5">g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Dashboard */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dashboard</h3>
              <div className="flex gap-1.5 flex-wrap justify-end">
                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                  🔩 {results.bolts.length} Bolts
                </span>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  🔗 {results.structuralConnections?.ties || 0} Top Ties
                </span>
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                  🏗️ {results.structuralConnections?.struts || 0} Cross Beams
                </span>
              </div>
            </div>
            
            <div className={`relative rounded-xl border p-4 shadow-sm transition-all ${isAnyBoltFailing ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200'}`}>
              
              {/* Status Badge */}
              <div className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-sm flex items-center gap-1 ${isAnyBoltFailing ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}>
                {isAnyBoltFailing ? (
                  <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg> WARNING</>
                ) : (
                  <><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg> SAFE</>
                )}
              </div>

              <div className="mt-3 space-y-1">
                <StatRow label="Dead Load" value={(results.deadLoadN / 1000).toFixed(1)} unit="kN" />
                <StatRow label="Live Load" value={(results.liveLoadN / 1000).toFixed(1)} unit="kN" />
                <StatRow label="Wind Uplift" value={(results.upliftForceN / 1000).toFixed(1)} unit="kN" />
                <StatRow label="Net Downward" value={(results.netDownwardForceN / 1000).toFixed(1)} unit="kN" />
                <StatRow label="Base Shear" value={(results.totalLateralForceN / 1000).toFixed(1)} unit="kN" highlight={true} />
                <StatRow label="O. Moment" value={(results.overturningMomentNm / 1000).toFixed(1)} unit="kN·m" highlight={true} />
              </div>

              {/* Detailed Analysis Button */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-5 bg-slate-800 text-white font-bold text-xs py-3 rounded-xl shadow-md hover:bg-slate-700 transition-colors flex justify-center items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                Detailed Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      <DetailedAnalysisModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          results={results}
          boltCapacityN={boltCapacityN}
          placedUnits={placedUnits}
        />
    </>
  );
}
