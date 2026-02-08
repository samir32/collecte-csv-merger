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
  const [showAutosavePrompt, setShowAutosavePrompt] = useState(false);
  const [autosaveData, setAutosaveData] = useState<any>(null);
  const [equipmentRows, setEquipmentRows] = useState<Map<number, any[]>>(new Map());

  // Check for autosave on app load
  useEffect(() => {
    console.log('🔍 Checking for autosave on app load...');
    console.log('📦 All localStorage keys:', Object.keys(localStorage));
    
    try {
      // Check all possible autosave keys (we don't know client name yet)
      const keys = Object.keys(localStorage).filter(k => k.startsWith('workingsheet_autosave_'));
      console.log('📋 Found autosave keys:', keys);
      
      if (keys.length > 0) {
        // Get the most recent one
        const savedKey = keys[0]; // For now, use first one found
        console.log('🔑 Using autosave key:', savedKey);
        
        const saved = localStorage.getItem(savedKey);
        if (saved) {
          console.log('📦 Found autosave data, size:', saved.length, 'characters');
          console.log('📦 Parsing JSON...');
          const parsed = JSON.parse(saved);
          console.log('✅ Parsed autosave successfully');
          console.log('📊 Autosave contents:', {
            timestamp: parsed.timestamp,
            hasSetupConfig: !!parsed.setupConfig,
            setupConfig: parsed.setupConfig,
            hasResult: !!parsed.result,
            resultRowCount: parsed.result?.combinedDeduped?.length || 0,
            hasExcelResult: !!parsed.excelResult,
            excelEquipmentCount: parsed.excelResult?.processed?.length || 0,
            hasEquipmentRows: !!parsed.equipmentRows,
            equipmentRowsCount: parsed.equipmentRows?.length || 0,
            viewMode: parsed.viewMode,
            allKeys: Object.keys(parsed)
          });
          
          // VALIDATE: Only show prompt if autosave has complete data
          if (!parsed.setupConfig || !parsed.result || !parsed.excelResult) {
            console.warn('⚠️ Autosave is INCOMPLETE - missing core data. Deleting it.');
            console.log('❌ Missing:', {
              setupConfig: !parsed.setupConfig,
              result: !parsed.result,
              excelResult: !parsed.excelResult
            });
            localStorage.removeItem(savedKey);
            console.log('🗑️ Incomplete autosave deleted.');
            console.log('💡 To create a valid autosave:');
            console.log('   1. Load CSV files');
            console.log('   2. Answer setup questions');
            console.log('   3. Go to Working Sheet');
            console.log('   4. Make changes');
            console.log('   5. Autosave will be created automatically');
            return;
          }
          
          const savedTime = new Date(parsed.timestamp);
          const now = new Date();
          const daysDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60 * 24);
          console.log('📅 Autosave age:', daysDiff.toFixed(2), 'days');
          
          if (daysDiff < 7) {
            console.log('✅ Autosave is recent, showing prompt');
            setAutosaveData({ ...parsed, storageKey: savedKey });
            setShowAutosavePrompt(true);
          } else {
            console.log('⏰ Autosave too old (>7 days), removing');
            localStorage.removeItem(savedKey);
          }
        } else {
          console.log('⚠️ Key exists but no data found');
        }
      } else {
        console.log('ℹ️ No autosave keys found (this is normal on first use)');
      }
    } catch (error) {
      console.error('❌ Error loading autosave:', error);
    }
  }, []);

  // Restore from autosave
  const restoreAutosave = () => {
    console.log('🔄 Restore autosave clicked');
    console.log('📦 Autosave data:', autosaveData);
    
    if (!autosaveData) {
      console.error('❌ No autosave data to restore');
      toast.error('No autosave data found');
      return;
    }
    
    try {
      // Validate required data
      if (!autosaveData.setupConfig || !autosaveData.result || !autosaveData.excelResult) {
        console.error('❌ Missing required data in autosave:', {
          hasSetupConfig: !!autosaveData.setupConfig,
          hasResult: !!autosaveData.result,
          hasExcelResult: !!autosaveData.excelResult,
          hasEquipmentRows: !!autosaveData.equipmentRows
        });
        toast.error('Autosave data is incomplete - missing core data');
        
        // Log what we have
        console.log('Autosave data structure:', {
          keys: Object.keys(autosaveData),
          timestamp: autosaveData.timestamp,
          storageKey: autosaveData.storageKey
        });
        return;
      }
      
      console.log('✅ Validation passed, restoring state...');
      console.log('setupConfig:', autosaveData.setupConfig);
      console.log('result has', autosaveData.result?.combinedDeduped?.length || 0, 'rows');
      console.log('excelResult has', autosaveData.excelResult?.processed?.length || 0, 'equipment');
      console.log('equipmentRows has', autosaveData.equipmentRows?.length || 0, 'entries');
      
      setSetupConfig(autosaveData.setupConfig);
      setResult(autosaveData.result);
      setExcelResult(autosaveData.excelResult);
      setEquipmentRows(new Map(autosaveData.equipmentRows));
      setViewMode(autosaveData.viewMode || 'working');
      setShowAutosavePrompt(false);
      
      console.log('✅ All setState calls completed');
      
      // Give React time to process state updates
      setTimeout(() => {
        toast.success('Session restored!');
        console.log('✅ Restore complete - UI should update now');
      }, 100);
      
    } catch (error) {
      console.error('❌ Error during restore:', error);
      toast.error('Failed to restore session: ' + error.message);
    }
  };

  // Dismiss autosave
  const dismissAutosave = () => {
    if (autosaveData && autosaveData.storageKey) {
      localStorage.removeItem(autosaveData.storageKey);
    }
    setShowAutosavePrompt(false);
    setAutosaveData(null);
  };

  // Autosave complete state whenever it changes
  useEffect(() => {
    // Only autosave if we have complete data
    if (!setupConfig || !result || !excelResult) {
      console.log('⏭️ Skipping autosave - missing data:', {
        hasSetupConfig: !!setupConfig,
        hasResult: !!result,
        hasExcelResult: !!excelResult
      });
      return;
    }
    
    try {
      const AUTOSAVE_KEY = `workingsheet_autosave_${setupConfig.clientName}`;
      const dataToSave = {
        timestamp: new Date().toISOString(),
        setupConfig,
        result,
        excelResult,
        equipmentRows: Array.from(equipmentRows.entries()),
        viewMode
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave));
      console.log('✅ Autosaved to', AUTOSAVE_KEY, {
        equipmentCount: equipmentRows.size,
        viewMode,
        timestamp: dataToSave.timestamp
      });
    } catch (error) {
      console.error('❌ Error autosaving:', error);
    }
  }, [equipmentRows, setupConfig, result, excelResult, viewMode]);

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
    
    // Dismiss autosave prompt if files are being loaded
    if (showAutosavePrompt) {
      console.log('📥 New files loaded - dismissing autosave prompt');
      setShowAutosavePrompt(false);
    }
    
    try {
      // Check if first file is a session file
      if (files.length === 1 && files[0].name.endsWith('.json')) {
        console.log('📄 Detected JSON file:', files[0].name);
        const sessionFile = files[0];
        const sessionText = await sessionFile.text();
        try {
          const sessionData = JSON.parse(sessionText);
          console.log('📋 Parsed JSON, type:', sessionData.type);
          
          if (sessionData.type === 'workingsheet_session') {
            console.log('✅ Valid session file, loading...');
            // Load session
            setSetupConfig({
              language: sessionData.language,
              preProgram: false,
              spartakus: false,
              clientName: sessionData.clientName
            });
            setResult(sessionData.result);
            setExcelResult(sessionData.excelResult);
            setEquipmentRows(new Map(sessionData.equipmentRows));
            setViewMode('working');
            toast.success(`Session loaded: ${sessionData.clientName}`);
            setIsProcessing(false);
            console.log('✅ Session loaded successfully');
            return;
          } else {
            console.warn('⚠️ JSON file is not a session file (missing type field)');
            toast.error('This is not a valid session file');
            setIsProcessing(false);
            return;
          }
        } catch (e) {
          console.error('❌ Failed to parse JSON:', e);
          toast.error('Invalid JSON file format');
          setIsProcessing(false);
          return;
        }
      }
      
      console.log('📊 Processing as CSV files...');
      // Process CSV files (preserveOrder=true by default to match VBA macro behavior)
      // The VBA macro does NOT sort data ('Call SORTIT' is commented out)
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
        {/* Autosave Restore Prompt - FIRST THING */}
        {showAutosavePrompt && autosaveData && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-yellow-900 mb-2">
                  🔄 Autosaved Work Found
                </h3>
                <p className="text-sm text-yellow-800 mb-4">
                  Found autosaved work from {new Date(autosaveData.timestamp).toLocaleString()}. 
                  Would you like to restore your previous session?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={restoreAutosave}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                  >
                    ✅ Restore Autosave
                  </button>
                  <button
                    onClick={dismissAutosave}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  >
                    ❌ Start Fresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
              <div className="flex justify-center mb-6">
                <div className="flex gap-2 bg-gray-100 p-2 rounded-lg">
                  <button
                    onClick={() => setViewMode('csv')}
                    style={{
                      padding: '16px 32px',
                      fontWeight: 'bold',
                      borderRadius: '8px',
                      border: viewMode === 'csv' ? 'none' : '2px solid #1f2937',
                      backgroundColor: viewMode === 'csv' ? '#2563eb' : '#ffffff',
                      color: viewMode === 'csv' ? '#ffffff' : '#1f2937',
                      cursor: 'pointer'
                    }}
                  >
                    CSV View
                  </button>
                  <button
                    onClick={() => setViewMode('excel')}
                    style={{
                      padding: '16px 32px',
                      fontWeight: 'bold',
                      borderRadius: '8px',
                      border: viewMode === 'excel' ? 'none' : '2px solid #1f2937',
                      backgroundColor: viewMode === 'excel' ? '#16a34a' : '#ffffff',
                      color: viewMode === 'excel' ? '#ffffff' : '#1f2937',
                      cursor: 'pointer'
                    }}
                  >
                    Equipment Review
                  </button>
                  <button
                    onClick={() => setViewMode('working')}
                    style={{
                      padding: '16px 32px',
                      fontWeight: 'bold',
                      borderRadius: '8px',
                      border: viewMode === 'working' ? 'none' : '2px solid #1f2937',
                      backgroundColor: viewMode === 'working' ? '#9333ea' : '#ffffff',
                      color: viewMode === 'working' ? '#ffffff' : '#1f2937',
                      cursor: 'pointer'
                    }}
                  >
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
                        rawData={result.combinedDeduped}
                        schema={result.schema}
                        clientName={setupConfig.clientName}
                        language={setupConfig.language}
                        equipmentRows={equipmentRows}
                        onEquipmentRowsChange={setEquipmentRows}
                        onSaveSession={() => {
                          // Save complete session as downloadable file
                          const sessionData = {
                            type: 'workingsheet_session',
                            version: '1.0',
                            timestamp: new Date().toISOString(),
                            clientName: setupConfig.clientName,
                            language: setupConfig.language,
                            result: result,
                            excelResult: excelResult,
                            equipmentRows: Array.from(equipmentRows.entries())
                          };
                          const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${setupConfig.clientName}_Session_${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          toast.success('Session saved!');
                        }}
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
