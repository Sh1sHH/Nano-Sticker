import React from 'react';
import {render} from '@testing-library/react-native';
import {AIProcessingAnimation} from '../AIProcessingAnimation';

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = () => ({
    start: jest.fn(),
  });
  RN.Animated.loop = jest.fn();
  RN.Animated.sequence = jest.fn();
  RN.Animated.Value = jest.fn(() => ({
    interpolate: jest.fn(() => '0deg'),
    setValue: jest.fn(),
    _value: 0,
  }));
  return RN;
});

describe('AIProcessingAnimation', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders when processing is true', () => {
    const {getByText} = render(
      <AIProcessingAnimation isProcessing={true} progress={0.5} />
    );
    
    expect(getByText('🧠')).toBeTruthy();
    expect(getByText('Current Step:')).toBeTruthy();
  });

  it('does not render when processing is false', () => {
    const {container} = render(
      <AIProcessingAnimation isProcessing={false} progress={0.5} />
    );
    
    expect(container.children).toHaveLength(0);
  });

  it('displays custom step when provided', () => {
    const customStep = 'Custom processing step';
    const {getByText} = render(
      <AIProcessingAnimation
        isProcessing={true}
        progress={0.3}
        currentStep={customStep}
      />
    );
    
    expect(getByText(customStep)).toBeTruthy();
  });

  it('shows progress indicator', () => {
    const {getByText} = render(
      <AIProcessingAnimation isProcessing={true} progress={0.75} />
    );
    
    // Should show progress-related text
    expect(getByText('Processing with AI...')).toBeTruthy();
  });

  it('displays processing steps', () => {
    const {getByText} = render(
      <AIProcessingAnimation isProcessing={true} progress={0.2} />
    );
    
    // Should show the first step initially
    expect(getByText('Analyzing your image')).toBeTruthy();
  });

  it('shows brain emoji and particles', () => {
    const {getByText, getAllByText} = render(
      <AIProcessingAnimation isProcessing={true} progress={0.4} />
    );
    
    expect(getByText('🧠')).toBeTruthy();
    // Should have multiple sparkle emojis for particles
    const sparkles = getAllByText('✨');
    expect(sparkles.length).toBeGreaterThan(0);
  });
});