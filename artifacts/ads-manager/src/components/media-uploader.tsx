import { useCallback, useRef, useState } from "react";
import { useUpload } from "@workspace/object-storage-web";
import { ImagePlus, Loader2, X, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaSrc } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 15 * 1024 * 1024;

export function MediaUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (objectPath: string | null) => void;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (res) => onChange(res.objectPath),
    onError: () =>
      toast({
        title: "Upload failed",
        description: "Could not upload the image. Please try again.",
        variant: "destructive",
      }),
  });

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!ACCEPTED.includes(file.type)) {
        toast({
          title: "Unsupported file",
          description: "Upload a PNG, JPG, WEBP or GIF image.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > MAX_BYTES) {
        toast({
          title: "File too large",
          description: "Images must be 15 MB or smaller.",
          variant: "destructive",
        });
        return;
      }
      void uploadFile(file);
    },
    [uploadFile, toast],
  );

  const src = mediaSrc(value);

  if (src) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border shadow-sm group">
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10">
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-semibold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all"
          >
            <X className="h-4 w-4" /> Remove Media
          </button>
        </div>
        <img
          src={src}
          alt="Ad creative"
          className="h-56 w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "flex h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200",
        isDragging
          ? "border-primary bg-primary/5 scale-[0.98]"
          : "border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-primary/5",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <svg className="w-12 h-12 text-muted" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
            </svg>
            <svg className="w-12 h-12 text-primary absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} className="transition-all duration-300" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold">{progress}%</span>
            </div>
          </div>
          <span className="text-sm font-semibold text-primary animate-pulse">
            Uploading media...
          </span>
        </div>
      ) : (
        <>
          <div className="h-14 w-14 rounded-full bg-background border border-border shadow-sm flex items-center justify-center mb-1">
            <UploadCloud className="h-6 w-6 text-primary" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground block">
              Click or drag to upload
            </span>
            <span className="text-xs text-muted-foreground mt-1 block">
              PNG, JPG, WEBP up to 15 MB
            </span>
          </div>
        </>
      )}
    </div>
  );
}
