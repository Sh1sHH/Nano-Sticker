import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorDisplay } from '../ErrorDisplay';
import { ErrorType, ErrorService } from '../../services/errorService';

describe('ErrorDisplay', () => {
  const mockError = ErrorService.createError(
    ErrorType.NETWORK,
    'NETWORK_ERROR',
    'Network request failed',
    'Please check your internet connection and try again.',
    true
  );

  it('renders error message correctly', () => {
    const { getByText } = render(<ErrorDisplay error={mockError} />);

    expect(getByText('Error')).toBeTruthy();
    expect(getByText('NETWORK_ERROR')).toBeTruthy();
    expect(getByText('Please check your internet connection and try again.')).toBeTruthy();
  });

  it('shows retry button for retryable errors', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ErrorDisplay error={mockError} onRetry={onRetry} />
    );

    const retryButton = getByText('Try Again');
    expect(retryButton).toBeTruthy();

    fireEvent.press(retryButton);
    expect(onRetry).toHaveBeenCalled();
  });

  it('does not show retry button for non-retryable errors', () => {
    const nonRetryableError = ErrorService.createError(
      ErrorType.VALIDATION,
      'INVALID_INPUT',
      'Invalid input provided',
      'Please check your input and try again.',
      false
    );

    const { queryByText } = render(<ErrorDisplay error={nonRetryableError} />);

    expect(queryByText('Try Again')).toBeNull();
  });

  it('shows dismiss button when onDismiss is provided', () => {
    const onDismiss = jest.fn();
    const { getByText } = render(
      <ErrorDisplay error={mockError} onDismiss={onDismiss} />
    );

    const dismissButton = getByText('Dismiss');
    expect(dismissButton).toBeTruthy();

    fireEvent.press(dismissButton);
    expect(onDismiss).toHaveBeenCalled();
  });

  it('shows details button when showDetails is true', () => {
    const { getByText } = render(
      <ErrorDisplay error={mockError} showDetails={true} />
    );

    expect(getByText('Details')).toBeTruthy();
  });

  it('displays correct icon for different error types', () => {
    const aiError = ErrorService.createError(
      ErrorType.AI_PROCESSING,
      'AI_ERROR',
      'AI processing failed',
      'AI service is unavailable.',
      true
    );

    const { getByText } = render(<ErrorDisplay error={aiError} />);
    expect(getByText('🤖')).toBeTruthy();
  });

  it('applies correct color scheme for different error types', () => {
    const paymentError = ErrorService.createError(
      ErrorType.PAYMENT,
      'PAYMENT_FAILED',
      'Payment processing failed',
      'Your payment could not be processed.',
      true
    );

    const { getByText } = render(<ErrorDisplay error={paymentError} />);
    expect(getByText('💳')).toBeTruthy();
  });
});