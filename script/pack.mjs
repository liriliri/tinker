import builder from 'electron-builder'
import isMac from 'licia/isMac.js'

cd('dist')

const pkg = await fs.readJson('package.json')

let publishChannel = '${productName}-latest'
if (isMac && process.arch !== 'arm64') {
  publishChannel = '${productName}-latest-${arch}'
}

const config = {
  appId: pkg.appId,
  directories: {
    output: `../release/${pkg.version}`,
  },
  files: ['main', 'preload', 'renderer', 'plugins'],
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  extraResources: {
    from: 'resources',
    to: './',
    filter: ['**/*'],
  },
  nsis: {
    allowToChangeInstallationDirectory: true,
    oneClick: false,
  },
  win: {
    target: [
      {
        target: 'nsis',
      },
    ],
  },
  mac: {
    electronLanguages: ['zh_CN', 'en'],
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    minimumSystemVersion: '10.13',
    target: [
      {
        target: 'dmg',
      },
    ],
    extendInfo: {
      LSEnvironment: {
        MallocNanoZone: '0',
      },
      LSUIElement: true,
      NSBluetoothAlwaysUsageDescription: 'This app needs access to Bluetooth',
      NSBluetoothPeripheralUsageDescription:
        'This app needs access to Bluetooth',
      NSCameraUsageDescription: 'This app needs access to the camera',
      NSMicrophoneUsageDescription:
        'Voice recognition requires microphone access.',
      NSScreenCaptureUsageDescription:
        'Screenshot and color picker features require screen recording access.',
      NSRequiresAquaSystemAppearance: false,
      NSQuitAlwaysKeepsWindows: false,
      NSSupportsAutomaticGraphicsSwitching: true,
    },
  },
  publish: {
    provider: 'generic',
    url: 'https://release.liriliri.io/',
    channel: publishChannel,
  },
}

await builder.build({
  config,
})
