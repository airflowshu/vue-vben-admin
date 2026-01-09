export interface SearchItem {
  field?: string;
  op?: string;
  val?: any;
  logic?: 'AND' | 'OR';
  children?: SearchItem[];
}

export interface OrderItem {
  column: string;
  asc: boolean;
}

export interface SearchRequest {
  pageNumber: number;
  pageSize: number;
  keyword?: string;
  searchFields?: string[];
  logic?: 'AND' | 'OR';
  items?: SearchItem[];
  orders?: OrderItem[];
}

// op ("eq"、"ne"、"gt"、"ge"、"lt"、"le"、"like"、"notlike"、"in"、"notin"、"isnull"、"notnull")
