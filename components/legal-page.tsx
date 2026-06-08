import Link from "next/link";

type LegalPageProps = {
  title: string;
  updatedAt: string;
  intro: string;
  sections: {
    title: string;
    body: string[];
  }[];
};

export function LegalPage({ title, updatedAt, intro, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-orange-600">
            SERJAFAN
          </Link>
          <Link href="/" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            Kembali
          </Link>
        </div>

        <header className="space-y-3">
          <p className="text-sm font-semibold text-orange-600">Dokumen Operasional</p>
          <h1 className="text-3xl font-bold tracking-normal sm:text-4xl">{title}</h1>
          <p className="text-sm text-slate-500">Terakhir diperbarui: {updatedAt}</p>
          <p className="text-base leading-7 text-slate-700">{intro}</p>
        </header>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">{section.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
