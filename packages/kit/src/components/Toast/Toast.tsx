import { UNSTABLE_Toast as AriaToast, UNSTABLE_ToastContent as AriaToastContent, UNSTABLE_ToastQueue as ToastQueue, UNSTABLE_ToastRegion as AriaToastRegion, Text } from 'react-aria-components'
import { IconButton } from '../IconButton/IconButton'
import './Toast.css'

export interface ToastMessage {
  readonly title: string
  readonly description?: string
  readonly tone?: 'neutral' | 'warning' | 'danger'
}

/** One queue for the application; call toast() from anywhere and render ToastRegion once. */
export const queue = new ToastQueue<ToastMessage>({ maxVisibleToasts: 4 })

export function toast(message: ToastMessage | string, options?: { timeout?: number; onClose?: () => void }): string {
  const m = typeof message === 'string' ? { title: message } : message
  return queue.add(m, options)
}

export function ToastRegion() {
  return (
    <AriaToastRegion queue={queue} className="kit-toast-region">
      {({ toast: t }) => (
        <AriaToast toast={t} className="kit-toast" data-tone={t.content.tone ?? 'neutral'}>
          <AriaToastContent className="kit-toast-content">
            <Text slot="title" className="kit-toast-title">
              {t.content.title}
            </Text>
            {t.content.description && (
              <Text slot="description" className="kit-toast-description">
                {t.content.description}
              </Text>
            )}
          </AriaToastContent>
          <IconButton slot="close" icon="close" size="sm" aria-label="Dismiss" tooltip={false} />
        </AriaToast>
      )}
    </AriaToastRegion>
  )
}
