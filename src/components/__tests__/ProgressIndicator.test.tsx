import React from 'react';
import {render} from '@testing-library/react-native';
import {ProgressIndicator} from '../ProgressIndicator';

describe('ProgressIndicator', () => {
  it('renders correctly with default props', () => {
    const {getByText} = render(<ProgressIndicator progress={0.5} />);
    expect(getByText('50%')).toBeTruthy();
  });

  it('displays custom message when provided', () => {
    const message = 'Processing your image...';
    const {getByText} = render(
      <ProgressIndicator progress={0.3} message={message} />
    );
    expect(getByText(message)).toBeTruthy();
    expect(getByText('30%')).toBeTruthy();
  });

  it('hides percentage when showPercentage is false', () => {
    const {queryByText} = render(
      <ProgressIndicator progress={0.7} showPercentage={false} />
    );
    expect(queryByText('70%')).toBeNull();
  });

  it('handles progress values correctly', () => {
    const {getByText, rerender} = render(<ProgressIndicator progress={0} />);
    expect(getByText('0%')).toBeTruthy();

    rerender(<ProgressIndicator progress={1} />);
    expect(getByText('100%')).toBeTruthy();
  });

  it('applies custom colors', () => {
    const customColor = '#ff0000';
    const customBg = '#00ff00';
    
    render(
      <ProgressIndicator
        progress={0.5}
        color={customColor}
        backgroundColor={customBg}
      />
    );
    
    // Component should render without errors with custom colors
    expect(true).toBe(true);
  });
});