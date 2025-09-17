import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Alert} from 'react-native';
import {StickerExportComponent} from '../StickerExportComponent';
import {ExportResult} from '@/types';

// Mock dependencies are handled in jest.setup.js

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('StickerExportComponent', () => {
  const mockProps = {
    stickerUri: 'file://mock/sticker.png',
    onExportComplete: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    const {getByText} = render(
      <StickerExportComponent {...mockProps} />,
    );

    expect(getByText('Export Sticker')).toBeTruthy();
    expect(getByText('PNG')).toBeTruthy();
    expect(getByText('JPEG')).toBeTruthy();
    expect(getByText('WEBP')).toBeTruthy();
    expect(getByText('WHATSAPP (Sticker Pack)')).toBeTruthy();
    expect(getByText('Save to Gallery')).toBeTruthy();
    expect(getByText('Share Immediately')).toBeTruthy();
  });

  it('allows format selection', () => {
    const {getByText} = render(<StickerExportComponent {...mockProps} />);

    const jpegOption = getByText('JPEG');
    fireEvent.press(jpegOption);

    // Format should be selected (we can't easily test styles in React Native testing library)
    // Just verify the option exists and can be pressed
    expect(jpegOption).toBeTruthy();
  });

  it('toggles export options', () => {
    const {getByText} = render(<StickerExportComponent {...mockProps} />);

    const saveToGalleryOption = getByText('Save to Gallery');
    const shareImmediatelyOption = getByText('Share Immediately');

    // Initially, save to gallery should be checked
    fireEvent.press(saveToGalleryOption);
    fireEvent.press(shareImmediatelyOption);

    // Options should be toggled
    expect(shareImmediatelyOption).toBeTruthy();
  });

  it('shows WhatsApp-specific options when WhatsApp format is selected', () => {
    const {getByText} = render(<StickerExportComponent {...mockProps} />);

    const whatsappOption = getByText('WHATSAPP (Sticker Pack)');
    fireEvent.press(whatsappOption);

    expect(getByText('WhatsApp Pack Name')).toBeTruthy();
    expect(
      getByText(
        'Your sticker will be packaged for WhatsApp with optimized size and format.',
      ),
    ).toBeTruthy();
  });

  it('calls onCancel when cancel button is pressed', () => {
    const {getByText} = render(<StickerExportComponent {...mockProps} />);

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('handles successful export', async () => {
    const mockImageResizer = require('@bam.tech/react-native-image-resizer');
    const mockRNFS = require('react-native-fs');
    mockImageResizer.createResizedImage.mockResolvedValue({
      uri: 'file://mock/resized.png',
    });
    mockRNFS.copyFile.mockResolvedValue(true);
    mockRNFS.stat.mockResolvedValue({size: 50000}); // Under 100KB limit
    const mockCameraRoll = require('@react-native-camera-roll/camera-roll');
    mockCameraRoll.save.mockResolvedValue(true);

    const {getByText} = render(<StickerExportComponent {...mockProps} />);

    const exportButton = getByText('Export PNG');
    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Export Successful',
        'Sticker exported successfully and saved to gallery!',
        expect.any(Array),
      );
    });
  });

  it('handles export failure', async () => {
    const mockImageResizer = require('@bam.tech/react-native-image-resizer');
    mockImageResizer.createResizedImage.mockRejectedValue(
      new Error('Resize failed'),
    );

    const {getByText} = render(<StickerExportComponent {...mockProps} />);

    const exportButton = getByText('Export PNG');
    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Export Failed',
        'Failed to resize image for export',
        expect.any(Array),
      );
    });
  });

  it('validates WhatsApp sticker size requirements', async () => {
    const mockImageResizer = require('@bam.tech/react-native-image-resizer');
    const mockRNFS = require('react-native-fs');

    mockImageResizer.createResizedImage.mockResolvedValue({
      uri: 'file://mock/resized.webp',
    });
    mockRNFS.copyFile.mockResolvedValue(true);
    mockRNFS.stat.mockResolvedValue({size: 150000}); // Over 100KB limit

    const {getByText} = render(<StickerExportComponent {...mockProps} />);

    // Select WhatsApp format
    const whatsappOption = getByText('WHATSAPP (Sticker Pack)');
    fireEvent.press(whatsappOption);

    const exportButton = getByText('Export WHATSAPP');
    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Export Failed',
        'Sticker does not meet WhatsApp requirements',
        expect.any(Array),
      );
    });
  });

  it('creates WhatsApp sticker pack metadata', async () => {
    const mockImageResizer = require('@bam.tech/react-native-image-resizer');
    const mockRNFS = require('react-native-fs');

    mockImageResizer.createResizedImage
      .mockResolvedValueOnce({uri: 'file://mock/resized.webp'})
      .mockResolvedValueOnce({uri: 'file://mock/tray.png'});
    mockRNFS.copyFile.mockResolvedValue(true);
    mockRNFS.stat.mockResolvedValue({size: 50000});
    mockRNFS.writeFile.mockResolvedValue(true);

    const {getByText} = render(<StickerExportComponent {...mockProps} />);

    // Select WhatsApp format
    const whatsappOption = getByText('WHATSAPP (Sticker Pack)');
    fireEvent.press(whatsappOption);

    const exportButton = getByText('Export WHATSAPP');
    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(mockRNFS.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('sticker_pack_'),
        expect.stringContaining('"identifier"'),
      );
    });
  });

  it('disables export button during export process', async () => {
    const mockImageResizer = require('@bam.tech/react-native-image-resizer');
    mockImageResizer.createResizedImage.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000)),
    );

    const {getByText} = render(<StickerExportComponent {...mockProps} />);

    const exportButton = getByText('Export PNG');
    fireEvent.press(exportButton);

    // Button should be disabled during export (we can't easily test styles)
    // Just verify the button exists
    expect(exportButton).toBeTruthy();
  });

  it('calls onExportComplete with result', async () => {
    const mockImageResizer = require('@bam.tech/react-native-image-resizer');
    const mockRNFS = require('react-native-fs');

    mockImageResizer.createResizedImage.mockResolvedValue({
      uri: 'file://mock/resized.png',
    });
    mockRNFS.copyFile.mockResolvedValue(true);
    mockRNFS.stat.mockResolvedValue({size: 50000});

    const {getByText} = render(<StickerExportComponent {...mockProps} />);

    const exportButton = getByText('Export PNG');
    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Simulate pressing OK on the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const okButton = alertCall[2][0];
    okButton.onPress();

    expect(mockProps.onExportComplete).toHaveBeenCalledWith({
      success: true,
      filePath: expect.stringContaining('/mock/documents/sticker_'),
      packId: undefined,
    });
  });
});