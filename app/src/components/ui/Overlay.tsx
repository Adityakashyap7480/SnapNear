import { type ReactNode, useId } from 'react';
import { Modal } from 'react-native';
import Toaster from './Toaster';

interface OverlayProps {
  visible?: boolean;
  onRequestClose?: () => void;
  children: ReactNode;
}

/** Full-screen layer above the page (dialogs, celebrations, alarms) that also shows toasts on top. */
export default function Overlay({ visible = true, onRequestClose, children }: OverlayProps) {
  const host = useId();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose} statusBarTranslucent>
      {children}
      {visible && <Toaster host={host} />}
    </Modal>
  );
}
