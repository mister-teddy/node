import { useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import { useThree } from '@react-three/fiber';
import { 
  cameraPositionAtom, 
  cameraTargetAtom, 
  animationStateAtom,
  windowConfigsAtom 
} from '@/state/3d';

interface GestureData {
  type: 'swipe' | 'pinch' | 'rotate' | 'tap' | 'double-tap';
  direction?: 'up' | 'down' | 'left' | 'right';
  fingers: number;
  velocity?: number;
  scale?: number;
  rotation?: number;
  position?: { x: number; y: number };
}

interface Touch {
  identifier: number;
  clientX: number;
  clientY: number;
  timestamp: number;
}

interface GestureSystem3DProps {
  onGesture?: (gesture: GestureData) => void;
  enableKeyboardControls?: boolean;
  enableMouseControls?: boolean;
  enableTouchControls?: boolean;
}

export default function GestureSystem3D({
  onGesture,
  enableKeyboardControls = true,
  enableMouseControls = true,
  enableTouchControls = true,
}: GestureSystem3DProps) {
  const { gl } = useThree();
  const [, setCameraPosition] = useAtom(cameraPositionAtom);
  const [, setCameraTarget] = useAtom(cameraTargetAtom);
  const [, setAnimationState] = useAtom(animationStateAtom);
  const [, setWindowConfigs] = useAtom(windowConfigsAtom);

  // Touch tracking
  const touchesRef = useRef<Map<number, Touch>>(new Map());
  const gestureStartRef = useRef<{ time: number; touches: Touch[] } | null>(null);
  const lastTapRef = useRef<number>(0);

  // Gesture detection utilities
  const calculateDistance = (touch1: Touch, touch2: Touch): number => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };


  // Touch event handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!enableTouchControls) return;

    const now = Date.now();
    const touches: Touch[] = [];

    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      const touchData: Touch = {
        identifier: touch.identifier,
        clientX: touch.clientX,
        clientY: touch.clientY,
        timestamp: now,
      };
      
      touchesRef.current.set(touch.identifier, touchData);
      touches.push(touchData);
    }

    gestureStartRef.current = { time: now, touches };
  }, [enableTouchControls]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!enableTouchControls || !gestureStartRef.current) return;

    const calculateVelocity = (startTouch: Touch, endTouch: Touch, deltaTime: number): number => {
      const distance = calculateDistance(startTouch, endTouch);
      return distance / deltaTime;
    };

    const now = Date.now();
    const deltaTime = now - gestureStartRef.current.time;
    const startTouches = gestureStartRef.current.touches;

    // Single finger gestures
    if (startTouches.length === 1 && event.changedTouches.length === 1) {
      const startTouch = startTouches[0];
      const endTouch = event.changedTouches[0];
      
      const distance = calculateDistance(startTouch, {
        identifier: endTouch.identifier,
        clientX: endTouch.clientX,
        clientY: endTouch.clientY,
        timestamp: now,
      });
      
      const velocity = calculateVelocity(startTouch, {
        identifier: endTouch.identifier,
        clientX: endTouch.clientX,
        clientY: endTouch.clientY,
        timestamp: now,
      }, deltaTime);

      // Tap detection
      if (distance < 20 && deltaTime < 300) {
        // Double tap detection
        if (now - lastTapRef.current < 300) {
          onGesture?.({
            type: 'double-tap',
            fingers: 1,
            position: { x: endTouch.clientX, y: endTouch.clientY },
          });
        } else {
          onGesture?.({
            type: 'tap',
            fingers: 1,
            position: { x: endTouch.clientX, y: endTouch.clientY },
          });
        }
        lastTapRef.current = now;
      }
      // Swipe detection
      else if (distance > 50 && velocity > 0.5) {
        const deltaX = endTouch.clientX - startTouch.clientX;
        const deltaY = endTouch.clientY - startTouch.clientY;
        
        let direction: 'up' | 'down' | 'left' | 'right';
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        onGesture?.({
          type: 'swipe',
          direction,
          fingers: 1,
          velocity,
        });
      }
    }

    // Three finger swipe - minimize all windows
    if (startTouches.length === 3) {
      const avgStartY = startTouches.reduce((sum, t) => sum + t.clientY, 0) / 3;
      const avgEndY = Array.from(event.changedTouches).reduce((sum, t) => sum + t.clientY, 0) / event.changedTouches.length;
      
      if (avgStartY - avgEndY > 50) { // Swipe up
        onGesture?.({
          type: 'swipe',
          direction: 'up',
          fingers: 3,
        });
        
        // Minimize all windows
        setWindowConfigs((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((id) => {
            updated[id] = { ...updated[id], isMinimized: true };
          });
          return updated;
        });
      }
    }

    // Clear touch data
    for (const touch of event.changedTouches) {
      touchesRef.current.delete(touch.identifier);
    }
    gestureStartRef.current = null;
  }, [enableTouchControls, onGesture, setWindowConfigs]);

  // Keyboard controls
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableKeyboardControls) return;

    const moveSpeed = 2;

    switch (event.code) {
      case 'KeyW':
        setCameraPosition(prev => [prev[0], prev[1], prev[2] - moveSpeed]);
        break;
      case 'KeyS':
        setCameraPosition(prev => [prev[0], prev[1], prev[2] + moveSpeed]);
        break;
      case 'KeyA':
        setCameraPosition(prev => [prev[0] - moveSpeed, prev[1], prev[2]]);
        break;
      case 'KeyD':
        setCameraPosition(prev => [prev[0] + moveSpeed, prev[1], prev[2]]);
        break;
      case 'KeyQ':
        setCameraPosition(prev => [prev[0], prev[1] - moveSpeed, prev[2]]);
        break;
      case 'KeyE':
        setCameraPosition(prev => [prev[0], prev[1] + moveSpeed, prev[2]]);
        break;
      case 'Space':
        event.preventDefault();
        // Reset camera to default position
        setCameraPosition([0, 5, 15]);
        setCameraTarget([0, 0, 0]);
        break;
      case 'KeyR':
        // Reposition windows
        setAnimationState('transitioning');
        setTimeout(() => setAnimationState('idle'), 1000);
        break;
      case 'KeyM':
        // Minimize all windows
        setWindowConfigs((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((id) => {
            updated[id] = { ...updated[id], isMinimized: !updated[id].isMinimized };
          });
          return updated;
        });
        break;
      case 'Escape':
        // Exit full screen or reset view
        setCameraPosition([0, 5, 15]);
        setCameraTarget([0, 0, 0]);
        setAnimationState('idle');
        break;
    }
  }, [
    enableKeyboardControls,
    setCameraPosition,
    setCameraTarget,
    setAnimationState,
    setWindowConfigs,
  ]);

  // Mouse wheel for zooming
  const handleWheel = useCallback((event: WheelEvent) => {
    if (!enableMouseControls) return;

    event.preventDefault();
    const zoomSpeed = 0.5;
    const deltaY = event.deltaY * zoomSpeed;

    setCameraPosition(prev => {
      const newZ = Math.max(5, Math.min(50, prev[2] + deltaY * 0.01));
      return [prev[0], prev[1], newZ];
    });
  }, [enableMouseControls, setCameraPosition]);

  // Set up event listeners
  useEffect(() => {
    const canvas = gl.domElement;
    
    if (enableTouchControls) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
    
    if (enableKeyboardControls) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    if (enableMouseControls) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [
    gl.domElement,
    enableTouchControls,
    enableKeyboardControls,
    enableMouseControls,
    handleTouchStart,
    handleTouchEnd,
    handleKeyDown,
    handleWheel,
  ]);



  // This component doesn't render anything visible
  return null;
}