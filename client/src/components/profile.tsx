import { enabled3DModeAtom, adaptiveIs3DModeAtom } from "@/state/3d";
import { useAtomValue, useSetAtom } from "jotai";
import { useState, useRef, useEffect } from "react";
import { hostAPI } from "@/libs/host-api";

export default function Profile() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const clickedRef = useRef(false);
  const setEnabled3DMode = useSetAtom(enabled3DModeAtom);
  const is3D = useAtomValue(adaptiveIs3DModeAtom);

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        clickedRef.current = false; // reset click state
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        // Only dismiss if not recently clicked
        if (!clickedRef.current) setOpen(false);
      }}
      onClick={() => {
        setOpen((v) => {
          if (v) {
            clickedRef.current = true;
          }
          return true;
        });
      }}
      tabIndex={0}
      style={{ outline: "none" }}
    >
      <div className="p-4 flex items-center border-t border-gray-100 bg-white cursor-pointer">
        <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xl mr-3 border border-gray-300">
          🐻
        </span>
        <span className="font-normal tracking-tight">Hồng Phát Nguyễn</span>
      </div>
      {open && (
        <div
          className={`absolute left-4 ${
            is3D ? "top-full -mt-2" : "bottom-full -mb-2"
          } py-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50`}
        >
          {!is3D && (
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
              onClick={async () => {
                setEnabled3DMode(true);
              }}
            >
              3D Mode
            </button>
          )}
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
            onClick={async () => {
              try {
                // Reset server-side database using hostAPI
                await hostAPI.db.reset();
              } catch (error) {
                console.warn("Failed to reset server database:", error);
              }

              // Clear any browser storage that might still be used
              try {
                localStorage.clear();
                sessionStorage.clear();
              } catch (error) {
                console.warn("Failed to clear browser storage:", error);
              }

              location.reload();
            }}
          >
            Clear Storage & Reload
          </button>
        </div>
      )}
    </div>
  );
}
