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
  const [currentPage, setCurrentPage] = useState(0);
  const [equipmentRows, setEquipmentRows] = useState<Map<number, WorkingRow[]>>(
    new Map(equipment.map((_, index) => [index, [{ id: `row-0` }]]))
  );

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
  
  // ENHANCED DEBUG: Log matching details
  console.log('🔍 DATA MATCHING DEBUG:', {
    currentEquipment_assetNumber: currentEquipment?.assetNumber,
    rawData_length: rawData?.length,
    first_3_rawData_assetNumbers: rawData?.slice(0, 3).map(r => r['Asset number']),
    all_unique_assetNumbers: [...new Set(rawData?.map(r => r['Asset number']))]
  });
  
  const currentRawData = rawData?.find(row => row['Asset number'] === currentEquipment?.assetNumber) || null;
  
  // Log the result
  console.log('✅ Match result:', {
    found: !!currentRawData,
    searching_for: currentEquipment?.assetNumber,
    matched_row: currentRawData ? 'YES' : 'NO'
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
    setEquipmentRows(newMap);
  };

  const deleteRow = (rowIndex: number) => {
    if (currentRows.length <= 1) return;
    const newRows = currentRows.filter((_, i) => i !== rowIndex);
    const newMap = new Map(equipmentRows);
    newMap.set(currentPage, newRows);
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

  return (
    <div className="space-y-4">
      {/* Header with Pagination */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
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

        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={16} />
          Add Row
        </button>
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

            {/* ENHANCED DEBUG INFO */}
            <div className="bg-yellow-100 border-2 border-yellow-500 p-3 rounded-lg mb-4 text-xs">
              <div className="font-bold mb-2 text-lg">🔍 DATA MATCHING DEBUG</div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="font-bold text-blue-800">Equipment Side:</div>
                  <div>currentEquipment exists: <span className="font-bold">{String(!!currentEquipment)}</span></div>
                  <div>Searching for Asset#: <span className="font-bold text-red-600">{currentEquipment?.assetNumber || 'NULL'}</span></div>
                </div>
                <div>
                  <div className="font-bold text-green-800">Raw Data Side:</div>
                  <div>rawData array length: <span className="font-bold">{rawData?.length || 0}</span></div>
                  <div>Match found: <span className="font-bold">{String(!!currentRawData)}</span></div>
                </div>
              </div>

              <div className="border-t-2 border-yellow-600 pt-2">
                <div className="font-bold mb-1">First 5 Asset Numbers in rawData:</div>
                <div className="bg-white p-2 rounded font-mono text-xs max-h-20 overflow-auto">
                  {rawData?.slice(0, 5).map((row, idx) => (
                    <div key={idx}>
                      [{idx}] "{row['Asset number']}" {row['Asset number'] === currentEquipment?.assetNumber ? '← MATCH!' : ''}
                    </div>
                  )) || 'No data'}
                </div>
              </div>

              {currentRawData && (
                <div className="mt-3 border-t-2 border-green-600 pt-2">
                  <div className="font-bold text-green-800 mb-1">✅ Match Found! Sample fields:</div>
                  <div className="bg-white p-2 rounded">
                    <div>Asset#: {String(currentRawData['Asset number'])}</div>
                    <div>User: {String(currentRawData['User'] || 'N/A')}</div>
                    <div>Motor: {String(currentRawData['Motor'] || 'N/A')}</div>
                    <div>HP: {String(currentRawData['HP'] || 'N/A')}</div>
                  </div>
                </div>
              )}

              {!currentRawData && rawData && rawData.length > 0 && (
                <div className="mt-3 border-t-2 border-red-600 pt-2">
                  <div className="font-bold text-red-800">❌ NO MATCH FOUND</div>
                  <div className="text-red-700">
                    Looking for "{currentEquipment?.assetNumber}" but not found in rawData.
                    Check if asset number format matches (spaces, dashes, leading zeros, etc.)
                  </div>
                </div>
              )}
            </div>

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
                        <td className="py-1">{currentRawData['Asset number'] || '-'}</td>
                        <td className="py-1">{currentRawData['UniqueRowID'] || '""'}</td>
                        <td className="py-1">{currentRawData['User'] || '-'}</td>
                        <td className="py-1">{currentRawData['Date/Time'] || '-'}</td>
                        <td className="py-1">{currentRawData['Done?'] || '-'}</td>
                        <td className="py-1">{currentRawData['CRIT #'] || '-'}</td>
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
                        <td className="py-1">{currentRawData['Asset description'] || '-'}</td>
                        <td className="py-1">{currentRawData['Asset description2'] || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Motor Section (if Motor data exists) */}
                {currentRawData['Motor'] && (
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
                          <td className="px-2 py-1">{currentRawData['HP'] || '-'}</td>
                          <td className="px-2 py-1">{currentRawData['RPM'] || '-'}</td>
                          <td className="px-2 py-1">{currentRawData['Current'] || '-'}</td>
                          <td className="px-2 py-1">{currentRawData['DE Bearing #'] || '-'}</td>
                          <td className="px-2 py-1">{currentRawData['DE BRG Alternate'] || '-'}</td>
                        </tr>
                        {(currentRawData['Frame'] || currentRawData['Orientation']) && (
                          <>
                            <tr className="border-t border-gray-200">
                              <td className="font-bold px-2 py-1 bg-gray-50">Frame</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">Orientation</td>
                              <td colSpan={3}></td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{currentRawData['Frame'] || '-'}</td>
                              <td className="px-2 py-1">{currentRawData['Orientation'] || '-'}</td>
                              <td colSpan={3}></td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Component Section */}
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-200 px-2 py-1 font-bold text-xs border-b-2 border-gray-300">
                    Component
                  </div>
                  <div className="p-2 text-xs space-y-1">
                    {currentRawData['Motor'] && <div><span className="font-bold">Motor:</span> {currentRawData['Motor']}</div>}
                    {currentRawData['Compressor'] && <div><span className="font-bold">Compressor:</span> {currentRawData['Compressor']}</div>}
                    {currentRawData['Gearbox'] && <div><span className="font-bold">Gearbox:</span> {currentRawData['Gearbox']}</div>}
                    {currentRawData['Pump'] && <div><span className="font-bold">Pump:</span> {currentRawData['Pump']}</div>}
                    {currentRawData['Bearing'] && <div><span className="font-bold">Bearing:</span> {currentRawData['Bearing']}</div>}
                    {currentRawData['Sub-Component descriptor'] && (
                      <div><span className="font-bold">Sub-Component descriptor:</span> {currentRawData['Sub-Component descriptor']}</div>
                    )}
                  </div>
                </div>

                {/* Additional Component Details (Bearing, Coupling, etc.) */}
                {(currentRawData['DE BRG / Coupling Type'] || currentRawData['NDE BRG / Coupling Type'] || currentRawData['NDE Bearing #'] || currentRawData['Vol. (L)']) && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-200 px-2 py-1 font-bold text-xs border-b-2 border-gray-300">
                      Bearing / Coupling
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {(currentRawData['DE BRG / Coupling Type'] || currentRawData['NDE BRG / Coupling Type']) && (
                          <>
                            <tr className="border-b border-gray-200">
                              <td className="font-bold px-2 py-1 bg-gray-50">DE BRG / Coupling Type</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">NDE BRG / Coupling Type</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{currentRawData['DE BRG / Coupling Type'] || '-'}</td>
                              <td className="px-2 py-1">{currentRawData['NDE BRG / Coupling Type'] || '-'}</td>
                            </tr>
                          </>
                        )}
                        {currentRawData['NDE Bearing #'] && (
                          <>
                            <tr className="border-t border-gray-200">
                              <td className="font-bold px-2 py-1 bg-gray-50">NDE Bearing #</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">Vol. (L)</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{currentRawData['NDE Bearing #'] || '-'}</td>
                              <td className="px-2 py-1">{currentRawData['Vol. (L)'] || '-'}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Sub-Component Details */}
                {(currentRawData['Sub-Comp RPM'] || currentRawData['Notes'] || currentRawData['Idem Sh. d'] || currentRawData['Sev drn']) && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-200 px-2 py-1 font-bold text-xs border-b-2 border-gray-300">
                      Sub-Component Details
                    </div>
                    <table className="w-full text-xs">
                      <tbody>
                        {(currentRawData['Sub-Comp RPM'] || currentRawData['Notes'] || currentRawData['Idem Sh. d']) && (
                          <>
                            <tr className="border-b border-gray-200">
                              <td className="font-bold px-2 py-1 bg-gray-50">Sub-Comp RPM</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">Notes</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">Idem Sh. d</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{currentRawData['Sub-Comp RPM'] || '-'}</td>
                              <td className="px-2 py-1">{currentRawData['Notes'] || '-'}</td>
                              <td className="px-2 py-1">{currentRawData['Idem Sh. d'] || '-'}</td>
                            </tr>
                          </>
                        )}
                        {currentRawData['D'] && (
                          <>
                            <tr className="border-t border-gray-200">
                              <td className="font-bold px-2 py-1 bg-gray-50">D</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">B</td>
                              <td className="font-bold px-2 py-1 bg-gray-50">H</td>
                            </tr>
                            <tr>
                              <td className="px-2 py-1">{currentRawData['D'] || '-'}</td>
                              <td className="px-2 py-1">{currentRawData['B'] || '-'}</td>
                              <td className="px-2 py-1">{currentRawData['H'] || '-'}</td>
                            </tr>
                          </>
                        )}
                        {currentRawData['Sev drn'] && (
                          <>
                            <tr className="border-t border-gray-200">
                              <td colSpan={3} className="px-2 py-1">
                                <span className="font-bold">Sev drn:</span> {currentRawData['Sev drn']}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Current Level Indicator */}
                {currentRawData['Current Level Indicator'] && (
                  <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-200 px-2 py-1 font-bold text-xs border-b-2 border-gray-300">
                      Current Level
                    </div>
                    <div className="p-2 text-xs">
                      <span className="font-bold">Indicator:</span> {currentRawData['Current Level Indicator']}
                    </div>
                  </div>
                )}

                {/* Idem to (Identical to) */}
                {currentRawData['*Idem to'] && (
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-2">
                    <div className="font-bold text-xs mb-1">*Idem to (Identical to)</div>
                    <div className="text-xs">{currentRawData['*Idem to']}</div>
                  </div>
                )}

                {/* Additional Notes */}
                {currentRawData['*Additional Notes'] && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-2">
                    <div className="font-bold text-xs mb-1">Additional Notes</div>
                    <div className="text-xs">{currentRawData['*Additional Notes']}</div>
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
