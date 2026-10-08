"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useRef } from "react";
import { X } from "lucide-react";
export function Modal({
  open,
  onOpenChange,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content"
          aria-describedby={undefined}
          onOpenAutoFocus={() => { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }}
          onCloseAutoFocus={(event) => { event.preventDefault(); opener.current?.focus(); }}
        >
          <Dialog.Title className="dialog-title">{title}</Dialog.Title>
          {children}
          <Dialog.Close className="dialog-close" aria-label={closeLabel}>
            <X size={22} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
