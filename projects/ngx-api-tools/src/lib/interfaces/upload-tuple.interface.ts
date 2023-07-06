import { HttpEvent } from "@angular/common/http";

import { GenericModelData } from "./model.interface";


export interface UploadTuple<MD extends GenericModelData> {
	instance?: MD | null;
	progress: HttpEvent<MD>;
}
