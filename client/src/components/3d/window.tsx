import { useRef, useState, useCallback, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";
import { useSetAtom } from "jotai";
import { windowsStatesAtom } from "@/state/3d";

interface Window3DProps {
  biFoldContent?: ReactNode;
  children: ReactNode;
  title?: string;
  icon?: string;
  position?: [number, number, number];
  size?: [number, number];
  windowId?: string;
}

interface WindowState {
  position: [number, number, number];
  isHovered: boolean;
  isFocused: boolean;
  size: [number, number];
}

export default function Window3D({
  children,
  title,
  icon,
  position = [0, 0, 0],
  size = [9, 16],
  biFoldContent,
  windowId,
}: Window3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const setWindowsStates = useSetAtom(windowsStatesAtom);

  const [windowState, setWindowState] = useState<WindowState>({
    position: position,
    size: size,
    isHovered: false,
    isFocused: false,
  });

  // Spring animations for smooth transitions
  const { position: animatedPosition, width: animatedWidth } = useSpring({
    position: windowState.position,
    width: biFoldContent ? windowState.size[0] * 2 : windowState.size[0],
    config: {
      tension: 200,
      friction: 25,
      mass: 1,
    },
  });

  // Camera-facing logic
  useFrame(() => {
    if (!meshRef.current) return;

    // Always face the camera
    meshRef.current.lookAt(camera.position);
  });

  // Event handlers
  const handlePointerEnter = useCallback(() => {
    setWindowState((prev) => ({ ...prev, isHovered: true }));
  }, []);

  const handlePointerLeave = useCallback(() => {
    setWindowState((prev) => ({ ...prev, isHovered: false }));
  }, []);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    // Touch event handling can be expanded here if needed
    event.preventDefault();
  }, []);

  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setWindowState((prev) => ({ ...prev, isFocused: !prev.isFocused }));
  }, []);

  const handleClose = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (windowId) {
        setWindowsStates((prev) =>
          prev.filter(
            (window, index) =>
              index !== parseInt(windowId) && window.title !== title
          )
        );
      } else if (title) {
        setWindowsStates((prev) =>
          prev.filter((window) => window.title !== title)
        );
      }
    },
    [windowId, title, setWindowsStates]
  );

  // Main window view
  return (
    <animated.group
      ref={meshRef}
      position={animatedPosition.get() as [number, number, number]}
    >
      {/* Left Panel - Main Content */}
      <Html
        transform
        position={[0, 0, 0.11]}
        style={{
          width: `${animatedWidth.get() * 60}px`,
          height: `${windowState.size[1] * 60}px`,
          pointerEvents: "auto",
        }}
      >
        <div
          className={`
            relative w-full h-full overflow-hidden
            transition-all duration-300 backdrop-blur-xl cursor-pointer
            ${
              windowState.isFocused
                ? "shadow-2xl shadow-blue-500/20"
                : "shadow-xl"
            }
            ${windowState.isHovered ? "shadow-3xl" : ""}
            flex flex-col
            rounded-2xl
          `}
          style={{
            background: windowState.isFocused
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(20px) saturate(180%)",
            border: windowState.isFocused
              ? "1px solid rgba(59, 130, 246, 0.3)"
              : "1px solid rgba(255, 255, 255, 0.2)",
          }}
          onMouseEnter={handlePointerEnter}
          onMouseLeave={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onClick={handleClick}
        >
          {/* Window Header */}
          {title && (
            <div
              className="flex items-center justify-between px-6 py-3 backdrop-blur-md flex-none"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <span className="text-sm font-semibold text-foreground select-none tracking-wide">
                {icon && <span>{icon} </span>}
                {title}
              </span>
              <button
                onClick={handleClose}
                className="ml-2 w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-gray-200/50 transition-colors duration-200"
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Window Body */}
          <div className="flex-1 overflow-auto">
            {biFoldContent ? (
              <div className="flex h-full">
                <div className="flex-1 overflow-auto">{children}</div>
                <div className="w-px bg-gray-300 flex-shrink-0"></div>
                <div className="flex-1 overflow-auto">{biFoldContent}</div>
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </Html>
    </animated.group>
  );
}
