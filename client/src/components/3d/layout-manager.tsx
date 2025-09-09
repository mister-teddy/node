import { createElement, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls, Stats } from "@react-three/drei";
import {
  deviceTypeAtom,
  deviceCapabilitiesAtom,
  renderQualityAtom,
  cameraPositionAtom,
  cameraTargetAtom,
  animationStateAtom,
  windowsStatesAtom,
  enabled3DModeAtom,
  environmentPresetAtom,
} from "@/state/3d";
import GestureSystem3D from "./gesture-system";
import Launcher3D from "./launcher";
import Window3D from "./window";
import { presetsObj } from "@react-three/drei/helpers/environment-assets";

interface LayoutManager3DProps {
  showStats?: boolean;
  enableOrbitControls?: boolean;
  className?: string;
}

/**
 * 3D Layout Manager Component
 * This component sets up the 3D scene, camera, controls, and renders
 * the 3D layout including frames and windows.
 *
 * If the user disabled 3D mode or the device is not capable, this component won't be used.
 * So it is guaranteed that `responsiveIs3DModeAtom` is true inside this component.
 */
export default function LayoutManager3D({
  className = "w-full h-full",
}: LayoutManager3DProps) {
  const [deviceType, setDeviceType] = useAtom(deviceTypeAtom);
  const [deviceCapabilities] = useAtom(deviceCapabilitiesAtom);
  const [renderQuality] = useAtom(renderQualityAtom);
  const [cameraPosition, setCameraPosition] = useAtom(cameraPositionAtom);
  const [cameraTarget] = useAtom(cameraTargetAtom);
  const [animationState] = useAtom(animationStateAtom);
  const windows = useAtomValue(windowsStatesAtom);
  const setEnabled3DMode = useSetAtom(enabled3DModeAtom);
  const [environmentPreset, setEnvironmentPreset] = useAtom(
    environmentPresetAtom
  );

  // Device detection effect
  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType("mobile");
      } else if (width < 1024) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };

    updateDeviceType();
    window.addEventListener("resize", updateDeviceType);
    return () => window.removeEventListener("resize", updateDeviceType);
  }, [setDeviceType]);

  return (
    <div className={className}>
      <Canvas
        camera={{
          position: cameraPosition,
          fov: deviceType === "mobile" ? 85 : 75,
          near: 0.1,
          far: 1000,
        }}
        dpr={[1, renderQuality.pixelRatio]}
        shadows={renderQuality.shadows}
        gl={{
          antialias: renderQuality.antialiasing,
          alpha: true,
          powerPreference:
            deviceCapabilities.performanceScore >= 6
              ? "high-performance"
              : "default",
        }}
        className="bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100"
      >
        {/* Lloyd's Frames */}
        <Launcher3D />

        {/* Page content goes here */}
        {windows.map((window) => (
          <Window3D
            title={window.title}
            icon={window.icon}
            position={window.position}
            size={window.size}
            biFoldContent={window.biFoldContent}
          >
            {createElement(window.component)}
          </Window3D>
        ))}

        <Environment background preset={environmentPreset} />

        {/* Camera Controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={8}
          maxDistance={80}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI - Math.PI / 8}
          target={cameraTarget}
          onChange={(event) => {
            if (event?.target?.object?.position && animationState === "idle") {
              const { x, y, z } = event.target.object.position;
              setCameraPosition([x, y, z]);
            }
          }}
          onStart={() => {
            // Optional: Set animation state when user starts interaction
          }}
          onEnd={() => {
            // Optional: Reset animation state when interaction ends
          }}
        />

        <Stats />

        <GestureSystem3D
          enableKeyboardControls={deviceType === "desktop"}
          enableMouseControls={true}
          enableTouchControls={deviceType !== "desktop"}
        />
      </Canvas>

      {/* 3D Mode Toggle & Performance Info (for development/debugging) */}
      <div className="absolute bottom-4 right-4 z-50 space-y-2">
        <button
          onClick={() => setEnabled3DMode(false)}
          className="px-3 py-1 bg-black/20 backdrop-blur text-white rounded-lg text-sm block"
        >
          2D Mode
        </button>
      </div>
      <div className="absolute top-4 right-4 z-50 space-y-2 px-3 py-1 bg-black/20 backdrop-blur text-white rounded-lg text-xs">
        Device: {deviceType}
        <br />
        Performance: {deviceCapabilities.performanceScore}/10
        <br />
        Quality: {deviceCapabilities.recommendedQuality}
        <br />
        WebGL: {deviceCapabilities.hasWebGL ? "✓" : "✗"}
        <br />
        Hardware: {deviceCapabilities.hasHardwareAcceleration ? "✓" : "✗"}
      </div>
      {/* Bottom left corner */}
      <div className="absolute bottom-4 left-4 z-50 flex gap-1">
        {/* Preset selection */}
        {Object.keys(presetsObj).map((preset) => (
          <button
            key={preset}
            onClick={() =>
              setEnvironmentPreset(preset as keyof typeof presetsObj)
            }
            className={`px-2 py-1 rounded text-sm border border-white/30 bg-black/20 backdrop-blur ${
              environmentPreset === preset
                ? "text-indigo-700 font-bold bg-white/20"
                : "text-white"
            }`}
            title={preset}
          >
            {
              {
                sunset: "🌅",
                dawn: "🌄",
                night: "🌃",
                warehouse: "🏭",
                forest: "🌲",
                apartment: "🏢",
                studio: "🎬",
                city: "🏙️",
                park: "🏞️",
                lobby: "🏛️",
              }[preset]
            }
          </button>
        ))}
      </div>
    </div>
  );
}
