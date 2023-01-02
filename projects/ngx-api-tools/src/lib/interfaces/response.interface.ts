export interface RichPaginatedResponse<MD, FLTR> {
    modelName: string;
    modelDomain?: string;
    fltr?: FLTR;
    current: number;
}
