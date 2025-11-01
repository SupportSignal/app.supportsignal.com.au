/**
 * Story 11.0: Prompt Group Manager Component
 *
 * Manages prompt groups with drag-drop reordering and collapsible sections.
 * Uses ShadCN Accordion for collapsible UI and @dnd-kit for drag-drop.
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@starter/ui/accordion';
import { Button } from '@starter/ui/button';
import { Plus } from 'lucide-react';
import { PromptCard } from './PromptCard';

interface PromptGroup {
  _id: Id<'prompt_groups'>;
  group_name: string;
  description?: string;
  display_order: number;
  is_collapsible?: boolean;
  default_collapsed?: boolean;
}

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

interface PromptGroupManagerProps {
  onCreateGroup?: () => void;
  onEditGroup?: (groupId: Id<'prompt_groups'>) => void;
  onDeleteGroup?: (groupId: Id<'prompt_groups'>) => void;
}

export function PromptGroupManager({
  onCreateGroup,
  onEditGroup,
  onDeleteGroup,
}: PromptGroupManagerProps) {
  const [activePromptId, setActivePromptId] = useState<Id<'ai_prompts'> | null>(null);

  // Fetch groups and prompts
  const groups = useQuery(api.promptGroups.listGroups) ?? [];
  const prompts = useQuery(api.promptGroups.listPrompts, { activeOnly: true }) ?? [];

  // Enhanced Debug logging
  console.log('🔍 CLIENT - PromptGroupManager - Component mounted', {
    timestamp: new Date().toISOString(),
    buildTime: '2025-11-01T04:15:00Z',
    apiAvailable: typeof api.promptGroups.listGroups !== 'undefined'
  });
  console.log('🔍 CLIENT - PromptGroupManager - groups:', {
    count: groups.length,
    data: groups,
    groupNames: groups.map((g: any) => g.group_name)
  });
  console.log('🔍 CLIENT - PromptGroupManager - prompts:', {
    count: prompts.length,
    data: prompts,
    promptNames: prompts.map((p: any) => p.prompt_name)
  });

  // Mutations
  const reorderPrompts = useMutation(api.promptGroups.reorderPrompts);
  const movePromptToGroup = useMutation(api.promptGroups.movePromptToGroup);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Group prompts by group_id
  const promptsByGroup = prompts.reduce((acc: any, prompt: any) => {
    const groupId = prompt.group_id ?? 'ungrouped';
    if (!acc[groupId as string]) {
      acc[groupId as string] = [];
    }
    acc[groupId as string].push(prompt);
    return acc;
  }, {} as Record<string, Prompt[]>);

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    setActivePromptId(event.active.id as Id<'ai_prompts'>);
  }

  // Handle drag end - reorder prompts within or across groups
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActivePromptId(null);

    if (!over || active.id === over.id) {
      return;
    }

    try {
      const activeId = active.id as Id<'ai_prompts'>;
      const overId = over.id as Id<'ai_prompts'>;

      // Find which groups these prompts belong to
      const activePrompt = prompts.find((p: any) => p._id === activeId);
      const overPrompt = prompts.find((p: any) => p._id === overId);

      if (!activePrompt) {
        // Active prompt not found - this shouldn't happen in normal operation
        return;
      }

      // Case 1: Moving within same group - reorder
      if (activePrompt.group_id === overPrompt?.group_id) {
        const groupId = activePrompt.group_id;
        const groupPrompts = promptsByGroup[groupId as string] || [];
        const oldIndex = groupPrompts.findIndex((p: any) => p._id === activeId);
        const newIndex = groupPrompts.findIndex((p: any) => p._id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        // Calculate new display_order values
        const promptIds = groupPrompts.map((p: any) => p._id);
        const [removed] = promptIds.splice(oldIndex, 1);
        promptIds.splice(newIndex, 0, removed);

        // Generate new display orders (0, 1, 2, ...)
        const newOrders = promptIds.map((_: any, index: number) => index);

        // Call reorderPrompts mutation
        await reorderPrompts({
          promptIds,
          newOrders,
        });
      }
      // Case 2: Moving to different group - movePromptToGroup
      else if (overPrompt) {
        await movePromptToGroup({
          promptId: activeId,
          newGroupId: overPrompt.group_id ?? null,
          displayOrder: overPrompt.display_order || 0,
        });
      }
    } catch {
      // Error during reordering - will be handled by Convex mutation error state
    }
  }

  // Handle group deletion with validation
  async function handleDeleteGroup(groupId: Id<'prompt_groups'>) {
    if (onDeleteGroup) {
      onDeleteGroup(groupId);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Group button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Prompt Groups</h2>
        <Button onClick={onCreateGroup}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Drag and Drop Context */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Accordion for collapsible groups */}
        <Accordion type="multiple" className="w-full">
          {groups
            .sort((a: PromptGroup, b: PromptGroup) => a.display_order - b.display_order)
            .map((group: PromptGroup) => {
              const groupPrompts = promptsByGroup[group._id] ?? [];
              const promptIds = groupPrompts.map((p: any) => p._id);

              return (
                <AccordionItem key={group._id} value={group._id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">{group.group_name}</span>
                        {group.description && (
                          <span className="text-sm text-muted-foreground">
                            {group.description}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {groupPrompts.length} prompts
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onEditGroup?.(group._id);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDeleteGroup(group._id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <SortableContext
                      items={promptIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 pt-2">
                        {groupPrompts.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            No prompts in this group
                          </div>
                        ) : (
                          groupPrompts.map((prompt: any) => (
                            <PromptCard
                              key={prompt._id}
                              prompt={prompt}
                              isDragging={activePromptId === prompt._id}
                            />
                          ))
                        )}
                      </div>
                    </SortableContext>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
        </Accordion>

        {/* Drag Overlay */}
        <DragOverlay>
          {activePromptId ? (
            <div className="opacity-50">
              <PromptCard
                prompt={prompts.find((p: any) => p._id === activePromptId)!}
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {groups.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No Groups Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first prompt group to get started
          </p>
          <Button onClick={onCreateGroup}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Group
          </Button>
        </div>
      )}
    </div>
  );
}
