import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = "p-5" }: Props) {
  return (
    <div className={`rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] ${className}`}>
      {children}
    </div>
  );
}