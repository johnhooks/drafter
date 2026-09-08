import type { ReactNode } from 'react'
import { Dialog as AriaDialog, type DialogProps as AriaDialogProps, DialogTrigger, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { Button } from '../Button/Button'
import { IconButton } from '../IconButton/IconButton'
import './Dialog.css'

export { DialogTrigger }

export interface DialogProps extends Omit<AriaDialogProps, 'children'> {
  readonly title: ReactNode
  readonly children: ReactNode | ((close: () => void) => ReactNode)
  /** Controls the modal when used without a DialogTrigger. */
  readonly isOpen?: boolean
  readonly onOpenChange?: (open: boolean) => void
  readonly isDismissable?: boolean
}

/** A modal dialog with a heading. Escape and clicking the overlay close it when dismissable. */
export function Dialog({ title, children, isOpen, onOpenChange, isDismissable = true, className, ...props }: DialogProps) {
  return (
    <ModalOverlay className="kit-overlay" isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={isDismissable}>
      <Modal className="kit-modal">
        <AriaDialog {...props} className={['kit-dialog', typeof className === 'string' ? className : ''].join(' ').trim()}>
          {({ close }) => (
            <>
              <div className="kit-dialog-head">
                <Heading slot="title" className="kit-dialog-title">
                  {title}
                </Heading>
                {isDismissable && <IconButton icon="close" size="sm" aria-label="Close" onPress={close} tooltip={false} />}
              </div>
              <div className="kit-dialog-body">{typeof children === 'function' ? children(close) : children}</div>
            </>
          )}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  )
}

export interface ConfirmDialogProps {
  readonly title: ReactNode
  readonly children: ReactNode
  readonly confirmLabel?: string
  readonly cancelLabel?: string
  readonly tone?: 'neutral' | 'danger'
  readonly isOpen: boolean
  readonly onConfirm: () => void
  readonly onCancel: () => void
}

/** A yes-or-no question. Escape and the overlay cancel; Enter on the focused confirm button confirms. */
export function ConfirmDialog({ title, children, confirmLabel = 'OK', cancelLabel = 'Cancel', tone = 'neutral', isOpen, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog title={title} isOpen={isOpen} onOpenChange={(open) => !open && onCancel()} role="alertdialog">
      <div className="kit-dialog-message">{children}</div>
      <div className="kit-dialog-actions">
        <Button onPress={onCancel}>{cancelLabel}</Button>
        <Button variant="primary" tone={tone} onPress={onConfirm} autoFocus>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}
