import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('react-native-share', () => ({
  open: jest.fn(),
  shareSingle: jest.fn(),
  Social: {
    WHATSAPP: 'whatsapp',
  },
}));

jest.mock('react-native-permissions', () => ({
  request: jest.fn(),
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
      READ_MEDIA_IMAGES: 'android.permission.READ_MEDIA_IMAGES',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
  },
}));

jest.mock('@bam.tech/react-native-image-resizer', () => ({
  createResizedImage: jest.fn(),
}));

jest.mock('react-native-fs', () => ({
  stat: jest.fn(),
  exists: jest.fn(),
  unlink: jest.fn(),
  copyFile: jest.fn(),
  writeFile: jest.fn(),
  DocumentDirectoryPath: '/mock/documents',
  CachesDirectoryPath: '/mock/caches',
}));

jest.mock('@react-native-camera-roll/camera-roll', () => ({
  save: jest.fn(),
}));

// Mock Linking separately to avoid React Native module issues
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  canOpenURL: jest.fn(),
  openURL: jest.fn(),
}));

// jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');