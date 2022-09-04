interface GlobalVars {
  [key: string]: any;
  set: <T>(key: string, value: T, merge?: boolean) => void;
  get: <T>(key: string) => T;
  remove: (key: string) => void;
}

const Globals: GlobalVars = {
  set<T>(key: string, data: T) {
    this[key] = data;
  },
  merge<T>(key: string, data: T) {
    this[key] = { ...this[key], ...data };
  },
  remove(key: string) {
    delete this[key];
  },
  get<T>(key: string): T {
    return this[key];
  },
};

export default Globals;
