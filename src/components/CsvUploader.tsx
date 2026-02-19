import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CsvUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  onClear: () => void;
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ files, onFilesChange, onClear }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => 
      file.name.toLowerCase().endsWith('.csv') || 
      file.name.toLowerCase().endsWith('.json') ||
      file.type === 'text/csv' ||
      file.type === 'application/json'
    );
    onFilesChange([...files, ...validFiles]);
  }, [files, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
  });

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Upload size={24} />
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {isDragActive ? 'Drop the files here' : 'Click or drag CSV or JSON files to upload'}
            </p>
            <p className="text-sm text-gray-500 mt-1">CSV for data processing • JSON for session restore</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Uploaded Files ({files.length})
              </h3>
              <button
                onClick={onClear}
                className="text-xs font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {files.map((file, idx) => (
                <motion.div
                  key={`${file.name}-${idx}`}
                  layout
                  className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText size={18} className="text-blue-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
