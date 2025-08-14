// @ts-nocheck
"use client";

import { useState } from "react";
import { Button } from "@starter/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@starter/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Generic sample data option interface
interface SampleDataOption {
  id: string;
  label: string;
  description?: string;
  tags?: string[];
  severity?: 'low' | 'medium' | 'high';
  data: any; // The actual data to be used when selected
  icon?: string;
}

interface SampleDataButtonProps {
  // Button configuration
  buttonText?: string;
  variant?: 'simple' | 'dropdown';
  size?: 'xs' | 'sm' | 'default' | 'lg';
  className?: string;
  disabled?: boolean;
  
  // Simple button props
  onClick?: () => void;
  
  // Dropdown button props  
  options?: SampleDataOption[];
  onOptionSelect?: (option: SampleDataOption) => void;
  dropdownWidth?: string;
  dropdownLabel?: string;
}

const severityColors = {
  low: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100', 
  high: 'text-red-600 bg-red-100',
};

/**
 * Generic Sample Data Button Component
 * 
 * Supports both simple buttons and dropdown selection buttons
 * Uses preferred styling: gray text with teal hover effect
 * Completely decoupled from any specific sample data logic
 * 
 * Examples:
 * - Simple: <SampleDataButton variant="simple" buttonText="Random Sample" onClick={handleClick} />
 * - Dropdown: <SampleDataButton variant="dropdown" options={scenarios} onOptionSelect={handleSelect} />
 */
export function SampleDataButton({
  buttonText = "Sample Data",
  variant = "simple",
  size = "xs",
  className,
  disabled = false,
  onClick,
  options = [],
  onOptionSelect,
  dropdownWidth = "w-96",
  dropdownLabel = "Select Sample Data"
}: SampleDataButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Preferred sample data button styling
  const buttonClassName = cn(
    "text-xs text-gray-500 hover:text-white hover:bg-ss-teal border-b border-dashed border-gray-300 rounded-none hover:border-ss-teal transition-all duration-200",
    className
  );

  const handleOptionSelect = (option: SampleDataOption) => {
    onOptionSelect?.(option);
    setIsDropdownOpen(false);
  };

  // Simple button variant
  if (variant === 'simple') {
    return (
      <Button
        variant="ghost"
        size={size}
        className={buttonClassName}
        onClick={onClick}
        disabled={disabled}
      >
        {buttonText}
      </Button>
    );
  }

  // Dropdown button variant
  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={buttonClassName}
          disabled={disabled}
        >
          {buttonText}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className={dropdownWidth}>
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {dropdownLabel}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => handleOptionSelect(option)}
            className="flex flex-col items-start p-3 cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              {option.icon && (
                <span className="text-base">{option.icon}</span>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{option.label}</span>
                  {option.severity && (
                    <span className={cn("text-xs font-medium px-2 py-1 rounded", severityColors[option.severity])}>
                      {option.severity}
                    </span>
                  )}
                </div>
                {option.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
            
            {option.tags && option.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 w-full">
                {option.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block bg-muted px-1.5 py-0.5 rounded text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <div className="px-3 py-2 text-xs text-muted-foreground">
          💡 Sample data helps with testing and demonstrations
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { SampleDataOption };