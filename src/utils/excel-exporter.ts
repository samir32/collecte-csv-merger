import * as ExcelJS from 'exceljs';
import { ProcessedEquipment } from './excel-processor';

/**
 * Export processed equipment to formatted Excel file (mimicking VBA output)
 */
export async function exportToFormattedExcel(
  equipment: ProcessedEquipment[],
  categories: {
    procedures: ProcessedEquipment[];
    notCollected: ProcessedEquipment[];
    noLubePoint: ProcessedEquipment[];
    sampled: ProcessedEquipment[];
    questions: ProcessedEquipment[];
  },
  clientName: string = 'IAMGold-Westwood'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'Lubrication Pro Web App';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Create main procedures sheet
  createProceduresSheet(workbook, categories.procedures, clientName);
  
  // Create category sheets
  createCategorySheet(workbook, categories.notCollected, 'Pas collécté', 'Not Collected');
  createCategorySheet(workbook, categories.noLubePoint, 'Pas lubrifié', 'No Lube Point');
  createCategorySheet(workbook, categories.sampled, 'Echantillion', 'Sampled');
  createCategorySheet(workbook, categories.questions, 'Questions', 'Questions');
  
  // Download the file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${clientName}_Lubrication_Schedule_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create main procedures worksheet with VBA-style formatting
 */
function createProceduresSheet(
  workbook: ExcelJS.Workbook,
  equipment: ProcessedEquipment[],
  sheetName: string
) {
  const sheet = workbook.addWorksheet(sheetName);
  
  // Define columns (matching VBA structure)
  const columns = [
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Area', key: 'area', width: 14 },
    { header: '', key: 'separator', width: 3 },
    { header: 'Asset number', key: 'assetNumber', width: 13 },
    { header: 'Asset description', key: 'assetDescription', width: 25 },
    { header: 'Component', key: 'component', width: 20 },
    { header: 'Sub-Component', key: 'subComponent', width: 20 },
    { header: 'Failure Mode 1', key: 'failureMode1', width: 15 },
    { header: 'Current Lubricant', key: 'currentLubricant', width: 18 },
    { header: 'Recommended Lubricant', key: 'recommendedLubricant', width: 20 },
    { header: 'LIS Number', key: 'lisNumber', width: 18 },
    { header: '# of Points', key: 'numberOfPoints', width: 10 },
    { header: 'Procedure #', key: 'procedureNumber', width: 12 },
    { header: 'Procedure', key: 'procedure', width: 25 },
    { header: 'Sub Task 1', key: 'subTask1', width: 20 },
    { header: 'Sub Task 2', key: 'subTask2', width: 20 },
    { header: 'Measured Task 1', key: 'measuredTask1', width: 20 },
    { header: 'Measured Task 2', key: 'measuredTask2', width: 20 },
    { header: 'Operation Status', key: 'operationStatus', width: 15 },
    { header: 'Component Class', key: 'componentClass', width: 18 },
    { header: 'Time Interval (days)', key: 'timeInterval', width: 18 },
    { header: 'Required Time (min)', key: 'requiredTime', width: 17 },
    { header: 'Recommended Quantity', key: 'recommendedQuantity', width: 18 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Comment/Question', key: 'comment', width: 25 },
    { header: 'Particle', key: 'particle', width: 12 },
    { header: 'Moisture', key: 'moisture', width: 12 },
    { header: 'Vibration', key: 'vibration', width: 12 },
    { header: 'Orientation', key: 'orientation', width: 12 },
    { header: 'Temperature', key: 'temperature', width: 12 },
    { header: 'Runtime', key: 'runtime', width: 12 },
  ];
  
  sheet.columns = columns;
  
  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };
  headerRow.alignment = { 
    vertical: 'middle', 
    horizontal: 'center',
    wrapText: true
  };
  headerRow.height = 30;
  
  // Add data rows
  equipment.forEach((eq) => {
    // Determine priority
    let priority = '';
    if (eq.isCritical && eq.isComplicated) {
      priority = 'Critical & Complicated';
    } else if (eq.isCritical) {
      priority = 'Critical';
    } else if (eq.isComplicated) {
      priority = 'Complicated';
    }
    
    const row = sheet.addRow({
      priority,
      area: eq.area || '',
      separator: '',
      assetNumber: eq.assetNumber || '',
      assetDescription: eq.assetDescription || '',
      component: eq.component || '',
      subComponent: eq.subComponent || '',
      failureMode1: '', // Would need to be extracted from data
      currentLubricant: eq.currentLubricant || '',
      recommendedLubricant: eq.recommendedLubricant || '',
      lisNumber: eq.lubricantLIS || '',
      numberOfPoints: eq.numberOfPoints || '',
      procedureNumber: eq.procedureNumber || '',
      procedure: eq.procedure || '',
      subTask1: eq.subTask1 || '',
      subTask2: eq.subTask2 || '',
      measuredTask1: eq.measuredTask1 || '',
      measuredTask2: eq.measuredTask2 || '',
      operationStatus: eq.operationStatus || '',
      componentClass: eq.componentClass || '',
      timeInterval: eq.timeInterval || '',
      requiredTime: eq.requiredTime || '',
      recommendedQuantity: eq.recommendedQuantity || '',
      unit: eq.unit || '',
      comment: eq.comment || '',
      particle: eq.conditions.particle || '',
      moisture: eq.conditions.moisture || '',
      vibration: eq.conditions.vibration || '',
      orientation: eq.conditions.orientation || '',
      temperature: eq.conditions.temperature || '',
      runtime: eq.conditions.runtime || '',
    });
    
    // Color code by priority
    if (priority.includes('Critical')) {
      row.getCell('priority').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF6B6B' } // Red
      };
      row.getCell('priority').font = { bold: true, color: { argb: 'FFFFFFFF' } };
    } else if (priority.includes('Complicated')) {
      row.getCell('priority').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD93D' } // Yellow
      };
      row.getCell('priority').font = { bold: true };
    }
    
    // Center alignment for priority and key columns
    row.getCell('priority').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('assetNumber').alignment = { horizontal: 'center', vertical: 'middle' };
  });
  
  // Add borders to all cells
  const lastRow = sheet.rowCount;
  const lastCol = columns.length;
  
  for (let row = 1; row <= lastRow; row++) {
    for (let col = 1; col <= lastCol; col++) {
      const cell = sheet.getRow(row).getCell(col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    }
  }
  
  // Freeze header row
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

/**
 * Create category worksheets (Not Collected, No Lube Point, etc.)
 */
function createCategorySheet(
  workbook: ExcelJS.Workbook,
  equipment: ProcessedEquipment[],
  frenchName: string,
  englishName: string
) {
  const sheet = workbook.addWorksheet(frenchName);
  
  // Simplified columns for category sheets
  const columns = [
    { header: 'Asset number', key: 'assetNumber', width: 15 },
    { header: 'Asset description', key: 'assetDescription', width: 30 },
    { header: 'Area', key: 'area', width: 15 },
    { header: 'Component', key: 'component', width: 20 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'User', key: 'user', width: 15 },
    { header: 'Date/Time', key: 'dateTime', width: 20 },
    { header: 'Comment', key: 'comment', width: 30 },
  ];
  
  sheet.columns = columns;
  
  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFB4D7FF' } // Light blue
  };
  headerRow.alignment = { 
    vertical: 'middle', 
    horizontal: 'center',
    wrapText: true
  };
  headerRow.height = 25;
  
  // Add data
  equipment.forEach((eq) => {
    sheet.addRow({
      assetNumber: eq.assetNumber || '',
      assetDescription: eq.assetDescription || '',
      area: eq.area || '',
      component: eq.component || '',
      status: eq.status || '',
      user: eq.user || '',
      dateTime: eq.dateTime || '',
      comment: eq.comment || '',
    });
  });
  
  // Add borders
  const lastRow = sheet.rowCount;
  const lastCol = columns.length;
  
  for (let row = 1; row <= lastRow; row++) {
    for (let col = 1; col <= lastCol; col++) {
      const cell = sheet.getRow(row).getCell(col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    }
  }
  
  // Freeze header
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
}

/**
 * Quick export of current view to Excel
 */
export async function exportCurrentViewToExcel(
  equipment: ProcessedEquipment[],
  filename: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Export');
  
  // Add all relevant columns
  const columns = [
    { header: 'Priority', key: 'priority', width: 18 },
    { header: 'Asset Number', key: 'assetNumber', width: 15 },
    { header: 'Description', key: 'assetDescription', width: 30 },
    { header: 'Area', key: 'area', width: 15 },
    { header: 'Component', key: 'component', width: 20 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Recommended Lubricant', key: 'recommendedLubricant', width: 25 },
    { header: 'Particle', key: 'particle', width: 15 },
    { header: 'Moisture', key: 'moisture', width: 15 },
    { header: 'Vibration', key: 'vibration', width: 15 },
    { header: 'Orientation', key: 'orientation', width: 12 },
    { header: 'Temperature', key: 'temperature', width: 12 },
    { header: 'Runtime', key: 'runtime', width: 15 },
  ];
  
  sheet.columns = columns;
  
  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  
  // Add data
  equipment.forEach((eq) => {
    let priority = '';
    if (eq.isCritical && eq.isComplicated) priority = 'Critical & Complicated';
    else if (eq.isCritical) priority = 'Critical';
    else if (eq.isComplicated) priority = 'Complicated';
    
    sheet.addRow({
      priority,
      assetNumber: eq.assetNumber,
      assetDescription: eq.assetDescription,
      area: eq.area,
      component: eq.component,
      status: eq.status,
      recommendedLubricant: eq.recommendedLubricant,
      particle: eq.conditions.particle,
      moisture: eq.conditions.moisture,
      vibration: eq.conditions.vibration,
      orientation: eq.conditions.orientation,
      temperature: eq.conditions.temperature,
      runtime: eq.conditions.runtime,
    });
  });
  
  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
