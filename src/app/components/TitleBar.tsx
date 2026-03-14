import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

export default function TitleBar() {
  const isElectron = useMemo(
    () => typeof window !== "undefined" && typeof window.electronAPI !== "undefined",
    []
  );
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentPath, setCurrentPath] = useState(getCurrentPathname());

  const isLoginPage = currentPath === "/" || currentPath === "/login";
  const iconColor = isLoginPage ? "rgba(0,0,0,0.45)" : "rgba(60,60,60,0.7)";
  const hoverBg = isLoginPage ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.06)";

  useEffect(() => {
    let mounted = true;

    const syncMaximizedState = async () => {
      try {
        if (!isElectron || !window.electronAPI?.isMaximized) {
          return;
        }

        const value = await window.electronAPI.isMaximized();
        if (mounted) {
          setIsMaximized(Boolean(value));
        }
      } catch {
        if (mounted) {
          setIsMaximized(false);
        }
      }
    };

    syncMaximizedState();
    window.addEventListener("resize", syncMaximizedState);

    return () => {
      mounted = false;
      window.removeEventListener("resize", syncMaximizedState);
    };
  }, [isElectron]);

  useEffect(() => {
    const syncPath = () => {
      setCurrentPath(getCurrentPathname());
    };

    window.addEventListener("hashchange", syncPath);
    window.addEventListener("popstate", syncPath);

    return () => {
      window.removeEventListener("hashchange", syncPath);
      window.removeEventListener("popstate", syncPath);
    };
  }, []);

  const handleMinimize = () => {
    try {
      if (isElectron) {
        window.electronAPI?.minimize?.();
      }
    } catch {
      console.warn("Electron API not available");
    }
  };

  const handleMaximize = async () => {
    try {
      if (!isElectron) {
        return;
      }

      window.electronAPI?.maximize?.();
      const value = await window.electronAPI?.isMaximized?.();
      setIsMaximized(Boolean(value));
    } catch {
      console.warn("Electron API not available");
    }
  };

  const handleClose = () => {
    try {
      if (isElectron) {
        window.electronAPI?.close?.();
      }
    } catch {
      console.warn("Electron API not available");
    }
  };

  if (!isElectron) {
    return null;
  }

  return (
    <>
      <div
        className="drag-region"
        onDoubleClick={() => {
          void handleMaximize();
        }}
        style={{
          position: "fixed",
          top: 0,
          left: isLoginPage ? 0 : "260px",
          right: "138px",
          height: "38px",
          ["WebkitAppRegion" as any]: "drag",
          zIndex: 9998,
          background: "transparent",
          pointerEvents: "auto",
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "38px",
          zIndex: 99999,
          display: "flex",
          alignItems: "center",
          ["WebkitAppRegion" as any]: "no-drag",
          background: "transparent",
        }}
      >
        <button
          type="button"
          onClick={handleMinimize}
          title="Minimize"
          aria-label="Minimize window"
          style={buttonStyle(iconColor)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = hoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = iconColor;
          }}
        >
          <span
            style={{
              width: "10px",
              height: "1.5px",
              background: "currentColor",
              display: "block",
            }}
          />
        </button>

        <button
          type="button"
          onClick={handleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
          aria-label={isMaximized ? "Restore window" : "Maximize window"}
          style={buttonStyle(iconColor)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = hoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = iconColor;
          }}
        >
          {isMaximized ? (
            <span
              style={{
                width: "11px",
                height: "10px",
                position: "relative",
                display: "inline-block",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "8px",
                  height: "8px",
                  border: "1.5px solid currentColor",
                  boxSizing: "border-box",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  width: "8px",
                  height: "8px",
                  border: "1.5px solid currentColor",
                  boxSizing: "border-box",
                }}
              />
            </span>
          ) : (
            <span
              style={{
                width: "10px",
                height: "10px",
                border: "1.5px solid currentColor",
                boxSizing: "border-box",
                display: "block",
              }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={handleClose}
          title="Close"
          aria-label="Close window"
          style={buttonStyle(iconColor)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#e81123";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = iconColor;
          }}
        >
          <span
            style={{
              fontSize: "11px",
              lineHeight: 1,
              transform: "translateY(-0.5px)",
            }}
          >
            x
          </span>
        </button>
      </div>
    </>
  );
}

function getCurrentPathname(): string {
  if (typeof window === "undefined") {
    return "/";
  }

  try {
    const hash = window.location.hash;
    if (hash.startsWith("#/")) {
      const hashPath = hash.slice(1);
      return hashPath || "/";
    }

    return window.location.pathname || "/";
  } catch {
    return "/";
  }
}

const buttonStyle = (iconColor: string): CSSProperties => ({
  width: "46px",
  height: "38px",
  border: "none",
  outline: "none",
  background: "transparent",
  color: iconColor,
  cursor: "pointer",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 120ms ease",
});
