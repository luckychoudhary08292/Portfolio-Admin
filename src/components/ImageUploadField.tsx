import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  required = false,
  placeholder = 'Image URL or upload from system',
  onShowToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast?.('Invalid File', 'Please select an image file', 'error');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (ev) => {
      const rawData = ev.target?.result as string;
      const img = new Image();

      img.onload = () => {
        // Optimize image size to prevent exceeding MongoDB 16MB document limit
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const optimized = canvas.toDataURL(mime, 0.85);
          onChange(optimized);
        } else {
          onChange(rawData);
        }

        setIsProcessing(false);
        onShowToast?.('Photo Uploaded', file.name, 'success');
      };

      img.onerror = () => {
        onChange(rawData);
        setIsProcessing(false);
        onShowToast?.('Photo Uploaded', file.name, 'success');
      };

      img.src = rawData;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      onShowToast?.('Upload Error', 'Could not read image file', 'error');
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <label className="font-medium text-slate-300">
          {label} {required && <span className="text-slate-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition cursor-pointer disabled:opacity-50"
        >
          <Upload className="w-3 h-3 text-slate-400" />
          <span>{isProcessing ? 'Processing...' : 'Upload from System'}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-hidden focus:border-slate-700"
        />

        <div className="relative w-9 h-8 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center group">
          {value ? (
            <>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-300 hover:text-white transition"
                title="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
          )}
        </div>
      </div>
    </div>
  );
};
