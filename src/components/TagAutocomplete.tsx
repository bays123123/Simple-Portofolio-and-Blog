import { useState, useRef, useEffect, useMemo } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TagAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function TagAutocomplete({ value, onChange, placeholder = 'Tambahkan tag...' }: TagAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse current tags from comma-separated string
  const selectedTags = useMemo(() => {
    return value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }, [value]);

  // Fetch all unique tags from blog_posts
  const { data: allTags = [] } = useQuery({
    queryKey: ['all-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('tags');
      if (error) throw error;

      const tagSet = new Set<string>();
      data?.forEach((post) => {
        (post.tags || []).forEach((tag: string) => {
          if (tag.trim()) tagSet.add(tag.trim());
        });
      });
      return Array.from(tagSet).sort();
    },
  });

  // Filter suggestions: exclude already selected, match input
  const suggestions = useMemo(() => {
    const query = inputValue.toLowerCase().trim();
    return allTags.filter(
      (tag) =>
        !selectedTags.includes(tag) &&
        (!query || tag.toLowerCase().includes(query))
    );
  }, [allTags, selectedTags, inputValue]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions.length, inputValue]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (selectedTags.includes(trimmed)) {
      setInputValue('');
      return;
    }
    const newTags = [...selectedTags, trimmed];
    onChange(newTags.join(', '));
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    const newTags = selectedTags.filter((t) => t !== tag);
    onChange(newTags.join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (isOpen && suggestions.length > 0) {
        addTag(suggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[2.5rem] px-3 py-1.5 rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-text transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="hover:text-destructive transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-muted-foreground py-0.5"
        />
        <ChevronDown size={14} className="text-muted-foreground shrink-0 ml-1" />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-52 overflow-y-auto">
          <ul className="py-1">
            {suggestions.map((tag, index) => (
              <li
                key={tag}
                onClick={() => addTag(tag)}
                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between ${
                  index === highlightedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'text-popover-foreground hover:bg-accent/50'
                }`}
              >
                <span>{tag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOpen && inputValue.trim() && !suggestions.includes(inputValue.trim()) && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
          <div
            onClick={() => addTag(inputValue)}
            className={`px-3 py-2 text-sm cursor-pointer ${
              suggestions.length === 0 && highlightedIndex === 0
                ? 'bg-accent text-accent-foreground'
                : 'text-popover-foreground hover:bg-accent/50'
            }`}
          >
            Buat tag baru: <span className="font-medium">"{inputValue.trim()}"</span>
          </div>
        </div>
      )}
    </div>
  );
}
