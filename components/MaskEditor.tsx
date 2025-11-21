
import React, { useRef, useState, useEffect } from 'react';
import { CheckIcon, XMarkIcon, ArrowPathIcon, PaintBrushIcon } from '@heroicons/react/24/outline';

interface MaskEditorProps {
  imageSrc: string;
  onConfirm: (maskImage: string, prompt: string) => void;
  onCancel: () => void;
}

export const MaskEditor: React.FC<MaskEditorProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [prompt, setPrompt] = useState('');
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas size to match image aspect ratio
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      if (canvasRef.current && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const scale = containerWidth / img.width;
        const canvas = canvasRef.current;
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Clear canvas initially
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
  }, [imageSrc]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        // Reset path
        ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Use a semi-transparent color for visual feedback to the user
    ctx.strokeStyle = 'rgba(255, 0, 100, 0.5)'; 
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    setHasDrawn(true);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasDrawn(false);
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new canvas to generate the binary mask
    // This mask will be black background, white drawing
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');

    if (maskCtx) {
        // 1. Fill Black
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

        // 2. Draw the user's strokes (from the visual canvas) as White
        // We use the visual canvas as the source
        maskCtx.globalCompositeOperation = 'source-over';
        
        // Since the visual canvas has semi-transparent red, we need to treat non-transparent pixels as white.
        // A simple way is to draw the visual canvas on top, then threshold it, or re-record strokes.
        // Easier approach for this demo: Use the visual canvas as an image source, and use composite operations.
        
        // Draw the visual canvas onto the mask canvas
        maskCtx.drawImage(canvas, 0, 0);
        
        // Now apply a composite operation to turn colored pixels white?
        // Actually, simpler hack:
        // The visual canvas has `rgba(255, 0, 100, 0.5)`.
        // We can just get the image data and set any non-transparent pixel to white.
        
        const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // If pixel is not black (which we filled initially), make it white
            // The visual canvas was drawn on top of the black fill.
            // Visual canvas color R=255. So if R > 0, it's part of the stroke.
            if (data[i] > 0) {
                data[i] = 255;     // R
                data[i + 1] = 255; // G
                data[i + 2] = 255; // B
                data[i + 3] = 255; // Alpha
            }
        }
        maskCtx.putImageData(imageData, 0, 0);
        
        const maskDataUrl = maskCanvas.toDataURL('image/png');
        onConfirm(maskDataUrl, prompt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-10">
        <button onClick={onCancel} className="text-gray-400 hover:text-white flex items-center gap-2">
          <XMarkIcon className="w-6 h-6" /> Cancel
        </button>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <PaintBrushIcon className="w-5 h-5 text-pink-500" /> Magic Edit
        </h2>
        <button 
            onClick={handleClear} 
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm"
            disabled={!hasDrawn}
        >
          <ArrowPathIcon className="w-4 h-4" /> Clear
        </button>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-black flex items-center justify-center touch-none">
         {/* Background Image */}
         <img 
            src={imageSrc} 
            alt="Target" 
            className="max-w-full max-h-full object-contain pointer-events-none select-none"
            style={{ opacity: 0.8 }} 
         />
         
         {/* Drawing Canvas - Positioned absolutely over the image */}
         {/* We use CSS to ensure it overlays perfectly. 
             The useEffect resizes the canvas resolution to match the image resolution.
             We rely on CSS object-fit contain behavior of the img tag and matching simple layout 
             or explicit positioning if we knew exact dimensions.
             
             Better approach for responsive overlay: 
             Put both in a container with same aspect ratio.
         */}
         <canvas
            ref={canvasRef}
            className="absolute max-w-full max-h-full object-contain cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
         />
         
         {!hasDrawn && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full pointer-events-none border border-white/10">
                 Draw on the area you want to change
             </div>
         )}
      </div>

      {/* Controls */}
      <div className="bg-slate-900 p-6 border-t border-slate-800 flex flex-col gap-4">
         {/* Brush Size Slider */}
         <div className="flex items-center gap-4">
             <span className="text-xs text-gray-400 w-12">Brush</span>
             <input 
                type="range" 
                min="5" 
                max="100" 
                value={brushSize} 
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
             />
             <div 
                className="w-6 h-6 rounded-full bg-pink-500 border border-white/20" 
                style={{ width: Math.min(24, brushSize/2), height: Math.min(24, brushSize/2) }}
             />
         </div>

         {/* Prompt Input */}
         <div className="flex gap-2">
             <input 
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What should replace the highlighted area?"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
             />
             <button 
                onClick={handleSubmit}
                disabled={!hasDrawn || !prompt.trim()}
                className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold transition-all shadow-lg shadow-pink-900/20 flex items-center justify-center"
             >
                 <CheckIcon className="w-6 h-6" />
             </button>
         </div>
      </div>
    </div>
  );
};
