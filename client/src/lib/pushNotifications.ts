export async function isPushSupported(): Promise<boolean> {
  return false;
}

export async function getPermissionState(): Promise<NotificationPermission> {
  return "denied";
}

export async function subscribeToPush(_options?: Record<string, unknown>): Promise<boolean> {
  return false;
}

export async function unsubscribeFromPush(): Promise<boolean> {
  return true;
}

export async function isCurrentlySubscribed(): Promise<boolean> {
  return false;
}
