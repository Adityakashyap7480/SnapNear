/** Email with truncate; scrubbed deleted-* addresses show a short label (full on hover). */
export default function EmailCell({
  email,
  deleted = false,
  className = '',
}: {
  email: string;
  /** True when this row is a self-deleted account (we may still show the original email). */
  deleted?: boolean;
  className?: string;
}) {
  const scrubbed = /@deleted\.snapnear\.in$/i.test(email) || /^deleted-/i.test(email);
  const label = scrubbed ? 'Deleted account' : email;

  return (
    <p
      title={scrubbed ? email : deleted ? `${email} · account deleted by user` : email}
      className={`max-w-[11rem] truncate leading-snug ${className}`}
    >
      {label}
    </p>
  );
}
