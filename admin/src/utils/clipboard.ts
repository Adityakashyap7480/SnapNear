import toast from 'react-hot-toast';

/** Copies text and shows a toast. Returns true when the copy worked. */
export async function copyToClipboard(text: string, label = 'Text', failMessage = 'Could not copy') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
    return true;
  } catch {
    toast.error(failMessage);
    return false;
  }
}
