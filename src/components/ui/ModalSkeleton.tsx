// ─── ModalSkeleton ────────────────────────────────────────────────────────────
// Lightweight placeholder shown while a dynamically-imported modal chunk loads.

export function ModalSkeleton() {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      aria-hidden="true"
    >
      <div className="w-full max-w-[90vw] bg-[#1A1A1A] rounded-2xl overflow-hidden">
        {/* Poster placeholder */}
        <div className="skeleton-shimmer h-52 w-full" />
        {/* Content rows */}
        <div className="p-5 flex flex-col gap-3">
          <div className="skeleton-shimmer h-5 w-2/3 rounded-md" />
          <div className="skeleton-shimmer h-4 w-1/3 rounded-md" />
          <div className="skeleton-shimmer h-16 w-full rounded-xl" />
          <div className="skeleton-shimmer h-12 w-full rounded-xl mt-2" />
        </div>
      </div>
    </div>
  );
}
