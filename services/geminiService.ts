
import { GoogleGenAI } from "@google/genai";
import { CalculationResult, MachineCategory } from "../types";

export const getAIInsights = async (result: CalculationResult): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const d = result.details;
  let operationalContext = "";

  // Building targeted context based on the machine type to provide high-fidelity inputs to the AI
  switch (result.machineType) {
    case MachineCategory.EARTH_MOVING:
      operationalContext = `
        - Swing Factor: ${d.swingFactor}x (Impact of swing angle on cycle time)
        - Site Difficulty: ${d.jobFactor} job factor
        - Cycle Dynamics: ${d.cycleTime}s total cycle with ${d.fillFactor} bucket fill efficiency
      `;
      break;
    case MachineCategory.ROLLER:
      operationalContext = `
        - Compaction Tech: ${d.vibrationBonus} vibration bonus
        - Pass Geometry: ${d.width} width with ${d.overlap} overlap per pass
        - Operation: ${d.passes} passes required at ${d.speed} speed
      `;
      break;
    case MachineCategory.PAVER:
      operationalContext = `
        - Logistics Bottleneck: ${d.exchangeTime} min/hr lost to truck swaps
        - Material Specs: ${d.density} density mix paved at ${d.speed} speed
        - Geometry: ${d.width} width at ${d.thickness} layer depth
        - Mix Profile: ${d.asphaltType} delivered at ${d.matTemp}${result.unitSystem === 'METRIC' ? '°C' : '°F'}
      `;
      break;
    case MachineCategory.MILLER:
      operationalContext = `
        - Material Resistance: ${d.hardnessFactor} hardness factor
        - Cutting Specs: ${d.depth} depth at ${d.speed} speed
      `;
      break;
  }

  const prompt = `
    Analyze this heavy machinery operation for a ${result.machineType} (Model: ${d.model}):
    
    ### PERFORMANCE DATA:
    - Productivity: ${result.productivity} ${result.unit}
    - Total Hourly Cost: $${result.totalHourlyCost}/hr
    - Unit Cost: $${result.unitCost} per ${result.unit.split('/')[0]}
    
    ### OPERATIONAL CONTEXT:
    - Material Type: ${d.material}
    - General Efficiency: ${d.efficiency * 100}%
    ${operationalContext}
    
    As an expert construction engineering consultant, provide a concise report in Markdown:
    1. **Performance Audit**: Evaluate if this production rate is optimal for the given costs.
    2. **Optimization Roadmap**: 3 specific technical adjustments targeting the operational parameters (e.g., cycle reduction, pass management, or logistics) to lower the unit cost.
    3. **Financial Health**: Comment on the balance between owning and operating costs.
    4. **Bottleneck Identification**: Identify the most likely physical or logistical constraint for this specific setup.
    
    Keep the tone professional, authoritative, and data-driven.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // High-reasoning model for engineering data analysis
      contents: prompt,
    });
    return response.text || "No insights available at this time.";
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "Failed to fetch AI insights. Check your connection or API key.";
  }
};
