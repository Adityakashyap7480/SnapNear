/** Yes/no question before a destructive action. */
export function confirmAction(message: string): Promise<boolean> {
  return Promise.resolve(window.confirm(message));
}
