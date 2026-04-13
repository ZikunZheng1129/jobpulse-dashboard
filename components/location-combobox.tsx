"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

export function LocationCombobox({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), 120);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  const filteredOptions = useMemo(() => {
    const needle = debouncedValue.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((item) => item.toLowerCase().includes(needle));
  }, [debouncedValue, options]);

  const selectOption = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => {
          if (filteredOptions.length > 0) setIsOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex((prev) => Math.min(prev + 1, filteredOptions.length - 1));
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex((prev) => Math.max(prev - 1, 0));
          }

          if (event.key === "Enter" && isOpen && highlightedIndex >= 0) {
            event.preventDefault();
            const option = filteredOptions[highlightedIndex];
            if (option) selectOption(option);
          }

          if (event.key === "Escape") {
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
        }}
      />

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-44 w-full overflow-auto rounded-md border border-neutral-200 bg-white p-1 shadow-sm">
          {filteredOptions.map((option, index) => (
            <button
              key={option}
              type="button"
              className={`w-full rounded-sm px-2 py-1.5 text-left text-sm ${
                index === highlightedIndex ? "bg-neutral-100" : "hover:bg-neutral-50"
              }`}
              onMouseDown={(event) => {
                event.preventDefault();
                selectOption(option);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
