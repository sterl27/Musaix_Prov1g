import React, { useState } from 'react';
import { AudioLines, Music, Image as ImageIcon, Sparkles, Loader2, Play, Pause, SkipForward, SkipBack, Share2, Download, FileText } from 'lucide-react';
import { generateSongConcept, generateCoverArt, generateFullLyrics } from '../services/geminiService';
import { GeneratedAsset, GenerationStatus } from '../types';
import Visualizer from './Visualizer';

const Dashboard: React.FC = () => {
  // Inputs
  const [genre, setGenre] = useState('Lo-Fi Hip Hop');
  const [mood, setMood] = useState('Chill');
  const [topic, setTopic] = useState('Late night coding');
  
  // State
  const [generated, setGenerated] = useState<GeneratedAsset>({
    concept: null,
    coverArtUrl: null,
    status: GenerationStatus.IDLE,
    error: null
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);

  const handleGenerate = async () => {
    setGenerated(prev => ({ ...prev, status: GenerationStatus.GENERATING_TEXT, error: null }));
    
    try {
      // Step 1: Text Generation
      const concept = await generateSongConcept(genre, mood, topic);
      setGenerated(prev => ({ 
        ...prev, 
        concept, 
        status: GenerationStatus.GENERATING_IMAGE 
      }));

      // Step 2: Image Generation
      const coverArt = await generateCoverArt(concept.title, concept.style, concept.description);
      setGenerated(prev => ({ 
        ...prev, 
        coverArtUrl: coverArt, 
        status: GenerationStatus.COMPLETED 
      }));

    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred.";
      
      // Handle specific error for missing/invalid key which might occur if key is revoked or race condition persists
      if (errorMessage.includes("Requested entity was not found") && window.aistudio) {
          try {
             await window.aistudio.openSelectKey();
             setGenerated(prev => ({ ...prev, status: GenerationStatus.ERROR, error: "API Key refreshed. Please try again." }));
             return;
          } catch(e) {
             console.error("Failed to re-select key", e);
          }
      }

      setGenerated(prev => ({ 
        ...prev, 
        status: GenerationStatus.ERROR, 
        error: errorMessage 
      }));
    }
  };

  const handleFullLyrics = async () => {
    if (!generated.concept) return;
    setIsGeneratingLyrics(true);
    try {
        const lyrics = await generateFullLyrics(generated.concept);
        setGenerated(prev => ({
            ...prev,
            concept: { ...prev.concept!, lyrics }
        }));
    } catch (e) {
        console.error("Failed to generate lyrics", e);
    } finally {
        setIsGeneratingLyrics(false);
    }
  };

  const isLoading = generated.status === GenerationStatus.GENERATING_TEXT || generated.status === GenerationStatus.GENERATING_IMAGE;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls & Input */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-musaix-card border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-musaix-accent" />
              <span>AI Composer</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Genre</label>
                <select 
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-musaix-accent transition-colors"
                >
                  <option>Lo-Fi Hip Hop</option>
                  <option>Cyberpunk Synthwave</option>
                  <option>Ambient Electronic</option>
                  <option>Modern Jazz</option>
                  <option>Indie Pop</option>
                  <option>Dark Techno</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Mood</label>
                <input 
                  type="text"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-musaix-accent transition-colors"
                  placeholder="e.g., Melancholic, Energetic"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Topic / Theme</label>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-musaix-accent transition-colors h-24 resize-none"
                  placeholder="What should the song be about?"
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  isLoading 
                    ? 'bg-gray-800 cursor-not-allowed text-gray-500' 
                    : 'bg-gradient-to-r from-musaix-cyan to-musaix-accent hover:opacity-90 text-white shadow-lg shadow-musaix-accent/20'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {generated.status === GenerationStatus.GENERATING_TEXT ? 'Composing...' : 'Designing Art...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Track
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Stats / History could go here */}
          <div className="bg-musaix-card border border-white/10 rounded-2xl p-6">
             <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-4 font-mono">System Status</h3>
             <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Lyrics Model</span>
                    <span className="text-green-400">Gemini 2.5 Flash</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Art Model</span>
                    <span className="text-green-400">Gemini 3.0 Pro Image</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Audio Engine</span>
                    <span className="text-gray-500">Simulated</span>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="lg:col-span-8 space-y-6">
          
          {generated.error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl">
              Error: {generated.error}
            </div>
          )}

          {/* Player & Visualization Area */}
          <div className="bg-musaix-card border border-white/10 rounded-2xl p-6 min-h-[400px] flex flex-col justify-between relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-musaix-purple/10 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-musaix-cyan/10 blur-[100px] rounded-full pointer-events-none"></div>

            {!generated.concept ? (
              <div className="flex flex-col items-center justify-center flex-grow text-gray-500 space-y-4">
                <AudioLines className="w-16 h-16 opacity-20" />
                <p>Generate a track to see details</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {/* Cover Art Section */}
                <div className="space-y-4">
                  <div className="aspect-square w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 relative group">
                    {generated.coverArtUrl ? (
                      <img src={generated.coverArtUrl} alt="Album Art" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Loader2 className="w-8 h-8 text-musaix-accent animate-spin" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40"><Download className="w-5 h-5 text-white" /></button>
                        <button className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40"><Share2 className="w-5 h-5 text-white" /></button>
                    </div>
                  </div>
                  
                  {/* Player Controls */}
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 flex items-center justify-between border border-white/5">
                    <button className="text-gray-400 hover:text-white"><SkipBack className="w-5 h-5" /></button>
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    </button>
                    <button className="text-gray-400 hover:text-white"><SkipForward className="w-5 h-5" /></button>
                  </div>
                </div>

                {/* Track Details */}
                <div className="flex flex-col gap-4">
                  <div>
                    <h1 className="text-3xl font-bold font-sans tracking-tight leading-tight gradient-text">
                        {generated.concept.title}
                    </h1>
                    <p className="text-musaix-accent font-medium mt-1">
                        {generated.concept.style} • {generated.concept.bpm} BPM • Key of {generated.concept.key}
                    </p>
                    <p className="text-gray-400 text-sm mt-4 leading-relaxed">
                        {generated.concept.description}
                    </p>
                  </div>

                  {/* Charts */}
                  <Visualizer data={generated.concept.moodAnalysis} />
                </div>
              </div>
            )}
          </div>

          {/* Lyrics & Composition Data */}
          {generated.concept && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-musaix-card border border-white/10 rounded-2xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white/60 text-xs font-mono uppercase tracking-wider flex items-center gap-2">
                            <Music className="w-4 h-4" /> Generated Lyrics
                        </h3>
                        <button 
                            onClick={handleFullLyrics}
                            disabled={isGeneratingLyrics}
                            className="text-xs flex items-center gap-1 text-musaix-cyan hover:text-white transition-colors disabled:opacity-50"
                        >
                            {isGeneratingLyrics ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                            {isGeneratingLyrics ? 'Writing...' : 'Full Lyrics'}
                        </button>
                    </div>
                    <div className="space-y-4 font-mono text-sm text-gray-300 max-h-64 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                        {generated.concept.lyrics.map((line, idx) => (
                            <p key={idx} className={line === "" ? "h-4" : ""}>{line}</p>
                        ))}
                    </div>
                </div>

                <div className="bg-musaix-card border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white/60 text-xs font-mono mb-4 uppercase tracking-wider flex items-center gap-2">
                         Composition & Chords
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {generated.concept.chords.map((chord, idx) => (
                            <span key={idx} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-musaix-cyan font-mono text-sm">
                                {chord}
                            </span>
                        ))}
                    </div>
                    
                    <div className="p-4 bg-yellow-900/10 border border-yellow-500/20 rounded-lg">
                        <h4 className="text-yellow-500 text-sm font-bold mb-1">AI Production Note</h4>
                        <p className="text-yellow-200/60 text-xs leading-relaxed">
                            This progression works best with a syncopated bassline. Consider adding reverb to the snare for that {mood.toLowerCase()} atmosphere.
                        </p>
                    </div>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;