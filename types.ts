
export interface ReportSection {
  title: string;
  content: string;
  imageUrl: string;
}

export interface Report {
  id: number;
  createdAt: string;
  topic: string;
  sections: ReportSection[];
}
