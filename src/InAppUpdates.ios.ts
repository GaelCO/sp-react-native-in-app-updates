import { Alert, Linking } from 'react-native';
import { getBundleId, getVersion } from 'react-native-device-info';

import { compareVersions } from './utils';
import InAppUpdatesBase from './InAppUpdatesBase';
import { fetchItunesLookup } from './itunesLookup';
import type {
  CheckOptions,
  IosPerformCheckResponse,
  IosStartUpdateOptions,
  IosNeedsUpdateResponse,
} from './types';

const noop = () => {};

const DEFAULT_TITLE = 'Update Available';
const DEFAULT_MESSAGE =
  'There is an updated version available on the App Store. Would you like to upgrade?';
const DEFAULT_BUTTON_UPGRADE_TEXT = 'Upgrade';
const DEFAULT_BUTTON_CANCEL_TEXT = 'Cancel';

// react-native-siren is an optional peer dependency, only required when iosStrategy is 'siren'
const requireSiren = () => {
  try {
    return require('react-native-siren').default;
  } catch (e) {
    throw new Error(
      "iosStrategy 'siren' requires the react-native-siren package, which isn't installed. " +
        'Install it with `npm install react-native-siren` (or remove `iosStrategy: "siren"` to use the default iTunes Search API strategy).'
    );
  }
};

export default class InAppUpdates extends InAppUpdatesBase {
  public checkNeedsUpdate(
    checkOptions?: CheckOptions
  ): Promise<IosNeedsUpdateResponse> {
    const {
      bundleId,
      curVersion,
      toSemverConverter,
      customVersionComparator,
      country,
      iosStrategy = 'itunes',
    } = checkOptions || {};

    let appVersion: string;
    if (curVersion) {
      appVersion = curVersion;
    } else {
      appVersion = getVersion();
    }
    this.debugLog('Checking store version (iOS)');

    const performCheck: Promise<IosPerformCheckResponse> =
      iosStrategy === 'siren'
        ? requireSiren().performCheck({ bundleId, country })
        : this.performItunesCheck(bundleId, country, appVersion);

    return performCheck
      .then((checkResponse: IosPerformCheckResponse) => {
        this.debugLog(
          `Received response from app store: ${JSON.stringify(checkResponse)}`
        );
        const { version } = checkResponse || {};

        if (version != null) {
          let newAppV = `${version}`;
          if (toSemverConverter) {
            newAppV = toSemverConverter(version);
            this.debugLog(
              `Used custom semver, and converted result from store (${version}) to ${newAppV}`
            );
            if (!newAppV) {
              this.throwError(
                `Couldnt convert ${version} using your custom semver converter`,
                'checkNeedsUpdate'
              );
            }
          }
          const vCompRes = customVersionComparator
            ? customVersionComparator(newAppV, appVersion)
            : compareVersions(newAppV, appVersion);

          if (vCompRes > 0) {
            this.debugLog(
              `Compared cur version (${appVersion}) with store version (${newAppV}). The store version is higher!`
            );
            // app store version is higher than the current version
            return {
              shouldUpdate: true,
              storeVersion: newAppV,
              other: { ...checkResponse },
            };
          }
          this.debugLog(
            `Compared cur version (${appVersion}) with store version (${newAppV}). The current version is higher!`
          );
          return {
            shouldUpdate: false,
            storeVersion: newAppV,
            reason: `current version (${appVersion}) is already later than the latest store version (${newAppV}${
              toSemverConverter ? ` - originated from ${version}` : ''
            })`,
            other: { ...checkResponse },
          };
        }
        this.debugLog('Failed to fetch a store version');
        return {
          shouldUpdate: false,
          reason: "Couldn't fetch the latest version",
          other: { ...checkResponse },
        };
      })
      .catch((err: any) => {
        this.debugLog(err);
        return this.throwError(err, 'checkNeedsUpdate');
      });
  }

  private async performItunesCheck(
    bundleId: string | undefined,
    country: string | undefined,
    appVersion: string
  ): Promise<IosPerformCheckResponse> {
    const resolvedBundleId = bundleId || getBundleId();
    const entry = await fetchItunesLookup(resolvedBundleId, country);
    if (!entry) {
      return { updateIsAvailable: false } as IosPerformCheckResponse;
    }
    return {
      ...entry,
      updateIsAvailable: compareVersions(entry.version, appVersion) > 0,
    };
  }

  startUpdate(updateOptions: IosStartUpdateOptions): Promise<void> {
    const { iosStrategy = 'itunes' } = updateOptions || {};
    if (iosStrategy === 'siren') {
      return Promise.resolve(
        requireSiren().promptUser(
          updateOptions,
          updateOptions?.versionSpecificOptions,
          updateOptions?.bundleId,
          updateOptions?.country
        )
      );
    }
    return this.promptUserForUpdate(updateOptions);
  }

  private async promptUserForUpdate(
    updateOptions: IosStartUpdateOptions
  ): Promise<void> {
    const { bundleId, country, versionSpecificOptions } = updateOptions || {};
    const resolvedBundleId = bundleId || getBundleId();
    const [entry, appVersion] = await Promise.all([
      fetchItunesLookup(resolvedBundleId, country),
      Promise.resolve(getVersion()),
    ]);

    const versionOverride = versionSpecificOptions?.find(
      (option) => option.localVersion === appVersion
    );
    const {
      title = DEFAULT_TITLE,
      message = DEFAULT_MESSAGE,
      buttonUpgradeText = DEFAULT_BUTTON_UPGRADE_TEXT,
      buttonCancelText = DEFAULT_BUTTON_CANCEL_TEXT,
      forceUpgrade = false,
      reverseButtons = false,
    } = versionOverride || updateOptions;

    return new Promise<void>((resolve) => {
      const openStore = () => {
        if (entry?.trackViewUrl) {
          Linking.openURL(entry.trackViewUrl.split('?')[0]);
        }
        resolve();
      };
      const cancel = {
        text: buttonCancelText,
        style: 'cancel' as const,
        onPress: () => resolve(),
      };
      const upgrade = { text: buttonUpgradeText, onPress: openStore };
      const buttons = forceUpgrade
        ? [upgrade]
        : reverseButtons
        ? [upgrade, cancel]
        : [cancel, upgrade];

      this.debugLog(`Prompting user to update (title: ${title})`);
      Alert.alert(title, message, buttons);
    });
  }

  installUpdate = noop;
  addStatusUpdateListener = noop;
  removeStatusUpdateListener = noop;
  addIntentSelectionListener = noop;
  removeIntentSelectionListener = noop;
}
