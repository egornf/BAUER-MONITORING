import React, { useMemo } from 'react';
import { AudioFile, AnalysisStatus, CRITERIA_NAMES, CallAnalysis } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, User, TrendingUp, TrendingDown, LayoutList, BarChart3 } from 'lucide-react';

interface SummaryTabProps {
  files: AudioFile[];
  isDark?: boolean;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ files, isDark = false }) => {
  const completedFiles = useMemo(() => files.filter(f => f.status === AnalysisStatus.COMPLETED && f.analysis), [files]);

  const averageScores = useMemo(() => {
    if (completedFiles.length === 0) return [];
    
    const sums: Record<string, number> = {
      greeting: 0,
      joining: 0,
      presentation: 0,
      referAFriend: 0,
      consolidation: 0,
      disconnection: 0
    };

    completedFiles.forEach(f => {
        if (!f.analysis) return;
        sums.greeting += f.analysis.greeting.score;
        sums.joining += f.analysis.joining.score;
        sums.presentation += f.analysis.presentation.score;
        sums.referAFriend += f.analysis.referAFriend.score;
        sums.consolidation += f.analysis.consolidation.score;
        sums.disconnection += f.analysis.disconnection.score;
    });

    return Object.keys(sums).map(key => ({
        name: CRITERIA_NAMES[key as keyof typeof CRITERIA_NAMES],
        avg: parseFloat((sums[key] / completedFiles.length).toFixed(1))
    }));

  }, [completedFiles]);

  const getScoreColor = (score: number, isBackground: boolean = true) => {
      if (score >= 8) return isBackground ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'text-emerald-600 dark:text-emerald-400';
      if (score >= 5) return isBackground ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' : 'text-amber-600 dark:text-amber-400';
      return isBackground ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' : 'text-rose-600 dark:text-rose-400';
  };

  if (completedFiles.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-400 dark:text-zinc-500">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-full mb-6">
                <AlertCircle className="w-12 h-12 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-zinc-600 dark:text-zinc-400 mb-2">Нет данных для анализа</h3>
              <p className="max-w-md text-center">Загрузите аудиофайлы, и после автоматического анализа здесь появится сводная статистика.</p>
          </div>
      );
  }

  const bestZone = averageScores.reduce((prev, current) => (prev.avg > current.avg) ? prev : current);
  const worstZone = averageScores.reduce((prev, current) => (prev.avg < current.avg) ? prev : current);

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 border-t-4 border-t-zinc-400 dark:border-t-zinc-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <LayoutList className="w-16 h-16 text-zinc-900 dark:text-white" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Всего звонков</h3>
            <p className="text-4xl font-extrabold text-zinc-800 dark:text-white">{completedFiles.length}</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 border-t-4 border-t-violet-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <BarChart3 className="w-16 h-16 text-violet-600" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Средний балл</h3>
            <p className="text-4xl font-extrabold text-violet-600 dark:text-violet-400">
                {(completedFiles.reduce((acc, curr) => acc + (curr.analysis?.overallScore || 0), 0) / completedFiles.length).toFixed(1)}
            </p>
        </div>
        
         <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 border-t-4 border-t-emerald-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <TrendingUp className="w-16 h-16 text-emerald-600" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Лучшая зона</h3>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate" title={bestZone.name}>
                {bestZone.name}
            </p>
            <span className="text-sm font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded mt-1 inline-block">{bestZone.avg}/10</span>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 border-t-4 border-t-rose-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <TrendingDown className="w-16 h-16 text-rose-600" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Зона роста</h3>
            <p className="text-xl font-bold text-rose-500 dark:text-rose-400 truncate" title={worstZone.name}>
                {worstZone.name}
            </p>
            <span className="text-sm font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded mt-1 inline-block">{worstZone.avg}/10</span>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 h-[28rem]">
        <h3 className="text-lg font-bold text-zinc-800 dark:text-white mb-8 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-500"/>
            Средние показатели по этапам звонка
        </h3>
        <ResponsiveContainer width="100%" height="90%">
            <BarChart data={averageScores} margin={{ top: 5, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#3f3f46' : '#f4f4f5'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 12, fontWeight: 500}} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: isDark ? '#a1a1aa' : '#71717a', fontSize: 12}} 
                  domain={[0, 10]} 
                />
                <Tooltip 
                    cursor={{fill: isDark ? '#27272a' : '#f4f4f5'}}
                    contentStyle={{
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: isDark ? '#18181b' : '#fff',
                      color: isDark ? '#f4f4f5' : '#18181b',
                      padding: '12px'
                    }}
                />
                <Bar dataKey="avg" name="Средний балл" radius={[6, 6, 0, 0]} barSize={50}>
                    {averageScores.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.avg >= 8 ? '#10b981' : entry.avg >= 5 ? '#f59e0b' : '#f43f5e'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
             <LayoutList className="w-5 h-5 text-violet-500"/>
             <h3 className="text-lg font-bold text-zinc-800 dark:text-white">Детальная статистика</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-600 dark:text-zinc-300">
                <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                        <th className="px-6 py-4 font-bold">Менеджер</th>
                        <th className="px-6 py-4 font-bold">Файл</th>
                        <th className="px-6 py-4 font-bold text-center">Общий</th>
                        <th className="px-6 py-4 font-bold text-center">Приветствие</th>
                        <th className="px-6 py-4 font-bold text-center">Присоед.</th>
                        <th className="px-6 py-4 font-bold text-center">Презент.</th>
                        <th className="px-6 py-4 font-bold text-center">Прив. друга</th>
                        <th className="px-6 py-4 font-bold text-center">Закреп.</th>
                        <th className="px-6 py-4 font-bold text-center">Отсоед.</th>
                    </tr>
                </thead>
                <tbody>
                    {completedFiles.map(file => (
                        <tr key={file.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold border border-violet-200 dark:border-violet-800">
                                        {file.analysis?.managerName ? file.analysis.managerName.substring(0,1).toUpperCase() : <User size={14}/>}
                                    </div>
                                    {file.analysis?.managerName}
                                </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-zinc-500 dark:text-zinc-400 truncate max-w-[150px]" title={file.name}>{file.name}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2.5 py-1 rounded-lg font-bold text-xs border ${getScoreColor(file.analysis!.overallScore)}`}>
                                    {file.analysis!.overallScore}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded-md font-medium text-xs border ${getScoreColor(file.analysis!.greeting.score)}`}>
                                    {file.analysis!.greeting.score}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded-md font-medium text-xs border ${getScoreColor(file.analysis!.joining.score)}`}>
                                    {file.analysis!.joining.score}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded-md font-medium text-xs border ${getScoreColor(file.analysis!.presentation.score)}`}>
                                    {file.analysis!.presentation.score}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded-md font-medium text-xs border ${getScoreColor(file.analysis!.referAFriend.score)}`}>
                                    {file.analysis!.referAFriend.score}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded-md font-medium text-xs border ${getScoreColor(file.analysis!.consolidation.score)}`}>
                                    {file.analysis!.consolidation.score}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`px-2 py-0.5 rounded-md font-medium text-xs border ${getScoreColor(file.analysis!.disconnection.score)}`}>
                                    {file.analysis!.disconnection.score}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;