'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@starter/ui/input';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import { Search, User, Building } from 'lucide-react';
import { ImpersonationSearchResult } from '@/types/impersonation';
import { cn } from '@/lib/utils';

interface UserSearchInputProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  searchResults: ImpersonationSearchResult[];
  selectedUser: ImpersonationSearchResult | null;
  onUserSelect: (user: ImpersonationSearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UserSearchInput({
  searchTerm,
  onSearchTermChange,
  searchResults,
  selectedUser,
  onUserSelect,
  placeholder = "Search by name or email...",
  disabled = false,
}: UserSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Open dropdown when search term changes or input is focused
  useEffect(() => {
    if (searchTerm.length > 0) {
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchTermChange(value);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    if (searchTerm.length > 0) {
      setIsOpen(true);
    }
  };

  const handleUserSelect = (user: ImpersonationSearchResult) => {
    onUserSelect(user);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSearchTermChange('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          handleUserSelect(searchResults[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="pl-10"
          autoComplete="off"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((user, index) => (
            <button
              key={user.id}
              type="button"
              className={cn(
                "w-full px-3 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0",
                highlightedIndex === index && "bg-gray-50"
              )}
              onClick={() => handleUserSelect(user)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium text-sm truncate">{user.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate ml-6">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2 ml-6">
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                    {user.company_name && (
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {user.company_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && searchTerm.length > 0 && searchResults.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            No users found matching &quot;{searchTerm}&quot;
          </p>
        </div>
      )}
    </div>
  );
}