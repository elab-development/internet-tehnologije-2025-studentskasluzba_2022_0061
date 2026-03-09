'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Option = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  value: string;
  query: string;
  onQueryChange: (value: string) => void;
  onValueChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  emptyMessage?: string;
};

export function SearchableSelect({
  label,
  placeholder,
  searchPlaceholder,
  value,
  query,
  onQueryChange,
  onValueChange,
  options,
  disabled = false,
  emptyMessage = 'Nema rezultata.',
}: SearchableSelectProps) {
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter(option => option.label.toLowerCase().includes(normalized));
  }, [options, query]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <Input
        value={query}
        onChange={event => onQueryChange(event.target.value)}
        placeholder={searchPlaceholder}
        disabled={disabled}
      />

      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-gray-600">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
