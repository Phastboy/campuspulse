export interface CreateTagInput {
  readonly name: string;
  readonly slug?: string;
}

export interface UpdateTagInput {
  readonly name: string;
}

export interface TagView {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface PaginatedTags {
  readonly items: TagView[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}
