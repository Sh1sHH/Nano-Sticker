import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import App from '../../App';
import { useAppStore } from '../../stores/appStore';

// Mock the entire navigation stack for E2E testing
const Stack = createStackNavigator();

const MockNavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="App" component={() => <>{children}</>} />
    </Stack.Navigator>
  </NavigationContainer>
);

// Mock AI service responses
jest.mock('../../services/aiService', () => ({
  generateSticker: jest.fn(),
  generateMultipleStickers: jest.fn(),
}));

// Mock image processing
jest.mock('../../services/imageService', () => ({
  compressImage: jest.fn(),
  validateImage: jest.fn(),
  processImageForAI: jest.fn(),
}));

describe('Complete Sticker Creation Flow E2E', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAppStore.getState().resetStickerCreation();
    jest.clearAllMocks();
  });

  it('should complete full user journey from photo selection to sticker export', async () => {
    const mockImage = {
      uri: 'file://test-image.jpg',
      width: 1024,
      height: 1024,
      fileSize: 500000,
      type: 'image/jpeg',
    };

    const mockGeneratedSticker = {
      id: 'sticker-123',
      imageUrl: 'file://generated-sticker.png',
      style: 'cartoon',
      emotions: ['happy', 'excited'],
    };

    // Mock successful image selection
    const { launchImageLibrary } = require('react-native-image-picker');
    launchImageLibrary.mockImplementation((options, callback) => {
      callback({
        didCancel: false,
        assets: [mockImage],
      });
    });

    // Mock successful AI generation
    const { generateMultipleStickers } = require('../../services/aiService');
    generateMultipleStickers.mockResolvedValue([mockGeneratedSticker]);

    // Mock successful image processing
    const { compressImage, validateImage, processImageForAI } = require('../../services/imageService');
    validateImage.mockResolvedValue(true);
    compressImage.mockResolvedValue(mockImage);
    processImageForAI.mockResolvedValue(mockImage);

    const { getByTestId, getByText, queryByText } = render(
      <MockNavigationWrapper>
        <App />
      </MockNavigationWrapper>
    );

    // Step 1: Start sticker creation
    await waitFor(() => {
      expect(getByTestId('home-screen')).toBeTruthy();
    });

    const createStickerButton = getByTestId('create-sticker-button');
    fireEvent.press(createStickerButton);

    // Step 2: Photo selection
    await waitFor(() => {
      expect(getByTestId('photo-selection-screen')).toBeTruthy();
    });

    const selectFromGalleryButton = getByTestId('select-from-gallery-button');
    fireEvent.press(selectFromGalleryButton);

    // Wait for image selection and validation
    await waitFor(() => {
      expect(validateImage).toHaveBeenCalledWith(mockImage);
      expect(compressImage).toHaveBeenCalledWith(mockImage, expect.any(Object));
    });

    // Step 3: Segmentation screen
    await waitFor(() => {
      expect(getByTestId('segmentation-screen')).toBeTruthy();
    });

    // Simulate successful segmentation
    const proceedToStyleButton = getByTestId('proceed-to-style-button');
    fireEvent.press(proceedToStyleButton);

    // Step 4: Style selection
    await waitFor(() => {
      expect(getByTestId('style-selection-screen')).toBeTruthy();
    });

    const cartoonStyleButton = getByTestId('style-cartoon');
    fireEvent.press(cartoonStyleButton);

    const confirmStyleButton = getByTestId('confirm-style-button');
    fireEvent.press(confirmStyleButton);

    // Step 5: AI processing
    await waitFor(() => {
      expect(getByTestId('processing-screen')).toBeTruthy();
    });

    // Wait for AI processing to complete
    await waitFor(() => {
      expect(generateMultipleStickers).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUri: mockImage.uri,
          style: 'cartoon',
        })
      );
    }, { timeout: 10000 });

    // Step 6: Effects screen
    await waitFor(() => {
      expect(getByTestId('effects-screen')).toBeTruthy();
    });

    // Apply some effects
    const borderEffectButton = getByTestId('border-effect-button');
    fireEvent.press(borderEffectButton);

    const proceedToExportButton = getByTestId('proceed-to-export-button');
    fireEvent.press(proceedToExportButton);

    // Step 7: Export screen
    await waitFor(() => {
      expect(getByTestId('export-screen')).toBeTruthy();
    });

    const saveToGalleryButton = getByTestId('save-to-gallery-button');
    fireEvent.press(saveToGalleryButton);

    // Verify completion
    await waitFor(() => {
      expect(getByText('Sticker saved successfully!')).toBeTruthy();
    });

    // Verify store state
    const finalState = useAppStore.getState();
    expect(finalState.processedImageUri).toBeTruthy();
    expect(finalState.selectedStyle).toBe('cartoon');
  });

  it('should handle errors gracefully throughout the flow', async () => {
    // Mock image selection failure
    const { launchImageLibrary } = require('react-native-image-picker');
    launchImageLibrary.mockImplementation((options, callback) => {
      callback({
        didCancel: false,
        errorMessage: 'Camera not available',
      });
    });

    const { getByTestId, getByText } = render(
      <MockNavigationWrapper>
        <App />
      </MockNavigationWrapper>
    );

    // Start flow
    const createStickerButton = getByTestId('create-sticker-button');
    fireEvent.press(createStickerButton);

    // Try to select photo
    const selectFromGalleryButton = getByTestId('select-from-gallery-button');
    fireEvent.press(selectFromGalleryButton);

    // Verify error handling
    await waitFor(() => {
      expect(getByText('Failed to select image')).toBeTruthy();
    });
  });

  it('should handle insufficient credits scenario', async () => {
    // Set user credits to 0
    act(() => {
      useAppStore.getState().setCredits(0);
    });

    const { getByTestId, getByText } = render(
      <MockNavigationWrapper>
        <App />
      </MockNavigationWrapper>
    );

    // Start flow
    const createStickerButton = getByTestId('create-sticker-button');
    fireEvent.press(createStickerButton);

    // Should show insufficient credits modal
    await waitFor(() => {
      expect(getByTestId('insufficient-credits-modal')).toBeTruthy();
    });

    const purchaseCreditsButton = getByTestId('purchase-credits-button');
    fireEvent.press(purchaseCreditsButton);

    // Should navigate to credit purchase screen
    await waitFor(() => {
      expect(getByTestId('credit-purchase-screen')).toBeTruthy();
    });
  });
});