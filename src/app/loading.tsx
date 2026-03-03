const skeletonArray = Array.from({ length: 6 });

export default function Loading() {
  return (
    <div className="space-y-12" aria-busy="true" aria-live="polite">
      <section className="rounded-[32px] border border-white/10 bg-slate-950/60 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="h-6 w-40 rounded-full bg-white/10" />
            <div className="h-12 w-72 rounded-full bg-white/10" />
            <div className="h-4 w-96 max-w-full rounded-full bg-white/5" />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="h-11 w-40 rounded-full bg-white/10" />
            <div className="h-11 w-40 rounded-full bg-white/5" />
          </div>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="h-4 w-32 rounded-full bg-white/10" />
              <div className="mt-3 h-6 w-24 rounded-full bg-white/10" />
              <div className="mt-2 h-3 w-full rounded-full bg-white/5" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {skeletonArray.map((_, index) => (
          <div key={index} className="rounded-3xl border border-white/10 bg-slate-950/50 p-6">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded-full bg-white/10" />
              <div className="h-5 w-5 rounded-full bg-white/10" />
            </div>
            <div className="mt-6 flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-white/10" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-32 rounded-full bg-white/10" />
                <div className="h-3 w-28 rounded-full bg-white/5" />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <div className="h-3 w-full rounded-full bg-white/5" />
              <div className="h-3 w-4/5 rounded-full bg-white/5" />
            </div>
            <div className="mt-6 h-3 w-24 rounded-full bg-white/10" />
          </div>
        ))}
      </section>
    </div>
  );
}
