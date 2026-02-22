"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

type PersonOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type PersonDropdownProps = {
  id: string;
  label: string;
  options: PersonOption[];
  value?: string;
  defaultValue?: string;
  className?: string;
  onChange?: (value: string) => void;
};

function getNextEnabledIndex(options: PersonOption[], startIndex: number, step: 1 | -1): number {
  if (options.length === 0) {
    return -1;
  }

  for (let offset = 1; offset <= options.length; offset += 1) {
    const nextIndex = (startIndex + step * offset + options.length) % options.length;
    if (!options[nextIndex]?.disabled) {
      return nextIndex;
    }
  }

  return -1;
}

function getFirstEnabledIndex(options: PersonOption[]): number {
  return options.findIndex((option) => !option.disabled);
}

function getLastEnabledIndex(options: PersonOption[]): number {
  return options.findLastIndex((option) => !option.disabled);
}

export function PersonDropdown({
  id,
  label,
  options,
  value,
  defaultValue = "",
  className = "",
  onChange,
}: PersonDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const initialValue = useMemo(() => {
    if (options.some((option) => option.value === defaultValue)) {
      return defaultValue;
    }
    return options.find((option) => !option.disabled)?.value ?? "";
  }, [defaultValue, options]);

  const [selectedValue, setSelectedValue] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(() => {
    const selectedIndex = options.findIndex((option) => option.value === initialValue && !option.disabled);
    return selectedIndex >= 0 ? selectedIndex : getFirstEnabledIndex(options);
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const isControlled = value !== undefined;
  const selectedValueForRender = isControlled ? value : selectedValue;
  const effectiveSelectedValue = options.some((option) => option.value === selectedValueForRender)
    ? selectedValueForRender
    : initialValue;
  const selectedOption = options.find((option) => option.value === effectiveSelectedValue) ?? options[0];
  const listboxId = `${id}-listbox`;

  function openMenuWithSelectedHighlight() {
    const selectedIndex = options.findIndex((option) => option.value === effectiveSelectedValue && !option.disabled);
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : getFirstEnabledIndex(options));
    setIsOpen(true);
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openMenuWithSelectedHighlight();
        return;
      }

      const nextIndex = getNextEnabledIndex(options, highlightedIndex, 1);
      if (nextIndex >= 0) {
        setHighlightedIndex(nextIndex);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openMenuWithSelectedHighlight();
        return;
      }

      const previousIndex = getNextEnabledIndex(options, highlightedIndex, -1);
      if (previousIndex >= 0) {
        setHighlightedIndex(previousIndex);
      }
      return;
    }

    if (event.key === "Home" && isOpen) {
      event.preventDefault();
      setHighlightedIndex(getFirstEnabledIndex(options));
      return;
    }

    if (event.key === "End" && isOpen) {
      event.preventDefault();
      setHighlightedIndex(getLastEnabledIndex(options));
      return;
    }

    if ((event.key === "Enter" || event.key === " ") && isOpen) {
      event.preventDefault();
      const option = options[highlightedIndex];
      if (option && !option.disabled) {
        if (!isControlled) {
          setSelectedValue(option.value);
        }
        onChange?.(option.value);
      }
      setIsOpen(false);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenuWithSelectedHighlight();
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <span id={`${id}-label`} className="sr-only">
        {label}
      </span>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-labelledby={`${id}-label ${id}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          if (!isOpen) {
            openMenuWithSelectedHighlight();
            return;
          }
          setIsOpen(false);
        }}
        onKeyDown={handleTriggerKeyDown}
        className={`flex w-full items-center justify-between rounded-none border bg-white px-4 py-2 text-left text-sm transition-colors focus:outline-none ${
          isOpen
            ? "border-accent text-foreground"
            : "border-border text-foreground hover:border-accent/40 hover:bg-accent-light/30"
        }`}
      >
        <span className="truncate">{selectedOption?.label ?? label}</span>
        <svg
          className={`h-4 w-4 text-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 011.08 1.04l-4.25 4.514a.75.75 0 01-1.08 0L5.21 8.268a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-2 border border-border bg-white shadow-lg shadow-accent/10">
          <ul id={listboxId} role="listbox" aria-labelledby={`${id}-label`} className="max-h-64 overflow-auto py-1">
            {options.map((option, index) => {
              const isSelected = option.value === effectiveSelectedValue;
              const isHighlighted = index === highlightedIndex;

              return (
                <li key={`${id}-${option.value || option.label}`} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    disabled={option.disabled}
                    onMouseEnter={() => {
                      if (!option.disabled) {
                        setHighlightedIndex(index);
                      }
                    }}
                    onClick={() => {
                      if (option.disabled) {
                        return;
                      }
                      if (!isControlled) {
                        setSelectedValue(option.value);
                      }
                      onChange?.(option.value);
                      setIsOpen(false);
                      buttonRef.current?.focus();
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors ${
                      option.disabled
                        ? "cursor-not-allowed text-text-muted/70"
                        : isHighlighted
                          ? "bg-accent-light/60 text-foreground"
                          : "text-foreground hover:bg-accent-light/40"
                    } ${isSelected ? "font-medium" : ""}`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <svg className="h-4 w-4 text-accent" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.29a1 1 0 010 1.415l-7.25 7.25a1 1 0 01-1.414 0l-3.25-3.25a1 1 0 111.414-1.415l2.543 2.543 6.543-6.543a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
