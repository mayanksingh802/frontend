// "use client";

// import { useId, type FormEvent, type ReactNode } from "react";
// import Modal from "./Modal";

// interface FormModalProps {
//   title: string;
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit: (event: FormEvent<HTMLFormElement>) => void;
//   saveLabel: string;
//   children: ReactNode;
//   saving?: boolean;
//   variant?: "center" | "right";
//   resizable?: boolean;
// }

// export default function FormModal({
//   title,
//   isOpen,
//   onClose,
//   onSubmit,
//   saveLabel,
//   children,
//   saving = false,
//   variant = "center",
//   resizable = false,
// }: FormModalProps) {
//   const formId = useId();

//   return (
//     <Modal
//       title={title}
//       isOpen={isOpen}
//       onClose={onClose}
//       variant={variant}
//       resizable={resizable}
//       footer={
//         <>
//           <button
//             type="button"
//             className="app-modal-cancel"
//             onClick={onClose}
//             disabled={saving}
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="app-modal-save"
//             form={formId}
//             disabled={saving}
//           >
//             {saving ? "Saving..." : saveLabel}
//           </button>
//         </>
//       }
//     >
//       <form id={formId} onSubmit={onSubmit}>
//         {children}
//       </form>
//     </Modal>
//   );
// }

"use client";

import { useId, type FormEvent, type ReactNode } from "react";
import Modal from "./Modal";

interface FormModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saveLabel: string;
  children: ReactNode;
  saving?: boolean;
  variant?: "center" | "right";
  resizable?: boolean;
  formClassName?: string;
}

export default function FormModal({
  title,
  isOpen,
  onClose,
  onSubmit,
  saveLabel,
  children,
  saving = false,
  variant = "center",
  resizable = false,
  formClassName = "",
}: FormModalProps) {
  const formId = useId();

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      variant={variant}
      resizable={resizable}
      footer={
        <>
          <button
            type="button"
            className="app-modal-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="app-modal-save"
            form={formId}
            disabled={saving}
          >
            {saving ? "Saving..." : saveLabel}
          </button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={onSubmit}
        className={formClassName}
      >
        {children}
      </form>
    </Modal>
  );
}