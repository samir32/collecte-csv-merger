import React, { useState } from 'react';
import { ProcessedEquipment } from '../utils/excel-processor';
import { Edit2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import menuData from '../data/menu-dropdowns.json';

interface WorkingSheetProps {
  equipment: ProcessedEquipment[];
  clientName: string;
  language: 'en' | 'fr';
  onUpdate: (updatedEquipment: ProcessedEquipment[]) => void;
}

interface EditableEquipment extends ProcessedEquipment {
  // Left side editable fields (A-AD / 1-30)
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
  numberOfPoints?: number;
  procedureNumber?: string;
  procedure?: string;
  subTask1?: string;
  subTask2?: string;
  measuredTask1?: string;
  measuredTask2?: string;
  operationStatus?: string;
  componentClassDropdown?: string;
  timeInterval?: number;
  requiredTime?: number;
  recommendedQuantity?: number;
  unit?: string;
  comment?: string;
}

export function WorkingSheet({ equipment, clientName, language, onUpdate }: WorkingSheetProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<EditableEquipment | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const labels = {
    fr: {
      criticality: 'CRITICITÉ',
      status: 'Statut',
      area: 'Secteur',
      assetNumber: "Numéro d'équipement",
      assetDescription: "Nom d'équipement",
      componentClass: 'Classe du composant',
      subComponent: 'Sous-composant',
      subComponentDescription: 'Description du Sous-composant',
      failureMode1: 'Mode de défaillance 1',
      failureMode2: 'Mode de défaillance 2',
      failureMode3: 'Mode de défaillance 3',
      failureMode4: 'Mode de défaillance 4',
      failureMode5: 'Mode de défaillance 5',
      currentLubricant: 'Lubrifiant actuel',
      recommendedLubricant: 'Lubrifiant recommandé',
      lubricantLIS: 'LIS de Lubrifiant recommandé',
      numberOfPoints: 'Nombre des points',
      procedureNumber: 'Numéro de procédure',
      procedure: 'Procédure',
      subTask1: 'Sous-tâche 1',
      subTask2: 'Sous-tâche 2',
      measuredTask1: 'Tâche mesurée 1',
      measuredTask2: 'Tâche mesurée 2',
      operationStatus: "État de l'opération",
      componentClassDropdown: 'Classe de composant',
      timeInterval: 'Interval (jours)',
      requiredTime: 'Temps requis (min)',
      recommendedQuantity: 'Quantité recommandée',
      unit: 'Unité',
      comment: 'Commentaire/Question',
      // Reference data (right side)
      particle: 'Particle',
      moisture: 'Humidité',
      vibration: 'Vibration',
      orientation: 'Oriéntation',
      temperature: 'Temperature',
      runtime: "Temp d'operation",
    },
    en: {
      criticality: 'CRITICALITY',
      status: 'Status',
      area: 'Area',
      assetNumber: 'Equipment Number',
      assetDescription: 'Equipment Name',
      componentClass: 'Component Class',
      subComponent: 'Sub-component',
      subComponentDescription: 'Sub-component Description',
      failureMode1: 'Failure Mode 1',
      failureMode2: 'Failure Mode 2',
      failureMode3: 'Failure Mode 3',
      failureMode4: 'Failure Mode 4',
      failureMode5: 'Failure Mode 5',
      currentLubricant: 'Current Lubricant',
      recommendedLubricant: 'Recommended Lubricant',
      lubricantLIS: 'Recommended Lubricant LIS Number',
      numberOfPoints: '# of Points',
      procedureNumber: 'Procedure #',
      procedure: 'Procedure',
      subTask1: 'Sub Task 1',
      subTask2: 'Sub Task 2',
      measuredTask1: 'Measured Task 1',
      measuredTask2: 'Measured Task 2',
      operationStatus: 'Operation Status',
      componentClassDropdown: 'Component Class',
      timeInterval: 'Time Interval (days)',
      requiredTime: 'Required Time (min)',
      recommendedQuantity: 'Recommended Quantity',
      unit: 'Unit',
      comment: 'Comment/Question',
      // Reference data
      particle: 'Particle',
      moisture: 'Moisture',
      vibration: 'Vibration',
      orientation: 'Orientation',
      temperature: 'Temperature',
      runtime: 'Runtime',
    },
  };

  const t = labels[language];

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditedData({ ...equipment[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditedData(null);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editedData) {
      const updated = [...equipment];
      updated[editingIndex] = editedData;
      onUpdate(updated);
      setEditingIndex(null);
      setEditedData(null);
    }
  };

  const updateField = (field: keyof EditableEquipment, value: any) => {
    if (!editedData) return;
    
    const updated = { ...editedData, [field]: value };
    
    // Auto-fill logic
    if (field === 'recommendedLubricant') {
      // Find LIS number for selected lubricant
      const lube = menuData.lubricants.find(l => l.name === value);
      if (lube) {
        updated.lubricantLIS = lube.lis;
      }
    }
    
    setEditedData(updated);
  };

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const renderField = (label: string, field: keyof EditableEquipment, type: 'text' | 'number' | 'dropdown' = 'text', options?: string[]) => {
    const value = editedData?.[field];
    const isEditing = editingIndex !== null;

    if (!isEditing) {
      return (
        <div className="mb-3">
          <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
          <div className="text-sm text-gray-900">{value || '-'}</div>
        </div>
      );
    }

    if (type === 'dropdown' && options) {
      return (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
          <select
            value={String(value || '')}
            onChange={(e) => updateField(field, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">-</option>
            {options.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
        <input
          type={type}
          value={String(value || '')}
          onChange={(e) => updateField(field, type === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">{clientName}</h2>
        <p className="text-sm text-gray-600 mt-1">{equipment.length} equipment items</p>
      </div>

      {equipment.map((eq, index) => {
        const isExpanded = expandedRows.has(index);
        const isEditing = editingIndex === index;
        const data = isEditing ? editedData! : eq;

        return (
          <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header Row */}
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
              onClick={() => !isEditing && toggleRow(index)}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="text-gray-400">
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg text-gray-900">{eq.assetNumber || 'No Asset #'}</div>
                  <div className="text-sm text-gray-600">{eq.assetDescription || 'No description'}</div>
                </div>
                {eq.criticality && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                    {eq.criticality}
                  </span>
                )}
                {eq.status && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    {eq.status}
                  </span>
                )}
              </div>
              
              {!isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(index);
                  }}
                  className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
              )}

              {isEditing && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdit();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Save size={16} />
                    Save
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEdit();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Editable Fields (A-AD) */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                      Editable Fields
                    </h3>

                    {/* Basic Info */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-3">Basic Information</h4>
                      {renderField(t.criticality, 'criticality', 'dropdown', ['Critical', 'Complicated', 'Critical & Complicated'])}
                      {renderField(t.status, 'status', 'dropdown', language === 'fr' ? menuData.status.fr : menuData.status.en)}
                      {renderField(t.area, 'area')}
                      {renderField(t.assetNumber, 'assetNumber')}
                      {renderField(t.assetDescription, 'assetDescription')}
                    </div>

                    {/* Component Info */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-3">Component Information</h4>
                      {renderField(t.componentClass, 'componentClass')}
                      {renderField(t.subComponent, 'subComponent')}
                      {renderField(t.subComponentDescription, 'subComponentDescription')}
                      {renderField(t.componentClassDropdown, 'componentClassDropdown', 'dropdown', 
                        language === 'fr' ? menuData.componentClass.fr : menuData.componentClass.en)}
                    </div>

                    {/* Failure Modes */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-3">Failure Modes</h4>
                      {renderField(t.failureMode1, 'failureMode1')}
                      {renderField(t.failureMode2, 'failureMode2')}
                      {renderField(t.failureMode3, 'failureMode3')}
                      {renderField(t.failureMode4, 'failureMode4')}
                      {renderField(t.failureMode5, 'failureMode5')}
                    </div>

                    {/* Lubrication */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-3">Lubrication</h4>
                      {renderField(t.currentLubricant, 'currentLubricant')}
                      {renderField(t.recommendedLubricant, 'recommendedLubricant', 'dropdown', 
                        menuData.lubricants.map(l => l.name))}
                      {renderField(t.lubricantLIS, 'lubricantLIS')}
                      {renderField(t.numberOfPoints, 'numberOfPoints', 'number')}
                    </div>

                    {/* Procedures */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-3">Procedures & Tasks</h4>
                      {renderField(t.procedureNumber, 'procedureNumber')}
                      {renderField(t.procedure, 'procedure')}
                      {renderField(t.subTask1, 'subTask1')}
                      {renderField(t.subTask2, 'subTask2')}
                      {renderField(t.measuredTask1, 'measuredTask1')}
                      {renderField(t.measuredTask2, 'measuredTask2')}
                      {renderField(t.operationStatus, 'operationStatus')}
                    </div>

                    {/* Time & Quantity */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-3">Time & Quantity</h4>
                      {renderField(t.timeInterval, 'timeInterval', 'number')}
                      {renderField(t.requiredTime, 'requiredTime', 'number')}
                      {renderField(t.recommendedQuantity, 'recommendedQuantity', 'number')}
                      {renderField(t.unit, 'unit', 'dropdown', language === 'fr' ? menuData.units.fr : menuData.units.en)}
                    </div>

                    {/* Comments */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-3">Comments</h4>
                      {renderField(t.comment, 'comment')}
                    </div>
                  </div>

                  {/* Right Column - Reference Data (Read-Only) */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-300">
                      Reference Data (Read-Only)
                    </h3>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-3">Environmental Conditions</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs font-semibold text-blue-600">{t.particle}</div>
                          <div className="text-sm text-blue-900">{data.conditions?.particle || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-blue-600">{t.moisture}</div>
                          <div className="text-sm text-blue-900">{data.conditions?.moisture || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-blue-600">{t.vibration}</div>
                          <div className="text-sm text-blue-900">{data.conditions?.vibration || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-blue-600">{t.orientation}</div>
                          <div className="text-sm text-blue-900">{data.conditions?.orientation || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-blue-600">{t.temperature}</div>
                          <div className="text-sm text-blue-900">{data.conditions?.temperature || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-blue-600">{t.runtime}</div>
                          <div className="text-sm text-blue-900">{data.conditions?.runtime || '-'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-100 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-3">Collection Info</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-semibold">User:</span> {data.user || '-'}</div>
                        <div><span className="font-semibold">Date/Time:</span> {data.dateTime || '-'}</div>
                        <div><span className="font-semibold">Identical to:</span> {data.idemTo || '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
