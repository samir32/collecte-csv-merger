import React, { useState, useMemo } from 'react';
import { ProcessedEquipment } from '../utils/excel-processor';
import { 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Info,
  Thermometer,
  Droplets,
  Gauge,
  Compass,
  Clock,
  ChevronDown,
  ChevronRight,
  Filter
} from 'lucide-react';

interface EquipmentReviewProps {
  equipment: ProcessedEquipment[];
  title: string;
}

type FilterType = 'all' | 'critical' | 'complicated' | 'done' | 'todo';

export function EquipmentReview({ equipment, title }: EquipmentReviewProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Apply filters
  const filteredEquipment = useMemo(() => {
    let filtered = equipment;

    // Apply status filter
    switch (filter) {
      case 'critical':
        filtered = filtered.filter(eq => eq.isCritical);
        break;
      case 'complicated':
        filtered = filtered.filter(eq => eq.isComplicated);
        break;
      case 'done':
        filtered = filtered.filter(eq => eq.isDone);
        break;
      case 'todo':
        filtered = filtered.filter(eq => !eq.isDone);
        break;
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(eq =>
        eq.assetNumber?.toLowerCase().includes(term) ||
        eq.assetDescription?.toLowerCase().includes(term) ||
        eq.area?.toLowerCase().includes(term) ||
        eq.component?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [equipment, filter, searchTerm]);

  const getCriticalityBadge = (eq: ProcessedEquipment) => {
    if (eq.isCritical && eq.isComplicated) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">
          <AlertCircle size={12} />
          Critical & Complicated
        </span>
      );
    } else if (eq.isCritical) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-700">
          <AlertCircle size={12} />
          Critical
        </span>
      );
    } else if (eq.isComplicated) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-700">
          <Info size={12} />
          Complicated
        </span>
      );
    }
    return null;
  };

  const getStatusBadge = (eq: ProcessedEquipment) => {
    if (eq.isDone) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={12} />
          Done
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
          <XCircle size={12} />
          {eq.status}
        </span>
      );
    }
  };

  const ConditionBadge = ({ icon: Icon, label, value }: { icon: any, label: string, value?: string }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg text-sm">
        <Icon size={16} className="text-blue-600" />
        <div>
          <div className="text-xs text-blue-600 font-medium">{label}</div>
          <div className="text-blue-900 font-semibold">{value}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by asset, description, area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'critical', 'complicated', 'done', 'todo'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredEquipment.length} of {equipment.length} items
        </div>
      </div>

      {/* Equipment List */}
      <div className="space-y-3">
        {filteredEquipment.map((eq, index) => {
          const isExpanded = expandedRows.has(index);
          const hasConditions = Object.values(eq.conditions).some(v => v);
          const hasFeatures = Object.values(eq.features).some(v => v);

          return (
            <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Main Row */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleRow(index)}
              >
                <div className="flex items-start gap-4">
                  {/* Expand Icon */}
                  <div className="pt-1">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-gray-900">
                            {eq.assetNumber || 'No Asset #'}
                          </span>
                          {eq.pageNumber && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              Page {eq.pageNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {eq.assetDescription || 'No description'}
                        </p>
                        {eq.area && (
                          <p className="text-xs text-gray-500 mt-1">Area: {eq.area}</p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-col gap-2 items-end">
                        {getCriticalityBadge(eq)}
                        {getStatusBadge(eq)}
                      </div>
                    </div>

                    {/* Component Info */}
                    {(eq.component || eq.subComponent) && (
                      <div className="text-sm text-gray-700 mt-2">
                        <span className="font-medium">Component:</span>{' '}
                        {eq.component}
                        {eq.subComponent && ` → ${eq.subComponent}`}
                      </div>
                    )}

                    {/* Quick Info */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {eq.componentClass && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                          {eq.componentClass}
                        </span>
                      )}
                      {eq.recommendedLubricant && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                          🛢️ {eq.recommendedLubricant}
                        </span>
                      )}
                      {eq.procedureNumber && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          Proc #{eq.procedureNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                  {/* Environmental Conditions */}
                  {hasConditions && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-3">Environmental Conditions</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <ConditionBadge icon={Droplets} label="Particle" value={eq.conditions.particle} />
                        <ConditionBadge icon={Droplets} label="Moisture" value={eq.conditions.moisture} />
                        <ConditionBadge icon={Gauge} label="Vibration" value={eq.conditions.vibration} />
                        <ConditionBadge icon={Compass} label="Orientation" value={eq.conditions.orientation} />
                        <ConditionBadge icon={Clock} label="Runtime" value={eq.conditions.runtime} />
                        <ConditionBadge icon={Thermometer} label="Temperature" value={eq.conditions.temperature} />
                      </div>
                    </div>
                  )}

                  {/* Equipment Features */}
                  {hasFeatures && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-3">Equipment Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(eq.features).map(([key, value]) => 
                          value ? (
                            <span key={key} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lubrication Details */}
                  {(eq.currentLubricant || eq.recommendedLubricant || eq.numberOfPoints) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Lubrication</h4>
                        <div className="space-y-1 text-sm">
                          {eq.currentLubricant && (
                            <div><span className="text-gray-600">Current:</span> {eq.currentLubricant}</div>
                          )}
                          {eq.recommendedLubricant && (
                            <div><span className="text-gray-600">Recommended:</span> {eq.recommendedLubricant}</div>
                          )}
                          {eq.lubricantLIS && (
                            <div><span className="text-gray-600">LIS #:</span> {eq.lubricantLIS}</div>
                          )}
                          {eq.numberOfPoints && (
                            <div><span className="text-gray-600">Points:</span> {eq.numberOfPoints}</div>
                          )}
                        </div>
                      </div>

                      {(eq.procedureNumber || eq.timeInterval || eq.requiredTime) && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-700 mb-2">Procedure</h4>
                          <div className="space-y-1 text-sm">
                            {eq.procedureNumber && (
                              <div><span className="text-gray-600">Procedure #:</span> {eq.procedureNumber}</div>
                            )}
                            {eq.timeInterval && (
                              <div><span className="text-gray-600">Interval:</span> {eq.timeInterval} days</div>
                            )}
                            {eq.requiredTime && (
                              <div><span className="text-gray-600">Time:</span> {eq.requiredTime} min</div>
                            )}
                            {eq.recommendedQuantity && (
                              <div>
                                <span className="text-gray-600">Quantity:</span> {eq.recommendedQuantity} {eq.unit}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tasks */}
                  {(eq.subTask1 || eq.subTask2 || eq.measuredTask1 || eq.measuredTask2) && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Tasks</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {eq.subTask1 && <div>• {eq.subTask1}</div>}
                        {eq.subTask2 && <div>• {eq.subTask2}</div>}
                        {eq.measuredTask1 && <div>📏 {eq.measuredTask1}</div>}
                        {eq.measuredTask2 && <div>📏 {eq.measuredTask2}</div>}
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  {eq.comment && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="text-xs font-bold text-yellow-800 mb-1">Comment/Question:</div>
                      <div className="text-sm text-yellow-900">{eq.comment}</div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-gray-500 border-t pt-3 mt-3">
                    {eq.user && <span>Collected by {eq.user}</span>}
                    {eq.dateTime && <span className="ml-3">on {eq.dateTime}</span>}
                    {eq.idemTo && (
                      <div className="mt-1">
                        <span className="font-semibold">Identical to:</span> {eq.idemTo}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredEquipment.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Filter size={48} className="mx-auto mb-4 opacity-30" />
            <p>No equipment matches your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
