export interface APIContext {
    api: {
        protocol: 'http' | 'https';
        host: string;
        path: string;
        port?: number;
    }
    manualTrailingSlash?: boolean;
}
