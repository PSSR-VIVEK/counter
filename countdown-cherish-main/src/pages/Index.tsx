import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
} from "lucide-react";

const PRESETS = [
  { label: "15m", h: 0, m: 15, s: 0 },
  { label: "30m", h: 0, m: 30, s: 0 },
  { label: "1h", h: 1, m: 0, s: 0 },
  { label: "2h", h: 2, m: 0, s: 0 },
  { label: "6h", h: 6, m: 0, s: 0 },
  { label: "12h", h: 12, m: 0, s: 0 },
  { label: "24h", h: 24, m: 0, s: 0 },
];

function useFullscreen(ref: React.RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggle = useCallback(() => {
    if (!ref.current) return;
    if (!document.fullscreenElement) {
      ref.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, [ref]);

  return { isFullscreen, toggle };
}

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(containerRef);

  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isSet, setIsSet] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Tick
  useEffect(() => {
    if (!isRunning || totalSeconds <= 0) {
      if (isRunning && totalSeconds <= 0) {
        setIsRunning(false);
        if (soundEnabled) playAlarm();
      }
      return;
    }
    const id = setInterval(() => setTotalSeconds((p) => p - 1), 1000);
    return () => clearInterval(id);
  }, [isRunning, totalSeconds, soundEnabled]);

  const handleStart = useCallback(() => {
    if (!isSet) {
      const t = hours * 3600 + minutes * 60 + seconds;
      if (t <= 0) return;
      setTotalSeconds(t);
      setInitialTotal(t);
      setIsSet(true);
    }
    setIsRunning(true);
  }, [isSet, hours, minutes, seconds]);

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setIsSet(false);
    setTotalSeconds(0);
    setInitialTotal(0);
    setHours(0);
    setMinutes(0);
    setSeconds(0);
  };

  const dH = Math.floor(totalSeconds / 3600);
  const dM = Math.floor((totalSeconds % 3600) / 60);
  const dS = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const isFinished = isSet && totalSeconds <= 0;
  const progress = initialTotal > 0 && isSet ? totalSeconds / initialTotal : 1;

  // Urgency color
  const urgency =
    !isSet || isFinished
      ? "normal"
      : totalSeconds <= 60
        ? "critical"
        : totalSeconds <= 300
          ? "warning"
          : "normal";

  const ringColor =
    urgency === "critical"
      ? "hsl(var(--destructive))"
      : urgency === "warning"
        ? "hsl(40, 95%, 55%)"
        : "hsl(var(--primary))";

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 select-none"
    >
      {/* Layered background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <Orb color="var(--glow-primary)" position="-top-40 -left-40" delay={0} />
      <Orb color="var(--glow-accent)" position="-bottom-40 -right-40" delay={2} />
      <Orb color="var(--glow-primary)" position="top-1/3 -right-20" delay={4} size="h-[400px] w-[400px]" />

      {/* Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 2 + (i % 3) * 2,
            height: 2 + (i % 3) * 2,
            left: `${8 + i * 7.5}%`,
            top: `${10 + ((i * 17) % 70)}%`,
            background: i % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--accent))",
          }}
          animate={{ y: [-15, 15, -15], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
        />
      ))}

      {/* Top bar */}
      <motion.div
        className="absolute top-4 right-4 z-20 flex items-center gap-2 sm:top-6 sm:right-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <IconButton onClick={() => setSoundEnabled(!soundEnabled)} tooltip={soundEnabled ? "Mute" : "Unmute"}>
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </IconButton>
        <IconButton onClick={toggleFullscreen} tooltip={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </IconButton>
      </motion.div>

      {/* Title */}
      <motion.div
        className="relative z-10 mb-16 text-center sm:mb-20"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground sm:text-xs">
          ⚡ Hackathon Countdown ⚡
        </p>
        <h1 className="font-display text-5xl font-black tracking-wider text-primary text-glow-primary sm:text-7xl lg:text-8xl">
          CREATHON
        </h1>
        <motion.h2
          className="font-display mt-2 text-2xl font-bold tracking-[0.25em] text-accent text-glow-accent sm:text-4xl lg:text-5xl"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          2K26
        </motion.h2>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-3xl">
        <AnimatePresence mode="wait">
          {!isSet ? (
            /* ─── INPUT MODE ─── */
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.45 }}
              className="glass rounded-[2rem] border border-border p-6 glow-primary sm:p-10"
            >
              <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground sm:text-sm">
                Set Your Timer
              </p>

              <div className="flex items-center justify-center gap-2 sm:gap-5">
                <Spinner label="Hours" value={hours} onChange={setHours} max={99} />
                <span className="font-display mb-8 text-3xl font-bold text-primary/60 sm:text-5xl">:</span>
                <Spinner label="Minutes" value={minutes} onChange={setMinutes} max={59} />
                <span className="font-display mb-8 text-3xl font-bold text-primary/60 sm:text-5xl">:</span>
                <Spinner label="Seconds" value={seconds} onChange={setSeconds} max={59} />
              </div>

              {/* Presets */}
              <div className="mt-6 flex flex-wrap justify-center gap-2 sm:mt-8">
                {PRESETS.map((p) => (
                  <motion.button
                    key={p.label}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => { setHours(p.h); setMinutes(p.m); setSeconds(p.s); }}
                    className="rounded-xl border border-border bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary sm:text-sm"
                  >
                    {p.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* ─── COUNTDOWN MODE ─── */
            <motion.div
              key="countdown"
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col items-center"
            >
              {/* Ring + digits */}
              <div className="relative flex items-center justify-center" style={{ width: 440, height: 440 }}>
                <svg
                  className="absolute inset-0 -rotate-90"
                  width="440"
                  height="440"
                  viewBox="0 0 440 440"
                  style={{ filter: `drop-shadow(0 0 12px ${ringColor})` }}
                >
                  <circle cx="220" cy="220" r="208" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                  <motion.circle
                    cx="220"
                    cy="220"
                    r="208"
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 208}
                    animate={{ strokeDashoffset: 2 * Math.PI * 208 * (1 - progress) }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </svg>

                <div className="relative flex flex-col items-center justify-center">
                  {isFinished ? (
                    <motion.div
                      className="text-center"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                    >
                      <motion.p
                        className="font-display text-4xl font-black text-destructive sm:text-5xl"
                        animate={{ scale: [1, 1.05, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        TIME'S UP!
                      </motion.p>
                      <p className="mt-3 text-base text-muted-foreground">🎉 Great work, hackers!</p>
                    </motion.div>
                  ) : (
                    <div className="flex items-end gap-4 sm:gap-6">
                      <Digit value={pad(dH)} label="HRS" urgency={urgency} />
                      <Colon urgency={urgency} />
                      <Digit value={pad(dM)} label="MIN" urgency={urgency} />
                      <Colon urgency={urgency} />
                      <Digit value={pad(dS)} label="SEC" urgency={urgency} />
                    </div>
                  )}
                </div>
              </div>

              {/* Urgency bar */}
              {!isFinished && (
                <motion.div
                  className="mt-8 h-1.5 w-64 overflow-hidden rounded-full bg-muted sm:w-80"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: ringColor }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <motion.div
          className="mt-14 flex flex-wrap justify-center gap-4 sm:gap-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          {!isRunning ? (
            <GlowButton
              onClick={handleStart}
              disabled={isFinished}
              color="primary"
              icon={<Play className="h-5 w-5 sm:h-6 sm:w-6" />}
              label={isSet ? "Resume" : "Start"}
            />
          ) : (
            <GlowButton
              onClick={handlePause}
              color="accent"
              icon={<Pause className="h-5 w-5 sm:h-6 sm:w-6" />}
              label="Pause"
            />
          )}
          <GlowButton
            onClick={handleReset}
            color="destructive"
            icon={<RotateCcw className="h-5 w-5 transition-transform group-hover:-rotate-180 duration-500 sm:h-6 sm:w-6" />}
            label="Reset"
          />
          <GlowButton
            onClick={toggleFullscreen}
            color="muted"
            icon={isFullscreen ? <Minimize className="h-5 w-5 sm:h-6 sm:w-6" /> : <Maximize className="h-5 w-5 sm:h-6 sm:w-6" />}
            label={isFullscreen ? "Exit FS" : "Fullscreen"}
          />
        </motion.div>
      </div>

      {/* Footer tagline */}
      <motion.p
        className="relative z-10 mt-14 text-[10px] font-bold uppercase tracking-[0.35em] text-muted-foreground/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        Build · Innovate · Create
      </motion.p>
    </div>
  );
};

/* ─── SUB-COMPONENTS ─── */

function Orb({ color, position, delay, size = "h-[550px] w-[550px]" }: { color: string; position: string; delay: number; size?: string }) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${size} ${position} rounded-full blur-[160px]`}
      style={{ background: `hsl(${color})` }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.28, 0.12] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function IconButton({ onClick, tooltip, children }: { onClick: () => void; tooltip: string; children: React.ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      title={tooltip}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-primary"
    >
      {children}
    </motion.button>
  );
}

function Spinner({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) {
  const inc = () => onChange(Math.min(value + 1, max));
  const dec = () => onChange(Math.max(value - 1, 0));

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        whileHover={{ scale: 1.2, y: -2 }}
        whileTap={{ scale: 0.85 }}
        onClick={inc}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/15 hover:text-primary hover:shadow-[0_0_12px_hsl(var(--glow-primary)/0.2)]"
      >
        <ChevronUp className="h-5 w-5" />
      </motion.button>

      <motion.div
        className="font-display relative flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-border bg-background/80 text-3xl font-black text-foreground sm:h-[88px] sm:w-[88px] sm:text-4xl"
        whileHover={{ borderColor: "hsl(var(--primary))", boxShadow: "0 0 20px hsl(var(--glow-primary) / 0.15)" }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -20, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: 20, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.2 }}
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.2, y: 2 }}
        whileTap={{ scale: 0.85 }}
        onClick={dec}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/15 hover:text-primary hover:shadow-[0_0_12px_hsl(var(--glow-primary)/0.2)]"
      >
        <ChevronDown className="h-5 w-5" />
      </motion.button>

      <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
    </div>
  );
}

function Digit({ value, label, urgency }: { value: string; label: string; urgency: string }) {
  const color =
    urgency === "critical"
      ? "text-destructive"
      : urgency === "warning"
        ? "text-yellow-400"
        : "text-foreground";

  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial={{ y: -18, opacity: 0, scale: 0.8, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ y: 18, opacity: 0, scale: 0.8, filter: "blur(6px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`font-display text-7xl font-black sm:text-8xl lg:text-9xl ${color}`}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      <span className="mt-2 text-xs font-bold tracking-[0.25em] text-muted-foreground sm:text-sm">{label}</span>
    </div>
  );
}

function Colon({ urgency }: { urgency: string }) {
  const color =
    urgency === "critical"
      ? "text-destructive"
      : urgency === "warning"
        ? "text-yellow-400"
        : "text-primary";

  return (
    <motion.span
      className={`font-display mb-8 text-5xl font-bold sm:text-7xl lg:text-8xl ${color}`}
      animate={{ opacity: [1, 0.2, 1] }}
      transition={{ duration: 1, repeat: Infinity }}
    >
      :
    </motion.span>
  );
}

function GlowButton({
  onClick,
  disabled,
  color,
  icon,
  label,
}: {
  onClick: () => void;
  disabled?: boolean;
  color: "primary" | "accent" | "destructive" | "muted";
  icon: React.ReactNode;
  label: string;
}) {
  const styles: Record<string, string> = {
    primary:
      "bg-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(var(--glow-primary)/0.4)]",
    accent:
      "border border-accent/40 bg-accent/15 text-accent hover:bg-accent/25 hover:shadow-[0_0_25px_hsl(var(--glow-accent)/0.3)]",
    destructive:
      "border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:shadow-[0_0_25px_hsl(0_80%_55%/0.3)]",
    muted:
      "border border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-primary hover:shadow-[0_0_20px_hsl(var(--glow-primary)/0.15)]",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-base font-bold transition-all sm:px-8 sm:py-4 sm:text-lg disabled:cursor-not-allowed disabled:opacity-30 ${styles[color]}`}
    >
      {icon}
      {label}
    </motion.button>
  );
}

/* ─── ALARM SOUND (Web Audio API) ─── */
function playAlarm() {
  try {
    const ctx = new AudioContext();
    const playBeep = (time: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
      osc.start(time);
      osc.stop(time + 0.3);
    };
    for (let i = 0; i < 3; i++) {
      playBeep(ctx.currentTime + i * 0.4, 880);
      playBeep(ctx.currentTime + i * 0.4 + 0.15, 1100);
    }
  } catch {
    // Audio not available
  }
}

export default Index;
