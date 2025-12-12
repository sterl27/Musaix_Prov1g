
import React, { useState, useEffect } from 'react';
import { AudioLines, Music, Image as ImageIcon, Sparkles, Loader2, Play, Pause, SkipForward, SkipBack, Share2, Download, FileText, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { generateSongConcept, generateCoverArt, generateFullLyrics } from '../services/geminiService';
import { GeneratedAsset, GenerationStatus, SongConcept } from '../types';
import Visualizer from './Visualizer';

const Dashboard: React.FC = () => {
  // Inputs
  const [genre, setGenre] = useState('Lo-Fi Hip Hop');
  const [mood, setMood] = useState('Chill');
  const [topic, setTopic] = useState('Late night coding');
  
  // Generation State
  const [generated, setGenerated] = useState<GeneratedAsset>({
    concept: null,
    coverArtUrl: null,
    status: GenerationStatus.IDLE,
    error: null
  });

  // Player State
  const [playlist, setPlaylist] = useState<Array<{ concept: SongConcept, coverArtUrl: string | null }>>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');
  const [waveformHeights, setWaveformHeights] = useState<number[]>(Array(40).fill(10));

  const currentTrack = currentTrackIndex >= 0 && currentTrackIndex < playlist.length ? playlist[currentTrackIndex] : null;

  // Waveform Animation Effect
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setWaveformHeights(prev => prev.map(() => Math.max(15, Math.random() * 90)));
      }, 100);
    } else {
      setWaveformHeights(Array(40).fill(10));
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

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
      
      const newTrack = { concept, coverArtUrl: coverArt };
      
      // Add to playlist and play
      setPlaylist(prev => {
        const newPlaylist = [...prev, newTrack];
        setCurrentTrackIndex(newPlaylist.length - 1);
        return newPlaylist;
      });
      setIsPlaying(true);

      setGenerated(prev => ({ 
        ...prev, 
        coverArtUrl: coverArt, 
        status: GenerationStatus.COMPLETED 
      }));

    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred.";
      
      // Handle specific error for missing/invalid key which might occur if key is revoked or race condition persists
      if (errorMessage.includes("Requested entity was not found") && (window as any).aistudio) {
          try {
             await (window as any).aistudio.openSelectKey();
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
    if (!currentTrack?.concept) return;
    setIsGeneratingLyrics(true);
    try {
        const lyrics = await generateFullLyrics(currentTrack.concept);
        
        // Update current track in playlist
        setPlaylist(prev => {
            const newPlaylist = [...prev];
            if (currentTrackIndex >= 0 && newPlaylist[currentTrackIndex]) {
                newPlaylist[currentTrackIndex] = {
                    ...newPlaylist[currentTrackIndex],
                    concept: {
                        ...newPlaylist[currentTrackIndex].concept,
                        lyrics
                    }
                };
            }
            return newPlaylist;
        });

    } catch (e) {
        console.error("Failed to generate lyrics", e);
    } finally {
        setIsGeneratingLyrics(false);
    }
  };

  const handleDownload = () => {
    if (currentTrack?.coverArtUrl) {
      const link = document.createElement('a');
      link.href = currentTrack.coverArtUrl;
      link.download = `${currentTrack.concept?.title.replace(/\s+/g, '-').toLowerCase() || 'musaix-art'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (currentTrack?.concept) {
      alert(`Shared "${currentTrack.concept.title}" successfully!`);
    }
  };

  // Player Controls
  const handleNext = () => {
    if (playlist.length === 0) return;
    
    if (isShuffle) {
        let nextIndex = Math.floor(Math.random() * playlist.length);
        // Try to not pick the same song if playlist has more than 1
        if (playlist.length > 1 && nextIndex === currentTrackIndex) {
             nextIndex = (nextIndex + 1) % playlist.length;
        }
        setCurrentTrackIndex(nextIndex);
    } else {
        if (currentTrackIndex < playlist.length - 1) {
            setCurrentTrackIndex(currentTrackIndex + 1);
        } else if (repeatMode === 'all') {
            setCurrentTrackIndex(0);
        }
    }
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    
    if (currentTrackIndex > 0) {
        setCurrentTrackIndex(currentTrackIndex - 1);
    } else if (repeatMode === 'all') {
        setCurrentTrackIndex(playlist.length - 1);
    }
    setIsPlaying(true);
  };

  const toggleRepeat = () => {
    if (repeatMode === 'none') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('none');
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
                    <span className="text-gray-500">Playlist</span>
                    <span className="text-gray-500">{playlist.length} Tracks</span>
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

            {!currentTrack ? (
              <div className="flex flex-col items-center justify-center flex-grow text-gray-500 space-y-4">
                {isLoading ? (
                     <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-musaix-accent animate-spin" />
                        <p className="text-lg font-medium animate-pulse">Creating masterpiece...</p>
                     </div>
                ) : (
                    <>
                        <AudioLines className="w-16 h-16 opacity-20" />
                        <p>Generate a track to see details</p>
                    </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {/* Cover Art Section */}
                <div className="space-y-4">
                  <div className="aspect-square w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 relative group">
                    {currentTrack.coverArtUrl ? (
                      <img src={currentTrack.coverArtUrl} alt="Album Art" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Loader2 className="w-8 h-8 text-musaix-accent animate-spin" />
                      </div>
                    )}
                    {currentTrack.coverArtUrl && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button 
                            onClick={handleDownload}
                            className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 hover:scale-110 transition-all text-white shadow-lg"
                            title="Download Art"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={handleShare}
                            className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 hover:scale-110 transition-all text-white shadow-lg"
                            title="Share"
                          >
                            <Share2 className="w-5 h-5" />
                          </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Player Controls */}
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/5 relative overflow-hidden group">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-2 relative z-10">
                        <span>{isPlaying ? '0:12' : '0:00'}</span>
                        <span>{isPlaying ? '2:45' : '3:30'}</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full mb-4 overflow-hidden relative z-10">
                        <div className={`h-full rounded-full bg-gradient-to-r from-musaix-cyan via-purple-500 to-musaix-purple transition-all duration-1000 ${isPlaying ? 'w-1/3 shadow-[0_0_15px_rgba(155,81,224,0.6)]' : 'w-0'}`}></div>
                    </div>

                    {/* Main Controls */}
                    <div className="flex items-center justify-between relative z-10 mb-2">
                         {/* Secondary Controls Left */}
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => setIsShuffle(!isShuffle)}
                                className={`p-2 rounded-full transition-colors ${isShuffle ? 'text-musaix-accent hover:text-musaix-accentHover' : 'text-gray-400 hover:text-white'}`}
                                title="Shuffle"
                            >
                                <Shuffle className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Playback Controls */}
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={handlePrev}
                                className="text-gray-300 hover:text-white transition-all hover:scale-110 p-2 hover:bg-white/5 rounded-full"
                            >
                                <SkipBack className="w-6 h-6 fill-current" />
                            </button>
                            
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 relative ${
                                    isPlaying 
                                    ? 'bg-gradient-to-br from-musaix-cyan via-purple-500 to-musaix-purple shadow-[0_0_30px_rgba(208,9,226,0.6)] scale-110' 
                                    : 'bg-white text-black hover:scale-110 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                                }`}
                            >
                                {isPlaying && (
                                    <div className="absolute inset-0 rounded-full border border-white/50 animate-ping opacity-30"></div>
                                )}
                                {isPlaying ? (
                                    <Pause className="w-7 h-7 text-white fill-current" />
                                ) : (
                                    <Play className="w-7 h-7 text-black fill-current ml-1" />
                                )}
                            </button>

                            <button 
                                onClick={handleNext}
                                className="text-gray-300 hover:text-white transition-all hover:scale-110 p-2 hover:bg-white/5 rounded-full"
                            >
                                <SkipForward className="w-6 h-6 fill-current" />
                            </button>
                        </div>

                        {/* Secondary Controls Right */}
                         <div className="flex items-center gap-2">
                            <button 
                                onClick={toggleRepeat}
                                className={`p-2 rounded-full transition-colors ${repeatMode !== 'none' ? 'text-musaix-accent hover:text-musaix-accentHover' : 'text-gray-400 hover:text-white'}`}
                                title="Repeat"
                            >
                                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                            </button>
                         </div>
                    </div>

                    {/* Animated Waveform Background */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-between px-4 opacity-30 pointer-events-none gap-[2px]">
                        {waveformHeights.map((height, i) => (
                            <div 
                                key={i}
                                className={`w-1.5 rounded-t-full transition-all duration-200 ease-out ${isPlaying ? 'bg-gradient-to-t from-musaix-cyan to-musaix-purple shadow-[0_0_8px_rgba(208,9,226,0.4)]' : 'bg-white/10'}`}
                                style={{ 
                                    height: `${height}%`,
                                }}
                            />
                        ))}
                    </div>
                  </div>
                </div>

                {/* Track Details */}
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between items-start">
                        <h1 className="text-3xl font-bold font-sans tracking-tight leading-tight gradient-text line-clamp-2">
                            {currentTrack.concept.title}
                        </h1>
                        <span className="text-xs font-mono text-gray-500 border border-white/10 px-2 py-1 rounded">
                            {currentTrackIndex + 1}/{playlist.length}
                        </span>
                    </div>
                    <p className="text-musaix-accent font-medium mt-1">
                        {currentTrack.concept.style} • {currentTrack.concept.bpm} BPM • Key of {currentTrack.concept.key}
                    </p>
                    <p className="text-gray-400 text-sm mt-4 leading-relaxed line-clamp-3">
                        {currentTrack.concept.description}
                    </p>
                  </div>

                  {/* Charts */}
                  <Visualizer data={currentTrack.concept.moodAnalysis} />
                </div>
              </div>
            )}
          </div>

          {/* Lyrics & Composition Data */}
          {currentTrack?.concept && (
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
                        {currentTrack.concept.lyrics.map((line, idx) => (
                            <p key={idx} className={line === "" ? "h-4" : ""}>{line}</p>
                        ))}
                    </div>
                </div>

                <div className="bg-musaix-card border border-white/10 rounded-2xl p-6">
                    <h3 className="text-white/60 text-xs font-mono mb-4 uppercase tracking-wider flex items-center gap-2">
                         Composition & Chords
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {currentTrack.concept.chords.map((chord, idx) => (
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
