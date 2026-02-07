import React, { useState, useEffect } from 'react';
import { CsvUploader } from './components/CsvUploader';
import { CsvPreviewTable } from './components/CsvPreviewTable';
import { EquipmentReview } from './components/EquipmentReview';
import { SetupWizard, SetupConfig } from './components/SetupWizard';
import { WorkingSheet } from './components/WorkingSheet';
import { processCsvFiles, exportToCsv, ProcessedResult } from './utils/csv-logic';
import { 
  processWithExcelLogic, 
  assignPageNumbers,
  ExcelProcessingResult 
} from './utils/excel-processor';
import { 
  exportToFormattedExcel, 
  exportCurrentViewToExcel 
} from './utils/excel-exporter';
import { 
  Download, 
  FileCheck, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  Eye,
  LayoutList,
  ClipboardList,
  Edit3
} from 'lucide-react';
import { toast, Toaster } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'combined' | 'done' | 'todo';
type ViewMode = 'csv' | 'excel' | 'working';
type ExcelTab = 'all' | 'procedures' | 'notCollected' | 'noLubePoint' | 'sampled' | 'questions';

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [caseInsensitive, setCaseInsensitive] = useState(false);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [excelResult, setExcelResult] = useState<ExcelProcessingResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('combined');
  const [viewMode, setViewMode] = useState<ViewMode>('csv');
  const [excelTab, setExcelTab] = useState<ExcelTab>('all');
  const [setupConfig, setSetupConfig] = useState<SetupConfig | null>(null);

  useEffect(() => {
    if (files.length > 0) {
      handleProcess();
    } else {
      setResult(null);
      setExcelResult(null);
    }
  }, [files, caseInsensitive]);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      // Process CSV files (original logic)
      const processed = await processCsvFiles(files, caseInsensitive);
      setResult(processed);
      
      // Process with Excel logic
      const excelProcessed = processWithExcelLogic(processed.combinedDeduped, processed.schema);
      
      // Assign page numbers
      const withPageNumbers = {
        ...excelProcessed,
        processed: assignPageNumbers(excelProcessed.processed),
        byStatus: {
          procedures: assignPageNumbers(excelProcessed.byStatus.procedures),
          notCollected: assignPageNumbers(excelProcessed.byStatus.notCollected),
          noLubePoint: assignPageNumbers(excelProcessed.byStatus.noLubePoint),
          sampled: assignPageNumbers(excelProcessed.byStatus.sampled),
          questions: assignPageNumbers(excelProcessed.byStatus.questions),
        },
      };
      
      setExcelResult(withPageNumbers);
      
      if (processed.errors.length > 0) {
        processed.errors.forEach(err => toast.warning(err));
      } else {
        toast.success("Files processed successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to process files");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCsvDownload = (type: TabType) => {
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

  const handleExcelExport = async () => {
    if (!excelResult) return;
    
    try {
      toast.info('Generating Excel file...');
      await exportToFormattedExcel(
        excelResult.processed,
        excelResult.byStatus,
        'IAMGold-Westwood'
      );
      toast.success('Excel file exported successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export Excel file');
    }
  };

  const handleQuickExport = async () => {
    if (!excelResult) return;
    
    let data;
    let filename;
    
    switch (excelTab) {
      case 'all':
        data = excelResult.processed;
        filename = 'All_Equipment.xlsx';
        break;
      case 'procedures':
        data = excelResult.byStatus.procedures;
        filename = 'Procedures.xlsx';
        break;
      case 'notCollected':
        data = excelResult.byStatus.notCollected;
        filename = 'Not_Collected.xlsx';
        break;
      case 'noLubePoint':
        data = excelResult.byStatus.noLubePoint;
        filename = 'No_Lube_Point.xlsx';
        break;
      case 'sampled':
        data = excelResult.byStatus.sampled;
        filename = 'Sampled.xlsx';
        break;
      case 'questions':
        data = excelResult.byStatus.questions;
        filename = 'Questions.xlsx';
        break;
    }
    
    try {
      await exportCurrentViewToExcel(data, filename);
      toast.success(`Exported ${filename}`);
    } catch (error) {
      console.error(error);
      toast.error('Export failed');
    }
  };

  const csvStats = [
    { label: 'After Dedupe', value: result?.combinedDeduped.length || 0, icon: FileCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Done Rows', value: result?.done.length || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'ToDo Rows', value: result?.todo.length || 0, icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const excelStats = [
    { label: 'Total Equipment', value: excelResult?.stats.total || 0, icon: LayoutList, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Critical', value: excelResult?.stats.critical || 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Complicated', value: excelResult?.stats.complicated || 0, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Done', value: excelResult?.stats.done || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'To Do', value: excelResult?.stats.todo || 0, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Not Accessible', value: excelResult?.stats.notAccessible || 0, icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900 font-sans p-4 md:p-8">
      <Toaster position="top-right" richColors />
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Collecte CSV Merger & Processor
            </h1>
            <p className="text-gray-600 mt-2">Merge, deduplicate, and process lubrication data</p>
          </div>
        </header>

        {/* Upload Section */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
          <CsvUploader 
            files={files} 
            onFilesChange={setFiles} 
            onClear={() => {
              setFiles([]);
              setResult(null);
              setExcelResult(null);
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
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-xl font-semibold text-gray-700">Processing files...</p>
              <p className="text-sm text-gray-500">Merging, deduplicating, and analyzing equipment data</p>
            </motion.div>
          ) : result && excelResult ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* View Mode Toggle */}
              <div className="flex justify-center">
                <div className="inline-flex bg-gray-200 rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode('csv')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                      viewMode === 'csv'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FileCheck size={20} />
                    CSV View
                  </button>
                  <button
                    onClick={() => setViewMode('excel')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                      viewMode === 'excel'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Eye size={20} />
                    Equipment Review
                  </button>
                  <button
                    onClick={() => setViewMode('working')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${
                      viewMode === 'working'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Edit3 size={20} />
                    Working Sheet
                  </button>
                </div>
              </div>

              {/* CSV View */}
              {viewMode === 'csv' && (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {csvStats.map((stat, idx) => (
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

                  {/* CSV Exports */}
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => handleCsvDownload('combined')}
                      className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                      <Download size={20} />
                      Export Combined CSV
                    </button>
                    <button
                      onClick={() => handleCsvDownload('done')}
                      disabled={!result.hasDoneColumn}
                      className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={20} />
                      Export Done CSV
                    </button>
                    <button
                      onClick={() => handleCsvDownload('todo')}
                      disabled={!result.hasDoneColumn}
                      className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={20} />
                      Export ToDo CSV
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

                    <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
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
                </>
              )}

              {/* Excel View */}
              {viewMode === 'excel' && (
                <>
                  {/* Excel Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {excelStats.map((stat, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} w-fit mb-2`}>
                          <stat.icon size={20} />
                        </div>
                        <p className="text-xs font-medium text-gray-500 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Excel Export Buttons */}
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleExcelExport}
                      className="flex-1 min-w-[250px] flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all active:scale-95 shadow-xl shadow-green-200"
                    >
                      <FileSpreadsheet size={24} />
                      Export Full Excel Schedule
                    </button>
                    <button
                      onClick={handleQuickExport}
                      className="flex items-center justify-center gap-2 px-6 py-5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg"
                    >
                      <Download size={20} />
                      Export Current View
                    </button>
                  </div>

                  {/* Category Tabs */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                      {([
                        { key: 'all', label: 'All Equipment', count: excelResult.processed.length },
                        { key: 'procedures', label: 'Procedures', count: excelResult.byStatus.procedures.length },
                        { key: 'notCollected', label: 'Not Collected', count: excelResult.byStatus.notCollected.length },
                        { key: 'noLubePoint', label: 'No Lube Point', count: excelResult.byStatus.noLubePoint.length },
                        { key: 'sampled', label: 'Sampled', count: excelResult.byStatus.sampled.length },
                        { key: 'questions', label: 'Questions', count: excelResult.byStatus.questions.length },
                      ] as const).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setExcelTab(tab.key)}
                          className={`px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2
                            ${excelTab === tab.key 
                              ? 'text-green-600 border-green-600 bg-green-50' 
                              : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                          {tab.label}
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            excelTab === tab.key ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Equipment Review Display */}
                    <div className="p-6">
                      {excelTab === 'all' && (
                        <EquipmentReview equipment={excelResult.processed} title="All Equipment" />
                      )}
                      {excelTab === 'procedures' && (
                        <EquipmentReview equipment={excelResult.byStatus.procedures} title="Procedures to Perform" />
                      )}
                      {excelTab === 'notCollected' && (
                        <EquipmentReview equipment={excelResult.byStatus.notCollected} title="Equipment Not Collected" />
                      )}
                      {excelTab === 'noLubePoint' && (
                        <EquipmentReview equipment={excelResult.byStatus.noLubePoint} title="No Lubrication Points" />
                      )}
                      {excelTab === 'sampled' && (
                        <EquipmentReview equipment={excelResult.byStatus.sampled} title="Sampled Equipment" />
                      )}
                      {excelTab === 'questions' && (
                        <EquipmentReview equipment={excelResult.byStatus.questions} title="Questions & Comments" />
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Working Sheet View */}
              {viewMode === 'working' && (
                <>
                  {!setupConfig ? (
                    <SetupWizard
                      onComplete={(config) => {
                        setSetupConfig(config);
                        toast.success('Configuration saved!');
                      }}
                    />
                  ) : (
                    <>
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-purple-900">
                              {setupConfig.clientName}
                            </h3>
                            <p className="text-sm text-purple-700 mt-1">
                              Language: {setupConfig.language.toUpperCase()} | 
                              Pre-program: {setupConfig.preProgram ? 'Yes' : 'No'} | 
                              Spartakus: {setupConfig.spartakus ? 'Yes' : 'No'}
                            </p>
                          </div>
                          <button
                            onClick={() => setSetupConfig(null)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
                          >
                            Change Settings
                          </button>
                        </div>
                      </div>

                      <WorkingSheet
                        equipment={excelResult.processed}
                        rawData={result.combined}
                        schema={result.schema}
                        clientName={setupConfig.clientName}
                        language={setupConfig.language}
                        onUpdate={(updated) => {
                          setExcelResult({
                            ...excelResult,
                            processed: updated,
                          });
                        }}
                      />
                    </>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-gray-400"
            >
              <FileCheck size={64} strokeWidth={1} />
              <p className="mt-4 text-lg">Upload CSV files to begin processing</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
