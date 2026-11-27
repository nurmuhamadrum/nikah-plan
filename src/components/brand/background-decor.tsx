/**
 * Latar global ultra-bersih tanpa glowing orb atau blob dekoratif.
 */
export function BackgroundDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="grain-overlay absolute inset-0 opacity-[0.025]" />
    </div>
  );
}
