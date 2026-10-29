import type { CSSProperties, ReactNode } from "react";

interface ItemProps {
  index: number; // urutan (stagger)
  delay?: number; // jeda awal dalam ms
  className?: string;
  children: ReactNode;
}

export default function Item({
  index,
  delay = 0,
  className = "login-item",
  children,
}: ItemProps) {
  return (
    <div
      className={className}
      style={{ "--i": index, "--d": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}