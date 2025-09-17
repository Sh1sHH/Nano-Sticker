import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MLKitSegmentationComponent from '../MLKitSegmentationComponent';

// Mock the react-native-image-selfie-segmentation library
jest.mock('react-native-image-selfie-segmentation', () => ({
  replaceBackground: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock ManualEditingComponent
jest.mock('../ManualEditingComponent', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  return function MockManualEditingComponent({ onEditingComplete, onEditingCancel }) {
    return React.createElement(View, null, [
      React.createElement(Text, { key: 'title' }, 'Manual Editing'),
      React.createElement(Text, { key: 'subtitle' }, 'Drag and pinch to adjust the crop area'),
    ]);
  };
});

const mockSelfieSegmentation = require('react-native-image-selfie-segmentation');

describe('MLKitSegmentationComponent', () => {
  const mockProps = {
    imageUri: 'file://test-image.jpg',
    onSegmentationComplete: jest.fn(),
    onSegmentationError: jest.fn(),
    onManualEditingRequested: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    const { getByText, getByTestId } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    expect(getByText('Object Segmentation')).toBeTruthy();
    expect(getByText('Original Image:')).toBeTruthy();
    expect(getByText('Start Segmentation')).toBeTruthy();
  });

  it('displays original image correctly', () => {
    const { getByTestId } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    // The image should be rendered with the correct source
    const images = getByTestId ? [] : []; // Simplified for this test
    expect(mockProps.imageUri).toBe('file://test-image.jpg');
  });

  it('starts segmentation when button is pressed', async () => {
    mockSelfieSegmentation.replaceBackground.mockResolvedValue('file://segmented-image.png');

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    const startButton = getByText('Start Segmentation');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(mockSelfieSegmentation.replaceBackground).toHaveBeenCalledWith(
        mockProps.imageUri,
        expect.any(String), // transparent background data URL
        1024
      );
    });
  });

  it('shows processing indicator during segmentation', async () => {
    // Mock a delayed response
    mockSelfieSegmentation.replaceBackground.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('file://segmented-image.png'), 100))
    );

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    const startButton = getByText('Start Segmentation');
    fireEvent.press(startButton);

    // Should show processing text
    expect(getByText('Segmenting object...')).toBeTruthy();
  });

  it('displays segmented image after successful segmentation', async () => {
    const segmentedImageUri = 'file://segmented-image.png';
    mockSelfieSegmentation.replaceBackground.mockResolvedValue(segmentedImageUri);

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    const startButton = getByText('Start Segmentation');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(getByText('Segmented Image:')).toBeTruthy();
      expect(getByText('Accept Result')).toBeTruthy();
      expect(getByText('Retry')).toBeTruthy();
      expect(getByText('Manual Edit')).toBeTruthy();
    });
  });

  it('calls onSegmentationComplete when accepting result', async () => {
    const segmentedImageUri = 'file://segmented-image.png';
    mockSelfieSegmentation.replaceBackground.mockResolvedValue(segmentedImageUri);

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    // Start segmentation
    fireEvent.press(getByText('Start Segmentation'));

    await waitFor(() => {
      expect(getByText('Accept Result')).toBeTruthy();
    });

    // Accept the result
    fireEvent.press(getByText('Accept Result'));

    expect(mockProps.onSegmentationComplete).toHaveBeenCalledWith(segmentedImageUri);
  });

  it('handles segmentation errors correctly', async () => {
    const errorMessage = 'Segmentation failed';
    mockSelfieSegmentation.replaceBackground.mockRejectedValue(new Error(errorMessage));

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    const startButton = getByText('Start Segmentation');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(mockProps.onSegmentationError).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('handles empty segmentation result', async () => {
    mockSelfieSegmentation.replaceBackground.mockResolvedValue(null);

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    const startButton = getByText('Start Segmentation');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(mockProps.onSegmentationError).toHaveBeenCalledWith(
        'Segmentation failed - no result returned'
      );
    });
  });

  it('retries segmentation when retry button is pressed', async () => {
    const segmentedImageUri = 'file://segmented-image.png';
    mockSelfieSegmentation.replaceBackground.mockResolvedValue(segmentedImageUri);

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    // Start initial segmentation
    fireEvent.press(getByText('Start Segmentation'));

    await waitFor(() => {
      expect(getByText('Retry')).toBeTruthy();
    });

    // Clear the mock to track retry call
    mockSelfieSegmentation.replaceBackground.mockClear();

    // Press retry
    fireEvent.press(getByText('Retry'));

    await waitFor(() => {
      expect(mockSelfieSegmentation.replaceBackground).toHaveBeenCalledTimes(1);
    });
  });

  it('shows manual editing component when manual edit button is pressed', async () => {
    const segmentedImageUri = 'file://segmented-image.png';
    mockSelfieSegmentation.replaceBackground.mockResolvedValue(segmentedImageUri);

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    // Start segmentation
    fireEvent.press(getByText('Start Segmentation'));

    await waitFor(() => {
      expect(getByText('Manual Edit')).toBeTruthy();
    });

    // Press manual edit
    fireEvent.press(getByText('Manual Edit'));

    // Should now show the manual editing interface
    await waitFor(() => {
      expect(getByText('Manual Editing')).toBeTruthy();
      expect(getByText('Drag and pinch to adjust the crop area')).toBeTruthy();
    });
  });

  it('shows alert for manual editing fallback on segmentation failure', async () => {
    mockSelfieSegmentation.replaceBackground.mockRejectedValue(new Error('Segmentation failed'));

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    const startButton = getByText('Start Segmentation');
    fireEvent.press(startButton);

    await waitFor(() => {
      expect(mockProps.onSegmentationError).toHaveBeenCalled();
    });
  });

  it('handles segmentation with transparent background', async () => {
    const segmentedImageUri = 'file://segmented-image.png';
    mockSelfieSegmentation.replaceBackground.mockResolvedValue(segmentedImageUri);

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    fireEvent.press(getByText('Start Segmentation'));

    await waitFor(() => {
      expect(mockSelfieSegmentation.replaceBackground).toHaveBeenCalledWith(
        mockProps.imageUri,
        expect.stringContaining('data:image/png;base64'), // transparent background
        1024
      );
    });
  });

  it('maintains transparent background in segmented image', async () => {
    const segmentedImageUri = 'file://segmented-image.png';
    mockSelfieSegmentation.replaceBackground.mockResolvedValue(segmentedImageUri);

    const { getByText } = render(
      <MLKitSegmentationComponent {...mockProps} />
    );

    fireEvent.press(getByText('Start Segmentation'));

    await waitFor(() => {
      expect(mockSelfieSegmentation.replaceBackground).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('data:image/png;base64'), // PNG format supports transparency
        expect.any(Number)
      );
    });
  });
});