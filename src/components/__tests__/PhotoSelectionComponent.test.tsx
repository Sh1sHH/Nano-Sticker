import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { request, RESULTS } from 'react-native-permissions';
import PhotoSelectionComponent from '../PhotoSelectionComponent';

// Mock dependencies
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
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

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockLaunchImageLibrary = launchImageLibrary as jest.MockedFunction<typeof launchImageLibrary>;
const mockLaunchCamera = launchCamera as jest.MockedFunction<typeof launchCamera>;
const mockRequest = request as jest.MockedFunction<typeof request>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

describe('PhotoSelectionComponent', () => {
  const mockOnImageSelected = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
  });

  const defaultProps = {
    onImageSelected: mockOnImageSelected,
    onError: mockOnError,
  };

  it('renders correctly', () => {
    const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
    
    expect(getByText('Gallery')).toBeTruthy();
    expect(getByText('Camera')).toBeTruthy();
    expect(getByText('Tips for best results:')).toBeTruthy();
  });

  describe('Gallery Selection', () => {
    it('should request permission and launch gallery when gallery button is pressed', async () => {
      mockRequest.mockResolvedValue(RESULTS.GRANTED);
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalled();
        expect(mockLaunchImageLibrary).toHaveBeenCalled();
      });
    });

    it('should show permission alert when gallery permission is denied', async () => {
      mockRequest.mockResolvedValue(RESULTS.DENIED);
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Permission Required',
          'Please grant photo library access to select images.',
          [{ text: 'OK' }]
        );
      });
    });

    it('should handle successful image selection from gallery', async () => {
      mockRequest.mockResolvedValue(RESULTS.GRANTED);
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({
          assets: [{
            uri: 'file://test-image.jpg',
            fileName: 'test-image.jpg',
            fileSize: 1024 * 1024, // 1MB
            width: 800,
            height: 600,
          }],
        });
      });
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockOnImageSelected).toHaveBeenCalledWith('file://test-image.jpg');
      });
    });
  });

  describe('Camera Capture', () => {
    it('should request permission and launch camera when camera button is pressed', async () => {
      mockRequest.mockResolvedValue(RESULTS.GRANTED);
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Camera'));
      
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalled();
        expect(mockLaunchCamera).toHaveBeenCalled();
      });
    });

    it('should show permission alert when camera permission is denied', async () => {
      mockRequest.mockResolvedValue(RESULTS.DENIED);
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Camera'));
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Permission Required',
          'Please grant camera access to take photos.',
          [{ text: 'OK' }]
        );
      });
    });
  });

  describe('Image Validation', () => {
    beforeEach(() => {
      mockRequest.mockResolvedValue(RESULTS.GRANTED);
    });

    it('should reject images that are too large', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({
          assets: [{
            uri: 'file://large-image.jpg',
            fileName: 'large-image.jpg',
            fileSize: 15 * 1024 * 1024, // 15MB - exceeds 10MB limit
            width: 800,
            height: 600,
          }],
        });
      });
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Image file is too large (max 10MB)');
      });
    });

    it('should reject images that are too small', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({
          assets: [{
            uri: 'file://small-image.jpg',
            fileName: 'small-image.jpg',
            fileSize: 1024,
            width: 100, // Below 200px minimum
            height: 100,
          }],
        });
      });
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Image is too small (minimum 200x200px)');
      });
    });

    it('should reject unsupported image formats', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({
          assets: [{
            uri: 'file://image.bmp',
            fileName: 'image.bmp', // Unsupported format
            fileSize: 1024 * 1024,
            width: 800,
            height: 600,
          }],
        });
      });
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Unsupported format. Please use: jpg, jpeg, png, webp');
      });
    });

    it('should handle cancelled image selection', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ didCancel: true });
      });
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockOnImageSelected).not.toHaveBeenCalled();
        expect(mockOnError).not.toHaveBeenCalled();
      });
    });

    it('should handle image picker errors', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({ errorMessage: 'Camera not available' });
      });
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Image selection failed: Camera not available');
      });
    });

    it('should handle missing image URI', async () => {
      mockLaunchImageLibrary.mockImplementation((options, callback) => {
        callback({
          assets: [{
            fileName: 'test-image.jpg',
            fileSize: 1024 * 1024,
            width: 800,
            height: 600,
            // uri is missing
          }],
        });
      });
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Image URI is not available');
      });
    });
  });

  describe('Android Platform', () => {
    beforeEach(() => {
      Platform.OS = 'android';
    });

    it('should use correct Android permissions for API level 33+', async () => {
      Object.defineProperty(Platform, 'Version', {
        get: () => 33,
        configurable: true,
      });
      mockRequest.mockResolvedValue(RESULTS.GRANTED);
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledWith('android.permission.READ_MEDIA_IMAGES');
      });
    });

    it('should use legacy Android permissions for API level < 33', async () => {
      Object.defineProperty(Platform, 'Version', {
        get: () => 30,
        configurable: true,
      });
      mockRequest.mockResolvedValue(RESULTS.GRANTED);
      
      const { getByText } = render(<PhotoSelectionComponent {...defaultProps} />);
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledWith('android.permission.READ_EXTERNAL_STORAGE');
      });
    });
  });

  describe('Custom Processing Options', () => {
    it('should use custom processing options when provided', async () => {
      const customOptions = {
        quality: 0.9,
        maxWidth: 2048,
        maxHeight: 2048,
        format: 'png' as const,
      };

      mockRequest.mockResolvedValue(RESULTS.GRANTED);
      
      const { getByText } = render(
        <PhotoSelectionComponent 
          {...defaultProps} 
          processingOptions={customOptions}
        />
      );
      
      fireEvent.press(getByText('Gallery'));
      
      await waitFor(() => {
        expect(mockLaunchImageLibrary).toHaveBeenCalledWith(
          expect.objectContaining({
            quality: 0.9,
            maxWidth: 2048,
            maxHeight: 2048,
          }),
          expect.any(Function)
        );
      });
    });
  });
});