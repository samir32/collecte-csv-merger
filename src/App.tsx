import React, { useState, useEffect } from 'react';
import { CsvUploader } from './components/CsvUploader';
import { CsvPreviewTable } from './components/CsvPreviewTable';
import { processCsvFiles, exportToCsv, ProcessedResult } from './utils/csv-logic';
import { 
  Download, 
  Settings, 
  FileCheck, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast, Toaster } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'combined' | 'done' | 'todo';

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [caseInsensitive, setCaseInsensitive] = useState(false);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('combined');

  useEffect(() => {
    if (files.length > 0) {
      handleProcess();
    } else {
      setResult(null);
    }
  }, [files, caseInsensitive]);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const processed = await processCsvFiles(files, caseInsensitive);
      setResult(processed);
      if (processed.errors.length > 0) {
        processed.errors.forEach(err => toast.warning(err));
      } else {
        toast.success("CSV files processed successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to process CSV files");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (type: TabType) => {
    if (!result) return;

    let data;
    let filename;

    switch (type) {
      case 'combined':
        data = result.combinedDeduped;
        filename = 'Combined_Deduped.csv';
        break;
      case 'done':
        data = result.done;
        filename = 'Done.csv';
        break;
      case 'todo':
        data = result.todo;
        filename = 'ToDo.csv';
        break;
    }

    const csvContent = exportToCsv(data, result.schema);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${filename}`);
  };

  const stats = [
    { label: 'After Dedupe', value: result?.combinedDeduped.length || 0, icon: FileCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Done Rows', value: result?.done.length || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'ToDo Rows', value: result?.todo.length || 0, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 md:p-8">
      <Toaster position="top-right" richColors />
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Collecte CSV Merger
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
          </div>
        </header>

        {/* Upload Section */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <CsvUploader 
            files={files} 
            onFilesChange={setFiles} 
            onClear={() => {
              setFiles([]);
              setResult(null);
            }} 
          />
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-lg font-medium text-gray-600">Processing CSV files...</p>
            </motion.div>
          ) : result ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Exports */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => handleDownload('combined')}
                  className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
                >
                  <Download size={20} />
                  Export Combined_Deduped
                </button>
                <button
                  onClick={() => handleDownload('done')}
                  disabled={!result.hasDoneColumn}
                  className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Download size={20} />
                  Export Done
                </button>
                <button
                  onClick={() => handleDownload('todo')}
                  disabled={!result.hasDoneColumn}
                  className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all active:scale-95 shadow-lg shadow-orange-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <Download size={20} />
                  Export ToDo
                </button>
              </div>

              {/* Preview Tabs */}
              <div className="space-y-4">
                <div className="flex border-b border-gray-200">
                  {(['combined', 'done', 'todo'] as TabType[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      disabled={tab !== 'combined' && !result.hasDoneColumn}
                      className={`px-6 py-3 text-sm font-bold transition-all relative border-b-2 disabled:opacity-30
                        ${activeTab === tab 
                          ? 'text-blue-600 border-blue-600' 
                          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl overflow-hidden">
                  {activeTab === 'combined' && (
                    <CsvPreviewTable 
                      data={result.combinedDeduped} 
                      schema={result.schema} 
                      title="Combined & Deduped Preview" 
                    />
                  )}
                  {activeTab === 'done' && result.hasDoneColumn && (
                    <CsvPreviewTable 
                      data={result.done} 
                      schema={result.schema} 
                      title="Done Rows Preview" 
                    />
                  )}
                  {activeTab === 'todo' && result.hasDoneColumn && (
                    <CsvPreviewTable 
                      data={result.todo} 
                      schema={result.schema} 
                      title="ToDo Rows Preview" 
                    />
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-gray-400"
            >
              <FileCheck size={64} strokeWidth={1} />
              <p className="mt-4 text-lg">Upload CSV files to begin merging and deduplicating</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
