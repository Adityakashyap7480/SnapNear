import { Alert } from 'react-native';

/** Yes/no question before a destructive action. */
export function confirmAction(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert('SnapNear', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}
