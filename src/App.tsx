import React, { useState, useRef, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { playlist } from "./models/Track";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faPlay, 
  faPause, 
  faStepForward, 
  faStepBackward, 
  faVolumeUp, 
  faMusic,
  faVolumeMute,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";


function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.5);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [visualizerData, setVisualizerData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);
  const [userInteracted, setUserInteracted] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showVolumePercentage, setShowVolumePercentage] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(0.5); // To store volume before mute

  const audioRef = useRef<HTMLAudioElement | null>(null); 
  //@ts-ignore
  const animationRef = useRef<number>(); 
  //@ts-ignore
  const visualizerInterval = useRef<NodeJS.Timeout>();
  //@ts-ignore
  const volumeTimeoutRef = useRef<NodeJS.Timeout>();

  // Detect touch device and handle initial interaction
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    const handleFirstInteraction = () => {
      setUserInteracted(true);
      if (audioRef.current && isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed:", e));
      }
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };

    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('click', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('click', handleFirstInteraction);
    };
  }, []);

  // Generate random visualizer data
  useEffect(() => {
    const generateVisualizerData = () => {
      const bars = Array.from({ length: 20 }, () => Math.floor(Math.random() * 60) + 20);
      setVisualizerData(bars);
    };

    if (isPlaying) {
      visualizerInterval.current = setInterval(generateVisualizerData, 200);
    } else {
      clearInterval(visualizerInterval.current);
    }

    return () => clearInterval(visualizerInterval.current);
  }, [isPlaying]);

  // Initialize audio and handle track changes
  useEffect(() => {
    if (!userInteracted && isTouchDevice) return;

    // Clean up previous audio if it exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      cancelAnimationFrame(animationRef.current);
    }

    const audio = new Audio();
    audio.src = playlist[currentTrackIndex].src;
    audio.preload = "auto";
    audio.volume = volume;
    audioRef.current = audio;

    // iOS requires this for metadata to load properly
    audio.load();

    const handleLoadedData = () => {
      setDuration(audio.duration || 0);
      setIsReady(true);
      if (isPlaying && userInteracted) {
        audio.play().catch(e => console.error("Playback failed:", e));
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => nextSong();
    const handleError = () => {
      console.error("Error loading audio");
      setIsReady(false);
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedData);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedData);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      cancelAnimationFrame(animationRef.current);
    };
  }, [currentTrackIndex, userInteracted, isTouchDevice]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || !isReady) return;

    if (isPlaying) {
      setIsLoading(true);
      audioRef.current.play()
        .then(() => setIsLoading(false))
        .catch(e => {
          console.error("Playback failed:", e);
          setIsLoading(false);
          setIsPlaying(false);
        });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isReady]);

  const playPause = () => {
    if (!userInteracted && isTouchDevice) {
      setUserInteracted(true);
      setIsPlaying(true);
      return;
    }

    setIsPlaying(!isPlaying);
  };

  const nextSong = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    setIsPlaying(true);
  };

  const prevSong = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = Number(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
      setPrevVolume(newVolume); // Update previous volume when changing
    }
    
    if (audioRef.current) {
      audioRef.current.volume = isTouchDevice ? (userInteracted ? newVolume : 0) : newVolume;
    }
    
    // Show volume percentage temporarily
    setShowVolumePercentage(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumePercentage(false);
    }, 1000);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      // Unmute and restore to previous volume
      audioRef.current.volume = prevVolume;
      setVolume(prevVolume);
      setIsMuted(false);
    } else {
      // Mute and store current volume
      setPrevVolume(volume);
      audioRef.current.volume = 0;
      setVolume(0);
      setIsMuted(true);
    }
    
    // Show volume percentage temporarily
    setShowVolumePercentage(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumePercentage(false);
    }, 1000);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <AppContainer>
      {!userInteracted && isTouchDevice && (
        <MobileOverlay>
          <div>
            <h3>Welcome to Kotoko Band Player</h3>
            <p>Tap anywhere to enable audio playback</p>
          </div>
        </MobileOverlay>
      )}
      
      <PlayerCard>
        <AlbumArt $artUrl={playlist[currentTrackIndex].cover}>
          <TrackInfo>
            <SongTitle>{playlist[currentTrackIndex].name}</SongTitle>
            <ArtistName>{playlist[currentTrackIndex].artist}</ArtistName>
          </TrackInfo>
        </AlbumArt>

        <PlayerControls>
          <Visualizer>
            {visualizerData.map((height, index) => (
              <Bar key={index} $height={isPlaying ? height : 5} />
            ))}
          </Visualizer>

          <TimelineContainer>
            <Timeline type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} aria-label="Song timeline" />
            <TimeDisplay>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </TimeDisplay>
          </TimelineContainer>

          <Controls>
            <Button onClick={prevSong} aria-label="Previous song">
              <FontAwesomeIcon icon={faStepBackward} />
            </Button>
            <PlayPauseButton onClick={playPause} aria-label={isPlaying ? "Pause" : "Play"}>
              {isLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
              )}
            </PlayPauseButton>
            <Button onClick={nextSong} aria-label="Next song">
              <FontAwesomeIcon icon={faStepForward} />
            </Button>
          </Controls>

          <VolumeControl>
            <Button 
              onClick={toggleMute} 
              aria-label={isMuted ? "Unmute" : "Mute"}
              style={{ width: '40px', height: '40px', padding: '8px' }}
            >
              <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
            </Button>
            <div style={{ position: 'relative', flexGrow: 1 }}>
              <input 
                id="volume" 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume} 
                onChange={handleVolumeChange} 
                aria-label="Volume control" 
                style={{ width: '100%' }}
              />
              {showVolumePercentage && (
                <div style={{
                  position: 'absolute',
                  top: '-25px',
                  left: `${volume * 100}%`,
                  transform: 'translateY(50%)',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  whiteSpace: 'nowrap'
                }}>
                  {Math.round(volume * 100)}%
                </div>
              )}
            </div>
          </VolumeControl>

          <PlaylistButton>
            <FontAwesomeIcon icon={faMusic} /> Playlist by Kotoko Band
          </PlaylistButton>
        </PlayerControls>
      </PlayerCard>
    </AppContainer>
  );
}

export default App;

// Animations
const pulse = keyframes`
  0% { transform: scale(0.95); }
  50% { transform: scale(1.05); }
  100% { transform: scale(0.95); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled components
const AppContainer = styled.div`
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  box-sizing: border-box;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: white;
  position: relative;
`;

const PlayerCard = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 380px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: ${fadeIn} 0.6s ease-out;
  position: relative;

  @media (max-width: 480px) {
    max-width: 100%;
    border-radius: 0;
  }
`;

const AlbumArt = styled.div<{ $artUrl: string }>`
  width: 100%;
  height: 380px;
  background-image: url(${(props) => props.$artUrl});
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 24px;
  box-shadow: inset 0 -100px 60px -5px rgba(0, 0, 0, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 480px) {
    height: 300px;
  }
`;

const TrackInfo = styled.div`
  width: 100%;
  text-align: left;
  z-index: 2;
`;

const SongTitle = styled.h2`
  font-size: 1.8rem;
  margin: 0;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const ArtistName = styled.p`
  font-size: 1rem;
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const PlayerControls = styled.div`
  padding: 24px;
`;

const Visualizer = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 80px;
  gap: 4px;
  margin: 20px 0;
`;

const Bar = styled.div<{ $height: number }>`
  width: 8px;
  height: ${(props) => props.$height}%;
  background: linear-gradient(to top, rgb(244, 247, 74), rgb(226, 43, 43));
  border-radius: 4px;
  transition: height 0.1s ease-out;
  animation: ${pulse} 1.5s infinite ease-in-out;
  animation-delay: ${(props) => props.$height * 0.02}s;
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin: 24px 0;
`;

const Button = styled.button`
  background: transparent;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgba(44, 173, 61, 0.2);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 480px) {
    width: 44px;
    height: 44px;
  }
`;

const PlayPauseButton = styled(Button)`
  width: 60px;
  height: 60px;
  font-size: 1.5rem;
  background: linear-gradient(135deg, rgb(8, 99, 23), rgb(85, 83, 83));
  box-shadow: 0 4px 15px rgba(74, 108, 247, 0.3);

  @media (max-width: 480px) {
    width: 54px;
    height: 54px;
  }
`;

const TimelineContainer = styled.div`
  margin: 20px 0;
`;

const Timeline = styled.input`
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    background: #4a6cf7;
  }
`;

const TimeDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8px;
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;

  label {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  input {
    flex-grow: 1;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    outline: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: white;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    &::-webkit-slider-thumb:hover {
      background: #4a6cf7;
    }
  }
`;

const PlaylistButton = styled.button`
  background: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.8rem;
  margin-top: 20px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MobileOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  text-align: center;
  padding: 20px;
  backdrop-filter: blur(5px);
`;