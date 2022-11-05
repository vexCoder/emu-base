import { curry } from "ramda";

export const createTimer = <T extends (ts: number, elapsed: number) => void>(
  step: T,
  wait: number = 100,
  timeout: number = 0
) => {
  const timestamp = {
    start: 0,
    end: 0,
  };

  const timerStep = (ts: number) => {
    if (!timestamp.start) timestamp.start = ts;
    const elapsed = ts - timestamp.start;
    if (timestamp.end !== ts) {
      if (timeout ? elapsed >= timeout : timestamp.start === -1) return;
      step(ts, elapsed);
    }

    setTimeout(() => {
      timestamp.end = ts;
      window.requestAnimationFrame(timerStep);
    }, wait);
  };

  timerStep(0);

  return () => {
    timestamp.start = -1;
  };
};

export interface CustomEventFactory<T = {}> {
  subscribers: string[];
  subscribe: (listener: (e: CustomEvent<T>, data: T) => void) => void;
  unsubscribe: (listener: (e: CustomEvent<T>, data: T) => void) => void;
  dispatch: (data: T) => void;
}

export const createCustomEvent = <T extends object = {}>(
  name: "onpressgamepad",
  id: string
): CustomEventFactory<T> => {
  const target = new EventTarget();
  const obj: CustomEventFactory<T> = {
    subscribers: [],
    subscribe(callback: (e: CustomEvent<T>, data: T) => void) {
      if (!this.subscribers.includes(id)) {
        this.subscribers.push(id);
        target.addEventListener(name, (e) => {
          const cast = e as CustomEvent<T>;
          callback(cast, cast.detail);
        });
      }
    },
    unsubscribe(callback: (e: CustomEvent<T>, data: T) => void) {
      if (this.subscribers.includes(id)) {
        this.subscribers = this.subscribers.filter((v) => v !== id);
        target.removeEventListener(name, (e) => {
          const cast = e as CustomEvent<T>;
          callback(cast, cast.detail);
        });
      }
    },
    dispatch(data: T) {
      const event = new CustomEvent<T>(name, { detail: data });
      target.dispatchEvent(event);
    },
  };
  return obj;
};

export const extractString = curry(
  (regexp: RegExp, text: string, trim?: boolean) => {
    const res = new RegExp(regexp).exec(text)?.[1];

    return trim ? res?.trim() : res;
  }
);

export const extractMatches = curry(
  (regexp: RegExp, text: string, trim?: boolean) => {
    const arr = text.match(new RegExp(regexp)) ?? [];
    return arr?.map((o) => (trim ? o.trim() : o));
  }
);

export const cycleCounter = (value: number, min: number, max: number) => {
  if (value < min) return max;
  if (value > max) return min;
  return value;
};

export const extractTag = (url: string) => {
  const tag = url?.match(
    /^.*(youtu.be\/|v\/|embed\/|watch\?|youtube.com\/user\/[^#]*#([^/]*?\/)*)\??v?=?([^#&?]*).*/
  )?.[3];

  return tag;
};
