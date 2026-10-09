// hooks/useScenario.js - manages scenario loading and cycle playback (0..7)
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchScenario } from '../api.js';

export function useScenario(selectedNode, selectedSize) {
  const [scenario, setScenario] = useState(null);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);

  // Check prefers-reduced-motion
  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Load scenario when node or size changes
  useEffect(() => {
    if (!selectedNode) return;
    let cancelled = false;
    setIsLoading(true);

    fetchScenario(selectedNode, selectedSize).then(data => {
      if (cancelled) return;
      setScenario(data);
      setIsLoading(false);
      if (prefersReduced) {
        setCurrentCycle(7);
        setIsPlaying(false);
      } else {
        setCurrentCycle(0);
        setIsPlaying(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedNode, selectedSize, prefersReduced]);

  // Autoplay ticker: one cycle per second (1000ms)
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentCycle(prev => {
        if (prev >= 7) {
          setIsPlaying(false);
          return 7;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const play = useCallback(() => {
    if (currentCycle >= 7) {
      setCurrentCycle(0);
    }
    setIsPlaying(true);
  }, [currentCycle]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const step = useCallback(() => {
    setIsPlaying(false);
    setCurrentCycle(prev => (prev < 7 ? prev + 1 : 0));
  }, []);

  const jumpToCycle = useCallback((c) => {
    setIsPlaying(false);
    setCurrentCycle(Math.max(0, Math.min(7, c)));
  }, []);

  return {
    scenario,
    currentCycle,
    isPlaying,
    isLoading,
    play,
    pause,
    step,
    jumpToCycle,
  };
}
