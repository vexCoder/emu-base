type Setter<T, U = void> = (state: Partial<T> | (
    (prevState: T) => Partial<T>
)) => U extends void ? void : U;

type Getter<T> = () => T;