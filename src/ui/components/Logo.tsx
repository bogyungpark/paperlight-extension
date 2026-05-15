import { cn } from '@ui/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden
    >
      <path
        d="M6 3.5h7.5L18 8v11.5A1.5 1.5 0 0 1 16.5 21h-10.5A1.5 1.5 0 0 1 4.5 19.5v-14A1.5 1.5 0 0 1 6 4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M13 4v4h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="11" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m13.2 16 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
