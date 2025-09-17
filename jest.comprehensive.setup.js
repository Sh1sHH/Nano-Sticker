// Comprehensive test suite setup
import 'react-native-gesture-handler/jestSetup';

// Extend default timeout for comprehensive tests
jest.setTimeout(30000);

// Mock performance API for Node.js environment
if (typeof performance === 'undefined') {
  global.performance = require('perf_hooks').performance;
}

// Mock Google Cloud services
jest.mock('@google-cloud/aiplatform', () => ({
  PredictionServiceClient: jest.fn().mockImplementation(() => ({
    predict: jest.fn().mockResolvedValue([{
      predictions: [{
        bytesBase64Encoded: Buffer.from('mock-generated-image').toString('base64'),
      }],
    }]),
    initialize: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('@google-cloud/monitoring', () => ({
  MetricServiceClient: jest.fn().mockImplementation(() => ({
    createTimeSeries: jest.fn().mockResolvedValue([{}]),
    listTimeSeries: jest.fn().mockResolvedValue([[]]),
    getProject: jest.fn().mockReturnValue('projects/test-project'),
  })),
}));

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: jest.fn().mockReturnValue({
      file: jest.fn().mockReturnValue({
        save: jest.fn().mockResolvedValue(),
        getSignedUrl: jest.fn().mockResolvedValue(['https://mock-signed-url.com']),
        exists: jest.fn().mockResolvedValue([true]),
      }),
    }),
  })),
}));

// Mock React Native modules for comprehensive testing
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
  MediaType: {
    photo: 'photo',
    video: 'video',
    mixed: 'mixed',
  },
}));

jest.mock('react-native-share', () => ({
  open: jest.fn().mockResolvedValue({ success: true }),
  shareSingle: jest.fn().mockResolvedValue({ success: true }),
  Social: {
    WHATSAPP: 'whatsapp',
    FACEBOOK: 'facebook',
    TWITTER: 'twitter',
  },
}));

jest.mock('react-native-permissions', () => ({
  request: jest.fn().mockResolvedValue('granted'),
  check: jest.fn().mockResolvedValue('granted'),
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
    BLOCKED: 'blocked',
  },
}));

jest.mock('@bam.tech/react-native-image-resizer', () => ({
  createResizedImage: jest.fn().mockResolvedValue({
    uri: 'file://resized-image.jpg',
    width: 512,
    height: 512,
    size: 100000,
  }),
}));

jest.mock('react-native-fs', () => ({
  stat: jest.fn().mockResolvedValue({ size: 1024000 }),
  exists: jest.fn().mockResolvedValue(true),
  unlink: jest.fn().mockResolvedValue(),
  copyFile: jest.fn().mockResolvedValue(),
  writeFile: jest.fn().mockResolvedValue(),
  readFile: jest.fn().mockResolvedValue('mock-file-content'),
  DocumentDirectoryPath: '/mock/documents',
  CachesDirectoryPath: '/mock/caches',
  TemporaryDirectoryPath: '/mock/temp',
}));

jest.mock('@react-native-camera-roll/camera-roll', () => ({
  save: jest.fn().mockResolvedValue('mock-photo-uri'),
  getPhotos: jest.fn().mockResolvedValue({
    edges: [],
    page_info: { has_next_page: false },
  }),
}));

jest.mock('@shopify/react-native-skia', () => ({
  Canvas: 'Canvas',
  useCanvasRef: jest.fn(),
  Circle: 'Circle',
  Paint: 'Paint',
  Skia: {
    Paint: jest.fn(),
    Path: jest.fn(),
  },
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Mock Zustand store
jest.mock('zustand', () => ({
  create: (fn) => {
    const store = fn(() => {}, () => {});
    return () => store;
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(),
  removeItem: jest.fn().mockResolvedValue(),
  clear: jest.fn().mockResolvedValue(),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(),
  multiRemove: jest.fn().mockResolvedValue(),
}));

// Mock payment services
jest.mock('react-native-iap', () => ({
  initConnection: jest.fn().mockResolvedValue(true),
  endConnection: jest.fn().mockResolvedValue(),
  getProducts: jest.fn().mockResolvedValue([]),
  requestPurchase: jest.fn().mockResolvedValue({}),
  finishTransaction: jest.fn().mockResolvedValue(),
  validateReceiptIos: jest.fn().mockResolvedValue({ isValid: true }),
  validateReceiptAndroid: jest.fn().mockResolvedValue({ isValid: true }),
}));

// Global test utilities
global.mockImageData = Buffer.from('mock-image-data');
global.mockGeneratedSticker = {
  id: 'test-sticker-123',
  imageUrl: 'file://test-sticker.png',
  style: 'cartoon',
  emotion: 'happy',
  createdAt: new Date(),
};

// Performance testing utilities
global.measurePerformance = (fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  return {
    result,
    duration: end - start,
  };
};

// Async performance testing
global.measureAsyncPerformance = async (fn) => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    duration: end - start,
  };
};

// Test data generators
global.generateMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  credits: 10,
  subscriptionStatus: 'free',
  createdAt: new Date(),
  ...overrides,
});

global.generateMockImage = (overrides = {}) => ({
  uri: 'file://test-image.jpg',
  width: 1024,
  height: 1024,
  fileSize: 500000,
  type: 'image/jpeg',
  ...overrides,
});

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

console.log('🧪 Comprehensive test suite setup completed');