import {ArtisticStyle, AIPromptConfig, GeneratedSticker} from '@/types';

export class AIService {
  private static readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent';
  private static readonly API_KEY = ''; // TODO: Move to secure config
  private static readonly MAX_RETRIES = 3;
  private static readonly INITIAL_DELAY = 1000;

  // AI Prompt configurations from web reference
  private static readonly PROMPT_CONFIG: AIPromptConfig = {
    forceCharacter: "\n\n**Character** The generated character/person/animal must match the features of the person/character/animal in the uploaded reference image. keep the facial feature, hair style...",
    forceWhiteBackground: "\n\n**Background:** Plain solid white #FFFFFF background only (no background colors/elements)",
    skinTonePersistence: "ALWAYS PRESERVE the skin tone / hair style and other distict features of the uploaded character/person.",
    colorPalletPersistence: "First, describe the distinct features and style of the uploaded image in great detail e.g. hair style name, outfit name, and so on. Also, specify the color of each main element using its hexadecimal (HEX) code."
  };

  static getStylePrompt(styleId: string, emotion: string): string {
    const profilePicInstruction = "The character should be customized based on the attached profile picture.";
    
    switch (styleId) {
      case 'pop-art':
        return `Create a single sticker in the distinct Pop Art style. ${profilePicInstruction} The character must express the emotion: '${emotion}'. The image should feature bold, thick black outlines around all figures, objects, and text. Utilize a limited, flat color palette consisting of vibrant primary and secondary colors, applied in unshaded blocks, but maintain the person skin tone. Incorporate visible Ben-Day dots or halftone patterns to create shading, texture, and depth. The subject should display a dramatic expression. Include stylized text within speech bubbles or dynamic graphic shapes to represent sound effects (onomatopoeia). The overall aesthetic should be clean, graphic, and evoke a mass-produced, commercial art sensibility with a polished finish. The user's face from the uploaded photo must be the main character, ideally with an interesting outline shape that is not square or circular but closer to a dye-cut pattern.`;
      
      case 'claymation':
        return `Create a single sticker in the style of a classic claymation character. ${profilePicInstruction} The character must express the emotion: '${emotion}'. The sticker should feature a claymation character where the picture is made to look like it is made from clay, and an interesting claymation landscape in the background, using the playfulness of claymation to exaggerate certain features depending on the emotion, and with clay-like sculpting of the face visible when expressing different emotions, ideally with an interesting outline shape that is not square or circular but closer to a dye-cut pattern.`;
      
      case 'cartoon-dino':
        return `Create a single sticker of an anthropomorphized cartoon dinosaur. ${profilePicInstruction} The character's face, customized from the attached profile picture, must express the emotion: '${emotion}'. The style should be cute and whimsical with bright, cheerful colors and a simple background suitable for a messaging app, ideally with an interesting outline shape that is not square or circular but closer to a dye-cut pattern.`;
      
      case 'pixel-art':
        return `Create a single sticker in the style of a retro Pixel Art piece. ${profilePicInstruction} The character must express the emotion: '${emotion}'. The pixel art should be colorful, abstract, slightly retro-futuristic, combining 8 bit and glitch elements, and incorporating additional icons or accessories that represent the intended emotion, ideally with an interesting outline shape that is not square or circular but closer to a dye-cut pattern.`;
      
      case 'royal':
        return `Create a single sticker transforming the pic into royalty - a king, queen, prince or princess - with unicorns and rainbows. ${profilePicInstruction} The character must express the emotion: '${emotion}'. The image should feature a cool looking king, queen, prince or cute princess along with augmenting aces, spades, diamonds, hearts, unicorns, rainbows and clouds, ideally with an interesting outline shape that is not square or circular but closer to a die-cut pattern. The user's face should always be in a cartoonish style like the surrounding stickers, and never show in a photorealistic style.`;
      
      case 'football-sticker':
        return `Generate a single sticker in the style of vintage 1970s soccer trading cards ${profilePicInstruction} The character must express the emotion: '${emotion}'. The sticker should feature a headshot or upper torso portrait of a football player or manager Optionally, include a small, stylized team crest or a retro club name banner at the top. The entire sticker should have a clean, defined border and a slightly aged or matte finish to evoke a nostalgic, collectible feel.`;
      
      case 'vintage-bollywood':
        return `Change my image to a 1960's retro Bollywood themed poster. ${profilePicInstruction} Generate a poster with emotion: '${emotion}'.`;
      
      case 'japanese-matchbox':
        return `Make a single sticker in Japanese Showa-era matchbox art. ${profilePicInstruction} The character must express the emotion: '${emotion}'. Make a sticker in Japanese Showa-era matchbox art of a cat drinking coffee, retro graphic design, limited color palette, distressed paper texture and a retro-futuristic rocket ship, design for a 1960s Japanese matchbox label. Showa kitsch illustration of a person winking, simple lines, 2-color print style., ideally with an interesting outline shape that is not square or circular but closer to a dye-cut pattern.`;
      
      case 'sticker-bomb':
        return `Stylize and augment the user pic in a stickerbomb style. ${profilePicInstruction} The character must express the emotion: '${emotion}'. Stickerbomb style with colorful graphic stickers surrounding the users face, also reflecting the emotion depicted, ideally with an interesting outline shape that is not square or circular but closer to a dye-cut pattern. The user's face should always be in a cartoonish style like the surrounding stickers, and never show in a photorealistic style.`;
      
      default:
        return `Create a sticker of a person expressing '${emotion}' in a ${styleId} style, based on the uploaded photo.`;
    }
  }

  static buildFullPrompt(styleId: string, emotion: string): string {
    const userPrompt = this.getStylePrompt(styleId, emotion);
    
    switch (styleId) {
      case 'vintage-bollywood':
        return this.PROMPT_CONFIG.colorPalletPersistence + userPrompt + this.PROMPT_CONFIG.skinTonePersistence;
      case 'cartoon-dino':
        return this.PROMPT_CONFIG.colorPalletPersistence + userPrompt + this.PROMPT_CONFIG.forceWhiteBackground;
      default:
        return this.PROMPT_CONFIG.colorPalletPersistence + userPrompt + this.PROMPT_CONFIG.forceCharacter + this.PROMPT_CONFIG.forceWhiteBackground + this.PROMPT_CONFIG.skinTonePersistence;
    }
  }

  static async makeApiCallWithRetry(
    imageData: string,
    mimeType: string,
    styleId: string,
    emotion: string
  ): Promise<GeneratedSticker> {
    const fullPrompt = this.buildFullPrompt(styleId, emotion);
    
    const payload = {
      contents: [{
        parts: [
          { text: fullPrompt },
          { inlineData: { mimeType, data: imageData } }
        ]
      }],
      generationConfig: { responseModalities: ['IMAGE'] }
    };

    let attempt = 0;
    
    while (attempt < this.MAX_RETRIES) {
      try {
        const response = await fetch(`${this.GEMINI_API_URL}?key=${this.API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const result = await response.json();
        const base64Data = result?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        
        if (base64Data) {
          return {
            emotion,
            imageUrl: `data:image/png;base64,${base64Data}`,
            isLoading: false
          };
        } else {
          const safetyError = result?.promptFeedback?.blockReason;
          throw new Error(safetyError ? `Generation blocked: ${safetyError}` : 'No image data in response.');
        }
      } catch (err: any) {
        console.error(`Attempt ${attempt + 1} for emotion '${emotion}' failed:`, err);
        attempt++;
        
        if (attempt >= this.MAX_RETRIES) {
          return {
            emotion,
            imageUrl: null,
            isLoading: false,
            error: err.message
          };
        }
        
        await new Promise(res => setTimeout(res, this.INITIAL_DELAY * Math.pow(2, attempt)));
      }
    }

    return {
      emotion,
      imageUrl: null,
      isLoading: false,
      error: "Max retries reached."
    };
  }

  static async generateMultipleStickers(
    imageData: string,
    mimeType: string,
    styleId: string,
    emotions: string[]
  ): Promise<GeneratedSticker[]> {
    const promises = emotions.map(emotion => 
      this.makeApiCallWithRetry(imageData, mimeType, styleId, emotion)
    );
    
    return Promise.all(promises);
  }
}