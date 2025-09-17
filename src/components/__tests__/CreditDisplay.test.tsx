import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {CreditDisplay} from '../CreditDisplay';

describe('CreditDisplay', () => {
  it('renders correctly with normal credits', () => {
    const {getByText} = render(<CreditDisplay credits={20} />);
    expect(getByText('20 credits')).toBeTruthy();
    expect(getByText('✨')).toBeTruthy();
  });

  it('shows warning for low credits', () => {
    const {getByText} = render(
      <CreditDisplay credits={3} showWarning={true} warningThreshold={5} />
    );
    expect(getByText('Low credits')).toBeTruthy();
    expect(getByText('⚠️')).toBeTruthy();
  });

  it('shows out of credits message', () => {
    const {getByText} = render(<CreditDisplay credits={0} />);
    expect(getByText('No credits remaining')).toBeTruthy();
    expect(getByText('💳')).toBeTruthy();
  });

  it('shows purchase button when enabled and credits are low', () => {
    const mockOnPurchase = jest.fn();
    const {getByText} = render(
      <CreditDisplay
        credits={2}
        showPurchaseButton={true}
        onPurchasePress={mockOnPurchase}
      />
    );
    
    const purchaseButton = getByText('Get More');
    expect(purchaseButton).toBeTruthy();
    
    fireEvent.press(purchaseButton);
    expect(mockOnPurchase).toHaveBeenCalled();
  });

  it('shows buy credits button when out of credits', () => {
    const mockOnPurchase = jest.fn();
    const {getByText} = render(
      <CreditDisplay
        credits={0}
        showPurchaseButton={true}
        onPurchasePress={mockOnPurchase}
      />
    );
    
    expect(getByText('Buy Credits')).toBeTruthy();
  });

  it('applies different sizes correctly', () => {
    const {rerender, getByText} = render(
      <CreditDisplay credits={10} size="small" />
    );
    expect(getByText('10 credits')).toBeTruthy();

    rerender(<CreditDisplay credits={10} size="large" />);
    expect(getByText('10 credits')).toBeTruthy();
  });

  it('hides cost info for small size', () => {
    const {queryByText} = render(
      <CreditDisplay credits={10} size="small" />
    );
    expect(queryByText('1 credit per sticker generation')).toBeNull();
  });

  it('shows cost info for medium and large sizes', () => {
    const {getByText} = render(
      <CreditDisplay credits={10} size="medium" />
    );
    expect(getByText('1 credit per sticker generation')).toBeTruthy();
  });
});