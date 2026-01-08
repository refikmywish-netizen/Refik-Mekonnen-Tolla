
import { MachineCategory, MachineInput, CalculationResult, EarthMovingInput, RollerInput, PaverInput, MillerInput, UnitSystem } from '../types';

export const calculateProductivity = (category: MachineCategory, input: MachineInput, unitSystem: UnitSystem): CalculationResult => {
  let productivity = 0;
  let unit = '';

  const isMetric = unitSystem === UnitSystem.METRIC;

  switch (category) {
    case MachineCategory.EARTH_MOVING: {
      const em = input as EarthMovingInput;
      // Formula: Q = (C * F * E * JobFactor * 3600) / (Ct * SwingFactor)
      productivity = (em.bucketCapacity * em.fillFactor * em.efficiency * em.jobFactor * 3600) / (em.cycleTime * em.swingFactor);
      unit = isMetric ? 'm³/hr' : 'yd³/hr';
      break;
    }
    case MachineCategory.ROLLER: {
      const r = input as RollerInput;
      const effectiveWidth = Math.max(0.1, r.width - r.overlap);
      if (isMetric) {
        // Metric: Q = (EffW * S * L * E * 1000 * Bonus) / P
        productivity = (effectiveWidth * r.speed * r.liftThickness * r.efficiency * r.vibrationBonus * 1000) / r.passes;
        unit = 'm³/hr';
      } else {
        // Imperial: Q = (EffW * S * (L/12) * E * 5280 * Bonus) / (P * 27)
        productivity = (effectiveWidth * r.speed * (r.liftThickness / 12) * r.efficiency * r.vibrationBonus * 5280) / (r.passes * 27);
        unit = 'yd³/hr';
      }
      break;
    }
    case MachineCategory.PAVER: {
      const p = input as PaverInput;
      const timeLossFactor = Math.max(0.1, (60 - p.exchangeTime) / 60);
      if (isMetric) {
        // Metric: Q = W * S * T * D * E * 60 * TimeLoss
        productivity = p.width * p.speed * p.thickness * p.density * p.efficiency * 60 * timeLossFactor;
        unit = 'Tons/hr';
      } else {
        // Imperial: Q = W * S * (T/12) * D * E * 60 / 2000 * TimeLoss
        productivity = (p.width * p.speed * (p.thickness / 12) * p.density * p.efficiency * 60 * timeLossFactor) / 2000;
        unit = 'US Tons/hr';
      }
      break;
    }
    case MachineCategory.MILLER: {
      const m = input as MillerInput;
      // Hardness inversely affects speed/output
      const hardnessSpeed = m.speed / m.hardnessFactor;
      if (isMetric) {
        productivity = m.width * hardnessSpeed * m.depth * m.efficiency * 60;
        unit = 'm³/hr';
      } else {
        productivity = (m.width * hardnessSpeed * (m.depth / 12) * m.efficiency * 60) / 27;
        unit = 'yd³/hr';
      }
      break;
    }
  }

  const totalHourlyCost = (input.owningCost || 0) + (input.operatingCost || 0);
  const unitCost = productivity > 0 ? totalHourlyCost / productivity : 0;

  return {
    productivity: Number(productivity.toFixed(2)),
    unit,
    totalHourlyCost: Number(totalHourlyCost.toFixed(2)),
    unitCost: Number(unitCost.toFixed(2)),
    machineType: category,
    unitSystem,
    details: { ...input }
  };
};
