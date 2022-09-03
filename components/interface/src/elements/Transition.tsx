import { AnimatePresence, motion } from "framer-motion";

type Easing =
  | [number, number, number, number]
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "circIn"
  | "circOut"
  | "circInOut"
  | "backIn"
  | "backOut"
  | "backInOut"
  | "anticipate";
type TransitionProps = BaseComponentProps<"div"> & {
  in: boolean;
  duration?: number | number[];
  delay?: number | number[];
  ease?: Easing | Easing[];
  preset?: keyof typeof Presets;
};

const Presets = {
  Fade: {
    default: {
      opacity: 0,
    },
    enter: {
      opacity: 1,
    },
    keys: ["opacity"],
  },
  SlideY: {
    default: {
      translateY: "3rem",
      opacity: 0,
    },
    enter: {
      translateY: "0rem",
      opacity: 1,
    },
    keys: ["translateY", "opacity"],
  },
} as const;

const Transition = ({
  in: open,
  children,
  ease = "linear",
  duration = 0.5,
  delay = 0,
  preset = "Fade",
}: TransitionProps) => {
  const setArrayOrSingle = <T,>(value: T, i: number) => {
    return Array.isArray(value) ? value[i] : value;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="Transition"
          initial={Presets[preset].default}
          animate={Presets[preset].enter}
          exit={Presets[preset].default}
          transition={{
            default: {
              duration: setArrayOrSingle(duration, 0),
              ease: setArrayOrSingle(ease, 0),
              delay: setArrayOrSingle(delay, 0),
            },
            ...[...Presets[preset].keys].reduce((p, c, i) => {
              return {
                ...p,
                [c]: {
                  duration: setArrayOrSingle(duration, i),
                  ease: setArrayOrSingle(ease, i),
                  delay: setArrayOrSingle(delay, i),
                },
              };
            }, {}),
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Transition;
