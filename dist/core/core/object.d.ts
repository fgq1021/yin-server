import { Place } from "./place";
export declare const lifecycle: string[];
export declare class Schema extends Array {
    constructor(schema: any);
    push(...schema: any[]): number;
}
export declare class YinObject {
    $id: string;
    $name: any;
    $: {
        owner: any;
        model: any;
        schema: any[];
    };
    $$: {
        model: {
            $: {
                schema: any[];
            };
        };
        schema: any[];
    };
    $hide: any;
    $children: any;
    $changed: boolean;
    get $api(): any;
    get $place(): Place;
    constructor(object: any, module: any);
    $assign(object: any): void;
    $init(): Promise<void>;
    $initModel(): Promise<boolean>;
    $readable(user: any): Promise<boolean>;
    $manageable(user: any): Promise<boolean>;
    get $owner(): any;
    set $owner(o: any);
    get $model(): any;
    set $model(o: any);
    set $schema(s: any[]);
    get $schema(): any[];
    $refresh(): any;
    $createChild(req: any, key: string | object, user?: any): Promise<any>;
    $save(option?: any, user?: any): Promise<any>;
    $delete(user?: any): Promise<any>;
    'mounted'(user?: any): void;
    'beforeDestroy'(user?: any): void;
    'created'(user?: any): void;
    'beforeSave'(user?: any): void;
    'saved'(user?: any): void;
    'beforeDelete'(user?: any): void;
    'deleted'(user?: any): void;
    'childrenSaved'(user?: any): void;
    'childrenPushed'(key: any, id: any): void;
    'childrenDeleted'(user?: any): void;
}
