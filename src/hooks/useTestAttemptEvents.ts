import { useState, useCallback } from "react";

export interface AudioEvent {
  at: number;
  type: 'audio_start' | 'audio_end' | 'seek';
  sectionId: string;
  positionMs: number;
}

export interface LockdownViolationEvent {
  at: number;
  type: 'lockdown_violation';
  violationType: 'context_menu' | 'copy' | 'paste' | 'cut' | 'select_all' | 'print' | 'dev_tools' | 'fullscreen_exit' | 'tab_switch';
  details?: string;
}

export interface TestAttemptEvent extends AudioEvent {
  // Additional event types can be added here
}

export interface LockdownEvent extends LockdownViolationEvent {
  // Lockdown-specific events
}

interface TestAttempt {
  id: string;
  events: TestAttemptEvent[];
}

export function useTestAttemptEvents(attemptId?: string) {
  const [events, setEvents] = useState<TestAttemptEvent[]>([]);

  const addEvent = useCallback((event: TestAttemptEvent) => {
    setEvents(prev => [...prev, event]);
    
    // Log to console for debugging (remove in production)
    console.log('Test Event Recorded:', {
      attemptId,
      timestamp: new Date(event.at).toISOString(),
      type: event.type,
      sectionId: event.sectionId,
      positionMs: event.positionMs
    });
    
    // Here you would typically send to backend
    // Example: await supabase.from('test_attempt_events').insert({
    //   attempt_id: attemptId,
    //   event_type: event.type,
    //   section_id: event.sectionId,
    //   position_ms: event.positionMs,
    //   occurred_at: new Date(event.at).toISOString()
    // });
  }, [attemptId]);

  const addAudioEvent = useCallback((
    type: 'audio_start' | 'audio_end' | 'seek',
    sectionId: string,
    positionMs: number
  ) => {
    addEvent({
      at: Date.now(),
      type,
      sectionId,
      positionMs
    });
  }, [addEvent]);

  const getEventsBySection = useCallback((sectionId: string) => {
    return events.filter(event => event.sectionId === sectionId);
  }, [events]);

  const getAudioEvents = useCallback((sectionId?: string) => {
    const audioEvents = events.filter(event => 
      ['audio_start', 'audio_end', 'seek'].includes(event.type)
    );
    
    if (sectionId) {
      return audioEvents.filter(event => event.sectionId === sectionId);
    }
    
    return audioEvents;
  }, [events]);

  const getAudioPlayCount = useCallback((sectionId: string) => {
    const startEvents = events.filter(event => 
      event.type === 'audio_start' && event.sectionId === sectionId
    );
    return startEvents.length;
  }, [events]);

  const getTotalListeningTime = useCallback((sectionId: string) => {
    const audioEvents = getAudioEvents(sectionId).sort((a, b) => a.at - b.at);
    let totalTime = 0;
    let lastStartTime: number | null = null;

    for (const event of audioEvents) {
      if (event.type === 'audio_start') {
        lastStartTime = event.at;
      } else if (event.type === 'audio_end' && lastStartTime) {
        totalTime += event.at - lastStartTime;
        lastStartTime = null;
      }
    }

    return totalTime; // in milliseconds
  }, [getAudioEvents]);

  const getSeekAttempts = useCallback((sectionId: string) => {
    return events.filter(event => 
      event.type === 'seek' && event.sectionId === sectionId
    );
  }, [events]);

  return {
    events,
    addEvent,
    addAudioEvent,
    getEventsBySection,
    getAudioEvents,
    getAudioPlayCount,
    getTotalListeningTime,
    getSeekAttempts
  };
}