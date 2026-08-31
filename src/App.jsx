import React, { useState } from 'react';
import HeimViewer3D from './components/HeimViewer3D';
import ForceControls from './components/ForceControls';
import LoadControls from './components/LoadControls';
import UserManualModal from './components/UserManualModal';

function App() {
  const [isManualOpen, setIsManualOpen] = useState(false);

  return (
    <div className="w-screen h-screen flex bg-slate-100 p-4 gap-4 overflow-hidden box-border print:block print:h-auto print:overflow-visible print:bg-white print:p-0">
      {/* Left panel: Unit Manager */}
      <div className="w-80 flex-shrink-0 print:hidden">
        <ForceControls />
      </div>

      {/* Center panel: 3D Viewer */}
      <div className="flex-grow rounded-lg overflow-hidden relative shadow-lg print:hidden">
        <HeimViewer3D />
        
        {/* Floating Help Button */}
        <button 
          onClick={() => setIsManualOpen(true)}
          className="absolute top-4 left-4 bg-white/90 hover:bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition-all border border-indigo-100 z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          คู่มือการใช้งาน
        </button>
      </div>

      {/* Right panel: Analysis & Loads */}
      <div className="w-80 flex-shrink-0 print:w-full print:block">
        <LoadControls />
      </div>

      {/* User Manual Modal */}
      <UserManualModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
    </div>
  );
}

export default App;
