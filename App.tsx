
import React, { useState, useRef, useEffect } from 'react';
import { Camera } from './components/Camera';
import { EraSelector } from './components/EraSelector';
import { MaskEditor } from './components/MaskEditor';
import { analyzeImage, timeTravel, customEdit, generateCreativePrompt, magicEdit } from './services/geminiService';
import { AppState, Era, ImageStyle, Resolution, GenerationResult } from './types';
import { 
    ClockIcon, 
    ArrowDownTrayIcon, 
    ArrowPathIcon, 
    ShareIcon, 
    ArrowsRightLeftIcon, 
    InformationCircleIcon, 
    XMarkIcon,
    SparklesIcon,
    WrenchScrewdriverIcon,
    PaintBrushIcon
} from '@heroicons/react/24/outline';

// --- Constants & Helpers ---

const STORAGE_KEYS = {
    STYLE: 'chronolens_style',
    RESOLUTION: 'chronolens_resolution',
    DETAIL: 'chronolens_detail'
};

const FILTER_OPTIONS = [
    { name: 'Original', value: 'none' },
    { name: 'B&W', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Vintage', value: 'sepia(50%) contrast(120%) brightness(90%)' },
    { name: 'Warm', value: 'sepia(30%) saturate(140%)' },
    { name: 'Dramatic', value: 'contrast(125%) saturate(0) brightness(110%)' },
];

/**
 * Draws the image to a canvas with the specified CSS filter string 
 * and returns the new Data URL.
 */
const applyFilterToImage = (imageUrl: string, filter: string): Promise<string> => {
    if (!filter || filter === 'none') return Promise.resolve(imageUrl);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }
            ctx.filter = filter;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (e) => reject(e);
        img.src = imageUrl;
    });
};

// --- Components ---

const InfoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                    <ClockIcon className="w-8 h-8 text-teal-500" />
                    <h2 className="text-2xl font-bold text-white">ChronoLens</h2>
                </div>
                
                <p className="text-gray-300 mb-4 leading-relaxed">
                    Step into history or reimagine your reality. ChronoLens uses advanced AI to transport your photos through time while preserving your identity.
                </p>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
                    <h3 className="text-sm font-bold text-teal-400 uppercase mb-2 flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4" /> Powered by Gemini
                    </h3>
                    <ul className="text-xs text-gray-400 space-y-2">
                        <li className="flex gap-2">
                            <span className="font-mono text-white bg-slate-700 px-1 rounded">gemini-2.5-flash-image</span>
                            <span>High-fidelity image generation & editing</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-mono text-white bg-slate-700 px-1 rounded">gemini-3-pro-preview</span>
                            <span>Deep visual understanding & context analysis</span>
                        </li>
                    </ul>
                </div>
                
                <div className="text-center text-xs text-gray-500 mt-6">
                    v1.0.0 • Built with Google GenAI SDK
                </div>
            </div>
        </div>
    );
};

// --- Main Application ---

export default function App() {
  const [state, setState] = useState<AppState>(AppState.HOME);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Store multiple results
  const [generatedResults, setGeneratedResults] = useState<GenerationResult[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Configuration state with LocalStorage Persistence
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>(() => 
      (localStorage.getItem(STORAGE_KEYS.STYLE) as ImageStyle) || ImageStyle.REALISTIC
  );
  const [selectedResolution, setSelectedResolution] = useState<Resolution>(() => 
      (localStorage.getItem(STORAGE_KEYS.RESOLUTION) as Resolution) || Resolution.STANDARD
  );
  const [detailLevel, setDetailLevel] = useState<number>(() => 
      Number(localStorage.getItem(STORAGE_KEYS.DETAIL)) || 50
  );
  
  // Prompt State
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // UI State
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('none');

  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Effects ---

  // Save settings when they change
  useEffect(() => {
      localStorage.setItem(STORAGE_KEYS.STYLE, selectedStyle);
      localStorage.setItem(STORAGE_KEYS.RESOLUTION, selectedResolution);
      localStorage.setItem(STORAGE_KEYS.DETAIL, String(detailLevel));
  }, [selectedStyle, selectedResolution, detailLevel]);

  // Audio loop handling
  useEffect(() => {
    const playAudio = async () => {
        if (audioRef.current) {
            if (state === AppState.PROCESSING || state === AppState.RESTORE || state === AppState.RESULT) {
                audioRef.current.volume = 0.2;
                try {
                    await audioRef.current.play();
                } catch (e) {
                    console.warn("Autoplay prevented", e);
                }
            } else {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
    };
    playAudio();
  }, [state]);

  // --- Actions ---

  const startApp = () => setState(AppState.CAPTURE);

  const handleCapture = (imageSrc: string) => {
    setCapturedImage(imageSrc);
    setState(AppState.PREVIEW);
    setError(null);
    setAnalysisText(null);
    setGeneratedResults([]);
    setActiveFilter('none');
    setCustomPrompt('');
  };

  const reset = () => {
    setCapturedImage(null);
    setGeneratedResults([]);
    setAnalysisText(null);
    setState(AppState.HOME);
    setActiveFilter('none');
    setCustomPrompt('');
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setState(AppState.PROCESSING);
    setError(null);
    try {
      const text = await analyzeImage(capturedImage, 'CONTEXT');
      setAnalysisText(text);
      setState(AppState.PREVIEW);
    } catch (e: any) {
      setError(e.message || "Analysis failed");
      setState(AppState.PREVIEW);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!capturedImage) return;
    setIsGeneratingPrompt(true);
    try {
        const prompt = await generateCreativePrompt(capturedImage);
        setCustomPrompt(prompt);
    } catch (e: any) {
        console.error("Prompt generation error", e);
        // Don't block UI, just log
    } finally {
        setIsGeneratingPrompt(false);
    }
  };

  const handleRestore = async () => {
    if (!capturedImage) return;
    // Set to RESTORE state to show specific restoration UI
    setState(AppState.RESTORE);
    setError(null);
    setGeneratedResults([]);
    setActiveIndex(0);
    setActiveFilter('none');

    try {
        // 1. Analyze for damage
        const damageReport = await analyzeImage(capturedImage, 'DAMAGE');
        
        // 2. Generate Restored Image
        const restorationPrompt = `Restore this photograph to perfection. Fix the following issues: ${damageReport}. Remove all scratches, tears, noise, and blur. Enhance clarity and sharpness. Ensure colors are natural and vibrant.`;
        
        const imageUrl = await customEdit(capturedImage, restorationPrompt, ImageStyle.REALISTIC, Resolution.HIGH, 80);
        
        setGeneratedResults([{ era: 'Restored Photo', imageUrl }]);
        setState(AppState.RESULT);
    } catch (e: any) {
        console.error(e);
        setError(e.message || "Restoration failed.");
        setState(AppState.PREVIEW);
    }
  };

  const handleStartJourney = async (eras: Era[]) => {
    if (!capturedImage || eras.length === 0) return;
    setState(AppState.PROCESSING);
    setError(null);
    setGeneratedResults([]);
    setActiveIndex(0);
    setActiveFilter('none');

    const results: GenerationResult[] = [];
    try {
        for (const era of eras) {
            const imageUrl = await timeTravel(capturedImage, era, selectedStyle, selectedResolution, detailLevel);
            results.push({ era: era, imageUrl });
            setGeneratedResults([...results]);
        }
        setState(AppState.RESULT);
    } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed during time travel.");
        if (results.length > 0) {
            setState(AppState.RESULT);
        } else {
            setState(AppState.PREVIEW);
        }
    }
  };

  const handleCustomEdit = async (prompt: string) => {
    if (!capturedImage) return;
    setState(AppState.PROCESSING);
    setError(null);
    setGeneratedResults([]);
    setActiveIndex(0);
    setActiveFilter('none');
    
    try {
      const imageUrl = await customEdit(capturedImage, prompt, selectedStyle, selectedResolution, detailLevel);
      setGeneratedResults([{ era: 'Custom Reality', imageUrl }]);
      setState(AppState.RESULT);
    } catch (e: any) {
      setError(e.message || "Custom edit failed");
      setState(AppState.PREVIEW);
    }
  };
  
  // New Magic Edit Handlers
  const handleStartMagicEdit = () => {
      setState(AppState.MASKING);
  };

  const handleMagicEditProcess = async (maskImage: string, prompt: string) => {
      if (!capturedImage) return;
      setState(AppState.PROCESSING);
      setError(null);
      setGeneratedResults([]);
      setActiveIndex(0);
      setActiveFilter('none');
      
      try {
          const imageUrl = await magicEdit(capturedImage, maskImage, prompt);
          setGeneratedResults([{ era: 'Magic Edit', imageUrl }]);
          setState(AppState.RESULT);
      } catch (e: any) {
          setError(e.message || "Magic edit failed");
          setState(AppState.PREVIEW);
      }
  };

  const getProcessedImage = async () => {
      const currentImage = generatedResults[activeIndex]?.imageUrl;
      if (!currentImage) return null;
      return await applyFilterToImage(currentImage, activeFilter);
  };

  const handleShare = async () => {
    const processedImage = await getProcessedImage();
    
    if (navigator.share && processedImage) {
      try {
        const res = await fetch(processedImage);
        const blob = await res.blob();
        const file = new File([blob], 'chronolens-time-travel.png', { type: 'image/png' });
        await navigator.share({
          title: 'ChronoLens Time Travel',
          text: 'I just time traveled with ChronoLens! Check out my photo.',
          files: [file]
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      alert("Sharing is not supported on this device. Please use the Download button.");
    }
  };

  const handleDownload = async () => {
      const processedImage = await getProcessedImage();
      const currentEra = generatedResults[activeIndex]?.era || 'image';
      
      if (processedImage) {
          const link = document.createElement('a');
          link.href = processedImage;
          link.download = `chronolens-${currentEra.replace(/\s+/g, '-').toLowerCase()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  const handleDownloadOriginal = () => {
      if (capturedImage) {
          const link = document.createElement('a');
          link.href = capturedImage;
          link.download = 'chronolens-original.jpg';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  // --- Renders ---

  const renderHome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center relative">
      <div className="mb-8 relative">
        <div className="absolute inset-0 bg-teal-500 blur-3xl opacity-20 rounded-full animate-pulse-slow"></div>
        <ClockIcon className="w-24 h-24 text-teal-400 relative z-10" />
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-br from-white via-teal-200 to-teal-600 bg-clip-text text-transparent mb-6">
        ChronoLens
      </h1>
      <p className="text-xl text-gray-400 max-w-lg mb-10 leading-relaxed">
        Step into the past or rewrite your reality. Powered by Gemini 2.5 Flash & 3 Pro.
      </p>
      <button
        onClick={startApp}
        className="px-10 py-4 bg-teal-600 hover:bg-teal-500 text-white text-lg font-bold rounded-full transition-all transform hover:scale-105 shadow-lg shadow-teal-900/50"
      >
        Enter Photo Booth
      </button>
    </div>
  );

  const renderCapture = () => (
    <div className="h-screen w-full flex flex-col bg-obsidian">
       <div className="p-4 bg-black/20 text-center font-bold text-gray-500">
         ALIGN YOUR FACE
       </div>
      <div className="flex-1 overflow-hidden">
        <Camera onCapture={handleCapture} onCancel={() => setState(AppState.HOME)} />
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="min-h-screen flex flex-col items-center p-6 max-w-6xl mx-auto pt-16">
      <div className="w-full flex justify-between items-center mb-6">
        <button onClick={reset} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
           <ArrowPathIcon className="w-5 h-5"/> Start Over
        </button>
        <span className="font-mono text-teal-500/80 uppercase tracking-widest text-sm">Subject Acquired</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full items-start">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-black relative group">
            <img src={capturedImage!} alt="Original" className="w-full h-auto object-cover" />
            
            {/* Magic Prompt Button Overlay */}
            <button
                onClick={handleGeneratePrompt}
                disabled={isGeneratingPrompt}
                className="absolute bottom-4 right-4 bg-black/70 hover:bg-teal-600 text-white px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2 transition-all border border-white/20 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed z-20"
            >
                {isGeneratingPrompt ? (
                   <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                   <SparklesIcon className="w-5 h-5 text-yellow-400" />
                )}
                <span className="font-bold text-sm">Magic Prompt</span>
            </button>
          </div>
          
          {analysisText && (
            <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30 text-purple-100 text-sm leading-relaxed animate-fade-in">
              <h4 className="font-bold text-purple-400 mb-2 uppercase text-xs tracking-wider">Gemini 3 Pro Analysis</h4>
              {analysisText}
            </div>
          )}
          
          {error && (
            <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="w-full">
           <EraSelector 
              onStartJourney={handleStartJourney} 
              onCustom={handleCustomEdit}
              onAnalyze={handleAnalyze}
              onRestore={handleRestore}
              onMagicEdit={handleStartMagicEdit}
              onStyleChange={setSelectedStyle}
              onResolutionChange={setSelectedResolution}
              onDetailLevelChange={setDetailLevel}
              currentStyle={selectedStyle}
              currentResolution={selectedResolution}
              currentDetailLevel={detailLevel}
              isProcessing={state === AppState.PROCESSING || state === AppState.RESTORE}
              customPrompt={customPrompt}
              onCustomPromptChange={setCustomPrompt}
           />
        </div>
      </div>
    </div>
  );
  
  const renderMasking = () => (
      <MaskEditor 
        imageSrc={capturedImage!} 
        onConfirm={handleMagicEditProcess} 
        onCancel={() => setState(AppState.PREVIEW)} 
      />
  );

  const renderLoadingState = (isRestore: boolean) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-obsidian text-center p-6 relative overflow-hidden">
      {/* Background Nebulas */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${isRestore ? 'bg-blue-600' : 'bg-teal-600'} rounded-full blur-[120px] animate-pulse`}></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      {/* Vortex Animation */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
           {/* Outer Ring */}
           <div className={`absolute inset-0 border-2 ${isRestore ? 'border-blue-500/30' : 'border-teal-500/30'} rounded-full animate-[spin_10s_linear_infinite]`}></div>
           <div className={`absolute inset-0 border-t-2 ${isRestore ? 'border-blue-400' : 'border-teal-400'} rounded-full animate-[spin_3s_linear_infinite]`}></div>
           
           {/* Middle Ring */}
           <div className="absolute inset-4 border-2 border-purple-500/30 rounded-full animate-[spin_7s_linear_infinite_reverse]"></div>
           <div className="absolute inset-4 border-r-2 border-purple-400 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
           
           {/* Inner Core */}
           <div className="absolute inset-12 bg-slate-900 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 flex items-center justify-center">
               <div className={`w-full h-full rounded-full opacity-50 animate-pulse ${isRestore ? 'bg-blue-900' : 'bg-teal-900'}`}></div>
           </div>

           {/* Icon */}
           <div className="absolute inset-0 flex items-center justify-center z-20 animate-bounce-slight">
             {isRestore ? 
                <WrenchScrewdriverIcon className="w-10 h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" /> : 
                <ClockIcon className="w-10 h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
             }
           </div>
           
           {/* Orbital Particles */}
           <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
           </div>
           <div className="absolute inset-2 animate-[spin_5s_linear_infinite_reverse]">
              <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-purple-300 rounded-full shadow-[0_0_8px_purple]"></div>
           </div>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-white to-purple-200 animate-pulse">
            {isRestore ? 'Restoring Artifact' : 'Traversing Timelines'}
        </h2>
        
        <p className="text-gray-400 font-mono text-sm tracking-widest uppercase opacity-80">
           {isRestore 
            ? 'Analyzing structural integrity...' 
            : (generatedResults.length > 0 ? `Materializing Era ${generatedResults.length}...` : 'Initiating Warp Drive...')}
        </p>
      </div>
      <style>{`
        @keyframes bounce-slight {
            0%, 100% { transform: translateY(-5%); }
            50% { transform: translateY(5%); }
        }
        .animate-bounce-slight {
            animation: bounce-slight 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );

  const renderResult = () => {
    const activeResult = generatedResults[activeIndex];
    if (!activeResult) return <div>Error: No result</div>;

    return (
        <div className="min-h-screen flex flex-col items-center p-6 max-w-5xl mx-auto w-full pt-16">
           <div className="w-full flex justify-between items-center mb-6">
            <button onClick={() => setState(AppState.PREVIEW)} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
               &larr; Adjust Settings
            </button>
            <button onClick={reset} className="text-teal-400 hover:text-teal-300 transition-colors">
               New Photo
            </button>
          </div>
    
          <div className="w-full flex flex-col items-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">{activeResult.era}</h3>
              <div className="relative w-full max-w-2xl aspect-[3/4] md:aspect-square rounded-2xl overflow-hidden border-2 border-teal-500/30 shadow-2xl shadow-teal-900/20 group select-none cursor-col-resize">
                
                {/* Base Layer (Generated + Filter) */}
                <img 
                  src={activeResult.imageUrl} 
                  alt="Generated Result" 
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
                  style={{ filter: activeFilter }}
                />
                
                {/* Overlay Layer (Original) - No Filter */}
                <div 
                  className="absolute inset-0 w-full h-full overflow-hidden"
                  style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                >
                   <img 
                    src={capturedImage!} 
                    alt="Original" 
                    className="absolute inset-0 w-full h-full object-cover" 
                   />
                   <span className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md border border-white/10">ORIGINAL</span>
                </div>
        
                <span className="absolute top-4 right-4 bg-teal-600/80 text-white px-3 py-1 text-xs font-bold rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                    {selectedStyle}
                </span>
        
                <div 
                   className="absolute inset-y-0 w-1 bg-white/50 backdrop-blur-sm" 
                   style={{ left: `${sliderPosition}%` }}
                >
                   <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-teal-600 border-2 border-teal-500 animate-[pulse_3s_infinite]">
                      <ArrowsRightLeftIcon className="w-5 h-5" />
                   </div>
                </div>
        
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={sliderPosition} 
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize z-10"
                />
              </div>
          </div>

          {/* Filter Selector */}
          <div className="w-full max-w-2xl mb-8">
              <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  Color Filters <span className="text-xs font-normal normal-case text-gray-500">(Applied on Download)</span>
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {FILTER_OPTIONS.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => setActiveFilter(f.value)}
                        className={`flex flex-col items-center gap-2 group ${activeFilter === f.value ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                      >
                          <div className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${activeFilter === f.value ? 'border-teal-500 scale-105 shadow-lg shadow-teal-900/50' : 'border-transparent'}`}>
                              <img 
                                src={activeResult.imageUrl} 
                                className="w-full h-full object-cover"
                                style={{ filter: f.value }}
                                alt={f.name}
                              />
                          </div>
                          <span className={`text-xs font-medium ${activeFilter === f.value ? 'text-teal-400' : 'text-gray-400'}`}>{f.name}</span>
                      </button>
                  ))}
              </div>
          </div>

          {/* Gallery Strip */}
          {generatedResults.length > 1 && (
             <div className="w-full max-w-2xl overflow-x-auto mb-6 pb-2">
                <div className="flex gap-3">
                    {generatedResults.map((res, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                                activeIndex === idx ? 'border-teal-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                            <img src={res.imageUrl} className="w-full h-full object-cover" alt={res.era} style={{ filter: activeFilter }} />
                        </button>
                    ))}
                </div>
             </div>
          )}
    
          <div className="flex flex-col gap-4 w-full max-w-2xl justify-center pb-10">
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button 
                    onClick={handleDownload}
                    className="flex-1 px-6 py-4 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" /> Download Result
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex-1 px-6 py-4 bg-teal-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-teal-500 transition-colors shadow-lg"
                  >
                     <ShareIcon className="w-5 h-5" /> Share
                  </button>
              </div>
              <button 
                onClick={handleDownloadOriginal}
                className="text-gray-500 text-sm hover:text-white transition-colors underline decoration-dotted underline-offset-4"
              >
                Download Original Captured Image
              </button>
          </div>
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-obsidian text-slate-200 font-sans selection:bg-teal-500/30">
      {/* Header Info Button - Always visible unless in home */}
      <div className="fixed top-4 right-4 z-50">
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="bg-slate-800/80 backdrop-blur-md p-2 rounded-full text-gray-300 hover:text-white hover:bg-slate-700 transition-all shadow-lg border border-slate-600/50"
          >
              <InformationCircleIcon className="w-6 h-6" />
          </button>
      </div>

      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
      
      <audio ref={audioRef} loop src="https://cdn.pixabay.com/audio/2022/10/18/audio_31c2730e64.mp3" className="hidden" />

      {state === AppState.HOME && renderHome()}
      {state === AppState.CAPTURE && renderCapture()}
      {state === AppState.MASKING && renderMasking()}
      {state === AppState.PROCESSING && renderLoadingState(false)}
      {state === AppState.RESTORE && renderLoadingState(true)}
      {state === AppState.PREVIEW && renderPreview()}
      {state === AppState.RESULT && renderResult()}
    </div>
  );
}
