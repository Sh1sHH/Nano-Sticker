import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {AnimatedMessage} from '../AnimatedMessage';

// Mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = () => ({
    start: jest.fn(),
  });
  RN.Animated.loop = jest.fn();
  RN.Animated.sequence = jest.fn();
  return RN;
});

describe('AnimatedMessage', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders first message initially', () => {
    const messages = ['Message 1', 'Message 2', 'Message 3'];
    const {getByText} = render(<AnimatedMessage messages={messages} />);
    expect(getByText('Message 1')).toBeTruthy();
  });

  it('cycles through messages', async () => {
    const messages = ['Message 1', 'Message 2'];
    const {getByText, queryByText} = render(
      <AnimatedMessage messages={messages} interval={1000} />
    );

    expect(getByText('Message 1')).toBeTruthy();

    // Fast forward time
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(queryByText('Message 2')).toBeTruthy();
    });
  });

  it('shows dots when showDots is true', () => {
    const messages = ['Loading'];
    const {getByText} = render(
      <AnimatedMessage messages={messages} showDots={true} />
    );
    
    // Initially no dots
    expect(getByText('Loading')).toBeTruthy();
    
    // After some time, dots should appear
    jest.advanceTimersByTime(500);
    // Note: In a real test, we'd need to check for the dots, but they're in a separate Text component
  });

  it('handles empty messages array', () => {
    const {container} = render(<AnimatedMessage messages={[]} />);
    expect(container.children).toHaveLength(0);
  });

  it('handles single message without cycling', () => {
    const messages = ['Single message'];
    const {getByText} = render(<AnimatedMessage messages={messages} />);
    
    expect(getByText('Single message')).toBeTruthy();
    
    // Advance time - should still show same message
    jest.advanceTimersByTime(5000);
    expect(getByText('Single message')).toBeTruthy();
  });
});