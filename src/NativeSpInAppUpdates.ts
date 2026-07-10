import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  setStatusUpdateSubscription(active: boolean): void;

  checkNeedsUpdate(): Promise<{
    updateAvailability: number;
    isImmediateUpdateAllowed: boolean;
    isFlexibleUpdateAllowed: boolean;
    updatePriority: number;
    dayStaleness?: number;
    versionCode: number;
    packageName?: string;
    totalBytes?: number;
  }>;

  startUpdate(updateType: number): Promise<void>;

  installUpdate(): void;

  addListener(eventType: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SpInAppUpdates');
