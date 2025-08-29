/**
 * CENTRALIZED PDF SECTION CONFIGURATION
 * 
 * Single source of truth for all PDF section names across the entire application.
 * This prevents frontend/backend naming mismatches by ensuring consistency.
 * 
 * CRITICAL: Any changes to section names MUST be made here first.
 * Both frontend and backend import from this file.
 */

export const PDF_SECTIONS = {
  basic_information: 'Incident Overview & Metadata',
  participant_details: 'Participant Information',
  incident_narratives: 'Brief Narrative Summaries', 
  enhanced_narrative: 'Detailed Enhanced Narratives',
  clarification_qa: 'Questions & Answers (All Phases)',
  metadata: 'Processing & System Information'
} as const;

export type PDFSectionKey = keyof typeof PDF_SECTIONS;
export type PDFSectionTitle = typeof PDF_SECTIONS[PDFSectionKey];

/**
 * Get all available section keys
 */
export function getAllSectionKeys(): PDFSectionKey[] {
  return Object.keys(PDF_SECTIONS) as PDFSectionKey[];
}

/**
 * Get section title by key
 */
export function getSectionTitle(key: PDFSectionKey): PDFSectionTitle {
  return PDF_SECTIONS[key];
}

/**
 * Validate section keys against the centralized configuration
 * @param sections Array of section keys to validate
 * @returns Validation result with valid/invalid sections
 */
export function validateSectionKeys(sections: string[]) {
  const validKeys = getAllSectionKeys();
  const validSections = sections.filter(s => validKeys.includes(s as PDFSectionKey));
  const invalidSections = sections.filter(s => !validKeys.includes(s as PDFSectionKey));
  
  return {
    valid: validSections as PDFSectionKey[],
    invalid: invalidSections,
    allValid: invalidSections.length === 0,
    availableKeys: validKeys
  };
}

/**
 * Default section selection (all sections enabled)
 */
export function getDefaultSections(): PDFSectionKey[] {
  return getAllSectionKeys();
}

/**
 * Section configuration for UI checkboxes with icons
 */
export const PDF_SECTION_UI_CONFIG = [
  { 
    id: 'basic_information' as PDFSectionKey, 
    label: PDF_SECTIONS.basic_information, 
    icon: '📋' 
  },
  { 
    id: 'participant_details' as PDFSectionKey, 
    label: PDF_SECTIONS.participant_details, 
    icon: '👤' 
  },
  { 
    id: 'incident_narratives' as PDFSectionKey, 
    label: PDF_SECTIONS.incident_narratives, 
    icon: '📝' 
  },
  { 
    id: 'enhanced_narrative' as PDFSectionKey, 
    label: PDF_SECTIONS.enhanced_narrative, 
    icon: '📖' 
  },
  { 
    id: 'clarification_qa' as PDFSectionKey, 
    label: PDF_SECTIONS.clarification_qa, 
    icon: '❓' 
  },
  { 
    id: 'metadata' as PDFSectionKey, 
    label: PDF_SECTIONS.metadata, 
    icon: '📊' 
  }
] as const;