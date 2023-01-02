import { GenericModelData } from "../interfaces/model.interface";

export class GenericModel<D extends GenericModelData> {
    public data: D | {};

    public constructor(data?: D) {
        this.data = data || {};
    }
}
