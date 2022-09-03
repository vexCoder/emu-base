import { useLatest, useToggle } from "ahooks";
import clsx from "clsx";
import { AnimatePresence, EasingFunction, motion } from "framer-motion";
import { useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  handleClose?: () => void;
  title?: string;
  children: React.ReactNode;
  duration?: number;
  ease?: Easing | EasingFunction;
}

type ModalPropsWChildren = BaseComponentProps<"section"> &
  ModalProps & {
    portal?: boolean;
  };

const ModalComponent = ({
  title,
  open,
  children,
  handleClose: _handleClose,
  duration = 0.35,
  ease = "easeInOut",
}: ModalProps) => {
  const [transitioned, actions] = useToggle(false);
  const ref = useRef<HTMLDivElement>(null);

  const latestOpen = useLatest(open);

  const handleClose = () => {
    _handleClose?.();
  };

  return (
    <section
      className={clsx(
        "fixed top-0 left-0 h-full w-full",
        !open && !transitioned && "-z-10",
        open && transitioned && "z-50"
      )}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="modal-backdrop"
            className="fixed h-full w-full bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              delay: (duration * 1) / 3,
              duration: (duration * 2) / 3,
              ease,
            }}
            onClick={() => {
              if (transitioned && latestOpen.current) {
                handleClose();
              }
            }}
            onAnimationComplete={() => {
              if (!latestOpen.current) {
                actions.set(false);
              }
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.div
            key="modal-container"
            className="fixed origin-center top-1/2 left-1/2 z-50 bg-primary rounded-xl min-w-[450px] p-4"
            style={{ y: "-50%", x: "-50%" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            ref={open ? ref : null}
            onAnimationComplete={() => {
              if (latestOpen.current) {
                actions.set(true);
              }
            }}
            transition={{ duration, ease }}
          >
            {title && <h2 className="line">{title}</h2>}
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const Modal = ({ children, portal = true, ...props }: ModalPropsWChildren) => {
  const Component = <ModalComponent {...props}>{children}</ModalComponent>;
  if (portal || typeof portal === "undefined")
    return createPortal(Component, document.body);
  return Component;
};

export default Modal;
