/* eslint-disable no-bitwise */
// @ts-nocheck

import keycode from "keycode";

const FFI = require("ffi-napi");
const StructType = require("ref-struct-napi");
const UnionType = require("ref-union-napi");
const ref = require("ref-napi");

const user32 = new FFI.Library("user32.dll", {
  SendInput: ["uint32", ["int32", "pointer", "int32"]],
  MapVirtualKeyExA: ["uint", ["uint", "uint", "int"]],
  SetActiveWindow: ["long", ["long"]],
  FindWindowA: ["long", ["string", "string"]],
});

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
    setTimeout(resolve, 250);
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

export const setActiveWindow = (name: string) => {
  const window = user32.FindWindowA(null, name);
  user32.SetActiveWindow(window);
};
