
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onCancel: () => void;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [isStreamActive, setIsStreamActive] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreamActive(false);
    }
  };

  const startCamera = useCallback(async () => {
    setError('');
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      
      // Check if component is still mounted
      if (!videoRef.current) {
          currentStream.getTracks().forEach(t => t.stop());
          return;
      }

      streamRef.current = currentStream;
      setIsStreamActive(true);
      videoRef.current.srcObject = currentStream;
      
    } catch (err: any) {
      console.error("Camera error:", err);
      let msg = "Could not access camera.";
      
      const name = err.name || '';
      const message = err.message || '';

      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || message.toLowerCase().includes('denied')) {
         msg = "Camera access was denied. Please allow camera access in your browser settings (click the lock icon in the address bar) and reload.";
      } else if (message.toLowerCase().includes('dismissed')) {
         msg = "Permission prompt was dismissed. Please try again.";
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
         msg = "No camera device found on this device.";
      } else if (name === 'NotReadableError') {
         msg = "Camera is currently in use by another application.";
      }
      
      setError(msg);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && isStreamActive && !error) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageSrc);
      }
    }
  }, [onCapture, isStreamActive, error]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative">
      <div className="w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border-2 border-slate-700 flex flex-col justify-center group">
        {!error ? (
          <>
             <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
             />
             {/* Instruction Overlay */}
             <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                 <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                    Ensure good lighting for best AI results
                 </span>
             </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-red-400 p-6 text-center z-10 bg-slate-900/95 backdrop-blur-sm">
            <ExclamationTriangleIcon className="w-12 h-12 mb-4 opacity-80" />
            <p className="mb-6 text-lg font-semibold max-w-md leading-relaxed">{error}</p>
            
            <div className="flex flex-wrap justify-center gap-4 w-full">
                <button 
                    onClick={startCamera}
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center gap-2 text-white transition-all border border-slate-600 hover:border-teal-500 shadow-lg"
                >
                    <ArrowPathIcon className="w-5 h-5" />
                    Retry Access
                </button>
                
                <label className="cursor-pointer px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold transition-all flex items-center gap-2 shadow-lg transform hover:scale-105">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    <ArrowPathIcon className="w-5 h-5" />
                    <span>Upload Instead</span>
                </label>
            </div>
          </div>
        )}
      </div>

      {/* Controls Area - Hidden if error to reduce clutter, as error UI has its own controls */}
      {!error && (
        <div className="mt-8 flex gap-6 items-center z-10">
            <label className="cursor-pointer px-6 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all border border-slate-600 flex items-center gap-2 hover:border-teal-500 hover:text-teal-400">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <ArrowPathIcon className="w-5 h-5" />
                <span>Upload</span>
            </label>

            <button
            onClick={handleCapture}
            disabled={!isStreamActive}
            className={`w-20 h-20 rounded-full border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all flex items-center justify-center ${(!isStreamActive) ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-red-600 hover:bg-red-500 transform active:scale-95 hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]'}`}
            aria-label="Capture Photo"
            >
            <CameraIcon className="w-10 h-10 text-white" />
            </button>
            
            <button
            onClick={onCancel}
            className="px-6 py-3 rounded-full bg-transparent hover:bg-white/10 text-white font-medium transition-all border border-transparent hover:border-white/20"
            >
            Cancel
            </button>
        </div>
      )}

      {/* Cancel button when in error state */}
      {error && (
          <div className="mt-8">
              <button
                onClick={onCancel}
                className="px-6 py-3 rounded-full bg-transparent hover:bg-white/10 text-gray-400 hover:text-white font-medium transition-all"
                >
                Back to Home
            </button>
          </div>
      )}
    </div>
  );
};
