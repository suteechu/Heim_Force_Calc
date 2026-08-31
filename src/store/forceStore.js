import { create } from 'zustand';

export const TSMA_SIZES = {
  'Full': 2.464,
  'Sub': 1.339
};

export const KATE_SIZES = {
  'U36': 3.814,
  'U45': 4.714,
  'U47': 4.939,
  'U54': 5.614,
  'U59': 6.064,
  'U63': 6.514
};

export const KATE_BOLTS = {
  'U36': 2, // 2 per side (4 total)
  'U45': 2,
  'U47': 2,
  'U54': 4, // 4 per side (8 total)
  'U59': 4,
  'U63': 4
};

export const useForceStore = create((set) => ({
  placedUnits: [
    { id: 'unit-1', tsmaType: 'Full', kateType: 'U59', x: 0, z: 0, angle: 0 }
  ],
  windPressure: 1000, // Pa (N/m^2)
  windDirection: '-Z', // Default to -Z
  windUplift: 500,    // Pa (N/m^2) แรงดูดยกหลังคา
  seismicCoeff: 0.1,  // g (Cs)
  liveLoad: 150,      // kg/m^2 น้ำหนักบรรทุกจร
  boltCapacityN: 40000, // Max safe tension/shear
  cameraView: 'iso',
  isOrthographic: true,

  addUnit: () => set((state) => {
      const newId = `unit-${Date.now()}`;
      const lastUnit = state.placedUnits[state.placedUnits.length - 1];
      
      const newX = lastUnit ? lastUnit.x + 2.475 : 0; 
      const tsmaType = lastUnit ? lastUnit.tsmaType : 'Full';
      const kateType = lastUnit ? lastUnit.kateType : 'U59';
      const angle = lastUnit ? lastUnit.angle : 0;
      
      return {
          placedUnits: [...state.placedUnits, { id: newId, tsmaType, kateType, x: newX, z: 0, angle }]
      };
  }),
  updateUnit: (id, data) => set((state) => ({
      placedUnits: state.placedUnits.map(u => u.id === id ? { ...u, ...data } : u)
  })),
  removeUnit: (id) => set((state) => ({
      placedUnits: state.placedUnits.filter(u => u.id !== id)
  })),
  loadState: (data) => set(data),

  setWindPressure: (val) => set({ windPressure: val }),
  setWindDirection: (val) => set({ windDirection: val }),
  setWindUplift: (val) => set({ windUplift: val }),
  setSeismicCoeff: (val) => set({ seismicCoeff: val }),
  setLiveLoad: (val) => set({ liveLoad: val }),

  aiApiKey: localStorage.getItem('heim_ai_key') || '',
  setAiApiKey: (key) => {
    localStorage.setItem('heim_ai_key', key);
    set({ aiApiKey: key });
  },

  setCameraView: (view) => set({ cameraView: view }),
  setOrthographic: (val) => set({ isOrthographic: val }),
}));

export const getUnitData = (tsmaType, kateType) => {
  const w = TSMA_SIZES[tsmaType];
  const l = KATE_SIZES[kateType];
  const h = 2.8;
  // น้ำหนักอ้างอิงจากพื้นที่ (ประมาณ 350 kg ต่อตารางเมตร)
  const massKg = Math.round(w * l * 350);
  return { w, l, h, massKg };
};

export const UNIT_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];
