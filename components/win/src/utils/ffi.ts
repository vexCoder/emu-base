/* eslint-disable no-bitwise */
// @ts-nocheck

import keycode from "keycode";

const FFI = require("ffi-napi");
const StructType = require("ref-struct-napi");
const UnionType = require("ref-union-napi");
const ref = require("ref-napi");

const stringPtr = ref.refType(ref.types.CString);

const user32 = new FFI.Library("user32.dll", {
  SendInput: ["uint32", ["int32", "pointer", "int32"]],
  MapVirtualKeyExA: ["uint", ["uint", "uint", "int"]],
  SetActiveWindow: ["long", ["long"]],
  ShowWindow: ["bool", ["long", "int"]],
  SwitchToThisWindow: ["bool", ["long", "bool"]],
  GetWindow: ["long", ["long", "uint"]],
  FindWindowA: ["long", ["string", "string"]],
  GetWindowInfo: ["bool", ["long", "pointer"]],
  GetWindowTextA: ["long", ["long", stringPtr, "long"]],
  EnumWindows: ["bool", ["pointer", "long"]],
  GetWindowThreadProcessId: ["long", ["long", "pointer"]],
  GetForegroundWindow: ["long", []],
  GetWindowRect: ["bool", ["long", "pointer"]],
  SetFocus: ["long", ["long"]],
  SetWindowPos: ["bool", ["long", "long", "int", "int", "int", "int", "uint"]],
  SetForegroundWindow: ["bool", ["long"]],
  AttachThreadInput: ["bool", ["int", "long", "bool"]],
});

// const kernel32 = new FFI.Library("Kernel32.dll", {
//   GetCurrentThreadId: ["int", []],
// });

// typedef struct tagMOUSEINPUT {
//   LONG    dx;
//   LONG    dy;
//   DWORD   mouseData;
//   DWORD   dwFlags;
//   DWORD   time;
//   ULONG_PTR dwExtraInfo;
// } MOUSEINPUT;
const MOUSEINPUT = StructType({
  dx: "int32",
  dy: "int32",
  mouseData: "uint32",
  flags: "uint32",
  time: "uint32",
  extraInfo: "pointer",
});

// typedef struct tagKEYBDINPUT {
//   WORD    wVk;
//   WORD    wScan;
//   DWORD   dwFlags;
//   DWORD   time;
//   ULONG_PTR dwExtraInfo;
// } KEYBDINPUT;
const KEYBDINPUT = StructType({
  vk: "uint16",
  scan: "uint16",
  flags: "uint32",
  time: "uint32",
  extraInfo: "pointer",
});

// typedef struct tagHARDWAREINPUT {
//   DWORD   uMsg;
//   WORD    wParamL;
//   WORD    wParamH;
// } HARDWAREINPUT;
const HARDWAREINPUT = StructType({
  msg: "uint32",
  paramL: "uint16",
  paramH: "uint16",
});

// typedef struct tagINPUT {
//   DWORD   type;
//   union
//   {
//     MOUSEINPUT      mi;
//     KEYBDINPUT      ki;
//     HARDWAREINPUT   hi;
//   } DUMMYUNIONNAME;
// } INPUT;
const INPUT_UNION = UnionType({
  mi: MOUSEINPUT,
  ki: KEYBDINPUT,
  hi: HARDWAREINPUT,
});

const INPUT = StructType({
  type: "uint32",
  union: INPUT_UNION,
});

export function ConvertKeyCodeToScanCode(keyCode: number) {
  return user32.MapVirtualKeyExA(keyCode, 0, 0);
}

export const sendKeyToWindow = async (
  keyCode: keyof typeof keycode.codes | keyof typeof keycode.aliases
) => {
  const scanCode = ConvertKeyCodeToScanCode(keycode(keyCode));

  const keyDownKeyboardInput = KEYBDINPUT({
    vk: 0,
    extraInfo: ref.NULL_POINTER,
    time: 0,
    scan: scanCode,
    flags: 0x0008,
  });

  const keyDownInput = INPUT({
    type: 1,
    union: INPUT_UNION({ ki: keyDownKeyboardInput }),
  });
  user32.SendInput(1, keyDownInput.ref(), INPUT.size);

  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });

  const keyUpKeyboardInput = KEYBDINPUT({
    vk: 0,
    extraInfo: ref.NULL_POINTER,
    time: 0,
    scan: scanCode,
    flags: 0x0008 | 0x0002,
  });
  const keyUpInput = INPUT({
    type: 1,
    union: INPUT_UNION({ ki: keyUpKeyboardInput }),
  });
  user32.SendInput(1, keyUpInput.ref(), INPUT.size);
};

export const setActiveWindowByName = (name: string) => {
  const window = user32.FindWindowA(null, name);
  user32.SetActiveWindow(window);
};

export enum ShowWindowFlags {
  SW_MAXIMIZE = 3,
  SW_MINIMIZE = 6,
  SW_RESTORE = 9,
  SW_NORMAL = 1,
  SW_SHOW = 5,
}

export const getWindowByName = (name: string) => {
  const window = user32.FindWindowA(null, name);
  return window;
};

export const getWindow = (handle: number | any) => {
  const window = user32.GetWindow(handle, null);
  return window;
};

export const setActiveWindow = (
  handle: number | any,
  flag: ShowWindowFlags = ShowWindowFlags.SW_MAXIMIZE
) => {
  user32.ShowWindow(handle, flag);
  user32.SetForegroundWindow(handle);
  user32.SetFocus(handle);
  user32.SetActiveWindow(handle);
};

export const getWindowText = (handle: number | any) => {
  const buf = Buffer.alloc(255);
  user32.GetWindowTextA(handle, buf, 255);
  const name = ref.readCString(buf, 0);
  // const val = new StringDecoder("ucs2").write(buf).replace(/\0/g, "");
  return name;
};

export const listWindows = () => {
  const handles: number[] = [];
  const callback = new FFI.Callback("bool", ["long", "int32"], (handle) => {
    handles.push(handle);
    return true;
  });

  user32.EnumWindows(callback, 0);

  const windows: { title: string; handle: number }[] = handles
    .map((v) => ({
      title: getWindowText(v),
      handle: v,
    }))
    .filter((v) => !!v.title.length);

  return windows;
};

const pointerToRect = (
  rectPointer: Buffer
): Record<"left" | "top" | "bottom" | "right", number> => {
  const rect = {};
  rect.left = rectPointer.readInt16LE(0);
  rect.top = rectPointer.readInt16LE(4);
  rect.right = rectPointer.readInt16LE(8);
  rect.bottom = rectPointer.readInt16LE(12);
  return rect;
};

export const getWindowRect = (handle: number) => {
  const rectBuffer = Buffer.alloc(16);

  const rect = user32.GetWindowRect(handle, rectBuffer);
  return rect ? pointerToRect(rectBuffer) : undefined;
};

export const sendHoldKeyToWindow = (
  keyCode: keyof typeof keycode.codes | keyof typeof keycode.aliases
) => {
  const scanCode = ConvertKeyCodeToScanCode(keycode(keyCode));

  const keyDownKeyboardInput = KEYBDINPUT({
    vk: 0,
    extraInfo: ref.NULL_POINTER,
    time: 0,
    scan: scanCode,
    flags: 0x0008,
  });

  const keyDownInput = INPUT({
    type: 1,
    union: INPUT_UNION({ ki: keyDownKeyboardInput }),
  });

  user32.SendInput(1, keyDownInput.ref(), INPUT.size);

  return async () => {
    const keyUpKeyboardInput = KEYBDINPUT({
      vk: 0,
      extraInfo: ref.NULL_POINTER,
      time: 0,
      scan: scanCode,
      flags: 0x0008 | 0x0002,
    });
    const keyUpInput = INPUT({
      type: 1,
      union: INPUT_UNION({ ki: keyUpKeyboardInput }),
    });
    user32.SendInput(1, keyUpInput.ref(), INPUT.size);
  };
};
