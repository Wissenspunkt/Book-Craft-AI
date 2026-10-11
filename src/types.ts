export type CitationStyle = 'APA' | 'MLA' | 'Harvard' | 'Chicago' | 'IEEE';

export type ChapterStatus = 'draft' | 'writing' | 'factchecked' | 'proofread' | 'completed';

export type ClaimStatus = 'verified' | 'review_needed' | 'source_missing';

export type WorkflowPhase = 
  | 'concept' 
  | 'outline' 
  | 'writing' 
  | 'factcheck' 
  | 'proofread' 
  | 'illustrations' 
  | 'export';

export interface FactClaim {
  id: string;
  statement: string;
  status: ClaimStatus;
  explanation: string;
  suggestedCitation?: string;
}

export interface SourceReference {
  id: string;
  author: string;
  title: string;
  year: string;
  publisher: string;
  type: 'Book' | 'Journal' | 'Web' | 'Report';
  citationKey: string;
  url?: string;
}

export interface ProofreadSuggestion {
  id: string;
  type: 'grammar' | 'style' | 'clarity' | 'tone';
  originalText: string;
  suggestedText: string;
  reason: string;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  summary: string;
  estimatedWords: number;
  actualWords: number;
  status: ChapterStatus;
  content: string;
  illustrationUrl?: string;
  illustrationPrompt?: string;
  keyFacts: FactClaim[];
  proofreadSuggestions: ProofreadSuggestion[];
  fleschScore?: number;
}

export interface BookProject {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  genre: string;
  templateId: string;
  targetLength: string;
  targetWordCount: number;
  style: string;
  tone: string;
  targetAudience: string;
  citationStyle: CitationStyle;
  coverImage?: string;
  summary: string;
  targetChapterCount?: number; // Optional Ziel-Kapitelanzahl (z.B. 5, 8, 10, 12)
  blurb?: string;       // Klappentext
  foreword?: string;    // Vorwort
  conclusion?: string;  // Fazit / Schlusswort
  createdAt: string;
  lastModified: string;
  chapters: Chapter[];
  bibliography: SourceReference[];
  currentPhase: WorkflowPhase;
  cloudSynced: boolean;
  lastSyncedAt?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  iconName: string;
  defaultStyle: string;
  defaultTone: string;
  recommendedWordCount: string;
  sampleOutline: string[];
}
