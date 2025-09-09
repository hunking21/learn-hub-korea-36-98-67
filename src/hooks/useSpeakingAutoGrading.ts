import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface SpeakingMetrics {
  transcript: string;
  wpm: number; // Words per minute
  speakingTime: number; // Total speaking time in seconds
  pauses: number; // Number of pauses/silence periods
  fillers: number; // Number of filler words
  ttr: number; // Type-Token Ratio (vocabulary diversity)
}

export interface SpeakingAutoScores {
  fluency: number; // 0-4
  pronunciation: number; // 0-4
  grammar: number; // 0-4
  content: number; // 0-4
}

export interface AutoSpeakingResult {
  transcript: string;
  wpm: number;
  speakingTime: number;
  pauses: number;
  fillers: number;
  ttr: number;
  scores: SpeakingAutoScores;
  scoredAt: string;
}

interface UseSpeakingAutoGradingResult {
  isProcessing: boolean;
  autoGrade: (audioUrl: string, questionPrompt: string) => Promise<AutoSpeakingResult>;
  isSupported: boolean;
}

const FILLER_WORDS = ['um', 'uh', 'er', 'like', 'you know', 'so', 'well', 'actually', 'basically', '아', '음', '그', '어'];

export function useSpeakingAutoGrading(): UseSpeakingAutoGradingResult {
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if Web Speech API is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const transcribeAudio = useCallback(async (audioUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      // Create audio element to play the recorded audio
      const audio = new Audio(audioUrl);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US'; // Can be made configurable later

      let transcript = '';

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + ' ';
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        reject(new Error(`Speech recognition failed: ${event.error}`));
      };

      recognition.onend = () => {
        resolve(transcript.trim());
      };

      // Start recognition when audio starts playing
      audio.onplay = () => {
        recognition.start();
      };

      audio.onended = () => {
        recognition.stop();
      };

      audio.onerror = () => {
        recognition.stop();
        reject(new Error('Audio playback failed'));
      };

      // Start playing audio (muted so user doesn't hear it)
      audio.muted = true;
      audio.play().catch(reject);
    });
  }, [isSupported]);

  const calculateMetrics = useCallback((transcript: string, audioUrl: string): Promise<SpeakingMetrics> => {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      
      audio.onloadedmetadata = () => {
        const speakingTime = audio.duration;
        const words = transcript.trim().split(/\s+/).filter(word => word.length > 0);
        const uniqueWords = new Set(words.map(word => word.toLowerCase()));
        
        // Calculate WPM (Words Per Minute)
        const wpm = speakingTime > 0 ? Math.round((words.length / speakingTime) * 60) : 0;
        
        // Count filler words
        const fillers = words.filter(word => 
          FILLER_WORDS.some(filler => 
            word.toLowerCase().includes(filler.toLowerCase())
          )
        ).length;
        
        // Estimate pauses (simplified - in real implementation, would need audio analysis)
        const estimatedPauses = Math.max(0, Math.floor(speakingTime / 10) - 1);
        
        // Calculate TTR (Type-Token Ratio)
        const ttr = words.length > 0 ? uniqueWords.size / words.length : 0;
        
        resolve({
          transcript,
          wpm,
          speakingTime: Math.round(speakingTime),
          pauses: estimatedPauses,
          fillers,
          ttr: Math.round(ttr * 100) / 100
        });
      };
      
      audio.onerror = () => {
        // Fallback metrics if audio metadata fails
        const words = transcript.trim().split(/\s+/).filter(word => word.length > 0);
        const uniqueWords = new Set(words.map(word => word.toLowerCase()));
        
        resolve({
          transcript,
          wpm: 120, // Default assumption
          speakingTime: 30, // Default assumption
          pauses: 2, // Default assumption
          fillers: words.filter(word => 
            FILLER_WORDS.some(filler => 
              word.toLowerCase().includes(filler.toLowerCase())
            )
          ).length,
          ttr: words.length > 0 ? uniqueWords.size / words.length : 0
        });
      };
    });
  }, []);

  const calculateScores = useCallback((metrics: SpeakingMetrics, questionPrompt: string): SpeakingAutoScores => {
    const { wpm, fillers, ttr, transcript, speakingTime, pauses } = metrics;
    const words = transcript.trim().split(/\s+/).filter(word => word.length > 0);
    
    // Fluency scoring (based on WPM, pauses, fillers)
    let fluencyScore = 4;
    if (wpm < 80) fluencyScore -= 1;
    if (wpm < 60) fluencyScore -= 1;
    if (pauses > speakingTime / 10) fluencyScore -= 0.5;
    if (fillers > words.length * 0.1) fluencyScore -= 1;
    fluencyScore = Math.max(0, Math.min(4, fluencyScore));
    
    // Pronunciation scoring (simplified - would need more sophisticated analysis)
    let pronunciationScore = 3; // Default neutral score
    if (transcript.length === 0) pronunciationScore = 0;
    else if (words.length < 5) pronunciationScore = 1;
    else if (wpm > 100 && wpm < 160) pronunciationScore = 4;
    
    // Grammar scoring (simplified - based on sentence structure indicators)
    let grammarScore = 3; // Default neutral score
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) grammarScore = 0;
    else if (sentences.length === 1 && words.length < 10) grammarScore = 2;
    else if (ttr > 0.7) grammarScore = 4; // High vocabulary diversity suggests good grammar
    
    // Content scoring (based on response length and relevance)
    let contentScore = 3; // Default neutral score
    const promptWords = questionPrompt.toLowerCase().split(/\s+/);
    const transcriptLower = transcript.toLowerCase();
    const relevantWords = promptWords.filter(word => 
      word.length > 3 && transcriptLower.includes(word)
    ).length;
    
    if (words.length === 0) contentScore = 0;
    else if (words.length < 10) contentScore = 1;
    else if (words.length > 30 && relevantWords > promptWords.length * 0.3) contentScore = 4;
    else if (words.length > 20) contentScore = 3;
    else contentScore = 2;
    
    return {
      fluency: Math.round(fluencyScore * 10) / 10,
      pronunciation: Math.round(pronunciationScore * 10) / 10,
      grammar: Math.round(grammarScore * 10) / 10,
      content: Math.round(contentScore * 10) / 10
    };
  }, []);

  const autoGrade = useCallback(async (audioUrl: string, questionPrompt: string): Promise<AutoSpeakingResult> => {
    if (!isSupported) {
      throw new Error('이 브라우저는 음성 인식을 지원하지 않습니다.');
    }

    setIsProcessing(true);
    
    try {
      // Step 1: Transcribe audio
      const transcript = await transcribeAudio(audioUrl);
      
      if (!transcript.trim()) {
        throw new Error('음성을 인식할 수 없습니다. 오디오 품질을 확인해주세요.');
      }
      
      // Step 2: Calculate metrics
      const metrics = await calculateMetrics(transcript, audioUrl);
      
      // Step 3: Calculate scores based on metrics and question prompt
      const scores = calculateScores(metrics, questionPrompt);
      
      return {
        transcript: metrics.transcript,
        wpm: metrics.wpm,
        speakingTime: metrics.speakingTime,
        pauses: metrics.pauses,
        fillers: metrics.fillers,
        ttr: metrics.ttr,
        scores,
        scoredAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Auto grading failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [isSupported, transcribeAudio, calculateMetrics, calculateScores]);

  return {
    isProcessing,
    autoGrade,
    isSupported
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}