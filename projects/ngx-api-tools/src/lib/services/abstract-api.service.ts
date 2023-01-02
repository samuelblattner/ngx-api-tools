import { HttpClient } from "@angular/common/http";
import { Inject, Injectable, InjectionToken, LOCALE_ID } from "@angular/core";

import { APIContext } from "../interfaces/backend-context.interface";


declare const _APICTX_: APIContext;
export const APICTX: InjectionToken<APIContext> = new InjectionToken<APIContext>(
  'API', {
    providedIn: 'root',
    factory: () => ({
      api: {
        protocol: 'http',
          host: 'localhost',
          path: 'api'
      }
    })
  });


@Injectable()
export abstract class AbstractApiService {

    protected readonly ctx: APIContext;

    protected loadAPIContext(): APIContext {
        try {
            return _APICTX_;
        } catch {
            return this.apiCtx;
        }
    }

    protected validateAPIContext(raise: boolean = true): boolean {
        if (!this.ctx.api) {
            if (raise) {
                throw 'No API Context defined!'
            }
        }
        return true;
    }

    public constructor(protected http: HttpClient, @Inject(APICTX) public apiCtx: APIContext, @Inject(LOCALE_ID) public locale: string) {
        this.ctx = this.loadAPIContext()
        this.validateAPIContext();
    }

    public createAPIBaseUrl(): string {
        const portString: string = this.ctx.api?.port ? `:${this.ctx.api.port}` : '';
        const versionString: string = this.getVersion() ? `${this.getVersion()}/` : '';
        return new URL(
            `${this.ctx.api.path}/${versionString}`,
            `${this.ctx.api.protocol || 'http'}://${this.ctx.api.host}${portString}/`,
        ).toString();
    }

    public createAPIUrl(...pathComponents: (string | number | null | undefined)[]): string {
        const baseUrl = this.createAPIBaseUrl();
        const comps = pathComponents.filter(c => c) as string[];
        if (!comps || comps.length === 0) {
            return baseUrl;
        }
        const lastComp = comps[comps.length - 1];
        const isFileUrl = lastComp.indexOf('.') >= 0;
        const hasEndSlash = lastComp[lastComp.length - 1] === '/';
        return new URL(
            `${comps.join('/')}${!this.ctx.manualTrailingSlash && !isFileUrl && !hasEndSlash ? '/' : ''}`,
            baseUrl
        ).toString();
    }

    public createHeaders(): object {
        return {
            'Accept-Language': this.locale
        }
    }

    public abstract getVersion(): string;
}
