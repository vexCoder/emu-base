import {
  addIndex,
  complement,
  equals,
  filter,
  fromPairs,
  head,
  isNil,
  keys,
  map,
  pickBy,
  pipe,
} from "ramda";
import CONSTANTS from "./constants.utils";

export const getButtonName = (index: number): ButtonKeys | undefined => {
  const name = pipe(
    pickBy(equals(index)),
    keys<Record<ButtonKeys, number>>,
    head<ButtonKeys>
  )(CONSTANTS.BUTTON_MAPPINGS);

  return name;
};

export const getAxisName = (index: number): AxesKeys | undefined => {
  const name = pipe(
    pickBy(equals(index)),
    keys<Record<AxesKeys, number>>,
    head<AxesKeys>
  )(CONSTANTS.AXES_MAPPINGS);

  return name;
};

export const mapButtons = (buttons: GamepadButton[]) => {
  type BtnPair<T = Maybe<ButtonKeys>> = [T, boolean];
  const indexedMap = addIndex<GamepadButton, BtnPair | null>(map)((v, i) => {
    const name = getButtonName(i);
    if (!name) return null;
    return [getButtonName(i), v.pressed];
  });

  const reduced = pipe<
    [GamepadButton[]],
    BtnPair[],
    BtnPair<ButtonKeys>[],
    Record<string, boolean>
  >(
    indexedMap,
    filter(complement(isNil)),
    fromPairs
  )(buttons);

  return reduced as Record<ButtonKeys, boolean>;
};

export const mapAxes = (axes: number[]) => {
  type AxisPair<T = Maybe<AxesKeys>> = [T, number];
  const indexedMap = addIndex<number, AxisPair | null>(map)((v, i) => {
    const name = getAxisName(i);
    if (!name) return null;
    return [getAxisName(i), v];
  });

  const reduced = pipe<
    [number[]],
    AxisPair[],
    AxisPair<AxesKeys>[],
    Record<string, number>
  >(
    indexedMap,
    filter(complement(isNil)),
    fromPairs
  )(axes);

  return reduced as Record<AxesKeys, number>;
};
