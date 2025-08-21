
export interface ReportSection {
  title: string;
  content: string;
  imageUrl: string;
  imagePrompt?: string; // The prompt used to generate the image
  isPlaceholder?: boolean; // True if the imageUrl is a placeholder
}

export interface Report {
  id: number;
  createdAt: string;
  topic: string;
  sections: ReportSection[];
}

export type ReportLength = 'short' | 'normal' | 'long';
export type OutputFormat = 'pdf' | 'word';

export interface GenerationOptions {
    includeContributors: boolean;
    length: ReportLength;
    outputFormat: OutputFormat;
}
