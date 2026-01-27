import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Pin, PinOff } from 'lucide-react';
import { ColumnInfo, CsvRow } from '../utils/csv-logic';

interface CsvPreviewTableProps {
  data: CsvRow[];
  schema: ColumnInfo[];
  title: string;
}

// Simple manual virtualization to avoid react-window import issues
const VirtualizedBody: React.FC<{
  data: CsvRow[];
  filteredSchema: ColumnInfo[];
  freezeColumns: boolean;
  assetNumCol?: ColumnInfo;
  doneCol?: ColumnInfo;
  schema: ColumnInfo[];
}> = ({ data, filteredSchema, freezeColumns, assetNumCol, doneCol, schema }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const itemHeight = 48;
  const viewportHeight = 500;

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
  const endIndex = Math.min(data.length, Math.ceil((scrollTop + viewportHeight) / itemHeight) + 5);

  const visibleRows = data.slice(startIndex, endIndex);

  return (
    <div 
      ref={containerRef}
      onScroll={onScroll}
      className="overflow-auto relative"
      style={{ height: viewportHeight }}
    >
      <div style={{ height: data.length * itemHeight, position: 'relative' }}>
        {visibleRows.map((row, i) => {
          const index = startIndex + i;
          return (
            <div 
              key={index}
              className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors absolute w-full"
              style={{ 
                height: itemHeight, 
                top: index * itemHeight,
                left: 0
              }}
            >
              {filteredSchema.map((col) => {
                const isFrozen = freezeColumns && (col.internalKey === assetNumCol?.internalKey || col.internalKey === doneCol?.internalKey);
                const assetIndex = assetNumCol ? schema.indexOf(assetNumCol) : -1;
                const doneIndex = doneCol ? schema.indexOf(doneCol) : -1;
                
                let leftOffset = 0;
                if (isFrozen && col.internalKey === doneCol?.internalKey) {
                  if (assetNumCol && assetIndex < doneIndex) {
                    leftOffset = 200;
                  }
                }

                return (
                  <div
                    key={col.internalKey}
                    className={`flex-shrink-0 px-4 py-3 text-sm text-gray-600 truncate border-r border-gray-50 flex items-center
                      ${isFrozen ? 'sticky z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                    style={{ 
                      width: 200,
                      left: isFrozen ? leftOffset : undefined 
                    }}
                  >
                    {row[col.internalKey] || ''}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CsvPreviewTable: React.FC<CsvPreviewTableProps> = ({ data, schema, title }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [freezeColumns, setFreezeColumns] = useState(true);

  const filteredSchema = useMemo(() => {
    if (!searchTerm) return schema;
    return schema.filter(col => 
      col.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schema, searchTerm]);

  // Identify special columns for freezing
  const assetNumCol = schema.find(c => c.displayName.trim() === "Asset number");
  const doneCol = schema.find(c => c.displayName.trim() === "Done?");

  return (
    <div className="flex flex-col h-[600px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center justify-between p-4 gap-4 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            {data.length} rows
          </span>
        </div>
        
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={() => setFreezeColumns(!freezeColumns)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${freezeColumns ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Freeze Asset number & Done? columns"
          >
            {freezeColumns ? <Pin size={16} /> : <PinOff size={16} />}
            <span className="hidden sm:inline">{freezeColumns ? 'Frozen' : 'Freeze'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <div className="min-w-max">
            {/* Header */}
            <div className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
              {filteredSchema.map((col, idx) => {
                const isFrozen = freezeColumns && (col.internalKey === assetNumCol?.internalKey || col.internalKey === doneCol?.internalKey);
                const assetIndex = assetNumCol ? schema.indexOf(assetNumCol) : -1;
                const doneIndex = doneCol ? schema.indexOf(doneCol) : -1;

                let leftOffset = 0;
                if (isFrozen && col.internalKey === doneCol?.internalKey) {
                  if (assetNumCol && assetIndex < doneIndex) {
                    leftOffset = 200;
                  }
                }
                
                return (
                  <div
                    key={col.internalKey}
                    className={`flex-shrink-0 px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 group relative
                      ${isFrozen ? 'sticky z-30 bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}
                    style={{ 
                      width: 200,
                      left: isFrozen ? leftOffset : undefined 
                    }}
                    title={`Occurrence: ${col.occurrenceIndex}`}
                  >
                    <div className="truncate">{col.displayName}</div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-gray-800/90 text-white text-[10px] pointer-events-none transition-opacity">
                      Occ: {col.occurrenceIndex}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Virtualized Body */}
            <VirtualizedBody 
              data={data}
              filteredSchema={filteredSchema}
              freezeColumns={freezeColumns}
              assetNumCol={assetNumCol}
              doneCol={doneCol}
              schema={schema}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
