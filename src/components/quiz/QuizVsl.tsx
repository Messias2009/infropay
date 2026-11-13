import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";

/**
 * Player estilo VSL (video sales letter).
 *
 * * Arranca sozinho, em silêncio, sem controlos do navegador (sem download,
 *   sem velocidade, sem picture-in-picture) — a única coisa a fazer é ver.
 * * Barra de progresso própria, botão de som destacado e ecrã de "play"
 *   enquanto o vídeo não começa.
 * * O CTA (`children`) só aparece quando o vídeo termina ou quando passa o
 *   tempo configurado (`unlockAfter`). Há uma saída de segurança: se o vídeo
 *   falhar ou não carregar, desbloqueia ao fim de 20s para o funil nunca
 *   ficar preso.
 */

type Props = {
  src: string;
  poster?: string | null;
  caption?: string | null;
  accent: string;
  radius: number;
  autoplay?: boolean;
  unlockAfter?: number | null;
  /** Conteúdo revelado quando o vídeo desbloqueia (botão de continuar). */
  children?: React.ReactNode;
  onUnlocked?: () => void;
};

function fmtTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function QuizVsl({
  src,
  poster,
  caption,
  accent,
  radius,
  autoplay = true,
  unlockAfter,
  children,
  onUnlocked,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const unlockedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [buffering, setBuffering] = useState(false);

  const unlock = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    setUnlocked(true);
    onUnlocked?.();
  }, [onUnlocked]);

  // Desbloqueio por tempo (VSL curta) ou por fim do vídeo.
  useEffect(() => {
    if (!started || !unlockAfter) return;
    const timer = window.setTimeout(unlock, unlockAfter * 1000);
    return () => window.clearTimeout(timer);
  }, [started, unlockAfter, unlock]);

  // Rede de segurança: nunca deixar o visitante preso a um vídeo que falhou.
  useEffect(() => {
    if (!started) return;
    const timer = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.error) unlock();
    }, 20_000);
    return () => window.clearTimeout(timer);
  }, [started, unlock]);

  // Autoplay silencioso (permitido pelos navegadores); se for bloqueado,
  // o visitante vê o botão grande de play.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoplay) return;
    video.muted = true;
    const attempt = video.play();
    if (attempt?.catch) {
      attempt.catch(() => setStarted(false));
    }
  }, [autoplay, src]);

  function start() {
    const video = videoRef.current;
    if (!video) return;
    setStarted(true);
    video.muted = true;
    setMuted(true);
    void video.play().catch(() => setPlaying(false));
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted && video.paused) void video.play().catch(() => {});
  }

  const pct = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden bg-black shadow-2xl"
        style={{ borderRadius: radius, boxShadow: `0 24px 60px -20px ${accent}55` }}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster || undefined}
          playsInline
          preload="metadata"
          muted={muted}
          controls={false}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          onContextMenu={(event) => event.preventDefault()}
          className="w-full aspect-video object-cover"
          onPlay={() => {
            setPlaying(true);
            setStarted(true);
          }}
          onPause={() => setPlaying(false)}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            setCurrent(video.currentTime);
            if (!unlockedRef.current) {
              const limit = unlockAfter && unlockAfter > 0 ? unlockAfter : video.duration;
              if (limit && video.currentTime >= limit - 0.25) unlock();
            }
          }}
          onEnded={() => {
            setPlaying(false);
            unlock();
          }}
          onError={unlock}
        />

        {/* Chamada para começar */}
        {!started && (
          <button
            type="button"
            onClick={start}
            aria-label="Reproduzir vídeo"
            className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/80 via-black/40 to-black/30 transition hover:from-black/85"
          >
            <span
              className="grid h-20 w-20 place-items-center rounded-full shadow-2xl transition active:scale-95"
              style={{ background: accent }}
            >
              <Play className="ml-1 h-9 w-9 text-white" fill="currentColor" />
            </span>
          </button>
        )}

        {/* Etiqueta da VSL */}
        {caption && !unlocked && (
          <div className="pointer-events-none absolute left-3 top-3 max-w-[75%] rounded-full bg-black/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
            {caption}
          </div>
        )}

        {buffering && started && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/80" />
          </div>
        )}

        {/* Controlos mínimos: som (o mais importante numa VSL) e play/pause */}
        {started && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-8">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full transition-[width] duration-150"
                style={{ width: `${pct}%`, background: accent }}
              />
            </div>
            <div className="mt-2 flex items-center gap-3 text-white">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pausar" : "Reproduzir"}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/15 hover:bg-white/25"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Activar som" : "Silenciar"}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/15 hover:bg-white/25"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <span className="font-mono text-[11px] tabular-nums text-white/80">
                {fmtTime(current)} / {fmtTime(duration)}
              </span>
              {muted && (
                <span className="ml-auto rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                  Toque no som
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {children && (
        <div
          className={`grid overflow-hidden transition-all duration-500 ${
            unlocked ? "mt-4 max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
          aria-hidden={!unlocked}
        >
          <div className={unlocked ? "" : "pointer-events-none"}>{children}</div>
        </div>
      )}
    </div>
  );
}
