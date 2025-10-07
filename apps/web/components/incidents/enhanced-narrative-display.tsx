"use client";

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@starter/ui/button';
import { Textarea } from '@starter/ui/textarea';
import { Badge } from '@starter/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@starter/ui/tabs';
import { Alert, AlertDescription } from '@starter/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@starter/ui/card';
import { 
  Edit3, 
  Save, 
  X, 
  Clock, 
  User, 
  Bot, 
  Eye,
  History,
  FileText
} from 'lucide-react';
import { OriginalContentCollapse } from './original-content-collapse';
import { QADisplayCollapse } from './qa-display-collapse';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import type { Id } from '@/convex/_generated/dataModel';

interface EnhancedNarrativeDisplayProps {
  enhancedNarrative: {
    _id: Id<"incident_narratives">;
    original_content: string;
    clarification_responses: string;
    enhanced_content: string;
    enhancement_version: number;
    ai_model?: string;
    processing_time_ms: number;
    quality_score?: number;
    user_edited: boolean;
    user_edits?: string;
    created_at: number;
    updated_at: number;
  };
  incident_id: Id<"incidents">;
  phase?: string;
}

export function EnhancedNarrativeDisplay({ 
  enhancedNarrative, 
  incident_id,
  phase
}: EnhancedNarrativeDisplayProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(enhancedNarrative.enhanced_content);
  const [activeTab, setActiveTab] = useState("enhanced");

  // Mutation for updating enhanced narrative
  // DEPRECATED: updateEnhancedNarrative function removed
  // const updateEnhancedNarrative = useMutation(api.aiEnhancement.updateEnhancedNarrative);

  const handleSave = async () => {
    if (!user?.sessionToken) {
      toast.error("Authentication required");
      return;
    }

    if (editedContent.trim() === enhancedNarrative.enhanced_content.trim()) {
      setIsEditing(false);
      return;
    }

    try {
      // DEPRECATED: updateEnhancedNarrative function removed
      // await updateEnhancedNarrative({
      //   sessionToken: user.sessionToken,
      //   enhanced_narrative_id: enhancedNarrative._id,
      //   user_edited_content: editedContent
      // });
      
      toast.error("This feature has been deprecated. Please use the new enhancement system.");

      toast.success("Enhanced narrative updated");
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update enhanced narrative:", error);
      toast.error("Failed to update narrative. Please try again.");
    }
  };

  const handleCancel = () => {
    setEditedContent(enhancedNarrative.enhanced_content);
    setIsEditing(false);
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-4">
      {/* Enhancement Metadata */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bot className="h-4 w-4" />
            {enhancedNarrative.ai_model || "AI Enhanced"}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatProcessingTime(enhancedNarrative.processing_time_ms)}
          </div>
          <div className="flex items-center gap-1">
            <History className="h-4 w-4" />
            v{enhancedNarrative.enhancement_version}
          </div>
          {enhancedNarrative.user_edited && (
            <Badge variant="secondary" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              User Edited
            </Badge>
          )}
          {enhancedNarrative.quality_score && (
            <Badge variant="outline" className="text-xs">
              Quality: {Math.round(enhancedNarrative.quality_score * 100)}%
            </Badge>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          Updated {formatDistanceToNow(enhancedNarrative.updated_at)} ago
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Enhanced Narrative
          </TabsTrigger>
          <TabsTrigger value="original" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Original Content
          </TabsTrigger>
          <TabsTrigger value="clarifications" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Clarifications
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Narrative Tab */}
        <TabsContent value="enhanced" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">AI-Enhanced Narrative</CardTitle>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={12}
                    className="min-h-[300px] resize-none"
                    placeholder="Enhanced incident narrative..."
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="bg-background p-4 rounded-md border whitespace-pre-wrap">
                    <ReactMarkdown>
                      {enhancedNarrative.user_edited 
                        ? enhancedNarrative.user_edits 
                        : enhancedNarrative.enhanced_content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {enhancedNarrative.user_edited && (
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                This narrative has been modified by the user. The original AI-generated content 
                is preserved for audit purposes.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Original Content Tab */}
        <TabsContent value="original" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Narrative Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div className="bg-muted/30 p-4 rounded-md border">
                  <ReactMarkdown>
                    {enhancedNarrative.original_content}
                  </ReactMarkdown>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clarifications Tab */}
        <TabsContent value="clarifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clarification Responses</CardTitle>
            </CardHeader>
            <CardContent>
              {enhancedNarrative.clarification_responses ? (
                <div className="prose prose-sm max-w-none">
                  <div className="bg-muted/30 p-4 rounded-md border">
                    <ReactMarkdown>
                      {enhancedNarrative.clarification_responses}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  No clarification responses provided
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Collapsible Original Content and Q&A Sections */}
      <div className="space-y-4">
        <OriginalContentCollapse 
          originalContent={JSON.parse(enhancedNarrative.original_content)}
          defaultCollapsed={true}
        />
        
        <QADisplayCollapse 
          clarificationResponses={JSON.parse(enhancedNarrative.clarification_responses)}
          defaultCollapsed={true}
        />
      </div>
    </div>
  );
}