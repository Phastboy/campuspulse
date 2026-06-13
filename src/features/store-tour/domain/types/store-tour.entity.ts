export enum StoreTourStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export interface StoreTourHighlight {
  readonly id: string;
  readonly value: string;
}

export interface StoreTourMediaItem {
  readonly id: string;
  readonly url: string;
  readonly mediaType: 'IMAGE' | 'VIDEO';
  readonly order: number | null;
  readonly createdAt: Date;
}

export interface StoreTour {
  readonly id: string;
  readonly businessProfileId: string;
  readonly title: string;
  readonly summary: string | null;
  readonly visitDate: Date;
  readonly status: StoreTourStatus;
  readonly publishedAt: Date | null;
  readonly createdById: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  readonly highlights: StoreTourHighlight[];
  readonly media: StoreTourMediaItem[];
}
