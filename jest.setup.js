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

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');