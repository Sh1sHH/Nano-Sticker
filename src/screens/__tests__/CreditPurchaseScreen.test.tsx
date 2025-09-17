import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';
import CreditPurchaseScreen from '../CreditPurchaseScreen';

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

// Mock route
const mockRoute = {
  params: {},
};

// Mock store
const mockUseAppStore = {
  credits: 5,
  setCredits: jest.fn(),
};

jest.mock('@/stores/appStore', () => ({
  useAppStore: () => mockUseAppStore,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('CreditPurchaseScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly', () => {
    const {getByText} = render(
      <CreditPurchaseScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    expect(getByText('Get More Credits')).toBeTruthy();
    expect(getByText('Choose Your Package')).toBeTruthy();
    expect(getByText('10')).toBeTruthy(); // First package credits
    expect(getByText('$2.99')).toBeTruthy(); // First package price
  });

  it('shows current credits', () => {
    const {getByText} = render(
      <CreditPurchaseScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    expect(getByText('5 credits')).toBeTruthy();
  });

  it('allows package selection', () => {
    const {getByText} = render(
      <CreditPurchaseScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // Select the first package
    const firstPackage = getByText('10');
    fireEvent.press(firstPackage.parent?.parent as any);

    // Should show selected state
    expect(getByText('✓ Selected')).toBeTruthy();
  });

  it('shows popular badge for popular package', () => {
    const {getByText} = render(
      <CreditPurchaseScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    expect(getByText('MOST POPULAR')).toBeTruthy();
  });

  it('shows bonus credits for applicable packages', () => {
    const {getByText} = render(
      <CreditPurchaseScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    expect(getByText('+10 bonus!')).toBeTruthy(); // Popular package bonus
  });

  it('handles purchase flow', async () => {
    const {getByText} = render(
      <CreditPurchaseScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // Select a package
    const firstPackage = getByText('10');
    fireEvent.press(firstPackage.parent?.parent as any);

    // Press purchase button
    const purchaseButton = getByText('Purchase $2.99');
    fireEvent.press(purchaseButton);

    // Should show processing state
    expect(getByText('Processing...')).toBeTruthy();

    // Fast forward time to complete purchase
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockUseAppStore.setCredits).toHaveBeenCalledWith(15); // 5 + 10
      expect(Alert.alert).toHaveBeenCalledWith(
        'Purchase Successful!',
        "You've received 10 credits. Happy creating!",
        expect.any(Array)
      );
    });
  });

  it('shows error when no package selected', () => {
    const {getByText} = render(
      <CreditPurchaseScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    const purchaseButton = getByText('Select a Package');
    fireEvent.press(purchaseButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please select a credit package');
  });

  it('handles cancel button', () => {
    const {getByText} = render(
      <CreditPurchaseScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    const cancelButton = getByText('Maybe Later');
    fireEvent.press(cancelButton);

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('calculates per-credit cost correctly', () => {
    const {getByText} = render(
      <CreditPurchaseScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // First package: $2.99 for 10 credits = $0.30 per credit
    expect(getByText('$0.30 per credit')).toBeTruthy();
  });

  it('shows savings percentage for discounted packages', () => {
    const {getByText} = render(
      <CreditPurchaseScreen
        navigation={mockNavigation as any}
        route={mockRoute as any}
      />
    );

    // Popular package has original price $14.99, sale price $9.99
    expect(getByText('Save 33%')).toBeTruthy();
  });
});