
import React, { useState } from 'react';
import { Era, ImageStyle, Resolution } from '../types';
import { SparklesIcon, BeakerIcon, AdjustmentsHorizontalIcon, PlayIcon, WrenchScrewdriverIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface EraSelectorProps {
  onStartJourney: (eras: Era[]) => void;
  onCustom: (prompt: string) => void;
  onAnalyze: () => void;
  onRestore: () => void;
  onMagicEdit: () => void;
  onStyleChange: (style: ImageStyle) => void;
  onResolutionChange: (res: Resolution) => void;
  onDetailLevelChange: (level: number) => void;
  currentStyle: ImageStyle;
  currentResolution: Resolution;
  currentDetailLevel: number;
  isProcessing: boolean;
  customPrompt: string;
  onCustomPromptChange: (value: string) => void;
}

const eras = [
  { id: Era.VICTORIAN, label: "Victorian", desc: "Elegant fashion and industrial ambition.", icon: "🎩" },
  { id: Era.ROARING_20S, label: "Roaring 20s", desc: "Flappers, glitz, and jazz age spirit.", icon: "🎷" },
  { id: Era.VIKING, label: "Viking Age", desc: "Rugged warriors and epic sagas.", icon: "⚔️" },
  { id: Era.CYBERPUNK, label: "Cyberpunk", desc: "Neon-drenched dystopian future.", icon: "🦾" },
  { id: Era.ANCIENT_EGYPT, label: "Egypt", desc: "Pharaohs, pyramids, and sands.", icon: "🐪" },
  { id: Era.WESTERN, label: "Wild West", desc: "Outlaws, sheriffs, and saloons.", icon: "🤠" },
  { id: Era.RENAISSANCE, label: "Renaissance", desc: "Classical Artistry.", icon: "🎨" },
  { id: Era.MEDIEVAL, label: "Medieval", desc: "Knights, castles, and chivalry.", icon: "🏰" },
];

const styles = [
  { id: ImageStyle.REALISTIC, label: "Realistic", bg: "bg-slate-600" },
  { id: ImageStyle.CINEMATIC, label: "Cinematic", bg: "bg-gradient-to-r from-black via-slate-800 to-black border-y-2 border-black" },
  { id: ImageStyle.VINTAGE, label: "Vintage Film", bg: "bg-[#5d4037] sepia border-2 border-[#8d6e63] contrast-125" },
  { id: ImageStyle.PAINTING, label: "Painting", bg: "bg-[url('https://www.transparenttextures.com/patterns/canvas-orange.png')] bg-yellow-700/50" },
  { id: ImageStyle.SKETCH, label: "Pencil Sketch", bg: "bg-[#f3f4f6] text-gray-800 border-2 border-gray-400 border-dashed" },
  { id: ImageStyle.CYBER, label: "Cyber", bg: "bg-black border-2 border-[#00f3ff] shadow-[0_0_10px_#00f3ff] text-cyan-300" },
  { id: ImageStyle.STEAMPUNK, label: "Steampunk", bg: "bg-amber-900 border-2 border-amber-500 text-amber-100" },
  { id: ImageStyle.ART_DECO, label: "Art Deco", bg: "bg-slate-900 border-2 border-yellow-500 text-yellow-100" },
  { id: ImageStyle.RETRO_FUTURISM, label: "Retro Future", bg: "bg-indigo-900 border-2 border-pink-500 text-pink-100" },
  { id: ImageStyle.STUDIO, label: "Studio", bg: "bg-gradient-to-b from-white/20 to-transparent" },
];

const resolutions = [
    { id: Resolution.STANDARD, label: "Standard" },
    { id: Resolution.HIGH, label: "High (HD)" },
    { id: Resolution.ULTRA_4K, label: "4K Ultra" },
];

export const EraSelector: React.FC<EraSelectorProps> = ({ 
  onStartJourney, 
  onCustom, 
  onAnalyze,
  onRestore,
  onMagicEdit,
  onStyleChange,
  onResolutionChange,
  onDetailLevelChange,
  currentStyle,
  currentResolution,
  currentDetailLevel,
  isProcessing,
  customPrompt,
  onCustomPromptChange
}) => {
  const [selectedEras, setSelectedEras] = useState<Era[]>([]);

  const toggleEra = (era: Era) => {
    setSelectedEras(prev => 
      prev.includes(era) ? prev.filter(e => e !== era) : [...prev, era]
    );
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-32">
      
      <div className="text-left border-b border-slate-700/50 pb-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-200 to-teal-500 bg-clip-text text-transparent">
          Configure Journey
        </h2>
        <p className="text-gray-400 text-sm mt-1">Select your destination parameters</p>
      </div>

      {/* 1. Control Bar: Analysis & Resolution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* AI Tools Panel */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-600/20 transition-all"></div>
            
            <h3 className="text-sm font-bold text-gray-300 uppercase flex items-center gap-2">
              <BeakerIcon className="w-4 h-4 text-purple-400" />
              AI Analysis Tools
            </h3>
            
            <div className="flex gap-3 h-full">
                <button
                  onClick={onAnalyze}
                  disabled={isProcessing}
                  className="flex-1 bg-slate-800/50 hover:bg-purple-900/30 border border-slate-700 hover:border-purple-500/50 rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-all group/btn"
                >
                  <BeakerIcon className="w-5 h-5 text-purple-400 group-hover/btn:scale-110 transition-transform" /> 
                  <span className="text-[10px] font-medium text-gray-300 group-hover/btn:text-white">Analyze</span>
                </button>
                <button
                  onClick={onRestore}
                  disabled={isProcessing}
                  className="flex-1 bg-slate-800/50 hover:bg-blue-900/30 border border-slate-700 hover:border-blue-500/50 rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-all group/btn"
                >
                  <WrenchScrewdriverIcon className="w-5 h-5 text-blue-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[10px] font-medium text-gray-300 group-hover/btn:text-white">Restore</span>
                </button>
                <button
                  onClick={onMagicEdit}
                  disabled={isProcessing}
                  className="flex-1 bg-slate-800/50 hover:bg-pink-900/30 border border-slate-700 hover:border-pink-500/50 rounded-xl flex flex-col items-center justify-center gap-2 p-2 transition-all group/btn"
                >
                  <PaintBrushIcon className="w-5 h-5 text-pink-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[10px] font-medium text-gray-300 group-hover/btn:text-white">Draw & Edit</span>
                </button>
            </div>
        </div>

        {/* Resolution & Quality Panel */}
         <div className="lg:col-span-7 glass-panel rounded-2xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden">
             <div className="flex items-center justify-between z-10">
                 <h3 className="text-sm font-bold text-gray-300 uppercase flex items-center gap-2">
                     <AdjustmentsHorizontalIcon className="w-4 h-4 text-teal-400" /> 
                     Image Fidelity
                 </h3>
                 {currentResolution !== Resolution.STANDARD && (
                    <span className="text-[10px] font-mono text-teal-400 bg-teal-900/30 px-2 py-1 rounded">DETAIL: {currentDetailLevel}%</span>
                 )}
             </div>

             <div className="flex bg-slate-900/80 rounded-lg p-1 gap-1">
                 {resolutions.map(res => (
                     <button
                        key={res.id}
                        onClick={() => onResolutionChange(res.id)}
                        className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 ${
                            currentResolution === res.id 
                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/50' 
                            : 'text-gray-400 hover:text-white hover:bg-slate-800'
                        }`}
                     >
                         {res.label}
                     </button>
                 ))}
             </div>
             
             {/* Detail Slider - Only for High/4K */}
             {currentResolution !== Resolution.STANDARD && (
                 <div className="animate-fade-in z-10">
                     <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={currentDetailLevel} 
                        onChange={(e) => onDetailLevelChange(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                     />
                 </div>
             )}
         </div>
      </div>

      {/* 2. Style Selector (Horizontal Scroll Carousel) */}
      <div className="w-full">
          <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-yellow-400" /> Artistic Style
          </h3>
          
          {/* Carousel Container */}
          <div className="relative group/carousel">
            <div className="flex overflow-x-auto gap-4 pb-6 px-2 -mx-2 scroll-smooth scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {styles.map((style) => (
                  <button
                      key={style.id}
                      onClick={() => onStyleChange(style.id)}
                      className={`flex-none w-28 h-36 relative rounded-2xl overflow-hidden group transition-all duration-300 ${
                          currentStyle === style.id 
                          ? 'ring-2 ring-teal-400 scale-105 shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-10' 
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                  >
                      {/* Background Preview */}
                      <div className={`absolute inset-0 w-full h-full ${style.bg} flex items-center justify-center transition-transform duration-500 ${currentStyle === style.id ? 'scale-110' : ''}`}>
                          {currentStyle === style.id && (
                            <div className="bg-teal-500/20 backdrop-blur-sm rounded-full p-2">
                                <CheckCircleIcon className="w-8 h-8 text-white drop-shadow-lg" />
                            </div>
                          )}
                      </div>
                      
                      {/* Label Overlay */}
                      <div className={`absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent text-center`}>
                          <span className={`text-xs font-bold leading-tight block ${currentStyle === style.id ? 'text-white' : 'text-gray-300'}`}>
                            {style.label}
                          </span>
                      </div>
                  </button>
              ))}
            </div>
            
            {/* Scroll Hints (Optional visuals to indicate scrolling) */}
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-obsidian to-transparent pointer-events-none"></div>
          </div>
      </div>

      {/* 3. Era Selector Grid */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Select Eras</h3>
           <span className="text-xs text-teal-500 font-medium bg-teal-900/20 px-2 py-1 rounded-full border border-teal-900/50">
              {selectedEras.length} selected
           </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {eras.map((era) => {
                const isSelected = selectedEras.includes(era.id);
                return (
                    <button
                        key={era.id}
                        onClick={() => toggleEra(era.id)}
                        disabled={isProcessing}
                        className={`relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 h-full border ${
                            isSelected 
                            ? 'bg-teal-900/20 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.2)] translate-y-[-2px]' 
                            : 'bg-slate-800/30 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-3xl filter drop-shadow-md">{era.icon}</span>
                            <div className={`w-5 h-5 rounded-full border transition-colors flex items-center justify-center ${isSelected ? 'bg-teal-500 border-teal-500' : 'border-slate-500'}`}>
                                {isSelected && <CheckCircleIcon className="w-5 h-5 text-white" />}
                            </div>
                        </div>
                        <div>
                            <div className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>{era.label}</div>
                            <div className="text-[11px] text-gray-500 leading-tight">{era.desc}</div>
                        </div>
                    </button>
                );
            })}
        </div>
      </div>

      {/* Floating Action Button for Generation */}
      {selectedEras.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
              <button
                onClick={() => onStartJourney(selectedEras)}
                disabled={isProcessing}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-bold text-lg pl-8 pr-10 py-4 rounded-full shadow-[0_0_30px_rgba(20,184,166,0.4)] flex items-center gap-3 transform hover:scale-105 transition-all border border-white/20"
              >
                  <div className="relative">
                     <SparklesIcon className="w-6 h-6 animate-spin-slow" />
                     <div className="absolute inset-0 bg-white blur-md opacity-40 animate-pulse"></div>
                  </div>
                  <span>Generate ({selectedEras.length})</span>
              </button>
          </div>
      )}

      {/* Custom Prompt Input */}
      <div className="border-t border-slate-800 pt-6 mt-2">
        <div className="glass-panel p-1 rounded-xl flex items-center gap-2 transition-colors focus-within:ring-1 focus-within:ring-teal-500/50">
          <div className="pl-4 text-gray-500">
              <SparklesIcon className="w-5 h-5"/>
          </div>
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="Describe a custom reality to visit..."
            className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 py-3 focus:ring-0 focus:outline-none"
          />
          <button
            onClick={() => customPrompt && onCustom(customPrompt)}
            disabled={!customPrompt || isProcessing}
            className="bg-slate-700 hover:bg-teal-600 disabled:opacity-50 disabled:hover:bg-slate-700 text-white p-2 rounded-lg m-1 transition-colors"
          >
            <PlayIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
