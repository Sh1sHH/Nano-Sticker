import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MLKitSegmentationComponent from '../MLKitSegmentationComponent';

// Mock the react-native-image-selfie-segmentation library
jest.mock('react-native-image-selfie-segmentation', () => ({
  replaceBackground: jest.fn(),
}));

// Mock react-native-reanimated for ManualEditingComponent
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    default: {
      View: View,
      useSharedValue: jest.fn(() => ({ value: 0 })),
      useAnimatedStyle: jest.fn(() => ({})),
      useAnimatedGestureHandler: jest.fn(() => ({})),
      withSpring: jest.fn((value) => value),
      runOnJS: jest.fn((fn) => fn),
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    useAnimatedGestureHandler: jest.fn(() => ({})),
    withSpring: jest.fn((value) => value),
    runOnJS: jest.fn((fn) => fn),
  };
});

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    PanGestureHandler: View,
    PinchGestureHandler: View,
    State: {},
  };
});

const mockSelfieSegmentation = require('react-native-image-selfie-segmentation');

describe('Segmentation Integration', () => {
  const mockProps = {
    imageUri: 'file://test-image.jpg',
    onSegmentationComplete: jest.fn(),
    onSegmentationError: jest.fn(),
    onManualEditingRequested: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('integrates ML Kit segmentation with manual editing fallback', async () => {
    const segmentedImageUri = 'file://segmented-image.png';
    mockSelfieSegmentation.replaceBackground.mockResolvedValue(segmentedImageUri);

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    // Start with automatic segmentation
    expect(getByText('Object Segmentation')).toBeTruthy();
    fireEvent.press(getByText('Start Segmentation'));

    // Wait for segmentation to complete
    await waitFor(() => {
      expect(getByText('Accept Result')).toBeTruthy();
      expect(getByText('Manual Edit')).toBeTruthy();
    });

    // Switch to manual editing
    fireEvent.press(getByText('Manual Edit'));

    // Should now show manual editing interface
    await waitFor(() => {
      expect(getByText('Manual Editing')).toBeTruthy();
      expect(getByText('Drag and pinch to adjust the crop area')).toBeTruthy();
    });

    // Manual editing tools should be available
    expect(getByText('Apply Crop')).toBeTruthy();
    expect(getByText('Reset')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
  });

  it('handles segmentation failure and provides manual editing fallback', async () => {
    // Mock segmentation failure
    mockSelfieSegmentation.replaceBackground.mockRejectedValue(new Error('Segmentation failed'));

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    // Start segmentation
    fireEvent.press(getByText('Start Segmentation'));

    // Should handle error and still allow manual editing
    await waitFor(() => {
      expect(mockProps.onSegmentationError).toHaveBeenCalledWith('Segmentation failed');
    });

    // User should still be able to access manual editing through the interface
    expect(getByText('Object Segmentation')).toBeTruthy();
  });

  it('completes the full workflow from segmentation to manual editing to completion', async () => {
    const segmentedImageUri = 'file://segmented-image.png';
    mockSelfieSegmentation.replaceBackground.mockResolvedValue(segmentedImageUri);

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    // 1. Start automatic segmentation
    fireEvent.press(getByText('Start Segmentation'));

    await waitFor(() => {
      expect(getByText('Manual Edit')).toBeTruthy();
    });

    // 2. Switch to manual editing
    fireEvent.press(getByText('Manual Edit'));

    await waitFor(() => {
      expect(getByText('Manual Editing')).toBeTruthy();
    });

    // 3. Apply manual crop
    fireEvent.press(getByText('Apply Crop'));

    // 4. Should complete the workflow
    await waitFor(() => {
      expect(mockProps.onSegmentationComplete).toHaveBeenCalled();
    }, { timeout: 2000 });

    // Verify the completion callback was called with a cropped image URI
    const callArgs = mockProps.onSegmentationComplete.mock.calls[0];
    expect(callArgs[0]).toContain('cropped=');
  });

  it('allows canceling manual editing and returning to segmentation', async () => {
    const segmentedImageUri = 'file://segmented-image.png';
    mockSelfieSegmentation.replaceBackground.mockResolvedValue(segmentedImageUri);

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    // Start segmentation and go to manual editing
    fireEvent.press(getByText('Start Segmentation'));

    await waitFor(() => {
      expect(getByText('Manual Edit')).toBeTruthy();
    });

    fireEvent.press(getByText('Manual Edit'));

    await waitFor(() => {
      expect(getByText('Manual Editing')).toBeTruthy();
    });

    // Cancel manual editing
    fireEvent.press(getByText('Cancel'));

    // Should return to segmentation interface
    await waitFor(() => {
      expect(getByText('Object Segmentation')).toBeTruthy();
      expect(getByText('Accept Result')).toBeTruthy();
    });
  });
});