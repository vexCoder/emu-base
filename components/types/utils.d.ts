type InferPromise<T extends Promise<any>> = T extends Promise<infer U> ? U : T;

type Maybe<T> = T | null | undefined;

type Pair<T, Z = never> = [T, Z extends never ? T : Z];

type None = null | undefined;