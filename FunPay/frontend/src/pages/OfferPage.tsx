import { useParams } from "react-router-dom";

export function OfferPage() {
  const { id } = useParams();

  return (
    <main className="mx-auto max-w-[1260px] px-4 py-6 sm:px-6">
      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <h1 className="text-2xl font-extrabold text-[var(--text)]">Offer Page</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">Offer ID from URL: {id ?? "unknown"}</p>
      </section>
    </main>
  );
}
