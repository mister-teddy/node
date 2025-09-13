import type { Active3DWindow, WindowConfig } from "@/types";
import type { PresetsType } from "@react-three/drei/helpers/environment-assets";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// 3D Mode State
export const enabled3DModeAtom = atomWithStorage("is3DMode", false);

// Camera State
export const cameraPositionAtom = atomWithStorage<[number, number, number]>(
  "cameraPosition",
  [6.73052673149478, 2.6454633073348597, 21.455489862152568],
);
export const cameraTargetAtom = atomWithStorage<[number, number, number]>(
  "cameraTarget",
  [0, 0, 0],
);

export const windowConfigsAtom = atom<Record<string, WindowConfig>>({});

// Responsive State
export const deviceTypeAtom = atom<"desktop" | "tablet" | "mobile">("desktop");

// Performance capability detection
export const deviceCapabilitiesAtom = atom((get) => {
  const deviceType = get(deviceTypeAtom);

  // Detect WebGL support
  const hasWebGL = (() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return !!gl;
    } catch {
      return false;
    }
  })();

  // Detect hardware acceleration
  const hasHardwareAcceleration = (() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl");
      if (!gl) return false;

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = debugInfo
        ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "";

      // Check for software rendering indicators
      return !renderer.toLowerCase().includes("software");
    } catch {
      return false;
    }
  })();

  // Performance scoring based on device type and capabilities
  const performanceScore = (() => {
    let score = 0;

    if (deviceType === "desktop") score += 3;
    else if (deviceType === "tablet") score += 2;
    else score += 1; // mobile

    if (hasWebGL) score += 2;
    if (hasHardwareAcceleration) score += 2;

    // Check for high memory
    interface NavigatorWithDeviceMemory extends Navigator {
      deviceMemory?: number;
    }
    const nav = navigator as NavigatorWithDeviceMemory;
    if (nav.deviceMemory && nav.deviceMemory >= 4) score += 1;

    // Check for high CPU count
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 4)
      score += 1;

    return score;
  })();

  return {
    deviceType,
    hasWebGL,
    hasHardwareAcceleration,
    performanceScore,
    canRun3D: performanceScore >= 5, // Minimum score for 3D
    recommendedQuality:
      performanceScore >= 7 ? "high" : performanceScore >= 5 ? "medium" : "low",
  };
});

// Auto-detect device type based on screen size and user agent
export const adaptiveIs3DModeAtom = atom((get) => {
  const userRequested3D = get(enabled3DModeAtom);
  const capabilities = get(deviceCapabilitiesAtom);

  // Force 2D mode if device can't handle 3D
  if (!capabilities.canRun3D) return false;

  return userRequested3D;
});

// Quality settings based on device capabilities
export const renderQualityAtom = atom((get) => {
  const capabilities = get(deviceCapabilitiesAtom);
  const is3D = get(adaptiveIs3DModeAtom);

  if (!is3D) {
    return {
      shadows: false,
      antialiasing: false,
      pixelRatio: 1,
      maxLights: 2,
      particleCount: 0,
    };
  }

  switch (capabilities.recommendedQuality) {
    case "high":
      return {
        shadows: true,
        antialiasing: true,
        pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        maxLights: 8,
        particleCount: 100,
      };
    case "medium":
      return {
        shadows: true,
        antialiasing: false,
        pixelRatio: 1,
        maxLights: 4,
        particleCount: 50,
      };
    case "low":
    default:
      return {
        shadows: false,
        antialiasing: false,
        pixelRatio: 1,
        maxLights: 2,
        particleCount: 25,
      };
  }
});

// Frame System State
export interface FrameConfig {
  id: string;
  title: string;
  position: [number, number, number];
  size: [number, number];
  isVisible: boolean;
  component: React.ComponentType;
}

export const framesConfigAtom = atom<Record<string, FrameConfig>>({
  calendar: {
    id: "calendar",
    title: "Calendar",
    position: [-12, 2, 0],
    size: [3, 4],
    isVisible: true,
    component: () => null, // Will be replaced with actual component
  },
  todo: {
    id: "todo",
    title: "To-Do",
    position: [-12, -2, 0],
    size: [3, 4],
    isVisible: true,
    component: () => null,
  },
  weather: {
    id: "weather",
    title: "Weather",
    position: [-12, 6, 0],
    size: [3, 2],
    isVisible: true,
    component: () => null,
  },
});

// Animation State
export const animationStateAtom = atom<"idle" | "transitioning" | "zooming">(
  "idle",
);

export const windowsStatesAtom = atom<Active3DWindow[]>([]);

export const environmentPresetAtom = atomWithStorage<PresetsType>(
  "environmentPreset",
  "apartment",
);
