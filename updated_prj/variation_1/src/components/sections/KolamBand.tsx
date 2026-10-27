import { Kolam } from "@/components/ui/Kolam";

export function KolamBand() {
  return (
    <section className="section">
      <div className="container-x">
        <div className="relative grid min-h-[340px] place-items-center overflow-hidden rounded-2xl border border-line bg-bg-2/50">
          <Kolam className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-2/80 via-transparent to-bg-2/40" />
          <div className="relative z-10 max-w-xl px-6 text-center">
            <span className="eyebrow">Kolam of Consent</span>
            <p className="mt-4 font-display text-2xl font-semibold leading-snug text-text text-balance sm:text-3xl">
              Like a kolam drawn fresh each dawn, consent is given freely,
              renewed by choice - and never assumed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
