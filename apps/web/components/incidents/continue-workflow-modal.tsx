'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger 
} from '@starter/ui/alert-dialog';
import { Button } from '@starter/ui/button';
import { Plus } from 'lucide-react';
import { IncidentPreviewCard, type IncidentPreview } from './incident-preview-card';

interface ContinueWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  incompleteIncidents: IncidentPreview[];
  totalCount?: number;
  onContinue: (incidentId: string, step?: number) => void;
  onStartNew: () => void;
}

export const ContinueWorkflowModal: React.FC<ContinueWorkflowModalProps> = ({
  isOpen,
  onClose,
  incompleteIncidents,
  totalCount,
  onContinue,
  onStartNew,
}) => {
  const router = useRouter();

  const handleContinue = (incidentId: string, step?: number) => {
    onContinue(incidentId, step);
    // Don't call onClose() - let the parent component handle closing
  };

  const handleStartNew = () => {
    onStartNew();
    // Don't call onClose() - let the parent component handle closing
  };

  const handleMaybeLater = () => {
    onClose();
    // User stays on current page
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleMaybeLater();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold text-gray-900">
            Continue Existing Work or Start New?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            You have {totalCount || incompleteIncidents.length} incomplete incident{(totalCount || incompleteIncidents.length) !== 1 ? 's' : ''}.
            {totalCount && totalCount > incompleteIncidents.length && (
              <span> Showing your {incompleteIncidents.length} most recent.</span>
            )}
            {' '}Would you like to continue where you left off or start a new incident?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          {/* Incomplete Incidents List */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Your Incomplete Incidents
            </h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {incompleteIncidents.map((incident) => (
                <IncidentPreviewCard
                  key={incident._id}
                  incident={incident}
                  onContinue={handleContinue}
                />
              ))}
              {totalCount && totalCount > incompleteIncidents.length && (
                <div className="text-center py-2 text-xs text-gray-400">
                  <p>
                    ({incompleteIncidents.length} of {totalCount} incomplete incidents shown)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleStartNew}
              className="flex-1"
              variant="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start New Incident
            </Button>
            <Button
              onClick={handleMaybeLater}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ContinueWorkflowModal;