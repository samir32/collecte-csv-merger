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

  const currentEquipment = equipment[currentPage];
  const currentRawData = rawData[currentPage];
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

          {/* RIGHT SIDE - Reference Data (Read-Only) */}
          <div className="p-4 bg-blue-50 overflow-auto max-h-[600px]">
            <h3 className="text-lg font-bold text-blue-900 mb-4 sticky top-0 bg-blue-50 pb-2">
              Reference Data (From iPad Collection)
            </h3>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Raw iPad Data</h4>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">Asset Number:</td>
                      <td className="py-2">{currentEquipment?.assetNumber || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">Asset Description:</td>
                      <td className="py-2">{currentEquipment?.assetDescription || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">Area:</td>
                      <td className="py-2">{currentEquipment?.area || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">Component:</td>
                      <td className="py-2">{currentEquipment?.component || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">Sub-Component:</td>
                      <td className="py-2">{currentEquipment?.subComponent || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">User:</td>
                      <td className="py-2">{currentEquipment?.user || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">Date/Time:</td>
                      <td className="py-2">{currentEquipment?.dateTime || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">Done?:</td>
                      <td className="py-2">{currentEquipment?.status || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">CRIT #:</td>
                      <td className="py-2">{currentEquipment?.isCritical ? 'C' : '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">Complicated:</td>
                      <td className="py-2">{currentEquipment?.isComplicated ? 'Yes' : '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">Identical to:</td>
                      <td className="py-2">{currentEquipment?.idemTo || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-gray-600">UniqueRowID:</td>
                      <td className="py-2">{currentRawData?.['UniqueRowID'] || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Environmental Conditions</h4>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-blue-600">{t.particle}:</td>
                      <td className="py-2 text-blue-900">{currentEquipment?.conditions?.particle || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-blue-600">{t.moisture}:</td>
                      <td className="py-2 text-blue-900">{currentEquipment?.conditions?.moisture || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-blue-600">{t.vibration}:</td>
                      <td className="py-2 text-blue-900">{currentEquipment?.conditions?.vibration || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-blue-600">{t.orientation}:</td>
                      <td className="py-2 text-blue-900">{currentEquipment?.conditions?.orientation || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-blue-600">{t.temperature}:</td>
                      <td className="py-2 text-blue-900">{currentEquipment?.conditions?.temperature || '-'}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-semibold text-blue-600">{t.runtime}:</td>
                      <td className="py-2 text-blue-900">{currentEquipment?.conditions?.runtime || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* All Raw CSV Data */}
              {currentRawData && schema && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3">All iPad Collection Data</h4>
                  <div className="space-y-1 max-h-96 overflow-auto">
                    {schema.map((col, idx) => {
                      const value = currentRawData[col.internalKey];
                      if (!value || String(value).trim() === '') return null;
                      
                      return (
                        <div key={idx} className="grid grid-cols-2 gap-2 text-xs py-1 border-b border-gray-100">
                          <div className="font-semibold text-gray-600 break-words">
                            {col.displayName}
                          </div>
                          <div className="text-gray-900 break-words">
                            {String(value)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Equipment Features if any */}
              {Object.values(currentEquipment?.features || {}).some(v => v) && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-3">Equipment Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(currentEquipment.features).map(([key, value]) => 
                      value ? (
                        <span key={key} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
