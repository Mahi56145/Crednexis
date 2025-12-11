import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeonButton } from "./NeonButton";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  className?: string;
}

export const FileUpload = ({
  onFileSelect,
  accept = ".csv",
  className,
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <motion.div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-300",
        isDragging
          ? "border-neon-cyan bg-neon-cyan/10 shadow-[0_0_30px_hsl(var(--neon-cyan)/0.2)]"
          : "border-glass-border bg-glass-bg/50 hover:border-neon-cyan/50",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      <div className="p-8 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key="file-selected"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-neon-cyan/20 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-neon-cyan" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center z-20"
                >
                  <X className="w-4 h-4 text-destructive-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-foreground">
                <FileText className="w-5 h-5 text-neon-cyan" />
                <span className="font-medium">{selectedFile.name}</span>
              </div>
              <span className="text-sm text-muted-foreground mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="upload-prompt"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-neon-cyan/10 flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-neon-cyan" />
              </div>
              <p className="text-foreground font-medium mb-2">
                Drop your CSV file here
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                or click to browse
              </p>
              <NeonButton variant="outline-cyan" size="sm">
                Select File
              </NeonButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
