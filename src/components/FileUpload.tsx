import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploadProps {
  onFileLoaded: (data: ArrayBuffer, fileType: 'spreadsheet' | 'pdf', fileName?: string) => void;
}

export function FileUpload({ onFileLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setFileName(file.name);
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onFileLoaded(e.target.result as ArrayBuffer, isPdf ? 'pdf' : 'spreadsheet', file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [onFileLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
        transition-all duration-300 group
        ${isDragging 
          ? 'border-primary bg-primary/5 scale-[1.02]' 
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }
      `}
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls,.csv,.pdf';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) handleFile(file);
        };
        input.click();
      }}
    >
      <div className="flex flex-col items-center gap-4">
        {fileName ? (
          <>
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <p className="text-lg font-display font-semibold text-foreground">{fileName}</p>
              <p className="text-sm text-muted-foreground mt-1">Arquivo carregado com sucesso</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div>
              <p className="text-lg font-display font-semibold text-foreground">
                Arraste sua planilha aqui
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ou clique para selecionar • .xlsx, .xls, .csv, .pdf
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
