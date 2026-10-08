import Link from "next/link";

// The name set as a rubber stamp, with a small cancellation ring.
export default function Wordmark() {
  return (
    <Link href="/" className="wordmark" aria-label="Postmen home">
      <svg viewBox="-20 -20 40 40" aria-hidden="true">
        <circle r="17" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle r="10" fill="none" stroke="var(--red)" strokeWidth="2" />
      </svg>
      <span>Postmen</span>
    </Link>
  );
}
