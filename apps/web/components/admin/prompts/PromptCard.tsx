/**
 * Story 11.0: Prompt Card Component
 *
 * Displays individual prompt information in a card format with drag handle.
 * Shows usage stats, quick actions, and supports drag-drop reordering.
 */

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Id } from '@/convex/_generated/dataModel';
import { Card, CardContent } from '@starter/ui/card';
import { Button } from '@starter/ui/button';
import { Badge } from '@starter/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@starter/ui/dropdown-menu';
import {
  GripVertical,
  MoreVertical,
  Edit,
  Copy,
  Trash,
  Power,
  PowerOff,
} from 'lucide-react';

interface Prompt {
  _id: Id<'ai_prompts'>;
  prompt_name: string;
  description?: string;
  group_id?: Id<'prompt_groups'>;
  display_order?: number;
  is_active?: boolean;
  ai_model: string;
  usage_count?: number;
  success_rate?: number;
}

interface PromptCardProps {
  prompt: Prompt;
  isDragging?: boolean;
  onEdit?: (promptId: Id<'ai_prompts'>) => void;
  onDuplicate?: (promptId: Id<'ai_prompts'>) => void;
  onDelete?: (promptId: Id<'ai_prompts'>) => void;
  onToggleActive?: (promptId: Id<'ai_prompts'>, isActive: boolean) => void;
}

export function PromptCard({
  prompt,
  isDragging = false,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
}: PromptCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: prompt._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const isActive = prompt.is_active ?? true;
  const usageCount = prompt.usage_count ?? 0;
  const successRate = prompt.success_rate ?? 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'shadow-lg' : ''} ${!isActive ? 'opacity-60' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <button
            className="mt-1 cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Prompt Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold truncate">{prompt.prompt_name}</h3>
                {prompt.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {prompt.description}
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="font-medium">Model:</span>
                <span>{prompt.ai_model}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium">Usage:</span>
                <span>{usageCount.toLocaleString()}</span>
              </span>
              {successRate > 0 && (
                <span className="flex items-center gap-1">
                  <span className="font-medium">Success:</span>
                  <span>{(successRate * 100).toFixed(1)}%</span>
                </span>
              )}
            </div>
          </div>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(prompt._id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate?.(prompt._id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive?.(prompt._id, !isActive)}>
                {isActive ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(prompt._id)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
