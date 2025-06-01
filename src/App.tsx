import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";

interface Track {
  name: string;
  src: string;
}

const playlist: Track[] = [
  { name: "Song 1 - Adonai", src: "/assets/adonai.mp3" },
  { name: "Song 2 - Bambi", src: "/assets/bambi.mp3" },
  { name: "Song 3 - Memories", src: "/assets/memories.mp3" },
];

// Styled components
const AppContainer = styled.div`
  font-family: "Segoe UI", sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const PlayerCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;

  @media (max-width: 480px) {
    padding: 1rem;
  }
`;

const SongTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 480px) {
    font-size: 1.2rem;
  }
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin: 1.5rem 0;

  @media (max-width: 480px) {
    gap: 0.5rem;
  }
`;

const Button = styled.button`
  background: #4a6cf7;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #3a5bd9;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 0.9rem;
  }
`;

const TimelineContainer = styled.div`
  margin: 1.5rem 0;
`;

const Timeline = styled.input`
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 3px;
  outline: none;
  margin-bottom: 0.5rem;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #4a6cf7;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  @media (max-width: 480px) {
    height: 4px;

    &::-webkit-slider-thumb {
      width: 12px;
      height: 12px;
    }
  }
`;

const TimeDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;

  label {
    font-size: 0.9rem;
    color: #666;
    white-space: nowrap;

    @media (max-width: 480px) {
      font-size: 0.8rem;
    }
  }

  input {
    flex-grow: 1;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: #e0e0e0;
    border-radius: 2px;
    outline: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #4a6cf7;
      cursor: pointer;

      @media (max-width: 480px) {
        width: 10px;
        height: 10px;
      }
    }
  }
`;


function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.7);
  const [isReady, setIsReady] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio and handle track changes
  useEffect(() => {
    // Clean up previous audio if it exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create new audio element
    const audio = new Audio(playlist[currentTrackIndex].src);
    audioRef.current = audio;
    audio.volume = volume;

    const handleLoadedData = () => {
      setDuration(audio.duration);
      setIsReady(true);
      if (isPlaying) {
        audio.play().catch(e => console.error("Playback failed:", e));
      }
    };

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => nextSong();

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [currentTrackIndex]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current || !isReady) return;

    if (isPlaying) {
      audioRef.current.play().catch(e => {
        console.error("Playback failed:", e);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isReady]);

  const playPause = () => {
    setIsPlaying(!isPlaying);
  };

  const nextSong = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % playlist.length);
    setIsPlaying(true);
  };

  const prevSong = () => {
    setCurrentTrackIndex((prevIndex) => 
      (prevIndex - 1 + playlist.length) % playlist.length
    );
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
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
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
      <PlayerCard>
        <h1>🎵 Music Player</h1>
        <SongTitle>{playlist[currentTrackIndex].name}</SongTitle>

        <Controls>
          <Button onClick={prevSong} aria-label="Previous song">
            ⏮
          </Button>
          <Button onClick={playPause} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? "⏸" : "▶"}
          </Button>
          <Button onClick={nextSong} aria-label="Next song">
            ⏭
          </Button>
        </Controls>

        <TimelineContainer>
          <Timeline
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Song timeline"
          />
          <TimeDisplay>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </TimeDisplay>
        </TimelineContainer>

        <VolumeControl>
          <label htmlFor="volume">Volume:</label>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
          />
        </VolumeControl>
      </PlayerCard>
    </AppContainer>
  );
}

export default App;