import { useState, useRef, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface FileUploadProps {
  onFileSelect?: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  showProgress?: boolean;
  progress?: number;
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({
    onFileSelect,
    accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
    multiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB default
    disabled = false,
    className,
    children,
    showProgress = false,
    progress = 0,
    ...props
  }, ref) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = ref || fileInputRef;

    const handleFileSelect = (files: FileList | null) => {
      if (!files || files.length === 0) return;
      
      // Validate file size
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size <= maxSize) {
          validFiles.push(file);
        }
      }
      
      if (validFiles.length > 0) {
        const dt = new DataTransfer();
        validFiles.forEach(file => dt.items.add(file));
        onFileSelect?.(dt.files);
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!disabled) {
        handleFileSelect(e.dataTransfer.files);
      }
    };

    const handleClick = () => {
      if (!disabled && inputRef && 'current' in inputRef) {
        inputRef.current?.click();
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
    };

    return (
      <div className="w-full">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            isDragOver && !disabled
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          data-testid="file-upload-zone"
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            disabled={disabled}
            data-testid="file-upload-input"
            {...props}
          />
          
          {children || (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <i className="fas fa-cloud-upload-alt text-primary text-xl"></i>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                {accept.split(',').map(ext => ext.trim().replace('.', '').toUpperCase()).join(', ')} up to {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </div>
          )}
        </div>
        
        {showProgress && progress > 0 && (
          <div className="mt-4" data-testid="file-upload-progress">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Uploading...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload };
