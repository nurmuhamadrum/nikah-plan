"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange"> {
  /** Nilai mentah berupa string angka (mis. "2000000" / "105.5") atau number */
  value: string | number;
  /** Callback mengembalikan string angka mentah tanpa pemisah ribuan (mis. "2000000" atau "105.5" atau "") */
  onValueChange: (rawValue: string) => void;
  /** Izinkan koma desimal (contoh: 105,5 untuk kurs atau mata uang asing) */
  allowDecimal?: boolean;
}

function addThousandDots(intDigits: string): string {
  return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatRawToDisplay(
  value: string | number,
  allowDecimal: boolean
): string {
  if (value === "" || value === null || value === undefined) return "";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    if (!allowDecimal) {
      return addThousandDots(String(Math.max(0, Math.round(value))));
    }
    const [intPart, decPart] = String(Math.max(0, value)).split(".");
    return decPart !== undefined
      ? `${addThousandDots(intPart)},${decPart}`
      : addThousandDots(intPart);
  }

  if (allowDecimal) {
    const normalized = value.replace(/,/g, ".");
    const dotIdx = normalized.indexOf(".");
    if (dotIdx !== -1) {
      const intDigits = normalized
        .slice(0, dotIdx)
        .replace(/\D/g, "")
        .replace(/^0+(?=\d)/, "");
      const decDigits = normalized
        .slice(dotIdx + 1)
        .replace(/\D/g, "")
        .slice(0, 4);
      return `${addThousandDots(intDigits || "0")},${decDigits}`;
    }
    const intDigits = normalized.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    return intDigits ? addThousandDots(intDigits) : "";
  }

  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits ? addThousandDots(digits) : "";
}

function parseInputToRaw(input: string, allowDecimal: boolean): string {
  if (!allowDecimal) {
    const digits = input.replace(/\D/g, "");
    if (!digits) return "";
    return digits.replace(/^0+(?=\d)/, "");
  }

  const commaIdx = input.indexOf(",");
  if (commaIdx !== -1) {
    const intDigits = input
      .slice(0, commaIdx)
      .replace(/\D/g, "")
      .replace(/^0+(?=\d)/, "");
    const decDigits = input
      .slice(commaIdx + 1)
      .replace(/\D/g, "")
      .slice(0, 4);
    return `${intDigits || "0"}.${decDigits}`;
  }

  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/^0+(?=\d)/, "");
}

function countSignificantChars(str: string, allowDecimal: boolean): number {
  const regex = allowDecimal ? /[\d,]/g : /\d/g;
  return (str.match(regex) || []).length;
}

function findCaretPosition(
  formatted: string,
  significantCount: number,
  allowDecimal: boolean
): number {
  if (significantCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    const ch = formatted[i];
    const isSig = allowDecimal
      ? (ch >= "0" && ch <= "9") || ch === ","
      : ch >= "0" && ch <= "9";
    if (isSig) {
      seen++;
      if (seen === significantCount) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}

export const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  CurrencyInputProps
>(({ value, onValueChange, allowDecimal = false, className, ...props }, ref) => {
  const innerRef = React.useRef<HTMLInputElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  const displayValue = formatRawToDisplay(value, allowDecimal);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value;
    const caret = e.target.selectionStart ?? typed.length;
    const sigBeforeCaret = countSignificantChars(
      typed.slice(0, caret),
      allowDecimal
    );

    const nextRaw = parseInputToRaw(typed, allowDecimal);
    const nextFormatted = formatRawToDisplay(nextRaw, allowDecimal);

    onValueChange(nextRaw);

    requestAnimationFrame(() => {
      const el = innerRef.current;
      if (el && document.activeElement === el) {
        const nextPos = findCaretPosition(
          nextFormatted,
          sigBeforeCaret,
          allowDecimal
        );
        el.setSelectionRange(nextPos, nextPos);
      }
    });
  };

  return (
    <Input
      ref={setRefs}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      autoComplete="off"
      value={displayValue}
      onChange={handleChange}
      className={cn("tabular-nums", className)}
      {...props}
    />
  );
});

CurrencyInput.displayName = "CurrencyInput";
