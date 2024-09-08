import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const Modal = ({ children }: Props) => {
  return (
    <div className="absolute left-0 right-0 top-0 bottom-0 w-screen h-full max-h-screen bg-gray-500 !blur-none overflow-hidden">
      {children}
    </div>
  );
};

export default Modal;
