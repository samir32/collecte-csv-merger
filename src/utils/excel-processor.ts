import { CsvRow, ColumnInfo } from './csv-logic';

// Environmental conditions mapping (from VBA)
export const ENVIRONMENTAL_CONDITIONS = {
  // Particle contamination
  PMILD: 'Particle Mild',
  PHVY: 'Particle Heavy',
  
  // Moisture
  MMOD: 'Moisture Moderate', 
  MHVY: 'Moisture Heavy',
  
  // Vibration
  VHVY: 'Vibration Heavy',
  
  // Orientation
  HORIZ: 'Horizontal',
  VERT: 'Vertical',
  
  // Runtime
  EHR: '>=16 hrs/day',
  SHR: '<=8 hrs/day',
  
  // Temperature
  L80: '<80°C',
  H80: '>=80°C',
} as const;

// Status values (from VBA)
export const STATUS_VALUES = {
  DONE: 'Yes',
  NOT_ACCESSIBLE: 'Not Accessible',
  NOT_FOUND: 'Not Found',
  NLP: 'NLP',
  QUESTION: 'Question',
  INTERNAL_QUESTION: 'Internal Question',
  OUT_OF_SCOPE: 'Out of scope',
  OBSOLETE: 'Obsolete',
  NA: 'N/A',
} as const;

// Criticality levels (from VBA)
export const CRITICALITY = {
  CRITICAL: 'C',
  COMPLICATED: 'Complicated',
  CRITICAL_COMPLICATED: 'Critical & Complicated',
} as const;

export interface EnvironmentalConditions {
  particle?: string;
  moisture?: string;
  vibration?: string;
  orientation?: string;
  runtime?: string;
  temperature?: string;
}

export interface ProcessedEquipment extends CsvRow {
  // Core fields
  assetNumber: string;
  assetDescription?: string;
  area?: string;
  component?: string;
  subComponent?: string;
  
  // Criticality
  criticality?: string;
  isCritical: boolean;
  isComplicated: boolean;
  
  // Environmental conditions
  conditions: EnvironmentalConditions;
  
  // Status tracking
  status: string;
  isDone: boolean;
  
  // Equipment features (from VBA)
  features: {
    variableSpeed?: boolean;
    flowStop?: boolean;
    relief?: boolean;
    pipingRequired?: boolean;
    pipingExists?: boolean;
    autoluber?: boolean;
    bsw?: boolean;
    cooler?: boolean;
    motor?: boolean;
    filter?: boolean;
    frl?: boolean;
    heater?: boolean;
    qc?: boolean;
    noModifications?: boolean;
  };
  
  // Lubrication info
  currentLubricant?: string;
  recommendedLubricant?: string;
  lubricantLIS?: string;
  numberOfPoints?: number;
  
  // Procedure info
  procedureNumber?: string;
  procedure?: string;
  subTask1?: string;
  subTask2?: string;
  measuredTask1?: string;
  measuredTask2?: string;
  
  // Operation details
  operationStatus?: string;
  componentClass?: string;
  timeInterval?: number;
  requiredTime?: number;
  recommendedQuantity?: number;
  unit?: string;
  
  // Notes
  comment?: string;
  
  // Tracking
  user?: string;
  dateTime?: string;
  idemTo?: string;
  uniqueRowId?: string;
  pageNumber?: number;
}

export interface ExcelProcessingResult {
  processed: ProcessedEquipment[];
  byStatus: {
    procedures: ProcessedEquipment[];
    notCollected: ProcessedEquipment[];
    noLubePoint: ProcessedEquipment[];
    sampled: ProcessedEquipment[];
    questions: ProcessedEquipment[];
  };
  stats: {
    total: number;
    critical: number;
    complicated: number;
    done: number;
    todo: number;
    notAccessible: number;
  };
}

/**
 * Process CSV data with Excel VBA logic
 */
export function processWithExcelLogic(
  data: CsvRow[],
  schema: ColumnInfo[]
): ExcelProcessingResult {
  
  // Helper to get column value
  const getCol = (row: CsvRow, colName: string): string => {
    const col = schema.find(c => c.displayName.trim() === colName);
    return col ? (row[col.internalKey] || '').trim() : '';
  };
  
  // Process each row
  const processed: ProcessedEquipment[] = data.map((row, index) => {
    // Extract core fields
    const assetNumber = getCol(row, 'Asset number');
    const doneValue = getCol(row, 'Done?');
    const critical = getCol(row, 'CRITICAL');
    const complicated = getCol(row, 'Complicated');
    const critNum = getCol(row, 'CRIT #');
    
    // Determine criticality
    const isCritical = critical === 'C' || critNum === 'C';
    const isComplicated = complicated?.toLowerCase() === 'complicated';
    let criticality = '';
    if (isCritical && isComplicated) {
      criticality = CRITICALITY.CRITICAL_COMPLICATED;
    } else if (isCritical) {
      criticality = CRITICALITY.CRITICAL;
    } else if (isComplicated) {
      criticality = CRITICALITY.COMPLICATED;
    }
    
    // Extract environmental conditions
    const conditions: EnvironmentalConditions = {};
    
    // Scan for condition markers in all columns
    Object.entries(row).forEach(([key, value]) => {
      const val = (value || '').trim();
      
      // Particle
      if (val === 'Particle Mild' || val === 'PMILD') conditions.particle = ENVIRONMENTAL_CONDITIONS.PMILD;
      if (val === 'Particle Heavy' || val === 'PHVY') conditions.particle = ENVIRONMENTAL_CONDITIONS.PHVY;
      
      // Moisture
      if (val === 'Moisture Moderate' || val === 'MMOD') conditions.moisture = ENVIRONMENTAL_CONDITIONS.MMOD;
      if (val === 'Moisture Heavy' || val === 'MHVY') conditions.moisture = ENVIRONMENTAL_CONDITIONS.MHVY;
      
      // Vibration
      if (val === 'Vibration Heavy' || val === 'VHVY') conditions.vibration = ENVIRONMENTAL_CONDITIONS.VHVY;
      
      // Orientation
      if (val === 'Horizontal' || val === 'HORIZ') conditions.orientation = ENVIRONMENTAL_CONDITIONS.HORIZ;
      if (val === 'Vertical' || val === 'VERT') conditions.orientation = ENVIRONMENTAL_CONDITIONS.VERT;
      
      // Runtime
      if (val === '>=16 hrs/day' || val === 'EHR') conditions.runtime = ENVIRONMENTAL_CONDITIONS.EHR;
      if (val === '<=8 hrs/day' || val === 'SHR') conditions.runtime = ENVIRONMENTAL_CONDITIONS.SHR;
      
      // Temperature
      if (val === '<80°C' || val === 'L80') conditions.temperature = ENVIRONMENTAL_CONDITIONS.L80;
      if (val === '>=80°C' || val === 'H80') conditions.temperature = ENVIRONMENTAL_CONDITIONS.H80;
    });
    
    // Extract equipment features
    const features: ProcessedEquipment['features'] = {
      variableSpeed: getCol(row, 'Variable speed') === '1',
      flowStop: getCol(row, 'Flow stop') === '1',
      relief: getCol(row, 'Relief') === '1',
      pipingRequired: getCol(row, 'Piping required') === '1',
      pipingExists: getCol(row, 'Piping exists') === '1',
      autoluber: getCol(row, 'Autoluber needed') === '1',
      bsw: getCol(row, 'BS&W') === '1',
      cooler: getCol(row, 'Cooler') === '1',
      motor: getCol(row, 'Motor') === '1',
      filter: getCol(row, 'Filter(s)') === '1',
      frl: getCol(row, 'FRL') === '1',
      heater: getCol(row, 'Heater') === '1',
      qc: getCol(row, "QC's") === '1',
      noModifications: getCol(row, 'No modifications required') === '1',
    };
    
    // Determine status
    let status = doneValue;
    const isDone = doneValue.toLowerCase() === 'yes';
    
    if (doneValue.toLowerCase().includes('not accessible') || 
        doneValue.toLowerCase().includes('non accessible')) {
      status = STATUS_VALUES.NOT_ACCESSIBLE;
    } else if (doneValue.toLowerCase().includes('not found') || 
               doneValue.toLowerCase().includes('pas trouvé')) {
      status = STATUS_VALUES.NOT_FOUND;
    } else if (doneValue.toLowerCase() === 'nlp') {
      status = STATUS_VALUES.NLP;
    } else if (doneValue.toLowerCase().includes('question')) {
      status = STATUS_VALUES.QUESTION;
    } else if (doneValue.toLowerCase().includes('out of scope') || 
               doneValue.toLowerCase().includes('hors scope') ||
               doneValue.toLowerCase().includes('obsolete')) {
      status = STATUS_VALUES.OUT_OF_SCOPE;
    }
    
    return {
      ...row,
      assetNumber,
      assetDescription: getCol(row, 'Asset description'),
      area: getCol(row, 'Area'),
      component: getCol(row, 'Component'),
      subComponent: getCol(row, 'Sub-Component'),
      
      criticality,
      isCritical,
      isComplicated,
      
      conditions,
      
      status,
      isDone,
      
      features,
      
      currentLubricant: getCol(row, 'Current Lubricant'),
      recommendedLubricant: getCol(row, 'Recommended Lubricant'),
      lubricantLIS: getCol(row, 'Recommended Lubricant LIS Number'),
      numberOfPoints: parseInt(getCol(row, '# of Points')) || undefined,
      
      procedureNumber: getCol(row, 'Procedure #'),
      procedure: getCol(row, 'Procedure'),
      subTask1: getCol(row, 'Sub Task 1'),
      subTask2: getCol(row, 'Sub Task 2'),
      measuredTask1: getCol(row, 'Measured Task 1'),
      measuredTask2: getCol(row, 'Measured Task 2'),
      
      operationStatus: getCol(row, 'Operation Status'),
      componentClass: getCol(row, 'Component Class'),
      timeInterval: parseInt(getCol(row, 'Time Interval (days)')) || undefined,
      requiredTime: parseInt(getCol(row, 'Required Time (min)')) || undefined,
      recommendedQuantity: parseFloat(getCol(row, 'Recommended Quantity')) || undefined,
      unit: getCol(row, 'Unit'),
      
      comment: getCol(row, 'Comment/Question'),
      
      user: getCol(row, 'User'),
      dateTime: getCol(row, 'Date/Time'),
      idemTo: getCol(row, '*Idem to'),
      uniqueRowId: getCol(row, 'UniqueRowID'),
      pageNumber: undefined, // Will be assigned later
    };
  });
  
  // Categorize by status (mimicking Excel sheets)
  const byStatus = {
    procedures: processed.filter(p => p.isDone && p.assetNumber),
    notCollected: processed.filter(p => 
      p.status === STATUS_VALUES.NOT_FOUND || 
      !p.assetNumber
    ),
    noLubePoint: processed.filter(p => p.status === STATUS_VALUES.NLP),
    sampled: processed.filter(p => 
      p.status.toLowerCase().includes('sampl') || 
      p.status.toLowerCase().includes('échantillon')
    ),
    questions: processed.filter(p => 
      p.status.includes('Question') || 
      p.comment
    ),
  };
  
  // Calculate stats
  const stats = {
    total: processed.length,
    critical: processed.filter(p => p.isCritical).length,
    complicated: processed.filter(p => p.isComplicated).length,
    done: processed.filter(p => p.isDone).length,
    todo: processed.filter(p => !p.isDone).length,
    notAccessible: processed.filter(p => p.status === STATUS_VALUES.NOT_ACCESSIBLE).length,
  };
  
  return {
    processed,
    byStatus,
    stats,
  };
}

/**
 * Assign page numbers to equipment (mimicking Excel PAGEID function)
 */
export function assignPageNumbers(equipment: ProcessedEquipment[]): ProcessedEquipment[] {
  const grouped = new Map<string, ProcessedEquipment[]>();
  
  // Group by area and asset
  equipment.forEach(eq => {
    const key = `${eq.area || 'Unknown'}_${eq.assetNumber || 'Unknown'}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(eq);
  });
  
  // Assign page numbers
  let pageNum = 1;
  const result: ProcessedEquipment[] = [];
  
  grouped.forEach((items) => {
    items.forEach(item => {
      result.push({
        ...item,
        pageNumber: pageNum,
      });
    });
    pageNum++;
  });
  
  return result;
}
