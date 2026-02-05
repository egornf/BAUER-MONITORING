import React, { useCallback } from 'react';
import { Upload, FileAudio } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a'));
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="group border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl p-14 text-center hover:border-violet-500 dark:hover:border-violet-400 hover:bg-violet-50/10 dark:hover:bg-violet-900/10 transition-all cursor-pointer bg-white dark:bg-zinc-900 shadow-sm"
    >
      <input
        type="file"
        id="fileInput"
        multiple
        accept="audio/*"
        className="hidden"
        onChange={handleChange}
      />
      <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center w-full h-full">
        <div className="bg-violet-50 dark:bg-violet-900/20 p-6 rounded-full mb-6 group-hover:scale-110 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/40 transition-all duration-300">
          <Upload className="w-10 h-10 text-violet-600 dark:text-violet-400" />
        </div>
        <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">Загрузите аудио звонков</h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 max-w-xs leading-relaxed">
          Перетащите файлы сюда или нажмите, чтобы выбрать их на компьютере
        </p>
        <div className="flex gap-3 text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 py-2.5 px-6 rounded-full font-medium">
          <span className="flex items-center"><FileAudio className="w-3.5 h-3.5 mr-2"/> MP3</span>
          <span className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 self-center"></span>
          <span className="flex items-center"><FileAudio className="w-3.5 h-3.5 mr-2"/> WAV</span>
          <span className="w-px h-3 bg-zinc-300 dark:bg-zinc-600 self-center"></span>
          <span className="flex items-center"><FileAudio className="w-3.5 h-3.5 mr-2"/> M4A</span>
        </div>
      </label>
    </div>
  );
};

export default FileUpload;