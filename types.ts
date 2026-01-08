
export enum MachineCategory {
  EARTH_MOVING = 'EARTH_MOVING',
  ROLLER = 'ROLLER',
  PAVER = 'PAVER',
  MILLER = 'MILLER'
}

export enum UnitSystem {
  METRIC = 'METRIC',
  IMPERIAL = 'IMPERIAL'
}

export type MaterialType = 'Sand' | 'Clay' | 'Rock' | 'Asphalt' | 'Base Course';

export interface BaseInput {
  model: string;
  efficiency: number; // 0.1 to 1.0
  material: MaterialType;
  owningCost: number; // $/hr
  operatingCost: number; // $/hr
}

export interface EarthMovingInput extends BaseInput {
  bucketCapacity: number; // m3 or yd3
  cycleTime: number; // seconds
  fillFactor: number; // 0.1 to 1.2
  swingFactor: number; // 1.0 to 1.5 (angle of swing)
  jobFactor: number; // 0.5 to 1.0 (site conditions)
}

export interface RollerInput extends BaseInput {
  width: number; // meters or feet
  speed: number; // km/h or mph
  liftThickness: number; // meters or inches
  passes: number;
  overlap: number; // meters or feet
  vibrationBonus: number; // 1.0 to 1.2
}

export interface PaverInput extends BaseInput {
  width: number; // meters or feet
  speed: number; // m/min or ft/min
  thickness: number; // meters or inches
  density: number; // t/m3 or lb/ft3
  exchangeTime: number; // minutes lost per hour for truck swaps
  asphaltType: string;
  matTemp: number; // Celsius or Fahrenheit
}

export interface MillerInput extends BaseInput {
  width: number; // meters or feet
  speed: number; // m/min or ft/min
  depth: number; // meters or inches
  hardnessFactor: number; // 1.0 to 2.5 (material resistance)
}

export type MachineInput = EarthMovingInput | RollerInput | PaverInput | MillerInput;

export interface CalculationResult {
  productivity: number;
  unit: string;
  totalHourlyCost: number;
  unitCost: number;
  machineType: MachineCategory;
  unitSystem: UnitSystem;
  details: Record<string, any>;
}
