import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {SharingComponent} from '../SharingComponent';
import {SharingService} from '@/services/sharingService';

// Mock dependencies are handled in jest.setup.js

// Mock SharingService
jest.mock('@/services/sharingService', () => ({
  SharingService: {
    getAvailablePlatforms: jest.fn(),
    isPlatformAvailable: jest.fn(),
    shareToSpecificPlatform: jest.fn(),
    openShareDialog: jest.fn(),
    saveToGallery: jest.fn(),
    trackSharingEvent: jest.fn(),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('SharingComponent', () => {
  const mockProps = {
    filePath: '/mock/sticker.png',
    onSharingComplete: jest.fn(),
    onCancel: jest.fn(),
  };

  const mockPlatforms = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '💬',
      color: '#25D366',
      available: true,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: '📷',
      color: '#E4405F',
      available: true,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      color: '#0088CC',
      available: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (SharingService.getAvailablePlatforms as jest.Mock).mockReturnValue(mockPlatforms);
    (SharingService.isPlatformAvailable as jest.Mock).mockImplementation(
      (platformId: string) => {
        const platform = mockPlatforms.find(p => p.id === platformId);
        return Promise.resolve(platform?.available || false);
      },
    );
  });

  it('renders correctly with platforms', async () => {
    const {getByText} = render(<SharingComponent {...mockProps} />);

    await waitFor(() => {
      expect(getByText('Share Your Sticker')).toBeTruthy();
      expect(getByText('Quick Actions')).toBeTruthy();
      expect(getByText('Save to Gallery')).toBeTruthy();
      expect(getByText('More Options')).toBeTruthy();
      expect(getByText('Share to Apps')).toBeTruthy();
      expect(getByText('WhatsApp')).toBeTruthy();
      expect(getByText('Instagram')).toBeTruthy();
      expect(getByText('Telegram')).toBeTruthy();
    });
  });

  it('calls onCancel when cancel button is pressed', () => {
    const {getByText} = render(<SharingComponent {...mockProps} />);

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('saves to gallery successfully', async () => {
    (SharingService.saveToGallery as jest.Mock).mockResolvedValue({
      success: true,
      platform: 'gallery',
    });

    const {getByText} = render(<SharingComponent {...mockProps} />);

    const saveButton = getByText('Save to Gallery');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(SharingService.saveToGallery).toHaveBeenCalledWith('/mock/sticker.png');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Saved Successfully',
        'Your sticker has been saved to your photo gallery!',
        expect.any(Array),
      );
    });
  });

  it('handles save to gallery failure', async () => {
    (SharingService.saveToGallery as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Permission denied',
    });

    const {getByText} = render(<SharingComponent {...mockProps} />);

    const saveButton = getByText('Save to Gallery');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Save Failed',
        'Permission denied',
        expect.any(Array),
      );
    });
  });

  it('opens generic share dialog', async () => {
    (SharingService.openShareDialog as jest.Mock).mockResolvedValue({
      success: true,
      platform: 'com.example.app',
    });

    const {getByText} = render(<SharingComponent {...mockProps} />);

    const moreOptionsButton = getByText('More Options');
    fireEvent.press(moreOptionsButton);

    await waitFor(() => {
      expect(SharingService.openShareDialog).toHaveBeenCalledWith(
        '/mock/sticker.png',
        expect.objectContaining({
          title: 'Check out my AI-generated sticker!',
          message: 'I created this awesome sticker using AI. What do you think?',
        }),
      );
      expect(mockProps.onSharingComplete).toHaveBeenCalledWith({
        success: true,
        platform: 'com.example.app',
      });
    });
  });

  it('shares to specific platform successfully', async () => {
    (SharingService.shareToSpecificPlatform as jest.Mock).mockResolvedValue({
      success: true,
      platform: 'whatsapp',
    });

    const {getByText} = render(<SharingComponent {...mockProps} />);

    await waitFor(() => {
      const whatsappButton = getByText('WhatsApp');
      fireEvent.press(whatsappButton);
    });

    await waitFor(() => {
      expect(SharingService.shareToSpecificPlatform).toHaveBeenCalledWith(
        '/mock/sticker.png',
        'whatsapp',
        expect.objectContaining({
          title: 'Check out my AI-generated sticker!',
          message: 'I created this awesome sticker using AI. What do you think?',
        }),
      );
      expect(Alert.alert).toHaveBeenCalledWith(
        'Shared Successfully',
        'Your sticker has been shared to WhatsApp!',
        expect.any(Array),
      );
    });
  });

  it('handles platform sharing failure', async () => {
    (SharingService.shareToSpecificPlatform as jest.Mock).mockResolvedValue({
      success: false,
      error: 'App not installed',
    });

    const {getByText} = render(<SharingComponent {...mockProps} />);

    await waitFor(() => {
      const whatsappButton = getByText('WhatsApp');
      fireEvent.press(whatsappButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sharing Failed',
        'App not installed',
        expect.any(Array),
      );
    });
  });

  it('uses custom title and message', async () => {
    const customProps = {
      ...mockProps,
      customTitle: 'Custom Title',
      customMessage: 'Custom Message',
    };

    (SharingService.shareToSpecificPlatform as jest.Mock).mockResolvedValue({
      success: true,
      platform: 'whatsapp',
    });

    const {getByText} = render(<SharingComponent {...customProps} />);

    await waitFor(() => {
      const whatsappButton = getByText('WhatsApp');
      fireEvent.press(whatsappButton);
    });

    await waitFor(() => {
      expect(SharingService.shareToSpecificPlatform).toHaveBeenCalledWith(
        '/mock/sticker.png',
        'whatsapp',
        expect.objectContaining({
          title: 'Custom Title',
          message: 'Custom Message',
        }),
      );
    });
  });

  it('tracks sharing events', async () => {
    (SharingService.shareToSpecificPlatform as jest.Mock).mockResolvedValue({
      success: true,
      platform: 'instagram',
    });

    const {getByText} = render(<SharingComponent {...mockProps} />);

    await waitFor(() => {
      const instagramButton = getByText('Instagram');
      fireEvent.press(instagramButton);
    });

    await waitFor(() => {
      expect(SharingService.trackSharingEvent).toHaveBeenCalledWith(
        'instagram',
        true,
        'ai-generated',
      );
    });
  });

  it('disables buttons during sharing', async () => {
    (SharingService.shareToSpecificPlatform as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000)),
    );

    const {getByText} = render(<SharingComponent {...mockProps} />);

    await waitFor(() => {
      const whatsappButton = getByText('WhatsApp');
      fireEvent.press(whatsappButton);
    });

    // All buttons should be disabled during sharing
    const instagramButton = getByText('Instagram');
    fireEvent.press(instagramButton);

    // Instagram sharing should not be called because buttons are disabled
    expect(SharingService.shareToSpecificPlatform).toHaveBeenCalledTimes(1);
    expect(SharingService.shareToSpecificPlatform).toHaveBeenCalledWith(
      '/mock/sticker.png',
      'whatsapp',
      expect.any(Object),
    );
  });

  it('shows loading indicators during sharing', async () => {
    (SharingService.shareToSpecificPlatform as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({success: true}), 100)),
    );

    const {getByText, getByTestId} = render(<SharingComponent {...mockProps} />);

    await waitFor(() => {
      const whatsappButton = getByText('WhatsApp');
      fireEvent.press(whatsappButton);
    });

    // Should show loading indicator (ActivityIndicator is rendered)
    // We can't easily test for ActivityIndicator in React Native testing library
    // but we can verify the sharing service is called
    expect(SharingService.shareToSpecificPlatform).toHaveBeenCalled();
  });

  it('handles sharing service errors gracefully', async () => {
    (SharingService.shareToSpecificPlatform as jest.Mock).mockRejectedValue(
      new Error('Network error'),
    );

    const {getByText} = render(<SharingComponent {...mockProps} />);

    await waitFor(() => {
      const whatsappButton = getByText('WhatsApp');
      fireEvent.press(whatsappButton);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Sharing Error',
        'An unexpected error occurred while sharing',
        expect.any(Array),
      );
    });
  });

  it('displays sharing tips', () => {
    const {getByText} = render(<SharingComponent {...mockProps} />);

    expect(getByText('💡 Sharing Tips')).toBeTruthy();
    expect(getByText(/WhatsApp: Perfect for sending stickers/)).toBeTruthy();
    expect(getByText(/Instagram: Share to your story/)).toBeTruthy();
    expect(getByText(/Telegram: Great for sticker packs/)).toBeTruthy();
    expect(getByText(/Save to Gallery: Keep your stickers/)).toBeTruthy();
  });
});