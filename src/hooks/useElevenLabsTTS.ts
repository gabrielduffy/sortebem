import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseElevenLabsTTSOptions {
  enabled?: boolean;
  onSpeaking?: () => void;
  onFinished?: () => void;
  onError?: (error: string) => void;
}

interface ElevenLabsConfig {
  enabled: boolean;
  apiKey?: string;
  voiceId?: string;
  modelId?: string;
  narrationPrefix?: string;
  narrationInterval?: number;
}

export function useElevenLabsTTS(options: UseElevenLabsTTSOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<ElevenLabsConfig | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  // Load ElevenLabs config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'elevenlabs_config')
          .single();

        if (!error && data?.value) {
          const configValue = data.value as unknown as ElevenLabsConfig;
          if (configValue && typeof configValue === 'object') {
            setConfig(configValue);
          }
        }
      } catch (err) {
        console.error('Error loading ElevenLabs config:', err);
      }
    };

    loadConfig();
  }, []);

  const isEnabled = options.enabled !== false && config?.enabled === true;

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    queueRef.current = [];
    isProcessingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!isEnabled || !text) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const data = await response.json();
      
      if (!data.audioContent) {
        throw new Error('No audio content received');
      }

      // Create audio element and play
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.onplay = () => {
        setIsSpeaking(true);
        options.onSpeaking?.();
      };
      
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        options.onFinished?.();
        processQueue();
      };
      
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        options.onError?.('Audio playback error');
        processQueue();
      };

      await audioRef.current.play();
    } catch (error: any) {
      console.error('ElevenLabs TTS error:', error);
      options.onError?.(error.message);
      setIsSpeaking(false);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, options]);

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || queueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const text = queueRef.current.shift();
    
    if (text) {
      await speakText(text);
    }
    
    isProcessingRef.current = false;
    
    // Process next item if any
    if (queueRef.current.length > 0) {
      processQueue();
    }
  }, [speakText]);

  const speakNumber = useCallback(async (number: number) => {
    if (!isEnabled) return;

    const prefix = config?.narrationPrefix || 'Número sorteado:';
    const text = `${prefix} ${number}`;
    
    // Add to queue
    queueRef.current.push(text);
    
    // Start processing if not already
    if (!isProcessingRef.current && !isSpeaking) {
      processQueue();
    }
  }, [isEnabled, config, isSpeaking, processQueue]);

  const speakWinner = useCallback(async (prizeAmount: number, establishment?: string) => {
    if (!isEnabled) return;

    const formattedPrize = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(prizeAmount);

    let text = `Atenção! Temos um ganhador! Prêmio de ${formattedPrize}!`;
    if (establishment) {
      text += ` Parabéns ao estabelecimento ${establishment}!`;
    }

    queueRef.current.push(text);
    
    if (!isProcessingRef.current && !isSpeaking) {
      processQueue();
    }
  }, [isEnabled, isSpeaking, processQueue]);

  const speakTieBreak = useCallback(async (stoneNumber: number, winner?: string) => {
    if (!isEnabled) return;

    let text = `Desempate por pedra! Número da pedra: ${stoneNumber}.`;
    if (winner) {
      text += ` Vencedor: ${winner}!`;
    }

    queueRef.current.push(text);
    
    if (!isProcessingRef.current && !isSpeaking) {
      processQueue();
    }
  }, [isEnabled, isSpeaking, processQueue]);

  return {
    speakText,
    speakNumber,
    speakWinner,
    speakTieBreak,
    stop,
    isSpeaking,
    isLoading,
    isEnabled,
    config
  };
}
