import { useCallback, useRef } from 'react';

interface TouchHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseTouchDragOptions {
  onDragStart?: (x: number, y: number) => void;
  onDragMove?: (x: number, y: number, deltaX: number, deltaY: number) => void;
  onDragEnd?: (x: number, y: number) => void;
  onLongPress?: () => void;
  longPressDuration?: number;
  dragThreshold?: number;
}

export function useTouchDrag({
  onDragStart,
  onDragMove,
  onDragEnd,
  onLongPress,
  longPressDuration = 400,
  dragThreshold = 10,
}: UseTouchDragOptions): TouchHandlers {
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    isDragging.current = false;

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        if (!isDragging.current) {
          onLongPress();
        }
      }, longPressDuration);
    }
  }, [onLongPress, longPressDuration]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPos.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (!isDragging.current && distance > dragThreshold) {
      isDragging.current = true;
      clearLongPressTimer();
      onDragStart?.(startPos.current.x, startPos.current.y);
    }

    if (isDragging.current) {
      e.preventDefault();
      onDragMove?.(touch.clientX, touch.clientY, deltaX, deltaY);
    }
  }, [dragThreshold, clearLongPressTimer, onDragStart, onDragMove]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    clearLongPressTimer();
    
    if (isDragging.current && startPos.current) {
      const touch = e.changedTouches[0];
      onDragEnd?.(touch.clientX, touch.clientY);
    }

    startPos.current = null;
    isDragging.current = false;
  }, [clearLongPressTimer, onDragEnd]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// Convert touch event to mouse-like coordinates
export function getTouchPoint(e: TouchEvent | React.TouchEvent): { clientX: number; clientY: number } {
  const touch = 'touches' in e ? e.touches[0] || e.changedTouches[0] : e;
  return { clientX: touch.clientX, clientY: touch.clientY };
}
