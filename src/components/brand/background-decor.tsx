/**
 * Lapisan dekorasi global (tetap di belakang seluruh konten):
 * blob gradien yang bergerak perlahan + tekstur grain halus.
 * Dirender sekali di RootLayout sehingga berlaku di semua halaman.
 */
export function BackgroundDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-sage-300/30 blur-3xl animate-blob-drift" />
      <div className="absolute -top-20 right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-terracotta-200/40 blur-3xl animate-blob-drift animation-delay-4000" />
      <div className="absolute bottom-[-10rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-amberwarm-light/70 blur-3xl animate-blob-drift animation-delay-2000" />
      <div className="absolute bottom-[-6rem] right-[-6rem] h-[22rem] w-[22rem] rounded-full bg-sage-200/40 blur-3xl animate-blob-drift animation-delay-6000" />
      <div className="grain-overlay absolute inset-0" />
    </div>
  );
}
