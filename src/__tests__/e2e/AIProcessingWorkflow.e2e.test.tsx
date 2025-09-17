import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ProcessingScreen from '../../screens/ProcessingScreen';
import { useAppStore } from '../../stores/appStore';

// Mock AI service for integration testing
jest.mock('../../services/aiService', () => ({
  generateSticker: jest.fn(),
  generateMultipleStickers: jest.fn(),
}));

// Mock analytics service
jest.mock('../../services/analyticsService', () => ({
  trackEvent: jest.fn(),
  trackError: jest.fn(),
  trackPerformance: jest.fn(),
}));

const MockNavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('AI Processing Workflow Integration Tests', () => {
  beforeEach(() => {
    useAppStore.getState().resetStickerCreation();
    jest.clearAllMocks();
  });

  it('should handle successful AI processing with retry logic', async () => {
    const mockImage = {
      uri: 'file://test-image.jpg',
      width: 1024,
      height: 1024,
    };

    const mockGeneratedStickers = [
      {
        id: 'sticker-1',
        imageUrl: 'file://sticker-happy.png',
        emotion: 'happy',
        style: 'cartoon',
      },
      {
        id: 'sticker-2',
        imageUrl: 'file://sticker-excited.png',
        emotion: 'excited',
        style: 'cartoon',
      },
    ];

    // Set up store state
    act(() => {
      useAppStore.getState().setSelectedImageUri(mockImage.uri);
      useAppStore.getState().setSelectedStyle('cartoon');
      useAppStore.getState().setCredits(10);
    });

    // Mock successful AI generation after 1 retry
    const { generateMultipleStickers } = require('../../services/aiService');
    generateMultipleStickers
      .mockRejectedValueOnce(new Error('Temporary API error'))
      .mockResolvedValueOnce(mockGeneratedStickers);

    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const { getByTestId, getByText } = render(
      <MockNavigationWrapper>
        <ProcessingScreen navigation={mockNavigation} />
      </MockNavigationWrapper>
    );

    // Verify processing starts
    await waitFor(() => {
      expect(getByTestId('ai-processing-animation')).toBeTruthy();
    });

    // Wait for retry and success
    await waitFor(() => {
      expect(generateMultipleStickers).toHaveBeenCalledTimes(2);
    }, { timeout: 15000 });

    // Verify success state
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('EffectsScreen');
    });

    // Verify store state updated
    const finalState = useAppStore.getState();
    expect(finalState.processedImageUri).toBeTruthy();
    expect(finalState.credits).toBe(9); // 1 credit deducted
  });

  it('should handle AI processing failure after max retries', async () => {
    const mockImage = {
      uri: 'file://test-image.jpg',
      width: 1024,
      height: 1024,
    };

    act(() => {
      useAppStore.getState().setSelectedImageUri(mockImage.uri);
      useAppStore.getState().setSelectedStyle('anime');
      useAppStore.getState().setCredits(5);
    });

    // Mock consistent failures
    const { generateMultipleStickers } = require('../../services/aiService');
    generateMultipleStickers.mockRejectedValue(new Error('API quota exceeded'));

    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const { getByTestId, getByText } = render(
      <MockNavigationWrapper>
        <ProcessingScreen navigation={mockNavigation} />
      </MockNavigationWrapper>
    );

    // Wait for all retries to complete
    await waitFor(() => {
      expect(generateMultipleStickers).toHaveBeenCalledTimes(3); // Max retries
    }, { timeout: 20000 });

    // Verify error state
    await waitFor(() => {
      expect(getByTestId('error-display')).toBeTruthy();
      expect(getByText(/Failed to generate sticker/)).toBeTruthy();
    });

    // Verify credits not deducted on failure
    const finalState = useAppStore.getState();
    expect(finalState.credits).toBe(5);
  });

  it('should handle API safety blocks and content filtering', async () => {
    const mockImage = {
      uri: 'file://inappropriate-image.jpg',
      width: 1024,
      height: 1024,
    };

    act(() => {
      useAppStore.getState().setSelectedImageUri(mockImage.uri);
      useAppStore.getState().setSelectedStyle('realistic');
      useAppStore.getState().setCredits(3);
    });

    // Mock safety block response
    const { generateMultipleStickers } = require('../../services/aiService');
    generateMultipleStickers.mockRejectedValue(
      new Error('Content blocked by safety filters')
    );

    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const { getByTestId, getByText } = render(
      <MockNavigationWrapper>
        <ProcessingScreen navigation={mockNavigation} />
      </MockNavigationWrapper>
    );

    // Wait for processing to complete
    await waitFor(() => {
      expect(getByText(/Content not suitable for processing/)).toBeTruthy();
    }, { timeout: 10000 });

    // Verify appropriate error message
    expect(getByText(/Please try with a different image/)).toBeTruthy();

    // Verify credits not deducted for safety blocks
    const finalState = useAppStore.getState();
    expect(finalState.credits).toBe(3);
  });

  it('should track performance metrics during AI processing', async () => {
    const mockImage = {
      uri: 'file://test-image.jpg',
      width: 1024,
      height: 1024,
    };

    const mockGeneratedStickers = [
      {
        id: 'sticker-1',
        imageUrl: 'file://sticker.png',
        emotion: 'happy',
        style: 'oil-painting',
      },
    ];

    act(() => {
      useAppStore.getState().setSelectedImageUri(mockImage.uri);
      useAppStore.getState().setSelectedStyle('oil-painting');
      useAppStore.getState().setCredits(5);
    });

    const { generateMultipleStickers } = require('../../services/aiService');
    generateMultipleStickers.mockResolvedValue(mockGeneratedStickers);

    const { trackPerformance, trackEvent } = require('../../services/analyticsService');

    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    render(
      <MockNavigationWrapper>
        <ProcessingScreen navigation={mockNavigation} />
      </MockNavigationWrapper>
    );

    // Wait for processing to complete
    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('EffectsScreen');
    }, { timeout: 10000 });

    // Verify performance tracking
    expect(trackPerformance).toHaveBeenCalledWith('ai_processing_duration', expect.any(Number));
    expect(trackEvent).toHaveBeenCalledWith('sticker_generation_success', {
      style: 'oil-painting',
      processingTime: expect.any(Number),
      stickerCount: 1,
    });
  });

  it('should handle network connectivity issues', async () => {
    const mockImage = {
      uri: 'file://test-image.jpg',
      width: 1024,
      height: 1024,
    };

    act(() => {
      useAppStore.getState().setSelectedImageUri(mockImage.uri);
      useAppStore.getState().setSelectedStyle('pixel-art');
      useAppStore.getState().setCredits(2);
    });

    // Mock network error
    const { generateMultipleStickers } = require('../../services/aiService');
    generateMultipleStickers.mockRejectedValue(new Error('Network request failed'));

    const mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
    };

    const { getByTestId, getByText } = render(
      <MockNavigationWrapper>
        <ProcessingScreen navigation={mockNavigation} />
      </MockNavigationWrapper>
    );

    // Wait for network error handling
    await waitFor(() => {
      expect(getByText(/Network connection issue/)).toBeTruthy();
    }, { timeout: 15000 });

    // Verify retry button is available
    const retryButton = getByTestId('retry-button');
    expect(retryButton).toBeTruthy();

    // Test retry functionality
    generateMultipleStickers.mockResolvedValueOnce([
      {
        id: 'sticker-retry',
        imageUrl: 'file://retry-sticker.png',
        emotion: 'happy',
        style: 'pixel-art',
      },
    ]);

    fireEvent.press(retryButton);

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('EffectsScreen');
    });
  });
});