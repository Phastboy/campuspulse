export enum AttributeType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
}

/**
 * CategoryAttribute defines a schema for dynamic fields allowed on Listings
 * that belong to a specific leaf category.
 */
export interface CategoryAttribute {
  readonly id: string;
  readonly categoryId: string;
  readonly key: string;
  readonly label: string;
  readonly type: AttributeType;
  readonly isRequired: boolean;
  readonly displayOrder: number;
  
  /** 
   * Flat array of strings for SELECT type. 
   * Example: ['New', 'Used', 'Refurbished']
   */
  readonly options: string[] | null;
}
