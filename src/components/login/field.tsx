import type { ReactNode } from "react";
import { inputClass } from "./constants.tsx";

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white">
      {children}
    </span>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  icon: ReactNode;
  /** elemen tambahan di ujung kanan (mis. tombol mata) */
  action?: ReactNode;
}

export default function Field({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  icon,
  action,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative rounded-full shadow-sm">
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`${inputClass} ${action ? "pr-24" : "pr-14"}`}
        />
        <div className="absolute inset-y-0 right-3 flex items-center gap-2">
          <span className="pointer-events-none">
            <IconBadge>{icon}</IconBadge>
          </span>
          {action}
        </div>
      </div>
    </div>
  );
}