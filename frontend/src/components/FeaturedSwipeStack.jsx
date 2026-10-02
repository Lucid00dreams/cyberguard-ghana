import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Flame,
  ArrowRight,
  Loader2,
  Settings,
} from "lucide-react";

/**
 * FeaturedSwipeStack
 * React Bits inspired interactive swipe-away card stack for the Extentions Store.
 * Supports:
 * - Touch & mouse drag to swipe cards away
 * - Auto-swipe timer with smooth progress indicator & pause-on-hover
 * - Click-to-swipe buttons (Previous / Next / Swipe)
 * - Layered 3D card depth with Framer Motion spring physics
 */
export default function FeaturedSwipeStack({
  items,
  extensions,
  installed,
  installingId,
  toggleInstall,
  onOpenManage,
  ExtensionLogo,
}) {
  const [cards, setCards] = useState(items);
  const [isHovered, setIsHovered] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(1);
  const [swipingId, setSwipingId] = useState(null);
  const [progress, setProgress] = useState(0);

  const AUTO_SWIPE_MS = 5000;
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Sync cards if items prop changes
  useEffect(() => {
    setCards(items);
  }, [items]);

  // Handle Swipe Away logic
  const handleSwipeAway = (direction = 1) => {
    if (swipingId) return; // Prevent double trigger
    setSwipeDirection(direction);
    setSwipingId(cards[0].id);

    // After animation duration, cycle the top card to the back
    setTimeout(() => {
      setCards((prev) => {
        const next = [...prev];
        const top = next.shift();
        next.push(top);
        return next;
      });
      setSwipingId(null);
      setProgress(0);
    }, 280);
  };

  const handleSwipeBack = () => {
    if (swipingId) return;
    setSwipeDirection(-1);
    setCards((prev) => {
      const next = [...prev];
      const last = next.pop();
      next.unshift(last);
      return next;
    });
    setProgress(0);
  };

  // Jump to specific card
  const jumpToCard = (targetId) => {
    if (swipingId || cards[0].id === targetId) return;
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === targetId);
      if (idx === -1) return prev;
      return [...prev.slice(idx), ...prev.slice(0, idx)];
    });
    setProgress(0);
  };

  // Auto-swipe timer & progress tick
  useEffect(() => {
    if (isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const intervalStep = 50; // Update progress bar smoothly
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (intervalStep / AUTO_SWIPE_MS) * 100;
        return next >= 100 ? 100 : next;
      });
    }, intervalStep);

    timerRef.current = setTimeout(() => {
      handleSwipeAway(1);
    }, AUTO_SWIPE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [cards, isHovered, swipingId]);

  return (
    <div
      className="space-y-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Featured Highlights
          </h2>
          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
            • Drag or click to swipe away
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress Pill */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full text-[11px] font-mono text-slate-500">
            <span>Auto-Swipe</span>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0056D2] transition-all duration-75 ease-linear rounded-full"
                style={{ width: `${isHovered ? 100 : progress}%` }}
              />
            </div>
          </div>

          {/* Quick Arrow Controls */}
          <button
            onClick={handleSwipeBack}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center transition cursor-pointer shadow-2xs"
            title="Previous highlight"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleSwipeAway(1)}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 flex items-center justify-center transition cursor-pointer shadow-2xs"
            title="Next highlight (swipe away)"
            aria-label="Next card"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Swipe Away Action Button */}
          <button
            onClick={() => handleSwipeAway(1)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0056D2] text-xs font-bold transition cursor-pointer border border-blue-200/60"
          >
            <span>Swipe</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Swipe Stage */}
      <div className="relative h-[250px] sm:h-[230px] w-full max-w-4xl mx-auto select-none pt-2">
        <AnimatePresence mode="popLayout">
          {cards.slice(0, 3).map((item, index) => {
            const isFront = index === 0;
            const fullExt = extensions.find((e) => e.id === item.id);
            const isInst = installed.includes(item.id);
            const isLeaving = isFront && swipingId === item.id;

            // React Bits layered depth calculation
            const depthScale = 1 - index * 0.05;
            const depthY = index * 12;
            const depthOpacity = 1 - index * 0.22;
            const depthZ = 30 - index * 10;

            return (
              <motion.div
                key={item.id}
                layout
                initial={false}
                animate={
                  isLeaving
                    ? {
                        x: swipeDirection * 480,
                        rotate: swipeDirection * 22,
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.28, ease: "easeOut" },
                      }
                    : {
                        x: 0,
                        y: depthY,
                        scale: depthScale,
                        opacity: depthOpacity,
                        rotate: 0,
                        zIndex: depthZ,
                        transition: {
                          type: "spring",
                          stiffness: 320,
                          damping: 26,
                        },
                      }
                }
                drag={isFront ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragEnd={(e, info) => {
                  if (Math.abs(info.offset.x) > 75 || Math.abs(info.velocity.x) > 300) {
                    handleSwipeAway(info.offset.x > 0 ? 1 : -1);
                  }
                }}
                className={`absolute inset-x-0 mx-auto rounded-3xl p-5 sm:p-6 text-white bg-gradient-to-br ${
                  item.gradient || "from-[#0056D2] to-blue-800"
                } shadow-xl border border-white/20 flex flex-col justify-between cursor-${
                  isFront ? "grab active:cursor-grabbing" : "default"
                }`}
                style={{
                  touchAction: "pan-y",
                  transformOrigin: "bottom center",
                }}
              >
                {/* Card Top Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black tracking-wider text-blue-200 uppercase px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-xs">
                      {item.tagline}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                      <Flame className="w-2.5 h-2.5 fill-current" />
                      {item.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-0.5 bg-black/20 px-2 py-0.5 rounded-md">
                      <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      {fullExt?.rating || "4.9"}
                    </span>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="flex items-center gap-4 py-2">
                  <div className="shrink-0 p-1.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 shadow-inner">
                    {fullExt && <ExtensionLogo ext={fullExt} size="lg" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h3 className="font-black text-white text-lg sm:text-xl tracking-tight">
                        {item.title}
                      </h3>
                      <span className="text-xs text-blue-200 font-medium truncate">
                        • {item.subtitle}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed line-clamp-2 mt-1">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-blue-200 font-mono">
                      <span>{fullExt?.installs || "1M+"} users</span>
                      <span>•</span>
                      <span className="capitalize">{fullExt?.category || "Tools"}</span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-white/15">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-blue-200">
                    <span className="hidden sm:inline text-blue-300">
                      ← Swipe away card to see next →
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isInst && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fullExt) onOpenManage(fullExt);
                        }}
                        className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-white/20"
                        title="Manage Extension Controls"
                        aria-label="Manage Extension"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Settings</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isInst) {
                          if (fullExt) onOpenManage(fullExt);
                        } else {
                          toggleInstall(item.id);
                        }
                      }}
                      disabled={installingId === item.id}
                      className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md ${
                        installingId === item.id
                          ? "bg-white/80 text-[#0056D2] cursor-wait"
                          : isInst
                          ? "bg-emerald-500 text-white hover:bg-emerald-600 border border-emerald-400"
                          : "bg-white text-[#0056D2] hover:bg-blue-50"
                      }`}
                    >
                      {installingId === item.id ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Installing...
                        </span>
                      ) : isInst ? (
                        <span className="inline-flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Installed
                        </span>
                      ) : (
                        "GET"
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {items.map((item, idx) => {
          const isActive = cards[0].id === item.id;
          return (
            <button
              key={item.id}
              onClick={() => jumpToCard(item.id)}
              className={`transition-all duration-300 cursor-pointer rounded-full ${
                isActive
                  ? "w-7 h-2 bg-[#0056D2]"
                  : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
              }`}
              title={`Jump to ${item.title}`}
              aria-label={`Slide to ${item.title}`}
            />
          );
        })}
      </div>
    </div>
  );
}
