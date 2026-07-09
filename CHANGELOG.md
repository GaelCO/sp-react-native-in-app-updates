# 1.\*.\* -> 2.0.*

### New Architecture (TurboModules) support on Android

The Android native module now extends the codegen-generated TurboModule spec
instead of `ReactContextBaseJavaModule` directly, and the module is now
registered via a real `TurboReactPackage` (previously a plain `ReactPackage`,
which only worked through RN's legacy interop layer). This same class works
unchanged on apps still using the old bridge architecture, no app-side
changes are required.

`android/build.gradle` now applies the `com.facebook.react` Gradle plugin
directly, which is what actually runs codegen and generates
`NativeSpInAppUpdatesSpec` — previously it only applied `com.android.library`,
so codegen never ran for this module and consumer builds would have failed
with `cannot find symbol: class NativeSpInAppUpdatesSpec`. This makes RN
**>= 0.71** (where that plugin ships) the effective minimum supported
version, up from the previous unconstrained `react-native: "*"`.

### iOS defaults to the iTunes Search API instead of `react-native-siren`

`checkNeedsUpdate`/`startUpdate` on iOS no longer require `react-native-siren`
by default — they call the iTunes Search API directly, with no extra native
dependency. `react-native-siren` is now an optional peer dependency, still
available via `iosStrategy: 'siren'` on `CheckOptions`/`StartUpdateOptions`
for anyone who prefers it (install it separately if you use that option).

`new SpInAppUpdates(isDebug)` and its method signatures are unchanged.

### BREAKING (types only): `storeVersion`/`reason` are now optional on `NeedsUpdateResponseBase`

Both platforms already omitted these fields from `checkNeedsUpdate`'s result in
some success/failure branches; the types just didn't reflect that before. If
you're on strict TypeScript and read `result.storeVersion`/`result.reason`
without a null check (e.g. `semver.gt(result.storeVersion, ...)`), you'll need
to add one when upgrading.

# 1.2.* -> 1.3.*

### Android: Changing how we import core play dependencies.

- Google is moving away from a single `com.google.android.play:core` package, and instead it’s splitting functionality into multiple packages.
The only one we need for this library is: `com.google.android.play:app-update` so we've changed the project to only require that package.




# 0.\*.\* -> 1.0.*

BREAKING CHANGES:

### Changed how we import constants

Change:

- `SpInAppUpdates.UPDATE_TYPE` to `IAUUpdateKind`

- `SpInAppUpdates.UPDATE_STATUS` to `IAUAvailabilityStatus ` (and `IAUInstallStatus`) depending on what the status relates to (read on).


The following:

```
PENDING = 1,
DOWNLOADING = 2,
INSTALLING = 3,
INSTALLED = 4,
FAILED = 5,
CANCELED = 6,
DOWNLOADED = 11,
```

are all installation statuses, therefore they all belong to `IAUInstallStatus` from now on.

While the statuses below:

```
UNKNOWN = 0,
UNAVAILABLE = 1,
AVAILABLE = 2,
DEVELOPER_TRIGGERED = 3,
```

describe the update availability, and therefore belong to: `IAUAvailabilityStatus`

- Also the way to import those from now in is this:

`import { IAUUpdateKind, IAUInstallStatus, IAUAvailabilityStatus } from 'sp-react-native-in-app-updates';`