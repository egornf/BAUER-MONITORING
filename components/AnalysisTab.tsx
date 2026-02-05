import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AudioFile, AnalysisStatus, CRITERIA_NAMES, CallAnalysis } from '../types';
import { Play, Pause, AlertCircle, CheckCircle, Clock, Search, FileAudio, RefreshCw, Loader2, User, MessageSquare, ListMusic, ChevronRight, UserCircle2, Lightbulb, ChevronDown, Flag, PlayCircle } from 'lucide-react';

interface AnalysisTabProps {
  files: AudioFile[];
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({ files }) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [filterText, setFilterText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [viewMode, setViewMode] = useState<'analysis' | 'transcription' | 'tips'>('analysis');
  const [expandedErrorId, setExpandedErrorId] = useState<number | null>(null);

  const selectedFile = useMemo(() => files.find(f => f.id === selectedFileId), [files, selectedFileId]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptionContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.load();
    }
  }, [selectedFileId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const seekTo = (time: number) => {
      if (audioRef.current) {
          audioRef.current.currentTime = time;
          audioRef.current.play();
          setIsPlaying(true);
      }
  };

  const scrollToError = (index: number) => {
    const element = document.getElementById(`transcription-line-${index}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setExpandedErrorId(index);
    }
  };

  const formatTime = (time: number) => {
    if (!time && time !== 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredFiles = useMemo(() => {
    return files.filter(f => f.name.toLowerCase().includes(filterText.toLowerCase()));
  }, [files, filterText]);

  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

  const ScoreBadge = ({ score }: { score: number }) => {
    let strokeColor = 'stroke-rose-500';
    let textColor = 'text-rose-600 dark:text-rose-400';
    if (score >= 8) {
        strokeColor = 'stroke-emerald-500';
        textColor = 'text-emerald-600 dark:text-emerald-400';
    } else if (score >= 5) {
        strokeColor = 'stroke-amber-500';
        textColor = 'text-amber-600 dark:text-amber-400';
    }
    
    const circumference = 2 * Math.PI * 16; 
    const offset = circumference - (score / 10) * circumference;

    return (
      <div className="flex items-center gap-3">
         <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform drop-shadow-sm" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-zinc-100 dark:stroke-zinc-700" strokeWidth="4"></circle>
                <circle cx="18" cy="18" r="16" fill="none" 
                    className={`${strokeColor} transition-all duration-1000 ease-out`}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                ></circle>
            </svg>
            <span className={`absolute text-sm font-bold ${textColor}`}>{score}</span>
         </div>
      </div>
    );
  };

  const errors = useMemo(() => {
      if (!selectedFile?.analysis?.transcription) return [];
      return selectedFile.analysis.transcription
        .map((line, index) => ({ line, index }))
        .filter(item => item.line.error?.hasError);
  }, [selectedFile]);

  return (
    <div className="flex h-[calc(100vh-180px)] gap-6">
      {/* Left Sidebar: List */}
      <div className="w-1/3 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-black/50 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors w-4 h-4" />
            <input 
              type="text" 
              placeholder="Поиск по звонкам..." 
              className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:text-white transition-all shadow-sm"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-zinc-50/50 dark:bg-zinc-900/50">
            {filteredFiles.length === 0 ? (
                <div className="p-12 text-center text-zinc-400 dark:text-zinc-600">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileAudio className="w-8 h-8 opacity-50"/>
                    </div>
                    <p className="text-sm font-medium">Нет файлов</p>
                </div>
            ) : (
                filteredFiles.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`group p-4 rounded-xl cursor-pointer transition-all duration-200 border-l-4 relative overflow-hidden ${
                        selectedFileId === file.id 
                          ? 'bg-white dark:bg-zinc-800 border-l-violet-600 border-t border-r border-b border-zinc-200 dark:border-zinc-700 shadow-lg scale-[1.02] z-10' 
                          : 'bg-white dark:bg-zinc-900 border-l-transparent border border-zinc-100 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                             <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                                 selectedFileId === file.id ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                             }`}>
                                 {file.analysis?.managerName ? file.analysis.managerName.substring(0,2).toUpperCase() : <User className="w-4 h-4"/>}
                             </div>
                             <div className="flex flex-col overflow-hidden">
                                <span className={`font-semibold truncate text-sm ${selectedFileId === file.id ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`} title={file.name}>
                                    {file.analysis?.managerName || "Менеджер"}
                                </span>
                                <span className="text-xs text-zinc-400 truncate font-mono">{file.name}</span>
                             </div>
                        </div>
                        {file.status === AnalysisStatus.COMPLETED && (
                          <div className={`flex flex-col items-end px-2 py-1 rounded-md ${file.analysis && file.analysis.overallScore >= 8 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : file.analysis && file.analysis.overallScore >= 5 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                             <span className="text-sm font-bold">{file.analysis?.overallScore.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pl-13">
                         <div className="flex items-center gap-3">
                             {file.analysis?.clientName && (
                                 <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-100 dark:border-zinc-700">
                                     <UserCircle2 className="w-3 h-3 mr-1"/> {file.analysis.clientName}
                                 </span>
                             )}
                         </div>
                        <div className="text-xs flex items-center gap-2">
                           {file.status === AnalysisStatus.PENDING && <span className="w-2 h-2 rounded-full bg-zinc-300"></span>}
                           {file.status === AnalysisStatus.ANALYZING && <Loader2 className="w-3 h-3 animate-spin text-violet-500"/>}
                           {file.status === AnalysisStatus.ERROR && <AlertCircle className="w-3 h-3 text-rose-500"/>}
                        </div>
                      </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Right Content: Detail */}
      <div className="w-2/3 flex flex-col gap-6 overflow-hidden">
        {selectedFile ? (
          <>
             {/* Invisible Audio Element */}
             <audio
                ref={audioRef}
                src={selectedFile.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
             />

            {/* Audio Player Card - Always Visible */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-md border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
               {/* Decorative background gradient */}
               <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-violet-50/50 to-transparent dark:from-violet-900/10 pointer-events-none"></div>
               
               <div className="flex items-center gap-6 relative z-10">
                 <button 
                   onClick={togglePlay}
                   className="w-16 h-16 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center transition-all shadow-xl hover:scale-105 active:scale-95 flex-shrink-0"
                 >
                   {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
                 </button>
                 
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <h2 className="font-bold text-zinc-900 dark:text-white text-lg truncate tracking-tight">{selectedFile.name}</h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-1 flex items-center gap-2">
                                {selectedFile.status === AnalysisStatus.ANALYZING ? (
                                    <span className="flex items-center gap-2 text-violet-600"><Loader2 className="w-3 h-3 animate-spin"/> Нейросеть слушает звонок...</span>
                                ) : selectedFile.analysis ? (
                                    <span className="flex items-center gap-2"><User className="w-3 h-3"/> {selectedFile.analysis.managerName} <ChevronRight className="w-3 h-3 opacity-50"/> <UserCircle2 className="w-3 h-3"/> {selectedFile.analysis.clientName}</span>
                                ) : 'Ожидание анализа'}
                            </p>
                        </div>
                        <div className="font-mono text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
                             {formatTime(currentTime)} <span className="text-zinc-400 mx-1">/</span> {formatTime(duration)}
                        </div>
                    </div>
                    <div className="relative h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden cursor-pointer group border border-zinc-200 dark:border-zinc-700">
                        <div className="absolute top-0 left-0 h-full bg-violet-600 transition-all duration-100" style={{ width: `${(currentTime / (duration || 100)) * 100}%` }}></div>
                        <input 
                            type="range" 
                            min="0" 
                            max={duration || 100} 
                            value={currentTime} 
                            onChange={handleSeek}
                            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                 </div>
               </div>
            </div>

            {/* Content Tabs */}
            {selectedFile.status === AnalysisStatus.COMPLETED && selectedFile.analysis && (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex p-1.5 bg-zinc-200/50 dark:bg-zinc-900 rounded-xl mb-4 gap-1 border border-zinc-200 dark:border-zinc-800">
                        <button 
                            onClick={() => setViewMode('analysis')}
                            className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                                viewMode === 'analysis' 
                                ? 'bg-white dark:bg-zinc-700 text-violet-700 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-600' 
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <ListMusic className="w-4 h-4"/> Анализ
                        </button>
                        <button 
                            onClick={() => setViewMode('tips')}
                            className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                                viewMode === 'tips' 
                                ? 'bg-white dark:bg-zinc-700 text-violet-700 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-600' 
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Lightbulb className="w-4 h-4"/> Советы
                        </button>
                        <button 
                            onClick={() => setViewMode('transcription')}
                            className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                                viewMode === 'transcription' 
                                ? 'bg-white dark:bg-zinc-700 text-violet-700 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-600' 
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <MessageSquare className="w-4 h-4"/> Скрипт
                            {errors.length > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">{errors.length}</span>
                            )}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" ref={transcriptionContainerRef}>
                        {viewMode === 'analysis' && (
                            <div className="space-y-4 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {/* Summary Hero */}
                                <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-violet-500/20 relative overflow-hidden border border-violet-500/50">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    <div className="flex justify-between items-start gap-6 relative z-10">
                                        <div>
                                            <h3 className="text-violet-200 font-bold text-xs mb-2 uppercase tracking-widest flex items-center gap-2">
                                                <Flag className="w-3 h-3"/> Вердикт системы
                                            </h3>
                                            <p className="text-base font-medium leading-relaxed opacity-95">
                                                {selectedFile.analysis.summary}
                                            </p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl flex flex-col items-center min-w-[120px] border border-white/20 shadow-inner">
                                            <span className="text-5xl font-extrabold tracking-tighter drop-shadow-sm">{selectedFile.analysis.overallScore}</span>
                                            <span className="text-[10px] text-violet-100 mt-1 uppercase font-bold tracking-widest">Баллов</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Grid */}
                                <div className="flex flex-col gap-4">
                                    {Object.entries(CRITERIA_NAMES).map(([key, label], index) => {
                                        const sectionKey = key as keyof Omit<CallAnalysis, 'overallScore' | 'summary' | 'transcription' | 'managerName' | 'clientName' | 'advice'>;
                                        const data = selectedFile.analysis![sectionKey];
                                        if (!data) return null;

                                        return (
                                            <div key={key} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800">
                                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold text-sm border border-zinc-200 dark:border-zinc-700">
                                                            {index + 1}
                                                        </div>
                                                        <h4 className="font-bold text-zinc-800 dark:text-zinc-100 text-lg">{label}</h4>
                                                    </div>
                                                    <ScoreBadge score={data.score} />
                                                </div>
                                                <div className="pl-12">
                                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-7">
                                                        {data.comment}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {viewMode === 'tips' && (
                             <div className="space-y-4 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/20 border border-amber-500/50">
                                    <div className="flex gap-5">
                                        <div className="bg-white/20 p-3 rounded-xl h-fit backdrop-blur-sm border border-white/20">
                                            <Lightbulb className="w-8 h-8 text-white"/>
                                        </div>
                                        <div>
                                            <h3 className="text-amber-100 font-bold text-xs mb-2 uppercase tracking-widest">Стратегия роста</h3>
                                            <p className="text-lg font-medium leading-relaxed opacity-95">
                                                {selectedFile.analysis.advice?.overall || "Отличная работа! Продолжайте в том же духе."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                     {Object.entries(CRITERIA_NAMES).map(([key, label]) => {
                                        const sectionKey = key as keyof Omit<CallAnalysis, 'overallScore' | 'summary' | 'transcription' | 'managerName' | 'clientName' | 'advice'>;
                                        // Tip logic: Show if advice exists AND score < 8
                                        const tip = selectedFile.analysis?.advice?.[sectionKey as keyof typeof selectedFile.analysis.advice];
                                        const score = selectedFile.analysis?.[sectionKey]?.score || 0;
                                        
                                        if (!tip || score >= 8) return null;

                                        return (
                                            <div key={key} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 border-l-4 border-l-amber-500 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                     <Lightbulb className="w-24 h-24 text-amber-500" />
                                                </div>
                                                <h4 className="font-bold text-zinc-800 dark:text-zinc-100 mb-3 flex items-center gap-3 relative z-10">
                                                    {label} 
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${score >= 5 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                        {score}/10
                                                    </span>
                                                </h4>
                                                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed relative z-10 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                    {tip}
                                                </p>
                                            </div>
                                        );
                                     })}
                                     
                                     {/* Fallback if all scores are high */}
                                     {Object.entries(CRITERIA_NAMES).every(([key]) => {
                                         const score = selectedFile.analysis?.[key as keyof Omit<CallAnalysis, 'overallScore' | 'summary' | 'transcription' | 'managerName' | 'clientName' | 'advice'>]?.score || 0;
                                         return score >= 8;
                                     }) && (
                                         <div className="text-center p-16 text-zinc-400">
                                             <div className="bg-emerald-50 dark:bg-emerald-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200 dark:border-emerald-800">
                                                 <CheckCircle className="w-10 h-10 text-emerald-500"/>
                                             </div>
                                             <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-2">Идеальная работа</h3>
                                             <p className="max-w-xs mx-auto">По всем блокам оценки 8 и выше. Критических замечаний нет.</p>
                                         </div>
                                     )}
                                </div>
                             </div>
                        )}

                        {viewMode === 'transcription' && (
                            <div className="space-y-6 pb-4 px-2 animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
                                {/* Quick Navigation for Errors */}
                                {errors.length > 0 && (
                                    <div className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-2 -mx-2 mb-4 border-b border-rose-100 dark:border-rose-900/30 shadow-sm flex items-center gap-3 overflow-x-auto custom-scrollbar">
                                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs whitespace-nowrap px-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {errors.length} ошибок
                                        </div>
                                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700"></div>
                                        {errors.map((err, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => scrollToError(err.index)}
                                                className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors whitespace-nowrap border border-rose-100 dark:border-rose-800 flex items-center gap-1"
                                            >
                                                #{i+1} <span className="opacity-50 text-[10px]">|</span> {formatTime(err.line.startTime || 0)}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {selectedFile.analysis.transcription && selectedFile.analysis.transcription.length > 0 ? (
                                    selectedFile.analysis.transcription.map((line, idx) => (
                                        <div key={idx} id={`transcription-line-${idx}`} className={`flex gap-4 ${line.role === 'manager' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`flex flex-col items-center gap-2 flex-shrink-0`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm transition-transform hover:scale-105 border ${
                                                    line.role === 'manager' 
                                                    ? 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-100 border-violet-200 dark:border-violet-700' 
                                                    : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                                                }`}>
                                                    {line.speaker.substring(0,1).toUpperCase()}
                                                </div>
                                                {/* Play Button per line */}
                                                <button 
                                                    onClick={() => seekTo(line.startTime || 0)}
                                                    className="p-1.5 rounded-full text-zinc-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-all"
                                                    title={`Воспроизвести с ${formatTime(line.startTime || 0)}`}
                                                >
                                                    <PlayCircle className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className={`flex flex-col max-w-[85%] ${line.role === 'manager' ? 'items-end' : 'items-start'}`}>
                                                <div className={`flex items-center gap-2 mb-1 px-1 ${line.role === 'manager' ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-xs text-zinc-500 font-bold">
                                                        {line.speaker}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md font-mono">
                                                        {formatTime(line.startTime || 0)}
                                                    </span>
                                                </div>

                                                <div className={`relative p-5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all border ${
                                                    line.role === 'manager'
                                                    ? 'bg-violet-50/80 dark:bg-violet-900/10 text-zinc-800 dark:text-violet-50 rounded-tr-sm border-violet-100 dark:border-violet-800'
                                                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-tl-sm border-zinc-200 dark:border-zinc-700'
                                                } ${line.error?.hasError ? 'ring-2 ring-rose-300 dark:ring-rose-500/50 bg-rose-50 dark:bg-rose-900/10 border-rose-200' : ''}`}>
                                                    {line.text}
                                                    
                                                    {/* Error Indicator Button */}
                                                    {line.error?.hasError && (
                                                        <button 
                                                            onClick={() => setExpandedErrorId(expandedErrorId === idx ? null : idx)}
                                                            className={`absolute -top-3 -right-3 p-1.5 rounded-full shadow-md transition-colors ${expandedErrorId === idx ? 'bg-rose-600 text-white' : 'bg-white dark:bg-zinc-700 text-rose-500 border border-rose-200'} animate-bounce z-10`}
                                                            title="Показать ошибку"
                                                        >
                                                            <ChevronDown className={`w-3 h-3 transition-transform ${expandedErrorId === idx ? 'rotate-180' : ''}`}/>
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Expanded Error Comment */}
                                                {line.error?.hasError && expandedErrorId === idx && (
                                                    <div className="mt-3 mr-2 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-200 p-4 rounded-xl text-xs border border-rose-100 dark:border-rose-800 animate-in fade-in slide-in-from-top-1 shadow-sm max-w-md relative">
                                                        <div className="absolute top-0 right-4 w-3 h-3 bg-rose-50 dark:bg-rose-900/20 border-t border-l border-rose-100 dark:border-rose-800 transform rotate-45 -translate-y-1.5"></div>
                                                        <div className="font-bold mb-2 flex items-center gap-2 text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                                                            <AlertCircle className="w-4 h-4"/>
                                                            Ошибка коммуникации
                                                        </div>
                                                        <p className="leading-relaxed text-sm">{line.error.comment}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center p-10 text-zinc-400">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                                        <p>Транскрибация не доступна для этого файла.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Empty State / Loading / Error */}
            {(!selectedFile.analysis && selectedFile.status !== AnalysisStatus.COMPLETED) && (
                 <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl m-1 bg-zinc-50/50 dark:bg-zinc-900/30">
                    {selectedFile.status === AnalysisStatus.ANALYZING ? (
                        <>
                           <div className="relative">
                                <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping"></div>
                                <div className="relative w-20 h-20 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-zinc-100 dark:border-zinc-700">
                                    <Loader2 className="w-10 h-10 text-violet-600 animate-spin"/>
                                </div>
                           </div>
                           <p className="font-bold text-lg text-zinc-700 dark:text-zinc-300">Анализируем звонок</p>
                           <p className="text-sm mt-2 opacity-75">Оценка скриптов, психологии и интонаций</p>
                        </>
                    ) : selectedFile.status === AnalysisStatus.ERROR ? (
                        <>
                           <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-6 border border-rose-100 dark:border-rose-800">
                                <AlertCircle className="w-10 h-10 text-rose-500"/>
                           </div>
                           <p className="font-bold text-lg text-rose-500">Ошибка анализа</p>
                           <p className="text-sm mt-2 max-w-xs text-center">{selectedFile.errorMsg}</p>
                        </>
                    ) : (
                        <>
                           <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
                                <FileAudio className="w-10 h-10 text-zinc-300 dark:text-zinc-600"/>
                           </div>
                           <p className="text-lg font-medium text-zinc-500">Запись ожидает анализа</p>
                        </>
                    )}
                </div>
            )}
          </>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
                <div className="bg-white dark:bg-zinc-900 p-10 rounded-full mb-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
                  <UserCircle2 className="w-24 h-24 text-zinc-200 dark:text-zinc-700" />
                </div>
                <h3 className="text-2xl font-bold text-zinc-700 dark:text-zinc-300 mb-3">Выберите звонок</h3>
                <p className="max-w-sm text-center text-zinc-500">Выберите запись из списка слева, чтобы увидеть детальный разбор, советы и транскрибацию.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisTab;