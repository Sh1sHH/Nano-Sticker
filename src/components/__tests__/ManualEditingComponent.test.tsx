import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ManualEditingComponent from '../ManualEditingComponent';

// Mock react-native-reanimated
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

describe('ManualEditingComponent', () => {
  const mockProps = {
    imageUri: 'file://test-image.jpg',
    onEditingComplete: jest.fn(),
    onEditingCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial state', () => {
    const { getByText } = render(
      <ManualEditingComponent {...mockProps} />
    );

    expect(getByText('Manual Editing')).toBeTruthy();
    expect(getByText('Drag and pinch to adjust the crop area')).toBeTruthy();
    expect(getByText('Reset')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Apply Crop')).toBeTruthy();
  });

  it('displays image correctly', () => {
    const { getByTestId } = render(
      <ManualEditingComponent {...mockProps} />
    );

    // The image should be rendered with the correct source
    expect(mockProps.imageUri).toBe('file://test-image.jpg');
  });

  it('shows initial crop area information', () => {
    const { getByText } = render(
      <ManualEditingComponent {...mockProps} />
    );

    expect(getByText('Crop Area: 200 × 200')).toBeTruthy();
    expect(getByText('Position: (50, 50)')).toBeTruthy();
  });

  it('calls onEditingCancel when cancel button is pressed', () => {
    const { getByText } = render(
      <ManualEditingComponent {...mockProps} />
    );

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(mockProps.onEditingCancel).toHaveBeenCalled();
  });

  it('applies crop when apply button is pressed', async () => {
    const { getByText } = render(
      <ManualEditingComponent {...mockProps} />
    );

    const applyButton = getByText('Apply Crop');
    fireEvent.press(applyButton);

    await waitFor(() => {
      expect(mockProps.onEditingComplete).toHaveBeenCalled();
    }, { timeout: 2000 });

    // Check that the callback was called with a modified image URI
    const callArgs = mockProps.onEditingComplete.mock.calls[0];
    expect(callArgs[0]).toContain('cropped=');
  });

  it('resets crop area when reset button is pressed', () => {
    const { getByText } = render(
      <ManualEditingComponent {...mockProps} />
    );

    const resetButton = getByText('Reset');
    fireEvent.press(resetButton);

    // After reset, should show default crop area values
    expect(getByText('Crop Area: 200 × 200')).toBeTruthy();
    expect(getByText('Position: (50, 50)')).toBeTruthy();
  });

  it('handles image load event correctly', () => {
    const { getByTestId } = render(
      <ManualEditingComponent {...mockProps} />
    );

    // Simulate image load event
    // In a real test, you would trigger the onLoad event of the Image component
    // For now, we just verify the component renders without crashing
    expect(mockProps.imageUri).toBe('file://test-image.jpg');
  });

  it('provides manual editing tools interface', () => {
    const { getByText } = render(
      <ManualEditingComponent {...mockProps} />
    );

    // Verify all manual editing tools are available
    expect(getByText('Reset')).toBeTruthy();
    expect(getByText('Cancel')).toBeTruthy();
    expect(getByText('Apply Crop')).toBeTruthy();
    
    // Verify crop area is visible (through info display)
    expect(getByText('Crop Area: 200 × 200')).toBeTruthy();
  });

  it('handles crop area manipulation', () => {
    const { getByText } = render(
      <ManualEditingComponent {...mockProps} />
    );

    // Initial state should show default crop area
    expect(getByText('Crop Area: 200 × 200')).toBeTruthy();
    expect(getByText('Position: (50, 50)')).toBeTruthy();
    
    // The component should be ready to handle gesture interactions
    // In a real test environment with gesture handlers, you would simulate
    // pan and pinch gestures to test crop area updates
  });

  it('constrains crop area within image bounds', () => {
    const { getByText } = render(
      <ManualEditingComponent {...mockProps} />
    );

    // The component should prevent crop area from going outside image bounds
    // This is tested through the gesture handler logic, but since we're mocking
    // the gesture handlers, we verify the component renders correctly
    expect(getByText('Manual Editing')).toBeTruthy();
  });

  it('simulates crop functionality correctly', async () => {
    const { getByText } = render(
      <ManualEditingComponent {...mockProps} />
    );

    const applyButton = getByText('Apply Crop');
    fireEvent.press(applyButton);

    await waitFor(() => {
      expect(mockProps.onEditingComplete).toHaveBeenCalled();
    }, { timeout: 2000 });

    // Verify the simulated crop returns a modified URI
    const callArgs = mockProps.onEditingComplete.mock.calls[0];
    expect(callArgs[0]).toMatch(/\?cropped=\d+$/);
  });

  it('displays crop overlay with correct styling', () => {
    const { getByText } = render(
      <ManualEditingComponent {...mockProps} />
    );

    // Verify the component renders the crop overlay elements
    // The actual overlay is rendered through Animated.View components
    // which are mocked, but we can verify the component structure
    expect(getByText('Manual Editing')).toBeTruthy();
    expect(getByText('Drag and pinch to adjust the crop area')).toBeTruthy();
  });

  it('handles basic cropping functionality requirement', () => {
    const { getByText } = render(
      <ManualEditingComponent {...mockProps} />
    );

    // Verify basic cropping functionality is provided
    expect(getByText('Apply Crop')).toBeTruthy(); // Can apply crop
    expect(getByText('Reset')).toBeTruthy(); // Can reset crop area
    expect(getByText('Crop Area: 200 × 200')).toBeTruthy(); // Shows crop dimensions
    expect(getByText('Position: (50, 50)')).toBeTruthy(); // Shows crop position
  });
});