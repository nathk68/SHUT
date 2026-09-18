import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

export async function copyToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
