export type LogFunction = (...args: any[]) => unknown;
export interface IBotStorage<T extends object> {
    load(key: string): Promise<T | null>;
    save(key: string, obj: T): Promise<void>;
}
export declare class InMemoryBotStorage<T extends object> implements IBotStorage<T> {
    private readonly log;
    private readonly storage;
    constructor(log?: LogFunction);
    load<T>(key: string): Promise<T | null>;
    save(key: string, obj: T): Promise<void>;
}
export declare class FortaBotStorage<T extends object> implements IBotStorage<T> {
    private readonly log;
    constructor(log?: LogFunction);
    private getClient;
    load<T>(key: string): Promise<T | null>;
    save(key: string, obj: T): Promise<void>;
}
//# sourceMappingURL=storage.d.ts.map