import { Linking, Platform } from 'react-native';

/**
 * Opens tel:, mailto:, WhatsApp and map links. On web, http links open in a new tab
 * (like target="_blank") and tel:/mailto: open in place, the same as plain <a> tags.
 */
export function openLink(url: string) {
  if (Platform.OS === 'web') {
    if (/^https?:/i.test(url)) window.open(url, '_blank', 'noreferrer');
    else window.location.href = url;
    return;
  }
  Linking.openURL(url).catch(() => {});
}
