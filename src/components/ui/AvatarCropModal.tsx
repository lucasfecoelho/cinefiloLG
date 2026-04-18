'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { ZoomIn, ZoomOut } from 'lucide-react';

import { Modal }  from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

// ─── Constants ────────────────────────────────────────────────────────────────

const CROP_SIZE   = 260;   // px — visual preview circle diameter
const OUTPUT_SIZE = 256;   // px — canvas export (square JPEG)
const QUALITY     = 0.88;
const MIN_ZOOM    = 1;
const MAX_ZOOM    = 4;
const ZOOM_STEP   = 0.1;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pos { x: number; y: number }

export interface AvatarCropModalProps {
  /** Object URL of the original file — caller owns revocation */
  objectUrl: string | null;
  visible:   boolean;
  onConfirm: (blob: Blob) => void;
  onCancel:  () => void;
}

// ─── AvatarCropModal ──────────────────────────────────────────────────────────

export function AvatarCropModal({
  objectUrl,
  visible,
  onConfirm,
  onCancel,
}: AvatarCropModalProps) {
  const imgRef       = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [naturalW, setNaturalW]   = useState(0);
  const [naturalH, setNaturalH]   = useState(0);
  const [scale,    setScale]      = useState(1);
  const [pos,      setPos]        = useState<Pos>({ x: 0, y: 0 });
  const [loaded,   setLoaded]     = useState(false);
  const [exporting, setExporting] = useState(false);

  // Drag state (refs to avoid stale closures in event listeners)
  const dragging    = useRef(false);
  const dragStart   = useRef<Pos>({ x: 0, y: 0 });
  const posAtDrag   = useRef<Pos>({ x: 0, y: 0 });

  // Pinch state
  const pinchDist   = useRef<number | null>(null);
  const scaleAtPinch = useRef(1);

  // ── Derived ────────────────────────────────────────────────────────────────

  const minScale = loaded
    ? CROP_SIZE / Math.min(naturalW, naturalH)
    : 1;

  const clampPos = useCallback(
    (p: Pos, s: number): Pos => {
      if (!loaded) return p;
      const maxX = (naturalW * s - CROP_SIZE) / 2;
      const maxY = (naturalH * s - CROP_SIZE) / 2;
      return {
        x: Math.max(-maxX, Math.min(maxX, p.x)),
        y: Math.max(-maxY, Math.min(maxY, p.y)),
      };
    },
    [loaded, naturalW, naturalH],
  );

  const clampScale = useCallback(
    (s: number) => Math.max(minScale, Math.min(MAX_ZOOM, s)),
    [minScale],
  );

  // ── Image load ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!objectUrl || !visible) return;
    setLoaded(false);
    setPos({ x: 0, y: 0 });
    const img = new window.Image();
    img.onload = () => {
      setNaturalW(img.naturalWidth);
      setNaturalH(img.naturalHeight);
      const initialScale = CROP_SIZE / Math.min(img.naturalWidth, img.naturalHeight);
      setScale(initialScale);
      setPos({ x: 0, y: 0 });
      imgRef.current = img;
      setLoaded(true);
    };
    img.src = objectUrl;
    return () => { imgRef.current = null; };
  }, [objectUrl, visible]);

  // ── Mouse drag ─────────────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current  = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posAtDrag.current = pos;
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPos((p) => {
        const next = { x: posAtDrag.current.x + dx, y: posAtDrag.current.y + dy };
        return clampPos(next, scale);
      });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [scale, clampPos]);

  // ── Non-passive touch (drag + pinch) ───────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        dragging.current  = true;
        dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        posAtDrag.current = { x: 0, y: 0 }; // snapshot via pos ref below
      }
      if (e.touches.length === 2) {
        dragging.current = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchDist.current  = Math.hypot(dx, dy);
        scaleAtPinch.current = scale;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && dragging.current) {
        const dx = e.touches[0].clientX - dragStart.current.x;
        const dy = e.touches[0].clientY - dragStart.current.y;
        setPos((p) => {
          if (posAtDrag.current.x === 0 && posAtDrag.current.y === 0) {
            posAtDrag.current = p;
          }
          const next = { x: posAtDrag.current.x + dx, y: posAtDrag.current.y + dy };
          return clampPos(next, scale);
        });
      }
      if (e.touches.length === 2 && pinchDist.current !== null) {
        const dx   = e.touches[0].clientX - e.touches[1].clientX;
        const dy   = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const next = clampScale(scaleAtPinch.current * (dist / pinchDist.current));
        setScale(next);
        setPos((p) => clampPos(p, next));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchDist.current = null;
      if (e.touches.length === 0) dragging.current = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false });
    el.addEventListener('touchend',   onTouchEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, [scale, clampPos, clampScale]);

  // ── Wheel zoom ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setScale((s) => {
        const next = clampScale(s + delta * s);
        setPos((p) => clampPos(p, next));
        return next;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [clampPos, clampScale]);

  // ── Zoom helpers ──────────────────────────────────────────────────────────

  const adjustScale = (factor: number) => {
    setScale((s) => {
      const next = clampScale(s * factor);
      setPos((p) => clampPos(p, next));
      return next;
    });
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = clampScale(Number(e.target.value));
    setScale(next);
    setPos((p) => clampPos(p, next));
  };

  // ── Export ────────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!imgRef.current || !loaded) return;
    setExporting(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width  = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas 2d unavailable');

      const srcW = CROP_SIZE / scale;
      const srcH = CROP_SIZE / scale;
      const srcX = (naturalW - srcW) / 2 - pos.x / scale;
      const srcY = (naturalH - srcH) / 2 - pos.y / scale;

      ctx.drawImage(
        imgRef.current,
        srcX, srcY, srcW, srcH,
        0, 0, OUTPUT_SIZE, OUTPUT_SIZE,
      );

      canvas.toBlob(
        (blob) => {
          if (blob) onConfirm(blob);
          setExporting(false);
        },
        'image/jpeg',
        QUALITY,
      );
    } catch {
      setExporting(false);
    }
  };

  // ── Slider percentage ─────────────────────────────────────────────────────

  const zoomPct = loaded
    ? ((scale - minScale) / (MAX_ZOOM - minScale)) * 100
    : 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} onClose={onCancel} title="Ajustar foto">
      <div className="flex flex-col items-center gap-5 px-5 pb-6 pt-2">

        {/* ── Circular preview ──────────────────────────────────────────── */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          className="relative overflow-hidden rounded-full bg-[#2A2A2A] shrink-0 select-none touch-none cursor-grab active:cursor-grabbing"
          style={{ width: CROP_SIZE, height: CROP_SIZE }}
          aria-label="Arrastar para reposicionar"
        >
          {/* Outer ring */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full z-10"
            style={{ boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.12)' }}
          />

          {objectUrl && loaded && (
            <m.img
              src={objectUrl}
              alt=""
              aria-hidden="true"
              draggable={false}
              style={{
                position:  'absolute',
                width:     naturalW * scale,
                height:    naturalH * scale,
                left:      (CROP_SIZE - naturalW * scale) / 2 + pos.x,
                top:       (CROP_SIZE - naturalH * scale) / 2 + pos.y,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          )}

          {!loaded && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-[#6B7280] border-t-transparent rounded-full animate-spin" />
            </span>
          )}
        </div>

        <p className="text-xs text-[#6B7280] text-center -mt-2">
          Arraste para reposicionar · pinça para zoom
        </p>

        {/* ── Zoom controls ─────────────────────────────────────────────── */}
        <div className="w-full flex items-center gap-3">
          <button
            type="button"
            aria-label="Diminuir zoom"
            onClick={() => adjustScale(1 - ZOOM_STEP)}
            className="shrink-0 text-[#9CA3AF] hover:text-[#F5F5F5] transition-colors"
          >
            <ZoomOut size={18} aria-hidden="true" />
          </button>

          <input
            type="range"
            min={loaded ? minScale : MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={scale}
            onChange={handleSlider}
            className="flex-1 h-1 rounded-full appearance-none bg-[#2A2A2A] accent-(--color-primary)"
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${zoomPct}%, #2A2A2A ${zoomPct}%)`,
            }}
          />

          <button
            type="button"
            aria-label="Aumentar zoom"
            onClick={() => adjustScale(1 + ZOOM_STEP)}
            className="shrink-0 text-[#9CA3AF] hover:text-[#F5F5F5] transition-colors"
          >
            <ZoomIn size={18} aria-hidden="true" />
          </button>
        </div>

        {/* ── Buttons ───────────────────────────────────────────────────── */}
        <div className="w-full flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleConfirm}
            loading={exporting}
            disabled={!loaded}
          >
            Usar esta foto
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={onCancel}
            disabled={exporting}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
