/* eslint-disable no-alert */
import React from 'react';
import SpInAppUpdates, {
  NeedsUpdateResponse,
  IAUUpdateKind,
  StartUpdateOptions,
  StatusUpdateEvent,
  IosStrategy,
} from 'sp-react-native-in-app-updates';

import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Platform,
  Text,
} from 'react-native';
const pkg = require('../../package.json');

const COLORS = {
  background: '#0B1120',
  card: '#151B2E',
  border: '#22293F',
  primary: '#22C55E',
  primaryDisabled: '#33415580',
  secondary: '#1E293B',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  badgeYes: '#22C55E',
  badgeNo: '#334155',
  badgeUnknown: '#475569',
  error: '#EF4444',
};

const CURRENT_VERSION = '0.0.8';

const HIGH_PRIORITY_UPDATE = 5; // Arbitrary, depends on how you handle priority in the Play Console
type AppState = {
  needsUpdate: boolean | null;
  otherData?: NeedsUpdateResponse | null;
  error: string | null;
  iosStrategy: IosStrategy;
};
export default class App extends React.Component<{}, AppState> {
  private inAppUpdates: SpInAppUpdates;

  state: AppState = {
    needsUpdate: null,
    otherData: null,
    error: null,
    iosStrategy: 'itunes',
  };

  constructor(props: any) {
    super(props);
    this.inAppUpdates = new SpInAppUpdates(
      true // debug verbosely
    );
  }

  toggleIosStrategy = () => {
    this.setState((prevState) => ({
      iosStrategy: prevState.iosStrategy === 'itunes' ? 'siren' : 'itunes',
    }));
  };

  checkForUpdates = () => {
    this.inAppUpdates
      .checkNeedsUpdate({
        curVersion: CURRENT_VERSION,
        ...(Platform.OS === 'ios'
          ? { iosStrategy: this.state.iosStrategy }
          : null),
        // toSemverConverter: (ver: SemverVersion) => {
        //   // i.e if 400401 is the Android version, and we want to convert it to 4.4.1
        //   const androidVersionNo = parseInt(ver, 10);
        //   const majorVer = Math.trunc(androidVersionNo / 10000);
        //   const minorVerStarter = androidVersionNo - majorVer * 10000;
        //   const minorVer = Math.trunc(minorVerStarter / 100);
        //   const patchVersion = Math.trunc(minorVerStarter - minorVer * 100);
        //   return `${majorVer}.${minorVer}.${patchVersion}`;
        // },
      })
      .then((result: NeedsUpdateResponse) => {
        this.setState({
          needsUpdate: result.shouldUpdate,
          otherData: result,
        });
      })
      .catch((error) => {
        this.setState({
          error,
        });
      });
  };

  startUpdating = () => {
    if (this.state.needsUpdate) {
      let updateOptions: StartUpdateOptions = {};
      if (Platform.OS === 'ios') {
        updateOptions = { iosStrategy: this.state.iosStrategy };
      }
      if (Platform.OS === 'android' && this.state.otherData) {
        const { otherData } = this.state || {
          otherData: null,
        };
        // @ts-expect-error TODO: Check if updatePriority exists
        if (otherData?.updatePriority >= HIGH_PRIORITY_UPDATE) {
          updateOptions = {
            updateType: IAUUpdateKind.IMMEDIATE,
          };
        } else {
          updateOptions = {
            updateType: IAUUpdateKind.FLEXIBLE,
          };
        }
      }
      this.inAppUpdates.addStatusUpdateListener(this.onStatusUpdate);
      this.inAppUpdates.startUpdate(updateOptions);
    } else {
      // @ts-ignore
      alert('doesnt look like we need an update');
    }
  };

  onStatusUpdate = (event: StatusUpdateEvent) => {
    // const {
    //   // status,
    //   bytesDownloaded,
    //   totalBytesToDownload,
    // } = event;
    // do something
    console.log(`@@ ${JSON.stringify(event)}`);
  };

  render() {
    const { needsUpdate, error, otherData, iosStrategy } = this.state;
    let statusTxt;
    let badgeColor = COLORS.badgeUnknown;
    if (needsUpdate) {
      statusTxt = 'YES';
      badgeColor = COLORS.badgeYes;
    } else if (needsUpdate === false) {
      statusTxt = 'NO';
      badgeColor = COLORS.badgeNo;
    } else if (error) {
      statusTxt = 'ERROR';
      badgeColor = COLORS.error;
    } else {
      statusTxt = 'UNKNOWN';
    }
    return (
      <>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.background}
        />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>In-App Updates</Text>
            <Text style={styles.subtitle}>Example App</Text>

            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current version</Text>
                <Text style={styles.infoValue}>{CURRENT_VERSION}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Store version</Text>
                <Text style={styles.infoValue}>
                  {otherData?.storeVersion ?? '—'}
                </Text>
              </View>
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>Needs update</Text>
                <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                  <Text style={styles.badgeText}>{statusTxt}</Text>
                </View>
              </View>
            </View>

            {Platform.OS === 'ios' ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={this.toggleIosStrategy}
              >
                <Text style={styles.secondaryButtonText}>
                  iOS strategy: {iosStrategy} (tap to switch)
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={this.checkForUpdates}
            >
              <Text style={styles.primaryButtonText}>Check for updates</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !needsUpdate && styles.primaryButtonDisabled,
              ]}
              disabled={!needsUpdate}
              onPress={this.startUpdating}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  !needsUpdate && styles.primaryButtonTextDisabled,
                ]}
              >
                Start Updating
              </Text>
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>Error: {error}</Text>
              </View>
            ) : null}

            <Text style={styles.footer}>
              sp-react-native-in-app-updates v{pkg.version}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 18,
    paddingVertical: 4,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 14,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.primaryDisabled,
  },
  primaryButtonText: {
    color: '#06210F',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#3B1220',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: 14,
    marginTop: 4,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
  },
  footer: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
