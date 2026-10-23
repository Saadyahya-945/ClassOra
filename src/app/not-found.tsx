import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-between p-8 md:p-16 border-t-8 border-[#0F172A]">
      <header className="flex justify-between items-center text-xs uppercase tracking-widest text-[#475569] font-mono border-b border-[#E2E8F0] pb-4">
        <span>CLASSORA / 404 EXCEPTION</span>
        <span>ACADEMIC LEDGER ARCHIVE</span>
      </header>

      <main className="my-auto py-12">
        <div className="font-mono text-sm uppercase text-[#2563EB] font-bold tracking-widest mb-4">
          [ 404 RECORD NOT FOUND ]
        </div>
        <h1 className="text-7xl md:text-9xl font-black font-display tracking-tighter text-[#0F172A] leading-none mb-6">
          NULL_SET
        </h1>
        <p className="max-w-xl text-lg text-[#475569] leading-relaxed mb-8">
          The requested ledger course record, student session index, or sessional marks sheet does not exist in this register or has been safely archived.
        </p>
        <div className="flex flex-wrap gap-4 font-mono text-sm">
          <Link
            href="/"
            className="px-6 py-3 bg-[#0F172A] text-white hover:bg-[#1E3A8A] transition-colors rounded-none font-semibold flex items-center gap-2"
          >
            ← RETURN TO HOME
          </Link>
          <Link
            href="/professor"
            className="px-6 py-3 border border-[#0F172A] text-[#0F172A] hover:bg-white transition-colors rounded-none font-semibold"
          >
            PROFESSOR CABIN
          </Link>
          <Link
            href="/student"
            className="px-6 py-3 border border-[#0F172A] text-[#0F172A] hover:bg-white transition-colors rounded-none font-semibold"
          >
            STUDENT WALLET
          </Link>
        </div>
      </main>

      <footer className="text-xs font-mono text-[#94A3B8] border-t border-[#E2E8F0] pt-4 flex justify-between">
        <span>SYSTEM ERROR: HTTP 404 (IDEMPOTENT SAFE)</span>
        <span>SWISS LEDGER PRECISION</span>
      </footer>
    </div>
  );
}
