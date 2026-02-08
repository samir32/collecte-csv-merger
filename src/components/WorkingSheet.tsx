import React, { useState } from 'react';
import { ProcessedEquipment } from '../utils/excel-processor';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { CsvRow, ColumnInfo } from '../utils/csv-logic';
import menuData from '../data/menu-dropdowns.json';

interface WorkingSheetProps {
  equipment: ProcessedEquipment[];
  rawData: CsvRow[];
  schema: ColumnInfo[];
  clientName: string;
  language: 'en' | 'fr';
  onUpdate: (updatedEquipment: ProcessedEquipment[]) => void;
}

interface WorkingRow {
  id: string;
  criticality?: string;
  status?: string;
  area?: string;
  componentClass?: string;
  subComponent?: string;
  subComponentDescription?: string;
  failureMode1?: string;
  failureMode2?: string;
  currentLubricant?: string;
  recommendedLubricant?: string;
  lubricantLIS?: string;
  numberOfPoints?: string;
  procedureNumber?: string;
  procedure?: string;
  subTask1?: string;
  subTask2?: string;
  measuredTask1?: string;
  measuredTask2?: string;
  operationStatus?: string;
  timeInterval?: string;
  requiredTime?: string;
  recommendedQuantity?: string;
  unit?: string;
  comment?: string;
}

export function WorkingSheet({ equipment, rawData, schema, clientName, language, onUpdate }: WorkingSheetProps) {
  // Helper function to get column value using schema
  const getCol = (row: CsvRow, columnName: string, occurrence: number = 1): string => {
    if (!row || !schema) return '';
    const col = schema.find(c => c.displayName === columnName && c.occurrenceIndex === occurrence);
    return col ? (row[col.internalKey] || '') : '';
  };

  // Initialize equipment rows with "Idem to" logic
  const initializeEquipmentRows = (): Map<number, WorkingRow[]> => {
    const rowsMap = new Map<number, WorkingRow[]>();
    
    equipment.forEach((equip, index) => {
      // Find raw data for this equipment
      const equipRawData = rawData?.find(row => getCol(row, 'Asset number') === equip.assetNumber);
      
      if (equipRawData) {
        const idemTo = getCol(equipRawData, '*Idem to');
        
        if (idemTo && idemTo.trim() !== '') {
          // This equipment references another - find that equipment's index
          const referencedIndex = equipment.findIndex(e => e.assetNumber === idemTo.trim());
          
          if (referencedIndex !== -1 && rowsMap.has(referencedIndex)) {
            // Copy rows from referenced equipment (deep clone)
            const referencedRows = rowsMap.get(referencedIndex)!;
            rowsMap.set(index, referencedRows.map(row => ({ ...row, id: `row-${index}-${row.id}` })));
          } else {
            // Referenced equipment not found or not initialized yet, use default 3 rows
            rowsMap.set(index, [
              { id: `row-${index}-0` },
              { id: `row-${index}-1` },
              { id: `row-${index}-2` }
            ]);
          }
        } else {
          // No "Idem to" - start with 3 empty rows
          rowsMap.set(index, [
            { id: `row-${index}-0` },
            { id: `row-${index}-1` },
            { id: `row-${index}-2` }
          ]);
        }
      } else {
        // No raw data - default 3 rows
        rowsMap.set(index, [
          { id: `row-${index}-0` },
          { id: `row-${index}-1` },
          { id: `row-${index}-2` }
        ]);
      }
    });
    
    return rowsMap;
  };

  const [currentPage, setCurrentPage] = useState(0);
  const [equipmentRows, setEquipmentRows] = useState<Map<number, WorkingRow[]>>(() => initializeEquipmentRows());

  // Debug logging
  console.log('WorkingSheet render:', {
    equipmentCount: equipment?.length || 0,
    rawDataCount: rawData?.length || 0,
    schemaCount: schema?.length || 0,
    currentPage
  });

  // Safety check - if no equipment, show message
  if (!equipment || equipment.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 text-lg">No equipment data available. Please upload CSV files first.</p>
      </div>
    );
  }

  const currentEquipment = equipment[currentPage];
  
  // Log matching details
  console.log('DATA MATCHING DEBUG:', {
    currentEquipment_assetNumber: currentEquipment?.assetNumber,
    rawData_length: rawData?.length,
    first_3_rawData_assetNumbers: rawData?.slice(0, 3).map(r => getCol(r, 'Asset number')),
    all_unique_assetNumbers: [...new Set(rawData?.map(r => getCol(r, 'Asset number')))]
  });
  
  // Use getCol to access Asset number with proper internal key
  const currentRawData = rawData?.find(row => getCol(row, 'Asset number') === currentEquipment?.assetNumber) || null;
  
  // Log the result
  console.log('Match result:', {
    found: !!currentRawData,
    searching_for: currentEquipment?.assetNumber,
    matched_row: currentRawData ? 'YES' : 'NO',
    matched_asset: currentRawData ? getCol(currentRawData, 'Asset number') : 'N/A'
  });
  
  const currentRows = equipmentRows.get(currentPage) || [{ id: `row-0` }];

  const labels = {
    fr: {
      criticality: 'CRITICITÉ',
      status: 'Statut',
      area: 'Secteur',
      componentClass: 'Classe',
      subComponent: 'Sous-comp.',
      subComponentDesc: 'Desc.',
      failureMode1: 'Défaillance 1',
      failureMode2: 'Défaillance 2',
      currentLubricant: 'Lub. actuel',
      recommendedLubricant: 'Lub. recommandé',
      lubricantLIS: 'LIS',
      numberOfPoints: 'Nb points',
      procedureNumber: 'Proc. #',
      procedure: 'Procédure',
      subTask1: 'Sous-tâche 1',
      subTask2: 'Sous-tâche 2',
      measuredTask1: 'Tâche mes. 1',
      measuredTask2: 'Tâche mes. 2',
      operationStatus: 'État op.',
      timeInterval: 'Interval (j)',
      requiredTime: 'Temps (min)',
      recommendedQuantity: 'Quantité',
      unit: 'Unité',
      comment: 'Commentaire',
      particle: 'Particle',
      moisture: 'Humidité',
      vibration: 'Vibration',
      orientation: 'Orientation',
      temperature: 'Température',
      runtime: "Temps d'op.",
    },
    en: {
      criticality: 'PRIORITY',
      status: 'Status',
      area: 'Area',
      componentClass: 'Class',
      subComponent: 'Sub-comp.',
      subComponentDesc: 'Desc.',
      failureMode1: 'Failure 1',
      failureMode2: 'Failure 2',
      currentLubricant: 'Current Lube',
      recommendedLubricant: 'Rec. Lube',
      lubricantLIS: 'LIS',
      numberOfPoints: '# Points',
      procedureNumber: 'Proc. #',
      procedure: 'Procedure',
      subTask1: 'Sub Task 1',
      subTask2: 'Sub Task 2',
      measuredTask1: 'Meas. Task 1',
      measuredTask2: 'Meas. Task 2',
      operationStatus: 'Op. Status',
      timeInterval: 'Interval (d)',
      requiredTime: 'Time (min)',
      recommendedQuantity: 'Quantity',
      unit: 'Unit',
      comment: 'Comment',
      particle: 'Particle',
      moisture: 'Moisture',
      vibration: 'Vibration',
      orientation: 'Orientation',
      temperature: 'Temperature',
      runtime: 'Runtime',
    },
  };

  const t = labels[language];

  const addRow = () => {
    const newRows = [...currentRows, { id: `row-${Date.now()}` }];
    const newMap = new Map(equipmentRows);
    newMap.set(currentPage, newRows);
    
    // Sync to equipment that reference this one via "Idem to"
    const currentAssetNumber = currentEquipment?.assetNumber;
    equipment.forEach((equip, index) => {
      if (index !== currentPage) {
        const equipRawData = rawData?.find(row => getCol(row, 'Asset number') === equip.assetNumber);
        if (equipRawData) {
          const idemTo = getCol(equipRawData, '*Idem to');
          if (idemTo === currentAssetNumber) {
            newMap.set(index, newRows.map(row => ({ ...row, id: `row-${index}-${row.id}` })));
          }
        }
      }
    });
    
    setEquipmentRows(newMap);
  };

  const deleteRow = (rowIndex: number) => {
    if (currentRows.length <= 1) return;
    const newRows = currentRows.filter((_, i) => i !== rowIndex);
    const newMap = new Map(equipmentRows);
    newMap.set(currentPage, newRows);
    
    // Sync to equipment that reference this one via "Idem to"
    const currentAssetNumber = currentEquipment?.assetNumber;
    equipment.forEach((equip, index) => {
      if (index !== currentPage) {
        const equipRawData = rawData?.find(row => getCol(row, 'Asset number') === equip.assetNumber);
        if (equipRawData) {
          const idemTo = getCol(equipRawData, '*Idem to');
          if (idemTo === currentAssetNumber) {
            newMap.set(index, newRows.map(row => ({ ...row, id: `row-${index}-${row.id}` })));
          }
        }
      }
    });
    
    setEquipmentRows(newMap);
  };

  const updateCell = (rowIndex: number, field: keyof WorkingRow, value: string) => {
    const newRows = [...currentRows];
    newRows[rowIndex] = { ...newRows[rowIndex], [field]: value };
    
    if (field === 'recommendedLubricant') {
      const lube = menuData.lubricants.find(l => l.name === value);
      if (lube) {
        newRows[rowIndex].lubricantLIS = lube.lis;
      }
    }
    
    const newMap = new Map(equipmentRows);
    newMap.set(currentPage, newRows);
    
    // Sync to equipment that reference this one via "Idem to"
    const currentAssetNumber = currentEquipment?.assetNumber;
    equipment.forEach((equip, index) => {
      if (index !== currentPage) {
        const equipRawData = rawData?.find(row => getCol(row, 'Asset number') === equip.assetNumber);
        if (equipRawData) {
          const idemTo = getCol(equipRawData, '*Idem to');
          if (idemTo === currentAssetNumber) {
            // This equipment references the current one - copy rows
            newMap.set(index, newRows.map(row => ({ ...row, id: `row-${index}-${row.id}` })));
          }
        }
      }
    });
    
    setEquipmentRows(newMap);
  };

  const renderCell = (rowIndex: number, field: keyof WorkingRow, width: string, type: 'text' | 'dropdown' = 'text', options?: string[]) => {
    const value = currentRows[rowIndex]?.[field] || '';

    if (type === 'dropdown' && options) {
      return (
        <select
          value={value}
          onChange={(e) => updateCell(rowIndex, field, e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ width }}
        >
          <option value="">-</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => updateCell(rowIndex, field, e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        style={{ width }}
      />
    );
  };

  const exportData = () => {
    // Create CSV with equipment info + editable fields
    const headers = [
      'Asset Number',
      'Asset Description',
      'Asset Description 2',
      'User',
      'Date/Time',
      'Done?',
      'CRIT #',
      'Row #',
      'Criticality',
      'Status',
      'Area',
      'Component Class',
      'Sub-Component',
      'Sub-Component Description',
      'Failure Mode 1',
      'Failure Mode 2',
      'Current Lubricant',
      'Recommended Lubricant',
      'Lubricant LIS',
      'Number of Points',
      'Procedure Number',
      'Procedure',
      'Sub Task 1',
      'Sub Task 2',
      'Measured Task 1',
      'Measured Task 2',
      'Operation Status',
      'Time Interval',
      'Required Time',
      'Recommended Quantity',
      'Unit',
      'Comment'
    ];

    const csvRows: string[] = [];
    csvRows.push(headers.join(','));

    equipment.forEach((equip, equipIndex) => {
      const rows = equipmentRows.get(equipIndex) || [];
      const equipRawData = rawData?.find(row => getCol(row, 'Asset number') === equip.assetNumber);
      
      const assetNumber = equip.assetNumber || '';
      const assetDesc = equipRawData ? getCol(equipRawData, 'Asset description') : '';
      const assetDesc2 = equipRawData ? getCol(equipRawData, 'Asset description2') : '';
      const user = equipRawData ? getCol(equipRawData, 'User') : '';
      const dateTime = equipRawData ? getCol(equipRawData, 'Date/Time') : '';
      const done = equipRawData ? getCol(equipRawData, 'Done?') : '';
      const critNum = equipRawData ? getCol(equipRawData, 'CRIT #') : '';

      rows.forEach((row, rowIndex) => {
        const rowData = [
          `"${assetNumber}"`,
          `"${assetDesc}"`,
          `"${assetDesc2}"`,
          `"${user}"`,
          `"${dateTime}"`,
          `"${done}"`,
          `"${critNum}"`,
          rowIndex + 1,
          `"${row.criticality || ''}"`,
          `"${row.status || ''}"`,
          `"${row.area || ''}"`,
          `"${row.componentClass || ''}"`,
          `"${row.subComponent || ''}"`,
          `"${row.subComponentDescription || ''}"`,
          `"${row.failureMode1 || ''}"`,
          `"${row.failureMode2 || ''}"`,
          `"${row.currentLubricant || ''}"`,
          `"${row.recommendedLubricant || ''}"`,
          `"${row.lubricantLIS || ''}"`,
          `"${row.numberOfPoints || ''}"`,
          `"${row.procedureNumber || ''}"`,
          `"${row.procedure || ''}"`,
          `"${row.subTask1 || ''}"`,
          `"${row.subTask2 || ''}"`,
          `"${row.measuredTask1 || ''}"`,
          `"${row.measuredTask2 || ''}"`,
          `"${row.operationStatus || ''}"`,
          `"${row.timeInterval || ''}"`,
          `"${row.requiredTime || ''}"`,
          `"${row.recommendedQuantity || ''}"`,
          `"${row.unit || ''}"`,
          `"${row.comment || ''}"`
        ];
        csvRows.push(rowData.join(','));
      });
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${clientName}_WorkingSheet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header with Pagination and Export */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {currentEquipment?.assetNumber || 'No Asset #'}
              </h2>
              <p className="text-sm text-gray-600">
                Equipment {currentPage + 1} of {equipment.length}
              </p>
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(equipment.length - 1, currentPage + 1))}
              disabled={currentPage === equipment.length - 1}
              className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={addRow}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              <Plus size={20} />
              Add Row
            </button>
            <button
              onClick={exportData}
              style={{
                padding: '12px 24px',
                backgroundColor: '#16a34a',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
            >
              Export Data
            </button>
          </div>
        </div>
        
        {/* Equipment Description */}
        {currentRawData && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">Description:</span> {getCol(currentRawData, 'Asset description') || '-'}
              </div>
              <div>
                <span className="font-semibold">Description 2:</span> {getCol(currentRawData, 'Asset description2') || '-'}
              </div>
            </div>
            {getCol(currentRawData, '*Idem to') && (
              <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded text-sm">
                <span className="font-semibold text-blue-800">Linked to:</span> {getCol(currentRawData, '*Idem to')}
                <span className="text-blue-600 ml-2 text-xs">(Editable fields are synchronized with this equipment)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Split View */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          {/* LEFT SIDE - Editable Fields */}
          <div className="p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4 sticky top-0 left-0 bg-white z-10 pb-2">
              Editable Fields (Fill as needed)
            </h3>
            
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-12 bg-gray-100 z-10">
                <tr>
                  <th className="p-2 text-left font-semibold border sticky left-0 bg-gray-100 z-20" style={{minWidth: '30px'}}>#</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '100px'}}>{t.criticality}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '120px'}}>{t.status}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '100px'}}>{t.area}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '120px'}}>{t.componentClass}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '120px'}}>{t.subComponent}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '150px'}}>{t.subComponentDesc}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '120px'}}>{t.failureMode1}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '120px'}}>{t.failureMode2}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '140px'}}>{t.currentLubricant}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '140px'}}>{t.recommendedLubricant}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '120px'}}>{t.lubricantLIS}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '80px'}}>{t.numberOfPoints}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '100px'}}>{t.procedureNumber}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '150px'}}>{t.procedure}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '120px'}}>{t.subTask1}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '120px'}}>{t.subTask2}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '120px'}}>{t.measuredTask1}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '120px'}}>{t.measuredTask2}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '120px'}}>{t.operationStatus}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '100px'}}>{t.timeInterval}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '100px'}}>{t.requiredTime}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '100px'}}>{t.recommendedQuantity}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '80px'}}>{t.unit}</th>
                  <th className="p-2 text-left font-semibold border" style={{minWidth: '200px'}}>{t.comment}</th>
                  <th className="p-2 border sticky right-0 bg-gray-100 z-20" style={{minWidth: '50px'}}>Del</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, rowIndex) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="p-2 border sticky left-0 bg-white z-10 text-gray-500 font-semibold">{rowIndex + 1}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'criticality', '100px', 'dropdown', ['Critical', 'Complicated', 'Critical & Complicated'])}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'status', '120px', 'dropdown', language === 'fr' ? menuData.status.fr : menuData.status.en)}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'area', '100px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'componentClass', '120px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'subComponent', '120px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'subComponentDescription', '150px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'failureMode1', '120px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'failureMode2', '120px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'currentLubricant', '140px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'recommendedLubricant', '140px', 'dropdown', menuData.lubricants.map(l => l.name))}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'lubricantLIS', '120px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'numberOfPoints', '80px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'procedureNumber', '100px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'procedure', '150px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'subTask1', '120px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'subTask2', '120px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'measuredTask1', '120px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'measuredTask2', '120px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'operationStatus', '120px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'timeInterval', '100px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'requiredTime', '100px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'recommendedQuantity', '100px')}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'unit', '80px', 'dropdown', language === 'fr' ? menuData.units.fr : menuData.units.en)}</td>
                    <td className="p-2 border">{renderCell(rowIndex, 'comment', '200px')}</td>
                    <td className="p-2 border sticky right-0 bg-white z-10 text-center">
                      {currentRows.length > 1 && (
                        <button
                          onClick={() => deleteRow(rowIndex)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RIGHT SIDE - Organized Reference Data like Excel */}
          <div className="p-4 bg-blue-50 overflow-auto max-h-[600px]">
            <h3 className="text-lg font-bold text-blue-900 mb-4 sticky top-0 bg-blue-50 pb-2">
              Reference Data (From iPad Collection)
            </h3>

            {currentRawData && (
              <div className="space-y-3">
                {/* Header Info */}
                <div className="bg-gray-800 text-white p-2 rounded-lg">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr>
                        <td className="font-bold py-1">Asset Number</td>
                        <td className="font-bold py-1">UniqueRowID</td>
                        <td className="font-bold py-1">User</td>
                        <td className="font-bold py-1">Date/Time</td>
                        <td className="font-bold py-1">Done?</td>
                        <td className="font-bold py-1">CRIT #</td>
                      </tr>
                      <tr>
                        <td className="py-1">{getCol(currentRawData, 'Asset number') || '-'}</td>
                        <td className="py-1">{getCol(currentRawData, 'UniqueRowID') || '""'}</td>
                        <td className="py-1">{getCol(currentRawData, 'User') || '-'}</td>
                        <td className="py-1">{getCol(currentRawData, 'Date/Time') || '-'}</td>
                        <td className="py-1">{getCol(currentRawData, 'Done?') || '-'}</td>
                        <td className="py-1">{getCol(currentRawData, 'CRIT #') || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Asset Description Row */}
                <div className="bg-gray-800 text-white p-2 rounded-lg">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr>
                        <td className="font-bold py-1">Asset description</td>
                        <td className="font-bold py-1">Asset description2</td>
                      </tr>
                      <tr>
                        <td className="py-1">{getCol(currentRawData, 'Asset description') || '-'}</td>
                        <td className="py-1">{getCol(currentRawData, 'Asset description2') || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Motor Section (if Motor data exists) */}
                {getCol(currentRawData, 'Motor') && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-200 px-2 py-1 font-bold text-xs border-b-2 border-gray-300">
                      Motor
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="font-bold px-2 py-1 bg-gray-50">HP</td>
                          <td className="font-bold px-2 py-1 bg-gray-50">RPM</td>
                          <td className="font-bold px-2 py-1 bg-gray-50">Current</td>
                          <td className="font-bold px-2 py-1 bg-gray-50">DE BRG</td>
                          <td className="font-bold px-2 py-1 bg-gray-50">NDE BRG Alternate</td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1">{getCol(currentRawData, 'HP') || '-'}</td>
                          <td className="px-2 py-1">{getCol(currentRawData, 'RPM') || '-'}</td>
                          <td className="px-2 py-1">{getCol(currentRawData, 'Current') || '-'}</td>
                          <td className="px-2 py-1">{getCol(currentRawData, 'DE Bearing #') || '-'}</td>
                          <td className="px-2 py-1">{getCol(currentRawData, 'DE BRG Alternate') || '-'}</td>
                        </tr>
                        {(getCol(currentRawData, 'Frame') || getCol(currentRawData, 'Orientation')) && (
                          <>
                            <tr className="border-t border-gray-200">
                              <td className="font-bold px-2 py-1 bg-gray-50">Frame</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">Orientation</td>
                              <td colSpan={3}></td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{getCol(currentRawData, 'Frame') || '-'}</td>
                              <td className="px-2 py-1">{getCol(currentRawData, 'Orientation') || '-'}</td>
                              <td colSpan={3}></td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Component/Point Sections - Show ALL points with data (up to 12) */}
                {(() => {
                  const pointSections = [];
                  
                  // Check all 12 possible Component occurrences
                  for (let i = 1; i <= 12; i++) {
                    const component = getCol(currentRawData, 'Component', i);
                    const subComp = getCol(currentRawData, 'Sub-Component', i);
                    const subCompDesc = getCol(currentRawData, 'Sub-Component descriptor', i);
                    const orientation = getCol(currentRawData, 'Orientation', i);
                    
                    // Only show if component has actual data (not empty or "---")
                    if (component && component !== '---' && component.trim() !== '') {
                      pointSections.push(
                        <div key={`point-${i}`} className="bg-white border-2 border-blue-300 rounded-lg overflow-hidden">
                          <div className="bg-blue-200 px-2 py-1 font-bold text-xs border-b-2 border-blue-300">
                            Point {i}: {component}
                          </div>
                          <table className="w-full text-xs">
                            <tbody>
                              <tr className="border-b border-blue-100">
                                <td className="font-bold px-2 py-1 bg-blue-50">Component</td>
                                <td className="font-bold px-2 py-1 bg-blue-50">Sub-Component</td>
                                <td className="font-bold px-2 py-1 bg-blue-50">Descriptor</td>
                                <td className="font-bold px-2 py-1 bg-blue-50">Orientation</td>
                              </tr>
                              <tr>
                                <td className="px-2 py-1">{component}</td>
                                <td className="px-2 py-1">{subComp || '-'}</td>
                                <td className="px-2 py-1">{subCompDesc || '-'}</td>
                                <td className="px-2 py-1">{orientation || '-'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                  }
                  
                  return pointSections.length > 0 ? pointSections : (
                    <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-2 text-xs text-gray-500">
                      No component/point data collected
                    </div>
                  );
                })()}

                {/* Additional Component Details (Bearing, Coupling, etc.) */}
                {(getCol(currentRawData, 'DE BRG / Coupling Type') || getCol(currentRawData, 'NDE BRG / Coupling Type') || getCol(currentRawData, 'NDE Bearing #') || getCol(currentRawData, 'Vol. (L)')) && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-200 px-2 py-1 font-bold text-xs border-b-2 border-gray-300">
                      Bearing / Coupling
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {(getCol(currentRawData, 'DE BRG / Coupling Type') || getCol(currentRawData, 'NDE BRG / Coupling Type')) && (
                          <>
                            <tr className="border-b border-gray-200">
                              <td className="font-bold px-2 py-1 bg-gray-50">DE BRG / Coupling Type</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">NDE BRG / Coupling Type</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{getCol(currentRawData, 'DE BRG / Coupling Type') || '-'}</td>
                              <td className="px-2 py-1">{getCol(currentRawData, 'NDE BRG / Coupling Type') || '-'}</td>
                            </tr>
                          </>
                        )}
                        {getCol(currentRawData, 'NDE Bearing #') && (
                          <>
                            <tr className="border-t border-gray-200">
                              <td className="font-bold px-2 py-1 bg-gray-50">NDE Bearing #</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">Vol. (L)</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{getCol(currentRawData, 'NDE Bearing #') || '-'}</td>
                              <td className="px-2 py-1">{getCol(currentRawData, 'Vol. (L)') || '-'}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sub-Component Details */}
                {(getCol(currentRawData, 'Sub-Comp RPM') || getCol(currentRawData, 'Notes') || getCol(currentRawData, 'Idem Sh. d') || getCol(currentRawData, 'Sev drn')) && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-200 px-2 py-1 font-bold text-xs border-b-2 border-gray-300">
                      Sub-Component Details
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {(getCol(currentRawData, 'Sub-Comp RPM') || getCol(currentRawData, 'Notes') || getCol(currentRawData, 'Idem Sh. d')) && (
                          <>
                            <tr className="border-b border-gray-200">
                              <td className="font-bold px-2 py-1 bg-gray-50">Sub-Comp RPM</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">Notes</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">Idem Sh. d</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{getCol(currentRawData, 'Sub-Comp RPM') || '-'}</td>
                              <td className="px-2 py-1">{getCol(currentRawData, 'Notes') || '-'}</td>
                              <td className="px-2 py-1">{getCol(currentRawData, 'Idem Sh. d') || '-'}</td>
                            </tr>
                          </>
                        )}
                        {getCol(currentRawData, 'D') && (
                          <>
                            <tr className="border-t border-gray-200">
                              <td className="font-bold px-2 py-1 bg-gray-50">D</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">B</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">H</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{getCol(currentRawData, 'D') || '-'}</td>
                              <td className="px-2 py-1">{getCol(currentRawData, 'B') || '-'}</td>
                              <td className="px-2 py-1">{getCol(currentRawData, 'H') || '-'}</td>
                            </tr>
                          </>
                        )}
                        {getCol(currentRawData, 'Sev drn') && (
                          <>
                            <tr className="border-t border-gray-200">
                              <td colSpan={3} className="px-2 py-1">
                                <span className="font-bold">Sev drn:</span> {getCol(currentRawData, 'Sev drn')}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Current Level Indicator */}
                {getCol(currentRawData, 'Current Level Indicator') && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-200 px-2 py-1 font-bold text-xs border-b-2 border-gray-300">
                      Current Level
                    </div>
                    <div className="p-2 text-xs">
                      <span className="font-bold">Indicator:</span> {getCol(currentRawData, 'Current Level Indicator')}
                    </div>
                  </div>
                )}

                {/* Idem to (Identical to) */}
                {getCol(currentRawData, '*Idem to') && (
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-2">
                    <div className="font-bold text-xs mb-1">*Idem to (Identical to)</div>
                    <div className="text-xs">{getCol(currentRawData, '*Idem to')}</div>
                  </div>
                )}

                {/* Additional Notes */}
                {getCol(currentRawData, '*Additional Notes') && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-2">
                    <div className="font-bold text-xs mb-1">Additional Notes</div>
                    <div className="text-xs">{getCol(currentRawData, '*Additional Notes')}</div>
                  </div>
                )}

                {/* Environmental Conditions */}
                <div className="bg-blue-100 border-2 border-blue-300 rounded-lg overflow-hidden">
                  <div className="bg-blue-200 px-2 py-1 font-bold text-xs border-b-2 border-blue-300">
                    Environmental Conditions
                  </div>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-blue-200">
                        <td className="font-bold px-2 py-1 bg-blue-50">Particle</td>
                        <td className="font-bold px-2 py-1 bg-blue-50">Humidity</td>
                        <td className="font-bold px-2 py-1 bg-blue-50">Vibration</td>
                      </tr>
                      <tr className="border-b border-blue-200">
                        <td className="px-2 py-1">{currentEquipment?.conditions?.particle || '-'}</td>
                        <td className="px-2 py-1">{currentEquipment?.conditions?.moisture || '-'}</td>
                        <td className="px-2 py-1">{currentEquipment?.conditions?.vibration || '-'}</td>
                      </tr>
                      <tr className="border-b border-blue-200">
                        <td className="font-bold px-2 py-1 bg-blue-50">Orientation</td>
                        <td className="font-bold px-2 py-1 bg-blue-50">Temperature</td>
                        <td className="font-bold px-2 py-1 bg-blue-50">Runtime</td>
                      </tr>
                      <tr>
                        <td className="px-2 py-1">{currentEquipment?.conditions?.orientation || '-'}</td>
                        <td className="px-2 py-1">{currentEquipment?.conditions?.temperature || '-'}</td>
                        <td className="px-2 py-1">{currentEquipment?.conditions?.runtime || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
