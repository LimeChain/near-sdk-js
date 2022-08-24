declare enum StateSource {
    CONTRACT = 0,
    DEFAULT = 1
}
export declare class NearContract {
    deserialize(): StateSource;
    serialize(): void;
    static deserializeArgs(): any;
    static serializeReturn(ret: any): string;
}
export {};
