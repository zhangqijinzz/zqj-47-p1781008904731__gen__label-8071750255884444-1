import { useEffect, useState, useCallback } from "react"
import { useGreenhouseStore } from "@/store/greenhouse"
import type { OnboardingStep } from "@/store/greenhouse"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, Sparkles } from "lucide-react"

interface StepConfig {
  targetId: string
  title: string
  description: string
  highlightPadding?: number
  tooltipPosition: "top" | "bottom" | "left" | "right"
}

const STEP_CONFIG: Record<OnboardingStep, StepConfig> = {
  checkin: {
    targetId: "onboarding-checkin",
    title: "每日签到",
    description: "每天来这里签到，连续签到可以解锁更多植物哦！",
    highlightPadding: 6,
    tooltipPosition: "bottom",
  },
  planting: {
    targetId: "onboarding-planting",
    title: "种植植物",
    description: "点击这里开始种植你的第一株植物吧！",
    highlightPadding: 8,
    tooltipPosition: "top",
  },
  habits: {
    targetId: "onboarding-habits",
    title: "习惯打卡",
    description: "完成日常习惯可以给植物浇水，帮助它们茁壮成长～",
    highlightPadding: 4,
    tooltipPosition: "top",
  },
}

const STEP_ORDER: OnboardingStep[] = ["checkin", "planting", "habits"]

export default function OnboardingOverlay() {
  const { onboarding, advanceOnboarding, dismissOnboarding } = useGreenhouseStore()
  const currentStep = onboarding.currentStep
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)

  const updateHighlight = useCallback(() => {
    if (!currentStep) {
      setHighlightRect(null)
      return
    }
    const config = STEP_CONFIG[currentStep]
    const el = document.getElementById(config.targetId)
    if (el) {
      setHighlightRect(el.getBoundingClientRect())
    }
  }, [currentStep])

  useEffect(() => {
    updateHighlight()
    const timer = setTimeout(updateHighlight, 100)
    window.addEventListener("resize", updateHighlight)
    window.addEventListener("scroll", updateHighlight, true)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", updateHighlight)
      window.removeEventListener("scroll", updateHighlight, true)
    }
  }, [updateHighlight])

  useEffect(() => {
    if (!currentStep) return
    const config = STEP_CONFIG[currentStep]
    const el = document.getElementById(config.targetId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
    }
  }, [currentStep])

  if (!currentStep) return null

  const config = STEP_CONFIG[currentStep]
  const pad = config.highlightPadding ?? 4
  const stepIndex = STEP_ORDER.indexOf(currentStep)

  let tooltipStyle: React.CSSProperties = {}
  const arrowDir: "top" | "bottom" | "left" | "right" = config.tooltipPosition

  if (highlightRect) {
    switch (config.tooltipPosition) {
      case "top":
        tooltipStyle = {
          left: Math.max(16, Math.min(window.innerWidth - 320, highlightRect.left + highlightRect.width / 2 - 160)),
          top: Math.max(16, highlightRect.top - 180),
        }
        break
      case "bottom":
        tooltipStyle = {
          left: Math.max(16, Math.min(window.innerWidth - 320, highlightRect.left + highlightRect.width / 2 - 160)),
          top: Math.min(window.innerHeight - 180, highlightRect.bottom + 16),
        }
        break
      case "left":
        tooltipStyle = {
          left: Math.max(16, highlightRect.left - 336),
          top: Math.max(16, Math.min(window.innerHeight - 180, highlightRect.top + highlightRect.height / 2 - 90)),
        }
        break
      case "right":
        tooltipStyle = {
          left: Math.min(window.innerWidth - 336, highlightRect.right + 16),
          top: Math.max(16, Math.min(window.innerHeight - 180, highlightRect.top + highlightRect.height / 2 - 90)),
        }
        break
    }
  }

  const arrowStyle: React.CSSProperties = {}
  if (highlightRect) {
    const centerX = highlightRect.left + highlightRect.width / 2
    const centerY = highlightRect.top + highlightRect.height / 2
    switch (arrowDir) {
      case "top":
        arrowStyle.left = `calc(${tooltipStyle.left as number}px + ${centerX - (tooltipStyle.left as number)}px - 10px)`
        arrowStyle.top = "100%"
        break
      case "bottom":
        arrowStyle.left = `calc(${tooltipStyle.left as number}px + ${centerX - (tooltipStyle.left as number)}px - 10px)`
        arrowStyle.top = "-10px"
        break
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] pointer-events-none"
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: "none" }}
        >
          <defs>
            <mask id="onboarding-mask">
              <rect width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left - pad}
                  y={highlightRect.top - pad}
                  width={highlightRect.width + pad * 2}
                  height={highlightRect.height + pad * 2}
                  rx={16}
                  ry={16}
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.7)"
            mask="url(#onboarding-mask)"
          />
        </svg>

        {highlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute rounded-2xl border-2 border-green-400"
            style={{
              left: highlightRect.left - pad,
              top: highlightRect.top - pad,
              width: highlightRect.width + pad * 2,
              height: highlightRect.height + pad * 2,
              boxShadow: "0 0 0 4px rgba(74,124,89,0.2), 0 0 20px rgba(74,124,89,0.4)",
              animation: "pulse-highlight 2s ease-in-out infinite",
            }}
          />
        )}

        <div
          className="absolute z-10 pointer-events-auto"
          style={tooltipStyle}
        >
          {arrowDir === "bottom" && highlightRect && (
            <div
              className="absolute w-0 h-0"
              style={{
                left: `calc(50% - 10px)`,
                top: "-10px",
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderBottom: "10px solid #F5F0E8",
              }}
            />
          )}
          {arrowDir === "top" && highlightRect && (
            <div
              className="absolute w-0 h-0"
              style={{
                left: `calc(50% - 10px)`,
                bottom: "-10px",
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "10px solid #F5F0E8",
              }}
            />
          )}

          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-80 rounded-2xl p-5 pixel-border shadow-2xl"
            style={{ backgroundColor: "#F5F0E8" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <h3
                  className="text-lg"
                  style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive", color: "#4A7C59" }}
                >
                  {config.title}
                </h3>
              </div>
              <button
                onClick={dismissOnboarding}
                className="p-1 rounded-lg hover:bg-stone-200 transition-colors"
                title="跳过引导"
              >
                <X size={18} className="text-stone-400" />
              </button>
            </div>

            <p
              className="text-sm text-stone-600 mb-4 leading-relaxed"
              style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
            >
              {config.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEP_ORDER.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === stepIndex
                        ? "bg-green-600 w-4"
                        : i < stepIndex
                        ? "bg-green-300"
                        : "bg-stone-300"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={dismissOnboarding}
                  className="px-3 py-1.5 rounded-lg text-xs text-stone-500 hover:bg-stone-200 transition-colors"
                >
                  跳过
                </button>
                <button
                  onClick={() => {
                    if (stepIndex === STEP_ORDER.length - 1) {
                      dismissOnboarding()
                    } else {
                      advanceOnboarding()
                    }
                  }}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-white pixel-btn-primary hover:scale-105 active:scale-95 transition-all"
                  style={{ fontFamily: "'ZCOOL QingKe HuangYou', cursive" }}
                >
                  {stepIndex === STEP_ORDER.length - 1 ? "完成" : "下一步"}
                  {stepIndex < STEP_ORDER.length - 1 && <ChevronRight size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
