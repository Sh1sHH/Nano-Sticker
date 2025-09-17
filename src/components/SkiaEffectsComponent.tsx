import React, {useMemo} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {
  Canvas,
  Image,
  useImage,
  Rect,
  RoundedRect,
  Shadow,
  Blur,
  ColorFilter,
} from '@shopify/react-native-skia';
import {StickerEffect} from '@/types';

interface SkiaEffectsComponentProps {
  imageUri: string;
  effects: StickerEffect[];
  width?: number;
  height?: number;
}

const {width: screenWidth} = Dimensions.get('window');
const DEFAULT_SIZE = screenWidth * 0.8;

export const SkiaEffectsComponent: React.FC<SkiaEffectsComponentProps> = ({
  imageUri,
  effects,
  width = DEFAULT_SIZE,
  height = DEFAULT_SIZE,
}) => {
  const image = useImage(imageUri);

  // Create paint objects for effects
  const effectPaints = useMemo(() => {
    return effects.map((effect) => {
      // Create paint configuration object instead of Paint instance
      let paintConfig = {};
      
      switch (effect.type) {
        case 'border':
          paintConfig = {
            color: effect.config.color || '#000000',
            strokeWidth: effect.config.width || 2,
            style: 'stroke',
          };
          break;
          
        case 'shadow':
          // Shadow is handled differently in Skia
          break;
          
        case 'glow':
          paintConfig = {
            color: effect.config.color || '#ffffff',
            strokeWidth: effect.config.width || 4,
            style: 'stroke',
          };
          break;
      }
      
      return {effect, paintConfig};
    });
  }, [effects]);

  // Calculate image dimensions maintaining aspect ratio
  const imageDimensions = useMemo(() => {
    if (!image) return {width, height, x: 0, y: 0};
    
    const imageAspectRatio = image.width() / image.height();
    const containerAspectRatio = width / height;
    
    let imageWidth, imageHeight, x, y;
    
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container
      imageWidth = width;
      imageHeight = width / imageAspectRatio;
      x = 0;
      y = (height - imageHeight) / 2;
    } else {
      // Image is taller than container
      imageWidth = height * imageAspectRatio;
      imageHeight = height;
      x = (width - imageWidth) / 2;
      y = 0;
    }
    
    return {width: imageWidth, height: imageHeight, x, y};
  }, [image, width, height]);

  if (!image) {
    return <View style={[styles.container, {width, height}]} />;
  }

  return (
    <View style={[styles.container, {width, height}]}>
      <Canvas style={StyleSheet.absoluteFillObject}>
        {/* Render shadows first (behind the image) */}
        {effectPaints
          .filter(({effect}) => effect.type === 'shadow')
          .map(({effect}, index) => (
            <Shadow
              key={`shadow-${index}`}
              dx={effect.config.offset?.x || 2}
              dy={effect.config.offset?.y || 2}
              blur={effect.config.blur || 4}
              color={effect.config.color || 'rgba(0,0,0,0.3)'}
            >
              <Image
                image={image}
                x={imageDimensions.x}
                y={imageDimensions.y}
                width={imageDimensions.width}
                height={imageDimensions.height}
                fit="contain"
              />
            </Shadow>
          ))}

        {/* Render the main image */}
        <Image
          image={image}
          x={imageDimensions.x}
          y={imageDimensions.y}
          width={imageDimensions.width}
          height={imageDimensions.height}
          fit="contain"
        />

        {/* Render glow effects */}
        {effectPaints
          .filter(({effect}) => effect.type === 'glow')
          .map(({effect, paintConfig}, index) => (
            <React.Fragment key={`glow-${index}`}>
              <Blur blur={effect.config.blur || 8}>
                <RoundedRect
                  x={imageDimensions.x - (effect.config.width || 4)}
                  y={imageDimensions.y - (effect.config.width || 4)}
                  width={imageDimensions.width + 2 * (effect.config.width || 4)}
                  height={imageDimensions.height + 2 * (effect.config.width || 4)}
                  r={8}
                  color={paintConfig.color}
                  style="stroke"
                  strokeWidth={paintConfig.strokeWidth}
                />
              </Blur>
            </React.Fragment>
          ))}

        {/* Render border effects */}
        {effectPaints
          .filter(({effect}) => effect.type === 'border')
          .map(({effect, paintConfig}, index) => (
            <RoundedRect
              key={`border-${index}`}
              x={imageDimensions.x}
              y={imageDimensions.y}
              width={imageDimensions.width}
              height={imageDimensions.height}
              r={8}
              color={paintConfig.color}
              style="stroke"
              strokeWidth={paintConfig.strokeWidth}
            />
          ))}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});