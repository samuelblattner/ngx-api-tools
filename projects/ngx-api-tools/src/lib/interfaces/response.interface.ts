export interface RichPaginatedResponse<R, FLTR> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results?: R[];
  current?: number;
  pagesize?: number;
  modelName: string;
  modelDomain?: string;
  fltr?: FLTR;
}
