import { useState, useEffect, useCallback, useRef } from 'react';
import { useTestAttemptEvents } from './useTestAttemptEvents';
import { memoryRepo } from '@/repositories/memoryRepo';
import { toast } from 'sonner';

interface LockdownOptions {
  enabled: boolean;
  attemptId?: string;
}

export function useExamLockdown({ enabled, attemptId }: LockdownOptions) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState<Array<{
    type: string;
    timestamp: number;
    details?: string;
  }>>([]);
  
  const { addEvent } = useTestAttemptEvents(attemptId);
  const warningShownRef = useRef(false);
  const isInitialized = useRef(false);

  // 위반 기록 함수
  const recordViolation = useCallback(async (
    violationType: string, 
    details?: string
  ) => {
    const violation = {
      type: violationType,
      timestamp: Date.now(),
      details
    };
    
    setViolations(prev => [...prev, violation]);
    
    // TestAttempt의 violations 배열에 기록
    if (attemptId) {
      try {
        await memoryRepo.recordViolation(attemptId, 'lockdown_violation');
      } catch (error) {
        console.error('Failed to record violation:', error);
      }
    }
    
    // TestAttemptEvent로도 기록
    addEvent({
      at: Date.now(),
      type: 'lockdown_violation' as any,
      violationType,
      details
    } as any);

    // 경고 메시지 표시 (첫 번째 위반시에만)
    if (!warningShownRef.current) {
      warningShownRef.current = true;
      toast.error("부정행위가 감지되어 기록되었습니다.", {
        description: "계속된 위반 시 시험이 강제 종료될 수 있습니다.",
        duration: 5000,
      });
    }
  }, [addEvent, attemptId]);

  // 전체화면 요청
  const requestFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen request failed:', error);
      toast.error("전체화면 모드로 전환할 수 없습니다.");
    }
  }, []);

  // 전체화면 해제
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Exit fullscreen failed:', error);
    }
  }, []);

  // 전체화면 상태 변경 감지
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      // 잠금 모드에서 전체화면이 해제되면 위반 기록
      if (enabled && !isCurrentlyFullscreen && isInitialized.current) {
        recordViolation('fullscreen_exit', '전체화면 모드가 해제됨');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [enabled, recordViolation]);

  // 포커스 이탈 감지
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('tab_switch', '탭 전환 또는 창 전환');
      }
    };

    const handleWindowBlur = () => {
      recordViolation('tab_switch', '창 포커스 이탈');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [enabled, recordViolation]);

  // 키보드 단축키 차단
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = [
        'F12', // 개발자 도구
        'F5',  // 새로고침
        'F11', // 전체화면 토글
      ];

      const blockedCombinations = [
        { ctrl: true, key: 'c' },     // 복사
        { ctrl: true, key: 'v' },     // 붙여넣기
        { ctrl: true, key: 'x' },     // 잘라내기
        { ctrl: true, key: 'a' },     // 전체선택
        { ctrl: true, key: 'p' },     // 인쇄
        { ctrl: true, key: 's' },     // 저장
        { ctrl: true, key: 'r' },     // 새로고침
        { ctrl: true, shift: true, key: 'i' }, // 개발자 도구
        { ctrl: true, shift: true, key: 'j' }, // 콘솔
        { ctrl: true, shift: true, key: 'c' }, // 요소 검사
        { ctrl: true, key: 'u' },     // 소스 보기
        { alt: true, key: 'Tab' },    // Alt+Tab
        { cmd: true, key: 'c' },      // Mac 복사
        { cmd: true, key: 'v' },      // Mac 붙여넣기
        { cmd: true, key: 'x' },      // Mac 잘라내기
        { cmd: true, key: 'a' },      // Mac 전체선택
        { cmd: true, key: 'p' },      // Mac 인쇄
        { cmd: true, key: 's' },      // Mac 저장
        { cmd: true, key: 'r' },      // Mac 새로고침
      ];

      // 차단된 단일 키 확인
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        recordViolation('dev_tools', `차단된 키: ${e.key}`);
        return;
      }

      // 차단된 조합 키 확인
      for (const combo of blockedCombinations) {
        const isCtrlPressed = combo.ctrl && (e.ctrlKey || e.metaKey);
        const isCmdPressed = combo.cmd && e.metaKey;
        const isShiftPressed = combo.shift ? e.shiftKey : true;
        const isAltPressed = combo.alt ? e.altKey : !e.altKey;
        const isKeyPressed = combo.key.toLowerCase() === e.key.toLowerCase();

        if ((isCtrlPressed || isCmdPressed) && isShiftPressed && isAltPressed && isKeyPressed) {
          e.preventDefault();
          
          let violationType = 'copy';
          if (['c', 'v', 'x', 'a'].includes(combo.key)) {
            violationType = combo.key === 'c' ? 'copy' : 
                           combo.key === 'v' ? 'paste' : 
                           combo.key === 'x' ? 'cut' : 'select_all';
          } else if (combo.key === 'p') {
            violationType = 'print';
          } else {
            violationType = 'dev_tools';
          }
          
          recordViolation(violationType, `차단된 조합키: ${e.ctrlKey || e.metaKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`);
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, recordViolation]);

  // 우클릭 차단
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      recordViolation('context_menu', '우클릭 시도');
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [enabled, recordViolation]);

  // 텍스트 선택 차단
  useEffect(() => {
    if (!enabled) return;

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      recordViolation('text_selection', '텍스트 선택 시도');
    };

    document.addEventListener('selectstart', handleSelectStart);
    return () => document.removeEventListener('selectstart', handleSelectStart);
  }, [enabled, recordViolation]);

  // 드래그 차단
  useEffect(() => {
    if (!enabled) return;

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('dragstart', handleDragStart);
    return () => document.removeEventListener('dragstart', handleDragStart);
  }, [enabled]);

  // 잠금 모드 초기화
  useEffect(() => {
    if (enabled && !isInitialized.current) {
      isInitialized.current = true;
      requestFullscreen();
    }
  }, [enabled, requestFullscreen]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (enabled) {
        exitFullscreen();
      }
    };
  }, [enabled, exitFullscreen]);

  return {
    isFullscreen,
    violations,
    violationCount: violations.length,
    requestFullscreen,
    exitFullscreen,
    recordViolation
  };
}