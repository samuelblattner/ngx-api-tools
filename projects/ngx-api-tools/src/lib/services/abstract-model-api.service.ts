import { Observable, throwError } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";

import { HttpParams } from "@angular/common/http";

import { AbstractApiService } from "./abstract-api.service";
import { GenericModelData } from "../interfaces/model.interface";
import { RichPaginatedResponse } from "../interfaces/response.interface";
import { UploadTuple } from "../interfaces/upload-tuple.interface";


interface BackendError {
}

export abstract class AbstractModelApiService
    extends AbstractApiService {

    public static readonly PAGE_ATTR_NAME: string = 'page';

    public getBackendModelInstanceIDFieldName(): string {
        return 'id';
    }

    public getModelAPIPathPrefix(): string {
        return 'models';
    }

    public getModelMetaAPIPathPrefix(): string {
        return 'meta';
    }

    public getModelActionAPIPathPrefix(): string {
        return 'action';
    }

    public getModelPermissionAPIPathPrefix(): string {
        return 'permissions';
    }

    public getPageParamName(): string {
        return 'page';
    }

    public createInstanceManagementAPIUrl(modelName: string, modelDomain?: string, modelId?: string | number): string {
        return this.createAPIUrl(
            this.getModelAPIPathPrefix(),
            modelDomain,
            modelName,
            modelId
        );
    }

    public createMetaManagementAPIUrl(metaKey: string, modelName: string, modelId: string | number, modelDomain?: string): string {
        return this.createAPIUrl(
            this.createInstanceManagementAPIUrl(modelName, modelDomain, modelId),
            this.getModelMetaAPIPathPrefix(),
            metaKey
        );
    }

    public createInstanceActionAPIUrl(actionKey: string, modelName: string, modelId: string | number, modelDomain?: string): string {
        return this.createAPIUrl(
            this.createInstanceManagementAPIUrl(modelName, modelDomain, modelId),
            this.getModelActionAPIPathPrefix(),
            actionKey
        );
    }

    public createInstancePermissionsAPIUrl(modelName: string, modelId: string | number, modelDomain?: string): string {
        return this.createAPIUrl(
            this.createInstanceManagementAPIUrl(modelName, modelDomain, modelId),
            this.getModelPermissionAPIPathPrefix()
        );
    }

    public setFilterParams(fltr?: { [key: string]: any }, params?: HttpParams): HttpParams {
        params = params || new HttpParams();
        if (!fltr) {
            return params;
        }
        for (const key of Object.keys(fltr)) {
            params = params.set(key, fltr[key]);
        }
        return params;
    }

    public listInstances<MD extends GenericModelData, FLTR extends {
        [key: string]: any
    }>(modelName: string, fltr?: FLTR, page: number = 1, modelDomain?: string): Observable<RichPaginatedResponse<MD, FLTR>> {
        let params: HttpParams = this.setFilterParams(fltr);
        params = params.set(this.getPageParamName(), page);
        return this.http.get<RichPaginatedResponse<MD, FLTR>>(
            this.createInstanceManagementAPIUrl(modelName, modelDomain),
            {
                headers: {
                    'Accept': 'application/json',
                    ...this.createHeaders()
                },
                params: params
            }
        ).pipe(
            map(r => {
                    if (!r) {
                        return {
                            count: 1,
                            next: null,
                            previous: null,
                            current: 1,
                            pagesize: 0,
                            fltr: fltr,
                            results: [],
                            modelName: modelName
                        }
                    }
                    r.fltr = fltr;
                    r.modelName = modelName;
                    r.modelDomain = modelDomain;
                    return r;
                }
            )
        )
    }

    public getNextPage<MD extends GenericModelData, FLTR extends object>(response: RichPaginatedResponse<MD, FLTR>): Observable<RichPaginatedResponse<MD, FLTR>> {
        return this.listInstances<MD, FLTR>(response.modelName, response.fltr, (response.current || 1) + 1, response.modelDomain);
    }

    public getPreviousPage<MD extends GenericModelData, FLTR extends object>(response: RichPaginatedResponse<MD, FLTR>): Observable<RichPaginatedResponse<MD, FLTR>> {
        return this.listInstances<MD, FLTR>(response.modelName, response.fltr, (response.current || 1) - 1, response.modelDomain);
    }

    public getInstance<MD extends GenericModelData>(modelName: string, modelId: string, modelDomain?: string): Observable<MD> {
        return this.http.get<MD>(
            this.createInstanceManagementAPIUrl(modelName, modelDomain, modelId),
            {
                headers: {
                    'Accept': 'application/json',
                    ...this.createHeaders()
                },
            }
        );
    }

    public createInstance<MD extends GenericModelData>(modelName: string, data: GenericModelData, modelDomain?: string): Observable<MD> {
        const idField: keyof GenericModelData = this.getBackendModelInstanceIDFieldName();
        return this.http.post<MD>(
            this.createInstanceManagementAPIUrl(modelName, modelDomain),
            data,
            {
                headers: {
                    'Accept': 'application/json',
                    ...this.createHeaders()
                },
            }
        ).pipe(
            tap(createdInstance => {
                data[idField] = createdInstance[idField];

            }),
            catchError(e => {
                return throwError(() => <BackendError>e.error)
            })
        );
    }

    public uploadInstanceContentFromFile<MD extends {
        id?: number
    }>(modelName: string, instance: MD, file: File): Observable<UploadTuple<MD>> {

        const form: FormData = new FormData();
        form.append(file.name, file);
        return this.http.post<MD>(
            this.createInstanceManagementAPIUrl(modelName, undefined, instance.id),
            form,
            {
                headers: {
                    'Accept': 'application/json',
                    'x-requested-with': 'XMLHttpRequest',
                    ...this.createHeaders()
                },
                reportProgress: true,
                observe: 'events'
            }
        ).pipe(
            map(r => ({instance: r.type === 4 ? r.body : instance, progress: r, done: r.type === 4})),
            catchError(e => {
                return throwError(() => <BackendError>e.error)
            }));

    }

    public updateInstance<MD extends GenericModelData>(modelName: string, data: GenericModelData, modelDomain?: string) {
        const idField: keyof GenericModelData = this.getBackendModelInstanceIDFieldName();
        return this.http.patch<MD>(
            this.createInstanceManagementAPIUrl(modelName, modelDomain, data[idField]),
            data,
            {
                headers: {
                    'Accept': 'application/json',
                    ...this.createHeaders()
                },
            }
        )
    }

    public deleteInstance<MD extends GenericModelData>(modelName: string, data: GenericModelData, modelDomain?: string) {
        const idField: keyof GenericModelData = this.getBackendModelInstanceIDFieldName();
        const body: { [key: string]: any } = {};
        body[idField] = data[idField];
        return this.http.delete<MD>(
            this.createInstanceManagementAPIUrl(modelName),
            {
                body: body
            },
            {
                headers: {
                    'Accept': 'application/json',
                    ...this.createHeaders()
                },
            }            
        )
    }
}
