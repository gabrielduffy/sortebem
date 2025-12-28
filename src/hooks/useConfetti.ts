import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const fireConfetti = useCallback(() => {
    // First burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f97316', '#22c55e', '#3b82f6', '#eab308', '#ec4899']
    });

    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#f97316', '#22c55e', '#3b82f6']
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#f97316', '#22c55e', '#3b82f6']
      });
    }, 400);
  }, []);

  const fireStars = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      shapes: ['star'] as confetti.Shape[],
      colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8']
    };

    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.5 }
    });

    confetti({
      ...defaults,
      particleCount: 20,
      scalar: 0.75,
      origin: { x: 0.5, y: 0.5 }
    });
  }, []);

  const fireCannonSequence = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() - 0.2 },
        colors: ['#f97316', '#22c55e', '#3b82f6', '#eab308']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() - 0.2 },
        colors: ['#f97316', '#22c55e', '#3b82f6', '#eab308']
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const celebrateWin = useCallback(() => {
    // Initial burst
    fireConfetti();
    
    // Stars after a moment
    setTimeout(() => fireStars(), 500);
    
    // Continuous celebration
    setTimeout(() => fireCannonSequence(), 800);
  }, [fireConfetti, fireStars, fireCannonSequence]);

  return { fireConfetti, fireStars, fireCannonSequence, celebrateWin };
};
