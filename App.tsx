import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LayoutDashboard, Mic, Headphones, Moon, Sun, Plus } from 'lucide-react';

import { AudioFile, AnalysisStatus, TabView } from './types';
import FileUpload from './components/FileUpload';
import AnalysisTab from './components/AnalysisTab';
import SummaryTab from './components/SummaryTab';
import { analyzeCall } from './services/geminiService';

const MAX_CONCURRENT_ANALYSIS = 2;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('audio');
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Theme toggle effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Automatic Analysis Queue
  useEffect(() => {
    const processQueue = async () => {
      // Count currently analyzing files
      const analyzingCount = files.filter(f => f.status === AnalysisStatus.ANALYZING).length;
      
      // If we have capacity
      if (analyzingCount < MAX_CONCURRENT_ANALYSIS) {
        // Find next pending file
        const nextFile = files.find(f => f.status === AnalysisStatus.PENDING);
        
        if (nextFile) {
          handleAnalyze(nextFile.id);
        }
      }
    };

    processQueue();
  }, [files]); // Re-run when files state changes

  const handleFilesSelected = (newFiles: File[]) => {
    if (files.length + newFiles.length > 100) {
        alert("Максимальное количество файлов - 100");
        return;
    }

    const processedFiles: AudioFile[] = newFiles.map(file => ({
      id: uuidv4(),
      name: file.name,
      file,
      url: URL.createObjectURL(file),
      status: AnalysisStatus.PENDING,
    }));

    setFiles(prev => [...prev, ...processedFiles]);
  };

  const handleAnalyze = async (id: string) => {
    // 1. Mark as analyzing
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: AnalysisStatus.ANALYZING, errorMsg: undefined } : f
    ));

    const fileItem = files.find(f => f.id === id);
    if (!fileItem) return;

    try {
      const result = await analyzeCall(fileItem.file);
      
      // 2. Mark as completed
      setFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: AnalysisStatus.COMPLETED, analysis: result } : f
      ));
    } catch (error: any) {
        // 3. Mark as error
        setFiles(prev => prev.map(f => 
            f.id === id ? { ...f, status: AnalysisStatus.ERROR, errorMsg: error.message || "Ошибка при анализе" } : f
        ));
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-zinc-100 dark:bg-zinc-950">
      {/* Glassmorphism Header */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600 p-2.5 rounded-xl shadow-lg shadow-violet-600/20">
                <Headphones className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
               CallMonitor<span className="text-violet-600 dark:text-violet-400">Pro</span>
             </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button 
                  onClick={() => setActiveTab('audio')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'audio' 
                    ? 'bg-white dark:bg-zinc-700 text-violet-600 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-600' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
              >
                  <Mic className="w-4 h-4" />
                  Аудио
              </button>
              <button 
                  onClick={() => setActiveTab('summary')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'summary' 
                    ? 'bg-white dark:bg-zinc-700 text-violet-600 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-600' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
              >
                  <LayoutDashboard className="w-4 h-4" />
                  Свод
              </button>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-3 rounded-xl bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {files.length === 0 ? (
            <div className="max-w-xl mx-auto mt-20 fade-in">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-extrabold text-zinc-800 dark:text-white mb-4 tracking-tight">Мониторинг звонков 2.0</h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed">Загрузите записи разговоров. Наш AI проведет детальный аудит по 6 этапам продаж и даст рекомендации.</p>
                </div>
                <FileUpload onFilesSelected={handleFilesSelected} />
            </div>
        ) : (
             <>
                {activeTab === 'audio' && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center">
                             <div className="text-sm text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
                                Обработано: <span className="font-bold text-zinc-900 dark:text-white">{files.filter(f => f.status === AnalysisStatus.COMPLETED).length}</span> из {files.length}
                             </div>
                             <label className="cursor-pointer bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2 group transform active:scale-95 border border-violet-500">
                                <input type="file" multiple accept="audio/*" className="hidden" onChange={(e) => {
                                    if(e.target.files) handleFilesSelected(Array.from(e.target.files));
                                }} />
                                <Plus className="w-4 h-4" />
                                Добавить аудио
                             </label>
                        </div>
                        <AnalysisTab files={files} />
                    </div>
                )}

                {activeTab === 'summary' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                      <SummaryTab files={files} isDark={isDark} />
                    </div>
                )}
             </>
        )}
      </main>
    </div>
  );
};

export default App;