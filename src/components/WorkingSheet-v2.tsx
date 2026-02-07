import React, { useState } from 'react';
import { ProcessedEquipment } from '../utils/excel-processor';
import { ChevronLeft, ChevronRight, Plus, Trash2, Save } from 'lucide-react';
import menuData from '../data/menu-dropdowns.json';

interface WorkingSheetProps {
  equipment: ProcessedEquipment[];
  clientName: string;
  language: 'en' | 'fr';
  onUpdate: (updatedEquipment: ProcessedEquipment[]) => void;
}

interface WorkingRow {
  id: string;
  // Left side - Editable fields (A-AD / Columns 1-30)
  criticality?: string;
  status?: string;
  area?: string;
  assetNumber?: string;
  assetDescription?: string;
  componentClass?: string;
  subComponent?: string;
  subComponentDescription?: string;
  failureMode1?: string;
  failureMode2?: string;
  failureMode3?: string;
  failureMode4?: string;
  failureMode5?: string;
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
  componentClassDropdown?: string;
  timeInterval?: string;
  requiredTime?: string;
  recommendedQuantity?: string;
  unit?: string;
  comment?: string;
}

export function WorkingSheet({ equipment, clientName, language, onUpdate }: WorkingSheetProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [equipmentRows, setEquipmentRows] = useState<Map<number, WorkingRow[]>>(
    new Map(equipment.map((_, index) => [index, [{ id: `row-0` }]]))
  );

  const currentEquipment = equipment[currentPage];
  const currentRows = equipmentRows.get(currentPage) || [{ id: `row-0` }];

  const labels = {
    fr: {
      criticality: 'CRITICITÉ',
      status: 'Statut',
      area: 'Secteur',
      assetNumber: "N° d'équip.",
      assetDescription: "Nom d'équip.",
      componentClass: 'Classe',
      subComponent: 'Sous-comp.',
      subComponentDesc: 'Desc.',
      failureMode1: 'Défaillance 1',
      failureMode2: 'Défaillance 2',
      failureMode3: 'Défaillance 3',
      failureMode4: 'Défaillance 4',
      failureMode5: 'Défaillance 5',
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
      // Reference
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
      assetNumber: 'Equip. #',
      assetDescription: 'Equip. Name',
      componentClass: 'Class',
      subComponent: 'Sub-comp.',
      subComponentDesc: 'Desc.',
      failureMode1: 'Failure 1',
      failureMode2: 'Failure 2',
      failureMode3: 'Failure 3',
      failureMode4: 'Failure 4',
      failureMode5: 'Failure 5',
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
      // Reference
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
    if (currentRows.length <= 1) return; // Keep at least one row
    const newRows = currentRows.filter((_, i) => i !== rowIndex);
    const newMap = new Map(equipmentRows);
    newMap.set(currentPage, newRows);
    setEquipmentRows(newMap);
  };

  const updateCell = (rowIndex: number, field: keyof WorkingRow, value: string) => {
    const newRows = [...currentRows];
    newRows[rowIndex] = { ...newRows[rowIndex], [field]: value };
    
    // Auto-fill LIS number when lubricant selected
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
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Split View: Left (Editable) | Right (Reference) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          {/* LEFT SIDE - Editable Fields */}
          <div className="p-4 overflow-x-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4 sticky left-0 bg-white">
              Editable Fields (Fill as needed)
            </h3>
            
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left font-semibold sticky left-0 bg-gray-100" style={{width: '30px'}}>#</th>
                  <th className="p-2 text-left font-semibold" style={{width: '80px'}}>{t.criticality}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '100px'}}>{t.status}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '80px'}}>{t.area}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '100px'}}>{t.componentClass}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '100px'}}>{t.subComponent}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '120px'}}>{t.subComponentDesc}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '100px'}}>{t.failureMode1}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '100px'}}>{t.failureMode2}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '120px'}}>{t.currentLubricant}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '120px'}}>{t.recommendedLubricant}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '100px'}}>{t.lubricantLIS}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '80px'}}>{t.numberOfPoints}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '80px'}}>{t.procedureNumber}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '120px'}}>{t.procedure}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '100px'}}>{t.subTask1}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '100px'}}>{t.subTask2}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '100px'}}>{t.measuredTask1}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '100px'}}>{t.measuredTask2}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '100px'}}>{t.operationStatus}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '80px'}}>{t.timeInterval}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '80px'}}>{t.requiredTime}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '80px'}}>{t.recommendedQuantity}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '80px'}}>{t.unit}</th>
                  <th className="p-2 text-left font-semibold" style={{width: '150px'}}>{t.comment}</th>
                  <th className="p-2 sticky right-0 bg-gray-100" style={{width: '40px'}}></th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, rowIndex) => (
                  <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-2 sticky left-0 bg-white text-gray-500 font-semibold">{rowIndex + 1}</td>
                    <td className="p-2">{renderCell(rowIndex, 'criticality', '80px', 'dropdown', ['Critical', 'Complicated', 'Critical & Complicated'])}</td>
                    <td className="p-2">{renderCell(rowIndex, 'status', '100px', 'dropdown', language === 'fr' ? menuData.status.fr : menuData.status.en)}</td>
                    <td className="p-2">{renderCell(rowIndex, 'area', '80px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'componentClass', '100px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'subComponent', '100px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'subComponentDescription', '120px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'failureMode1', '100px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'failureMode2', '100px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'currentLubricant', '120px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'recommendedLubricant', '120px', 'dropdown', menuData.lubricants.map(l => l.name))}</td>
                    <td className="p-2">{renderCell(rowIndex, 'lubricantLIS', '100px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'numberOfPoints', '80px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'procedureNumber', '80px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'procedure', '120px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'subTask1', '100px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'subTask2', '100px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'measuredTask1', '100px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'measuredTask2', '100px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'operationStatus', '100px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'timeInterval', '80px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'requiredTime', '80px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'recommendedQuantity', '80px')}</td>
                    <td className="p-2">{renderCell(rowIndex, 'unit', '80px', 'dropdown', language === 'fr' ? menuData.units.fr : menuData.units.en)}</td>
                    <td className="p-2">{renderCell(rowIndex, 'comment', '150px')}</td>
                    <td className="p-2 sticky right-0 bg-white">
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
          <div className="p-4 bg-blue-50">
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              Reference Data (From iPad Collection)
            </h3>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Equipment Info</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-semibold">Asset #:</span> {currentEquipment?.assetNumber || '-'}</div>
                  <div><span className="font-semibold">Description:</span> {currentEquipment?.assetDescription || '-'}</div>
                  <div><span className="font-semibold">Area:</span> {currentEquipment?.area || '-'}</div>
                  <div><span className="font-semibold">Component:</span> {currentEquipment?.component || '-'}</div>
                  {currentEquipment?.subComponent && (
                    <div><span className="font-semibold">Sub-Component:</span> {currentEquipment.subComponent}</div>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Environmental Conditions</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs font-semibold text-blue-600">{t.particle}</div>
                    <div className="text-blue-900">{currentEquipment?.conditions?.particle || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">{t.moisture}</div>
                    <div className="text-blue-900">{currentEquipment?.conditions?.moisture || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">{t.vibration}</div>
                    <div className="text-blue-900">{currentEquipment?.conditions?.vibration || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">{t.orientation}</div>
                    <div className="text-blue-900">{currentEquipment?.conditions?.orientation || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">{t.temperature}</div>
                    <div className="text-blue-900">{currentEquipment?.conditions?.temperature || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-600">{t.runtime}</div>
                    <div className="text-blue-900">{currentEquipment?.conditions?.runtime || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="font-semibold text-gray-900 mb-3">Collection Data</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="font-semibold">User:</span> {currentEquipment?.user || '-'}</div>
                  <div><span className="font-semibold">Date/Time:</span> {currentEquipment?.dateTime || '-'}</div>
                  <div><span className="font-semibold">Status:</span> {currentEquipment?.status || '-'}</div>
                  {currentEquipment?.idemTo && (
                    <div><span className="font-semibold">Identical to:</span> {currentEquipment.idemTo}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
