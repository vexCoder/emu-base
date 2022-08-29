import { createPortal } from "react-dom";

interface ModalProps {
  title?: string;
}

type ModalPropsWChildren = React.PropsWithChildren<
  ModalProps & { portal: boolean }
>;

const ModalComponent = ({ title }: ModalProps) => {
  return (
    <section className="fixed top-1/2 left-1/2 origin-center -translate-x-1/2 -translate-y-1/2">
      {title && <h2 className="line">Modal</h2>}
    </section>
  );
};

const Modal = ({ children, portal, ...props }: ModalPropsWChildren) => {
  if (portal || typeof portal === "undefined")
    return createPortal(<ModalComponent {...props} />, document.body);
  return <ModalComponent {...props} />;
};

export default Modal;
