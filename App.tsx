
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MachineCategory, MaterialType, MachineInput, CalculationResult, UnitSystem } from './types';
import { calculateProductivity } from './services/calculatorLogic';
import { getAIInsights } from './services/geminiService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

// --- Local Storage Keys ---
const LS_KEYS = {
  UNIT_SYSTEM: 'equippro_unit_system',
  CATEGORY: 'equippro_category',
  INPUTS: 'equippro_inputs'
};

// --- Sub-components ---

const Nav: React.FC = () => (
  <nav className="bg-white border-b border-slate-200 no-print sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
      <div className="flex gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
        <a href="#calculator" className="hover:text-yellow-600 transition-colors">Calculator</a>
        <a href="#how-it-works" className="hover:text-yellow-600 transition-colors">Technical Docs</a>
        <a href="#faq" className="hover:text-yellow-600 transition-colors">FAQ</a>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">System Status</span>
          <span className="text-[10px] font-bold text-green-600 uppercase">Operational</span>
        </div>
        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
      </div>
    </div>
  </nav>
);

const Header: React.FC<{ unitSystem: UnitSystem; setUnitSystem: (u: UnitSystem) => void }> = ({ unitSystem, setUnitSystem }) => (
  <header className="bg-slate-900 text-white py-12 px-4 shadow-2xl border-b-4 border-yellow-500 no-print relative overflow-hidden">
    <div className="absolute top-0 right-0 w-1/3 h-full bg-yellow-500/5 -skew-x-12 transform translate-x-20"></div>
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
      <div className="flex items-center gap-6">
        <div className="bg-yellow-500 p-4 rounded-2xl shadow-[0_10px_25px_-5px_rgba(234,179,8,0.4)] transform hover:rotate-3 transition-transform">
          <svg className="w-12 h-12 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22,17.5L19,17.5V11C19,10.45 18.55,10 18,10H16V9.5C16,7.57 14.43,6 12.5,6H11V4H9V6H8.5C6.57,6 5,7.57 5,9.5V10H3C2.45,10 2,10.45 2,11V17.5L1,17.5V19.5H23V17.5M7,9.5C7,8.67 7.67,8 8.5,8H12.5C13.33,8 14,8.67 14,9.5V10H7V9.5M4,17.5V12H18V17.5H4Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-5xl heading-font tracking-tighter leading-none">EquipPro <span className="text-yellow-500">Optimizer</span></h1>
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-[0.3em] mt-2">Precision Construction Engineering</p>
        </div>
      </div>
      
      <div className="flex flex-col items-center md:items-end gap-3">
        <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700 shadow-2xl">
          <button 
            onClick={() => setUnitSystem(UnitSystem.METRIC)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all duration-300 ${unitSystem === UnitSystem.METRIC ? 'bg-yellow-500 text-slate-900 shadow-lg scale-105' : 'text-slate-500 hover:text-white'}`}
          >
            Metric
          </button>
          <button 
            onClick={() => setUnitSystem(UnitSystem.IMPERIAL)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all duration-300 ${unitSystem === UnitSystem.IMPERIAL ? 'bg-yellow-500 text-slate-900 shadow-lg scale-105' : 'text-slate-500 hover:text-white'}`}
          >
            Imperial
          </button>
        </div>
        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Global Standards Supported</p>
      </div>
    </div>
  </header>
);

const MachineTab: React.FC<{ 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string 
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex flex-col items-center justify-center py-6 transition-all border-b-4 outline-none ${
      active 
        ? 'border-yellow-500 bg-yellow-50/30 text-slate-900' 
        : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}
  >
    <div className={`mb-3 transition-all duration-500 ${active ? 'text-yellow-600 scale-125' : 'scale-100'}`}>{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => (
  <div className="border-b border-slate-200 py-6 last:border-0">
    <h4 className="text-slate-900 font-bold mb-2 flex items-center gap-2">
      <span className="text-yellow-500 text-lg">Q.</span> {question}
    </h4>
    <p className="text-slate-500 text-sm leading-relaxed">{answer}</p>
  </div>
);

const App: React.FC = () => {
  // --- Initialization from Local Storage ---
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem(LS_KEYS.UNIT_SYSTEM);
    return (saved as UnitSystem) || UnitSystem.METRIC;
  });
  
  const [category, setCategory] = useState<MachineCategory>(() => {
    const saved = localStorage.getItem(LS_KEYS.CATEGORY);
    return (saved as MachineCategory) || MachineCategory.EARTH_MOVING;
  });

  const [inputs, setInputs] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem(LS_KEYS.INPUTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved inputs", e);
      }
    }
    return {
      model: 'CAT 320 GC',
      efficiency: 0.85,
      material: 'Base Course',
      bucketCapacity: 1.2,
      cycleTime: 22,
      fillFactor: 0.95,
      swingFactor: 1.1,
      jobFactor: 0.9,
      width: 2.5,
      speed: 3.5,
      liftThickness: 0.15,
      passes: 6,
      overlap: 0.2,
      vibrationBonus: 1.1,
      thickness: 0.05,
      density: 2.35,
      exchangeTime: 5,
      depth: 0.04,
      hardnessFactor: 1.2,
      owningCost: 48.00,
      operatingCost: 72.00,
      asphaltType: 'Hot Mix (HMA)',
      matTemp: 150
    };
  });

  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const prevUnitSystemRef = useRef<UnitSystem>(unitSystem);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // --- Persistence Side Effects ---
  useEffect(() => {
    localStorage.setItem(LS_KEYS.UNIT_SYSTEM, unitSystem);
  }, [unitSystem]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.CATEGORY, category);
  }, [category]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.INPUTS, JSON.stringify(inputs));
  }, [inputs]);

  // --- Validation Logic ---
  const validateField = (name: string, value: any): string | null => {
    if (typeof value !== 'number' && name !== 'asphaltType') return null;
    
    switch (name) {
      case 'efficiency':
        if (value < 0.1 || value > 1.0) return "Range: 0.1 - 1.0";
        break;
      case 'swingFactor':
        if (value < 1.0 || value > 2.0) return "Range: 1.0 - 2.0";
        break;
      case 'jobFactor':
        if (value < 0.1 || value > 1.0) return "Range: 0.1 - 1.0";
        break;
      case 'fillFactor':
        if (value < 0.1 || value > 1.5) return "Range: 0.1 - 1.5";
        break;
      case 'vibrationBonus':
        if (value < 1.0 || value > 1.5) return "Range: 1.0 - 1.5";
        break;
      case 'hardnessFactor':
        if (value < 1.0 || value > 5.0) return "Range: 1.0 - 5.0";
        break;
      case 'exchangeTime':
        if (value < 0 || value > 59) return "Range: 0 - 59 min";
        break;
      case 'matTemp':
        if (unitSystem === UnitSystem.METRIC) {
          if (value < 60 || value > 200) return "Range: 60 - 200 °C";
        } else {
          if (value < 140 || value > 400) return "Range: 140 - 400 °F";
        }
        break;
      case 'owningCost':
      case 'operatingCost':
      case 'bucketCapacity':
      case 'cycleTime':
      case 'width':
      case 'speed':
      case 'liftThickness':
      case 'thickness':
      case 'depth':
      case 'density':
        if (value < 0) return "Value must be positive";
        break;
      case 'passes':
        if (value < 1) return "Min 1 pass required";
        break;
      case 'overlap':
        if (value < 0) return "Min overlap 0";
        break;
    }
    return null;
  };

  // Handle automatic value conversions when unit system changes
  useEffect(() => {
    if (prevUnitSystemRef.current === unitSystem) return;

    setInputs(prev => {
      const next = { ...prev };
      const toMetric = unitSystem === UnitSystem.METRIC;

      // Conversion Constants
      const M3_TO_YD3 = 1.30795;
      const M_TO_FT = 3.28084;
      const M_TO_IN = 39.3701;
      const KMH_TO_MPH = 0.621371;
      const TM3_TO_LBFT3 = 62.428;

      const convert = (val: number, factor: number) => 
        toMetric ? Number((val / factor).toFixed(2)) : Number((val * factor).toFixed(2));

      // 1. Capacity (Earth Moving)
      if (prev.bucketCapacity !== undefined) {
        next.bucketCapacity = convert(prev.bucketCapacity, M3_TO_YD3);
      }

      // 2. Linear dimensions: Width, Overlap (Roller, Paver, Miller)
      if (prev.width !== undefined) next.width = convert(prev.width, M_TO_FT);
      if (prev.overlap !== undefined) next.overlap = convert(prev.overlap, M_TO_FT);

      // 3. Speed: Category specific requirements
      if (prev.speed !== undefined) {
        if (category === MachineCategory.ROLLER) {
          next.speed = convert(prev.speed, KMH_TO_MPH);
        } else if (category === MachineCategory.PAVER || category === MachineCategory.MILLER) {
          next.speed = convert(prev.speed, M_TO_FT);
        }
      }

      // 4. Layer Depth / Thickness (Roller, Paver, Miller)
      if (prev.liftThickness !== undefined) next.liftThickness = convert(prev.liftThickness, M_TO_IN);
      if (prev.thickness !== undefined) next.thickness = convert(prev.thickness, M_TO_IN);
      if (prev.depth !== undefined) next.depth = convert(prev.depth, M_TO_IN);

      // 5. Density (Paver)
      if (prev.density !== undefined) next.density = convert(prev.density, TM3_TO_LBFT3);

      // 6. Temperature (Paver)
      if (prev.matTemp !== undefined) {
        if (toMetric) {
          // F to C
          next.matTemp = Number(((prev.matTemp - 32) * 5 / 9).toFixed(0));
        } else {
          // C to F
          next.matTemp = Number(((prev.matTemp * 9 / 5) + 32).toFixed(0));
        }
      }

      return next;
    });

    prevUnitSystemRef.current = unitSystem;
  }, [unitSystem, category]);

  const result = useMemo(() => {
    return calculateProductivity(category, inputs as MachineInput, unitSystem);
  }, [category, inputs, unitSystem]);

  const handleInputChange = (name: string, value: string | number) => {
    setInputs(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const fetchInsights = async () => {
    setLoadingAi(true);
    const insight = await getAIInsights(result);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    setAiInsight(null);
  }, [category]);

  const isMetric = unitSystem === UnitSystem.METRIC;

  const chartData = useMemo(() => {
    return [0.6, 0.7, 0.8, 0.9, 1.0].map(eff => {
      const simulatedResult = calculateProductivity(category, { ...inputs, efficiency: eff } as MachineInput, unitSystem);
      return {
        efficiencyLabel: `${(eff * 100).toFixed(0)}%`,
        efficiencyValue: eff,
        productivity: simulatedResult.productivity,
        unit: simulatedResult.unit,
        details: { ...inputs, efficiency: eff }
      };
    });
  }, [category, inputs, unitSystem]);

  const renderInputs = () => {
    switch (category) {
      case MachineCategory.EARTH_MOVING:
        return (
          <>
            <InputField 
              label="Bucket Capacity" 
              unit={isMetric ? 'm³' : 'yd³'}
              conversionHint={isMetric ? "1 m³ ≈ 1.31 yd³" : "1 yd³ ≈ 0.76 m³"}
              name="bucketCapacity" 
              value={inputs.bucketCapacity} 
              onChange={handleInputChange} 
              type="number" step="0.1" 
              tooltip="The nominal heap capacity of the excavator bucket." 
              error={errors.bucketCapacity} 
            />
            <InputField label="Cycle Time" unit="sec" name="cycleTime" value={inputs.cycleTime} onChange={handleInputChange} type="number" tooltip="Full cycle: Load, Swing, Dump, Return." error={errors.cycleTime} />
            <InputField label="Fill Factor" name="fillFactor" value={inputs.fillFactor} onChange={handleInputChange} type="number" step="0.05" tooltip="Percentage of rated bucket capacity effectively filled." error={errors.fillFactor} />
            <InputField label="Swing Factor" name="swingFactor" value={inputs.swingFactor} onChange={handleInputChange} type="number" step="0.1" tooltip="Standard swing (90°) is 1.0. Wider swings (180°) increase time (e.g., 1.3)." error={errors.swingFactor} />
            <InputField label="Job Condition" name="jobFactor" value={inputs.jobFactor} onChange={handleInputChange} type="number" step="0.1" tooltip="Site difficulty (slope, visibility, tight space). Perfect site is 1.0." error={errors.jobFactor} />
          </>
        );
      case MachineCategory.ROLLER:
        return (
          <>
            <InputField 
              label="Drum Width" 
              unit={isMetric ? 'm' : 'ft'}
              conversionHint={isMetric ? "1 m ≈ 3.28 ft" : "1 ft ≈ 0.30 m"}
              name="width" 
              value={inputs.width} 
              onChange={handleInputChange} 
              type="number" step="0.1" 
              tooltip="The physical width of the compaction drum." 
              error={errors.width} 
            />
            <InputField 
              label="Working Speed" 
              unit={isMetric ? 'km/h' : 'mph'}
              conversionHint={isMetric ? "1 km/h ≈ 0.62 mph" : "1 mph ≈ 1.61 km/h"}
              name="speed" 
              value={inputs.speed} 
              onChange={handleInputChange} 
              type="number" step="0.1" 
              tooltip="Average travel speed while compacting." 
              error={errors.speed} 
            />
            <InputField 
              label="Lift Thickness" 
              unit={isMetric ? 'm' : 'in'}
              conversionHint={isMetric ? "1 m ≈ 39.37 in" : "1 in ≈ 0.025 m"}
              name="liftThickness" 
              value={inputs.liftThickness} 
              onChange={handleInputChange} 
              type="number" step="0.01" 
              tooltip="Depth of loose layer before compaction." 
              error={errors.liftThickness} 
            />
            <InputField label="Required Passes" name="passes" value={inputs.passes} onChange={handleInputChange} type="number" tooltip="Estimated passes to achieve density requirements." error={errors.passes} />
            <InputField 
              label="Pass Overlap" 
              unit={isMetric ? 'm' : 'ft'}
              conversionHint={isMetric ? "1 m ≈ 3.28 ft" : "1 ft ≈ 0.30 m"}
              name="overlap" 
              value={inputs.overlap} 
              onChange={handleInputChange} 
              type="number" step="0.05" 
              tooltip="Reduces effective drum width. Standard is ~0.15m or 6 inches." 
              error={errors.overlap} 
            />
            <InputField label="Vibration Bonus" name="vibrationBonus" value={inputs.vibrationBonus} onChange={handleInputChange} type="number" step="0.05" tooltip="Multi-vibe frequency efficiency. High-frequency rollers provide ~1.1 bonus." error={errors.vibrationBonus} />
          </>
        );
      case MachineCategory.PAVER:
        return (
          <>
            <InputField 
              label="Paving Width" 
              unit={isMetric ? 'm' : 'ft'}
              conversionHint={isMetric ? "1 m ≈ 3.28 ft" : "1 ft ≈ 0.30 m"}
              name="width" 
              value={inputs.width} 
              onChange={handleInputChange} 
              type="number" step="0.1" 
              tooltip="Total width being paved in a single pass." 
              error={errors.width} 
            />
            <InputField 
              label="Paving Speed" 
              unit={isMetric ? 'm/min' : 'ft/min'}
              conversionHint={isMetric ? "1 m/min ≈ 3.28 ft/min" : "1 ft/min ≈ 0.30 m/min"}
              name="speed" 
              value={inputs.speed} 
              onChange={handleInputChange} 
              type="number" step="0.1" 
              tooltip="Forward speed during continuous paving." 
              error={errors.speed} 
            />
            <InputField 
              label="Layer Thickness" 
              unit={isMetric ? 'm' : 'in'}
              conversionHint={isMetric ? "1 m ≈ 39.37 in" : "1 in ≈ 0.025 m"}
              name="thickness" 
              value={inputs.thickness} 
              onChange={handleInputChange} 
              type="number" step="0.01" 
              error={errors.thickness} 
              tooltip="Compacted mat thickness." 
            />
            <InputField 
              label="Mix Density" 
              unit={isMetric ? 't/m³' : 'lb/ft³'}
              conversionHint={isMetric ? "1 t/m³ ≈ 62.43 lb/ft³" : "1 lb/ft³ ≈ 0.016 t/m³"}
              name="density" 
              value={inputs.density} 
              onChange={handleInputChange} 
              type="number" step="0.01" 
              error={errors.density} 
              tooltip="Specific density of the asphalt mix after compaction." 
            />
            <InputField label="Truck Loss" unit="min/hr" name="exchangeTime" value={inputs.exchangeTime} onChange={handleInputChange} type="number" tooltip="Time lost per hour waiting for truck exchanges. High loss lowers output." error={errors.exchangeTime} />
            <SelectField 
              label="Mix Type" 
              name="asphaltType" 
              value={inputs.asphaltType} 
              onChange={handleInputChange} 
              options={['Hot Mix (HMA)', 'Warm Mix (WMA)', 'Stone Matrix (SMA)', 'Porous Asphalt']} 
              tooltip="The specific type of asphalt mixture being laid."
            />
            <InputField 
              label="Mat Temp" 
              unit={isMetric ? '°C' : '°F'} 
              conversionHint={isMetric ? "C = (F-32)*5/9" : "F = C*9/5+32"}
              name="matTemp" 
              value={inputs.matTemp} 
              onChange={handleInputChange} 
              type="number" 
              tooltip="Delivery temperature of the mat. Essential for compaction window analysis." 
              error={errors.matTemp} 
            />
          </>
        );
      case MachineCategory.MILLER:
        return (
          <>
            <InputField 
              label="Milling Width" 
              unit={isMetric ? 'm' : 'ft'}
              conversionHint={isMetric ? "1 m ≈ 3.28 ft" : "1 ft ≈ 0.30 m"}
              name="width" 
              value={inputs.width} 
              onChange={handleInputChange} 
              type="number" step="0.1" 
              error={errors.width} 
            />
            <InputField 
              label="Milling Speed" 
              unit={isMetric ? 'm/min' : 'ft/min'}
              conversionHint={isMetric ? "1 m/min ≈ 3.28 ft/min" : "1 ft/min ≈ 0.30 m/min"}
              name="speed" 
              value={inputs.speed} 
              onChange={handleInputChange} 
              type="number" step="0.1" 
              error={errors.speed} 
            />
            <InputField 
              label="Cutting Depth" 
              unit={isMetric ? 'm' : 'in'}
              conversionHint={isMetric ? "1 m ≈ 39.37 in" : "1 in ≈ 0.025 m"}
              name="depth" 
              value={inputs.depth} 
              onChange={handleInputChange} 
              type="number" step="0.01" 
              error={errors.depth} 
            />
            <InputField label="Hardness" name="hardnessFactor" value={inputs.hardnessFactor} onChange={handleInputChange} type="number" step="0.1" tooltip="1.0 for soft asphalt, 2.0+ for concrete or old reinforced pavement. Inversely proportional to output." error={errors.hardnessFactor} />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Nav />
      <Header unitSystem={unitSystem} setUnitSystem={setUnitSystem} />

      <main id="calculator" className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Side: Parameters */}
        <div className="lg:col-span-5 space-y-10 no-print">
          <section className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex bg-slate-50/70 border-b border-slate-200">
              <MachineTab 
                active={category === MachineCategory.EARTH_MOVING} 
                onClick={() => setCategory(MachineCategory.EARTH_MOVING)} 
                label="Excavator" 
                icon={<svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M19,13V11H17V13H15V11H13V13H11V11H9V13H7V11H5V13H3V11H1V19H23V11H21V13H19Z"/></svg>}
              />
              <MachineTab 
                active={category === MachineCategory.ROLLER} 
                onClick={() => setCategory(MachineCategory.ROLLER)} 
                label="Roller" 
                icon={<svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6V12L16,14.5L16.75,13.25L13.5,11.25V6H12Z"/></svg>}
              />
              <MachineTab 
                active={category === MachineCategory.PAVER} 
                onClick={() => setCategory(MachineCategory.PAVER)} 
                label="Paver" 
                icon={<svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M20,18V15H18V13H20V11H22V13H24V15H22V18H20M2,18V15H4V13H2V11H0V13H-2V15H0V18H2M16,10V8H8V10H6V8H4V10H2V6H22V10H20V8H18V10H16Z"/></svg>}
              />
              <MachineTab 
                active={category === MachineCategory.MILLER} 
                onClick={() => setCategory(MachineCategory.MILLER)} 
                label="Miller" 
                icon={<svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M13,10H11V8H13V10M13,14H11V12H13V14M17,10H15V8H17V10M17,14H15V12H17V14M21,10H19V8H21V10M21,14H19V12H21V14M9,10H7V8H9V10M9,14H7V12H9V14M5,10H3V8H5V10M5,14H3V12H5V14M1,18V15H23V18H1Z"/></svg>}
              />
            </div>

            <div className="p-10 space-y-8">
              <InputField label="Asset Identifier" name="model" value={inputs.model} onChange={handleInputChange} type="text" tooltip="The specific fleet number or machine model being analyzed." error={errors.model} />
              
              <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 grid grid-cols-2 gap-8 shadow-inner">
                <InputField label="Owning ($/hr)" name="owningCost" value={inputs.owningCost} onChange={handleInputChange} type="number" step="0.5" tooltip="Capital costs, depreciation, insurance, and taxes." error={errors.owningCost} />
                <InputField label="Operating ($/hr)" name="operatingCost" value={inputs.operatingCost} onChange={handleInputChange} type="number" step="0.5" tooltip="Fuel, maintenance, repairs, and operator wages." error={errors.operatingCost} />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <SelectField 
                  label="Material Profile" 
                  name="material" 
                  value={inputs.material} 
                  onChange={handleInputChange} 
                  options={['Sand', 'Clay', 'Rock', 'Asphalt', 'Base Course']} 
                />
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                    Jobsite Efficiency 
                    <span className="text-yellow-500 cursor-help" title="Overall job site efficiency factor (1.0 = perfect coordination)">ⓘ</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.05" 
                    value={inputs.efficiency} 
                    onChange={(e) => handleInputChange('efficiency', parseFloat(e.target.value))}
                    className={`w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-500 ${errors.efficiency ? 'accent-red-500' : ''}`}
                  />
                  <div className="flex justify-between text-[10px] font-black text-slate-400">
                    <span>Stalled Site</span>
                    <span className={`px-2 rounded ${errors.efficiency ? 'text-red-600 bg-red-50' : 'text-slate-900 bg-yellow-500/10'}`}>{(inputs.efficiency * 100).toFixed(0)}%</span>
                    <span>Max Sync</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6 pt-6 border-t border-slate-100">
                {renderInputs()}
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-4">
            <button 
              onClick={fetchInsights}
              disabled={loadingAi || Object.values(errors).some(e => e !== null)}
              className="w-full py-6 bg-slate-900 text-white font-black rounded-2xl shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 group border-2 border-slate-800 active:scale-95 transform overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {loadingAi ? (
                <div className="animate-spin rounded-full h-7 w-7 border-3 border-white border-t-transparent" />
              ) : (
                <>
                  <svg className="w-6 h-6 text-yellow-500 group-hover:rotate-12 transition-transform relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6L14,10H10L12,6M10,11H14L18,17H6L10,11Z" />
                  </svg>
                  <span className="relative z-10 text-base">GENERATE FINANCIAL AUDIT</span>
                </>
              )}
            </button>
            <button 
              onClick={handlePrint}
              className="w-full py-5 bg-white text-slate-700 font-black rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest shadow-lg active:scale-95"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Export Engineering Report
            </button>
          </div>
        </div>

        {/* Right Side: Visual Data & Results */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* Main Hero Result */}
          <section className="bg-white rounded-[3rem] shadow-2xl p-12 border border-slate-200 flex flex-col items-center gap-14 relative overflow-hidden group">
            <div className="absolute top-0 right-0 px-8 py-3 bg-yellow-500 text-slate-900 font-black text-[11px] uppercase tracking-widest rounded-bl-3xl no-print shadow-lg">
              Live Engineering Audit
            </div>
            
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Primary Productivity Gauge */}
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative w-64 h-64 flex items-center justify-center group">
                  <div className="absolute inset-0 bg-yellow-500/10 rounded-full scale-125 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl">
                    <circle cx="128" cy="128" r="118" stroke="currentColor" strokeWidth="20" fill="transparent" className="text-slate-50" />
                    <circle 
                      cx="128" 
                      cy="128" 
                      r="118" 
                      stroke="currentColor" 
                      strokeWidth="20" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 118} 
                      strokeDashoffset={2 * Math.PI * 118 * (1 - Math.min(result.productivity / (category === MachineCategory.PAVER ? 1200 : 600), 1))} 
                      strokeLinecap="round"
                      className="text-yellow-500 transition-all duration-1000 ease-in-out" 
                    />
                  </svg>
                  <div className="text-center z-10 transform group-hover:scale-110 transition-transform duration-500">
                    <span className="block text-6xl font-black text-slate-900 leading-none">{result.productivity}</span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-3 block">{result.unit}</span>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Peak Productivity</h4>
                  <p className="text-sm font-bold text-slate-600">{inputs.model} Output</p>
                </div>
              </div>

              {/* Prominent Hourly Cost Section */}
              <div className="flex flex-col space-y-8">
                <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(15,23,42,0.4)] border border-slate-800 transform group-hover:-translate-y-2 transition-transform duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 -skew-x-12 translate-x-10 -translate-y-10"></div>
                  <span className="text-[10px] font-black text-yellow-500 uppercase block tracking-[0.3em] mb-4">Total Asset Hourly Rate</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-white leading-none">${result.totalHourlyCost}</span>
                    <span className="text-lg font-bold text-slate-500">/hr</span>
                  </div>
                  
                  {/* Visual Cost Breakdown */}
                  <div className="mt-8 pt-8 border-t border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owning Cost</span>
                      </div>
                      <span className="text-sm font-bold text-slate-300">${inputs.owningCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operating Cost</span>
                      </div>
                      <span className="text-sm font-bold text-slate-300">${inputs.operatingCost.toFixed(2)}</span>
                    </div>
                    {/* Percent bar */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${(inputs.owningCost / result.totalHourlyCost) * 100}%` }} 
                        className="h-full bg-slate-600"
                      />
                      <div 
                        style={{ width: `${(inputs.operatingCost / result.totalHourlyCost) * 100}%` }} 
                        className="h-full bg-yellow-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-500 p-8 rounded-[2rem] shadow-xl border border-yellow-400 transform group-hover:translate-y-2 transition-transform duration-500">
                  <span className="text-[10px] font-black text-yellow-900 uppercase block tracking-[0.3em] mb-2">Production Unit Cost</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900">${result.unitCost}</span>
                    <span className="text-sm font-bold text-yellow-900 opacity-60">/{result.unit.split('/')[0]}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row Summaries */}
            <div className="w-full grid grid-cols-2 divide-x divide-slate-100 bg-slate-50/50 p-8 rounded-3xl border border-slate-100 mt-4">
              <div className="px-8 text-center md:text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase block tracking-widest mb-1">Shift Production (10h)</span>
                <span className="text-2xl font-black text-slate-800">{(result.productivity * 10).toLocaleString()} <span className="text-xs text-slate-400 font-bold uppercase">{result.unit.split('/')[0]}</span></span>
              </div>
              <div className="px-8 text-center md:text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase block tracking-widest mb-1">Shift Operating Cost (10h)</span>
                <span className="text-2xl font-black text-slate-800">${(result.totalHourlyCost * 10).toLocaleString()} <span className="text-xs text-slate-400 font-bold uppercase">USD</span></span>
              </div>
            </div>
          </section>

          {/* Data Visuals and AI Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-200 no-print flex flex-col">
              <h3 className="text-xs font-black text-slate-800 mb-8 uppercase tracking-widest flex items-center gap-4">
                <span className="w-2 h-8 bg-yellow-500 rounded-full shadow-lg"></span>
                Site Efficiency Sensitivity
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="efficiencyLabel" tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} axisLine={false} tickLine={false} dy={15} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} hide />
                    <Tooltip 
                      cursor={{fill: '#f8fafc', radius: 12}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const d = data.details;
                          return (
                            <div className="bg-white p-5 rounded-3xl shadow-2xl border border-slate-100 text-[11px] min-w-[200px]">
                              <div className="flex justify-between items-center mb-3 border-b border-slate-50 pb-2">
                                <span className="text-yellow-600 font-black uppercase tracking-widest">Efficiency: {data.efficiencyLabel}</span>
                                <span className="bg-slate-100 text-slate-400 px-2 py-0.5 rounded text-[9px] font-bold">SIMULATED</span>
                              </div>
                              <div className="text-slate-900 text-xl font-black mb-4 flex items-baseline gap-1">
                                {data.productivity} <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{data.unit}</span>
                              </div>
                              <div className="space-y-2 text-slate-500 font-bold uppercase tracking-tighter text-[10px]">
                                <div className="flex justify-between gap-4"><span>Model:</span> <span className="text-slate-900">{d.model}</span></div>
                                <div className="flex justify-between gap-4"><span>Material:</span> <span className="text-slate-900">{d.material}</span></div>
                                {category === MachineCategory.EARTH_MOVING && (
                                  <>
                                    <div className="flex justify-between gap-4"><span>Capacity:</span> <span className="text-slate-900">{d.bucketCapacity} {isMetric ? 'm³' : 'yd³'}</span></div>
                                    <div className="flex justify-between gap-4"><span>Cycle:</span> <span className="text-slate-900">{d.cycleTime} s</span></div>
                                    <div className="flex justify-between gap-4"><span>Swing:</span> <span className="text-slate-900">{d.swingFactor}x</span></div>
                                  </>
                                )}
                                {category === MachineCategory.ROLLER && (
                                  <>
                                    <div className="flex justify-between gap-4"><span>Width:</span> <span className="text-slate-900">{d.width} {isMetric ? 'm' : 'ft'}</span></div>
                                    <div className="flex justify-between gap-4"><span>Speed:</span> <span className="text-slate-900">{d.speed} {isMetric ? 'km/h' : 'mph'}</span></div>
                                    <div className="flex justify-between gap-4"><span>Overlap:</span> <span className="text-slate-900">{d.overlap} {isMetric ? 'm' : 'ft'}</span></div>
                                  </>
                                )}
                                {category === MachineCategory.PAVER && (
                                  <>
                                    <div className="flex justify-between gap-4"><span>Width:</span> <span className="text-slate-900">{d.width} {isMetric ? 'm' : 'ft'}</span></div>
                                    <div className="flex justify-between gap-4"><span>Thickness:</span> <span className="text-slate-900">{d.thickness} {isMetric ? 'm' : 'in'}</span></div>
                                    <div className="flex justify-between gap-4"><span>Swap Loss:</span> <span className="text-slate-900">{d.exchangeTime} min</span></div>
                                    <div className="flex justify-between gap-4"><span>Temp:</span> <span className="text-slate-900">{d.matTemp} {isMetric ? '°C' : '°F'}</span></div>
                                  </>
                                )}
                                {category === MachineCategory.MILLER && (
                                  <>
                                    <div className="flex justify-between gap-4"><span>Width:</span> <span className="text-slate-900">{d.width} {isMetric ? 'm' : 'ft'}</span></div>
                                    <div className="flex justify-between gap-4"><span>Hardness:</span> <span className="text-slate-900">{d.hardnessFactor}x</span></div>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="productivity" radius={[8, 8, 8, 8]} barSize={40}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.efficiencyLabel === `${(inputs.efficiency * 100).toFixed(0)}%` ? '#eab308' : '#e2e8f0'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-400 mt-8 text-center leading-relaxed font-bold uppercase tracking-wider">Correlation between site management and hourly output</p>
            </div>

            <div className={`bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative flex flex-col min-h-[400px] ${!aiInsight && 'items-center justify-center'}`}>
              {!aiInsight ? (
                <div className="text-center p-14 space-y-6">
                  <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner border border-slate-100">
                    <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-base font-black text-slate-800 uppercase tracking-[0.2em]">Ready for Audit</h4>
                    <p className="text-xs leading-relaxed text-slate-400 font-medium px-4">Our AI Expert is waiting for your machine data to generate a custom efficiency roadmap.</p>
                  </div>
                </div>
              ) : (
                <div className="p-10 flex flex-col h-full bg-gradient-to-b from-white to-slate-50/30">
                  <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
                    <div className="bg-slate-900 p-2 rounded-lg">
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
                    </div>
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">AI Engineering Audit</span>
                  </div>
                  <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 prose prose-sm prose-slate max-h-[450px]">
                    <div className="text-slate-600 text-[13px] space-y-5 leading-relaxed whitespace-pre-wrap font-medium">
                      {aiInsight}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Extended Site Sections */}
      <section id="how-it-works" className="bg-slate-900 text-white py-24 no-print relative overflow-hidden">
        <div className="absolute left-0 top-0 w-64 h-64 bg-yellow-500/5 blur-[120px] rounded-full"></div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-4xl heading-font text-yellow-500 mb-8 border-l-8 border-yellow-500 pl-8">Engineering Core</h2>
              <div className="space-y-10">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-4 text-slate-400 border-b border-slate-800 pb-2">Production Algorithms</h4>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    EquipPro implements validated deterministic models used in global fleet management. Our logic accounts for bucket swell, lift consolidation, and paving density variances.
                  </p>
                  <div className="space-y-4">
                    <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-xl group hover:border-yellow-500/50 transition-colors">
                      <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500 block mb-2">Earthworks Yield</span>
                      <code className="text-yellow-400 font-mono text-xs">Q = (Cap × Fill × Eff × JobFactor × 3600) / (Ct × SwingFactor)</code>
                    </div>
                    <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 shadow-xl group hover:border-yellow-500/50 transition-colors">
                      <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500 block mb-2">Asphalt Paving Rate</span>
                      <code className="text-yellow-400 font-mono text-xs">Q = Width × Speed × Thick × Dens × Eff × 60 × TimeLoss</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 rounded-[3rem] p-12 border border-white/10 backdrop-blur-xl shadow-2xl relative">
              <div className="absolute -top-10 -right-10 bg-yellow-500 w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </div>
              <h3 className="text-2xl heading-font mb-8 text-white">Smart Optimization</h3>
              <p className="text-base text-slate-400 leading-relaxed mb-10">
                Beyond pure math, our Gemini-enhanced engine simulates field variables. It analyzes the relationship between operating costs and material types to detect financial inefficiencies that standard calculators miss.
              </p>
              <ul className="space-y-6">
                {[
                  "Dynamic fuel consumption modeling based on cycle stress.",
                  "Unit cost parity analysis vs industry regional averages.",
                  "Predictive bottleneck detection for multi-machine paving trains."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4 text-sm font-medium">
                    <div className="mt-1 w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-white py-24 no-print border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl heading-font text-slate-900 mb-4 tracking-tighter">Help Center</h2>
            <p className="text-slate-400 uppercase text-xs font-black tracking-widest">Common Questions & Methodology</p>
          </div>
          <div className="space-y-4">
            <FAQItem 
              question="How is 'Efficiency' calculated in the model?" 
              answer="Efficiency is based on the 'Working Minute' rule. 100% efficiency assumes 60 minutes of work per hour. 85% (the default) assumes approximately 50 minutes of actual production, accounting for minor delays, spotting time, and brief interruptions."
            />
            <FAQItem 
              question="What is the difference between Owning and Operating costs?" 
              answer="Owning costs include the capital purchase price, depreciation, insurance, and taxes. Operating costs include fuel, preventive maintenance (PM), major repairs, and operator wages. Both must be combined to find the true Unit Cost of production."
            />
            <FAQItem 
              question="Does the calculator support swell and shrinkage factors?" 
              answer="Yes, the 'Fill Factor' for excavators handles swell (how much volume soil gains when dug), while the 'Mix Density' and 'Lift Thickness' for paving handle consolidation factors."
            />
            <FAQItem 
              question="Can I save these results for a bid proposal?" 
              answer="Currently, you can use the 'Export Engineering Report' button to generate a clean, professional PDF-ready printout of your analysis to attach to your construction bid documents."
            />
          </div>
        </div>
      </section>

      <footer className="mt-auto py-16 border-t border-slate-200 bg-white no-print">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-8">
          <div className="flex justify-center gap-12">
            <a href="#" className="text-[11px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-[0.2em] transition-colors">Privacy</a>
            <a href="#" className="text-[11px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-[0.2em] transition-colors">Agreement</a>
            <a href="#" className="text-[11px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-[0.2em] transition-colors">Enterprise Support</a>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-px bg-slate-200"></div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]">EquipPro &copy; 2024 Heavy Asset Engineering Solutions</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Helper UI Components ---

interface InputFieldProps {
  label: string;
  name: string;
  value: any;
  onChange: (name: string, value: any) => void;
  type?: string;
  step?: string;
  tooltip?: string;
  error?: string | null;
  unit?: string;
  conversionHint?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, type = 'text', step, tooltip, error, unit, conversionHint }) => (
  <div className="space-y-2 relative">
    <div className="flex justify-between items-baseline gap-2">
      <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">
        {label}
        {tooltip && <span className="text-yellow-500 cursor-help" title={tooltip}>ⓘ</span>}
      </label>
      {unit && (
        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">
          {unit}
        </span>
      )}
    </div>
    
    <div className="relative group">
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(name, type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value)}
        className={`w-full px-5 py-4 bg-slate-50 border-2 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-4 transition-all font-bold shadow-sm ${
          error 
            ? 'border-red-500 focus:ring-red-500/10 focus:border-red-600' 
            : 'border-slate-100 focus:ring-yellow-500/10 focus:border-yellow-500'
        }`}
      />
      {conversionHint && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
          <span className="text-[10px] font-bold text-slate-400 italic bg-white/80 px-2 py-1 rounded shadow-sm border border-slate-100">
            {conversionHint}
          </span>
        </div>
      )}
    </div>

    {error ? (
      <span className="absolute -bottom-5 left-0 text-[9px] font-black text-red-500 uppercase tracking-tighter">
        {error}
      </span>
    ) : conversionHint ? (
      <span className="block text-[8px] font-bold text-slate-300 uppercase tracking-widest pl-1">
        {conversionHint}
      </span>
    ) : null}
  </div>
);

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  options: string[];
  tooltip?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, options, tooltip }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
      {label}
      {tooltip && <span className="text-yellow-500 cursor-help" title={tooltip}>ⓘ</span>}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 transition-all font-bold appearance-none cursor-pointer shadow-sm"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
);

export default App;
