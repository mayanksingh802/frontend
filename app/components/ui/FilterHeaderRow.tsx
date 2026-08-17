"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type FilterHeaderRowOption = {
  label: string;
  value: string;
};

interface FilterHeaderRowProps {
  title: string;
  value: string;
  options: FilterHeaderRowOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export default function FilterHeaderRow({
  title,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search options",
  emptyMessage = "No options found.",
}: FilterHeaderRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const selectedOption =
    options.find((option) => option.value === value) ??
    options[0] ??
    ({ label: placeholder, value: "" } as FilterHeaderRowOption);

  const filteredOptions = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, searchText]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
        setSearchText("");
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className="filter-header-row">
      <div className="filter-header-title">{title}</div>

      <div ref={containerRef} className="filter-header-dropdown">
        <button
          type="button"
          className="filter-header-trigger"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
        >
          <span>{selectedOption.label}</span>
          <ChevronDown
            size={18}
            className={isOpen ? "filter-header-chevron-open" : ""}
          />
        </button>

        {isOpen && (
          <div className="filter-header-menu" role="listbox">
            <div className="filter-header-search">
              <input
                type="search"
                value={searchText}
                placeholder={searchPlaceholder}
                onChange={(event) => setSearchText(event.target.value)}
                onClick={(event) => event.stopPropagation()}
              />
            </div>

            <div className="filter-header-options">
              {filteredOptions.length ? (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`filter-header-option ${isSelected ? "selected" : ""}`}
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                        setSearchText("");
                      }}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="filter-header-option-label">
                        {isSelected && <Check size={16} />}
                        {option.label}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="filter-header-empty">{emptyMessage}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
