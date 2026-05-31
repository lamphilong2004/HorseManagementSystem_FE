"use client";
import { Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

interface LiquidMetalButtonProps {
  label?: string;
  onClick?: () => void;
  viewMode?: "text" | "icon";
  className?: string;
  width?: number;
}

export function LiquidMetalButton({
  label = "Get Started",
  onClick,
  viewMode = "text",
  className = "",
  width,
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<
    Array<{ x: number; y: number; id: number }>
  >([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);
  const shaderRef = useRef<HTMLDivElement>(null);
  const shaderMount = useRef<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [actualWidth, setActualWidth] = useState(0);

  const dimensions = useMemo(() => {
    if (viewMode === "icon") {
      return {
        width: 46,
        height: 46,
        innerWidth: 42,
        innerHeight: 42,
        shaderWidth: 46,
        shaderHeight: 46,
      };
    } else {
      const w = width || 180;
      return {
        width: w,
        height: 46,
        innerWidth: w - 4,
        innerHeight: 42,
        shaderWidth: w,
        shaderHeight: 46,
      };
    }
  }, [viewMode, width]);

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shaderRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setActualWidth(entry.contentRect.width);
      }
    });

    observer.observe(shaderRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const styleId = "shader-canvas-style-exploded";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .shader-container-exploded canvas {
          display: none !important;
        }
        @keyframes ripple-animation {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
        @keyframes rainbow-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `;
      document.head.appendChild(style);
    }

    const loadShader = async () => {
      if (actualWidth === 0) return;
      try {
        const { liquidMetalFragmentShader, ShaderMount } = await import(
          "@paper-design/shaders"
        );
        if (shaderRef.current) {
          if (shaderMount.current?.dispose) {
            shaderMount.current.dispose();
          }
          shaderMount.current = new ShaderMount(
            shaderRef.current,
            liquidMetalFragmentShader,
            {
              u_repetition: 4,
              u_softness: 0.5,
              u_shiftRed: 0.3,
              u_shiftBlue: 0.3,
              u_distortion: 0,
              u_contour: 0,
              u_angle: 45,
              u_scale: 8,
              u_shape: 1,
              u_offsetX: 0.1,
              u_offsetY: -0.1,
            },
            undefined,
            0.6,
          );
        }
      } catch (error) {
        console.error("[v0] Failed to load shader:", error);
      }
    };

    loadShader();

    return () => {
      if (shaderMount.current?.dispose) {
        shaderMount.current.dispose();
        shaderMount.current = null;
      }
    };
  }, [actualWidth]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    shaderMount.current?.setSpeed?.(1);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    shaderMount.current?.setSpeed?.(0.6);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.4);
      setTimeout(() => {
        if (isHovered) {
          shaderMount.current?.setSpeed?.(1);
        } else {
          shaderMount.current?.setSpeed?.(0.6);
        }
      }, 300);
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = { x, y, id: rippleId.current++ };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    }
    onClick?.();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        style={{
          perspective: "1000px",
          perspectiveOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "relative",
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            transformStyle: "preserve-3d",
            transition:
              "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
            transform: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, gap 0.4s ease",
              transform: "translateZ(20px)",
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            {viewMode === "icon" && (
              <Sparkles
                size={16}
                style={{
                  color: isDarkMode ? "#ffffff" : "#1e293b",
                  filter: isDarkMode ? "drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.5))" : "none",
                  transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: "scale(1)",
                }}
              />
            )}
            {viewMode === "text" && (
              <span
                className="font-bold tracking-wider"
                style={{
                  fontSize: "13px",
                  color: isDarkMode ? "#ffffff" : "#1e293b",
                  textShadow: isDarkMode ? "0px 1px 3px rgba(0, 0, 0, 0.8)" : "none",
                  transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: "scale(1)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            )}
          </div>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              transform: `translateZ(10px) ${
                isPressed
                  ? "translateY(1px) scale(0.98)"
                  : "translateY(0) scale(1)"
              }`,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: `${dimensions.innerWidth}px`,
                height: `${dimensions.innerHeight}px`,
                margin: "2px",
                borderRadius: "100px",
                background: isDarkMode
                  ? "linear-gradient(180deg, #374151 0%, #111827 100%)"
                  : "#ffffff",
                boxShadow: isPressed
                  ? (isDarkMode
                      ? "inset 0px 2px 4px rgba(0, 0, 0, 0.4), inset 0px 1px 2px rgba(0, 0, 0, 0.3)"
                      : "inset 0px 2px 4px rgba(0, 0, 0, 0.1), inset 0px 1px 2px rgba(0, 0, 0, 0.05)")
                  : "none",
                transition:
                  "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: "preserve-3d",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              transform: `translateZ(0px) ${
                isPressed
                  ? "translateY(1px) scale(0.98)"
                  : "translateY(0) scale(1)"
              }`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                height: `${dimensions.height}px`,
                width: `${dimensions.width}px`,
                borderRadius: "100px",
                boxShadow: isDarkMode
                  ? (isPressed
                      ? "0px 0px 0px 1px rgba(255, 255, 255, 0.2), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)"
                      : isHovered
                        ? "0px 0px 0px 1px rgba(255, 255, 255, 0.3), 0px 12px 6px 0px rgba(0, 0, 0, 0.3), 0px 8px 5px 0px rgba(0, 0, 0, 0.4)"
                        : "0px 0px 0px 1px rgba(255, 255, 255, 0.1), 0px 2px 5px 0px rgba(0, 0, 0, 0.5)")
                  : (isPressed
                      ? "0px 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 1px 2px 0px rgba(0, 0, 0, 0.1)"
                      : isHovered
                        ? "0px 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 8px 16px 0px rgba(0, 0, 0, 0.1), 0px 4px 6px 0px rgba(0, 0, 0, 0.05)"
                        : "0px 0px 0px 1px rgba(0, 0, 0, 0.05), 0px 2px 4px 0px rgba(0, 0, 0, 0.05)"),
                transition:
                  "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease, box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                background: "rgb(0 0 0 / 0)",
              }}
            >
              <div
                ref={shaderRef}
                className="shader-container-exploded"
                style={{
                  borderRadius: "100px",
                  overflow: "hidden",
                  position: "relative",
                  width: `${dimensions.shaderWidth}px`,
                  maxWidth: `${dimensions.shaderWidth}px`,
                  height: `${dimensions.shaderHeight}px`,
                  transition: "width 0.4s ease, height 0.4s ease",
                }}
              >
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: `${dimensions.width * 1.5}px`,
                    height: `${dimensions.width * 1.5}px`,
                    top: `calc(50% - ${dimensions.width * 0.75}px)`,
                    left: `calc(50% - ${dimensions.width * 0.75}px)`,
                    background: "conic-gradient(from 0deg, #ff4b4b, #ff9d4b, #ffe24b, #52ff4b, #4be5ff, #654bff, #ff4be5, #ff4b4b)",
                    animation: "rainbow-spin 4s linear infinite",
                    transformOrigin: "center",
                    zIndex: 5,
                  }}
                />
              </div>
            </div>
          </div>
          <button
            ref={buttonRef}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              outline: "none",
              zIndex: 40,
              transformStyle: "preserve-3d",
              transform: "translateZ(25px)",
              transition:
                "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.4s ease, height 0.4s ease",
              overflow: "hidden",
              borderRadius: "100px",
            }}
            aria-label={label}
          >
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: "absolute",
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: isDarkMode
                    ? "radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 70%)"
                    : "radial-gradient(circle, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0) 70%)",
                  pointerEvents: "none",
                  animation: "ripple-animation 0.6s ease-out",
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}
