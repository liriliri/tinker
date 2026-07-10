import builder from 'electron-builder'
import isMac from 'licia/isMac.js'

cd('dist')

const pkg = await fs.readJson('package.json')

const currentPlatform = `${process.platform}-${process.arch}`

const nativeModulesWithPrebuilds = {
  'node-pty': ['darwin-arm64', 'darwin-x64', 'win32-arm64', 'win32-x64'],
  'uiohook-napi': [
    'darwin-arm64',
    'darwin-x64',
    'linux-arm64',
    'linux-x64',
    'win32-x64',
  ],
}

const prebuildExclusions = []
for (const [pkg, platforms] of Object.entries(nativeModulesWithPrebuilds)) {
  const exclude = platforms.filter((p) => p !== currentPlatform)
  if (exclude.length > 0) {
    prebuildExclusions.push(
      `!node_modules/${pkg}/prebuilds/{${exclude.join(',')}}`
    )
  }
}

let publishChannel = '${productName}-latest'
if (isMac && process.arch !== 'arm64') {
  publishChannel = '${productName}-latest-${arch}'
}

const config = {
  appId: pkg.appId,
  directories: {
    output: `../release/${pkg.version}`,
  },
  files: [
    'main',
    'preload',
    'renderer',
    'plugins',

    '!node_modules/**/*.{map,ts,md,flow,yml,yaml,cs,gyp,gypi,h,c,html,Makefile}',
    '!node_modules/**/*LICENSE*',
    '!node_modules/**/*license*',
    '!node_modules/**/*eslint*',
    '!node_modules/**/*test*',
    '!node_modules/**/.vscode',
    '!node_modules/cpu-features',
    '!node_modules/nan',
    ...prebuildExclusions,
  ],
  asarUnpack: ['node_modules/npm/**'],
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  extraResources: [
    {
      from: 'resources',
      to: './',
      filter: ['**/*'],
    },
    {
      from: 'bin',
      to: 'bin',
    },
  ],
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
  linux: {
    executableName: 'tinker-app',
    category: 'Utility',
    executableArgs: ['--no-sandbox'],
    target: [
      {
        target: 'deb',
      },
      {
        target: 'rpm',
      },
    ],
  },
  mac: {
    hardenedRuntime: true,
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
      'com.apple.security.device.audio-input': true,
      'com.apple.security.device.camera': true,
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
