
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Era, ImageStyle, Resolution } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes the image using gemini-3-pro-preview
 * analysisType: 'CONTEXT' for historical era matching, 'DAMAGE' for restoration
 */
export const analyzeImage = async (base64Image: string, analysisType: 'CONTEXT' | 'DAMAGE' = 'CONTEXT'): Promise<string> => {
  try {
    // Remove header if present for API compatibility
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const prompt = analysisType === 'CONTEXT' 
      ? "Analyze this image in detail. Describe the person's appearance, expression, clothing, and the setting. Provide a creative assessment of what historical era they might accidentally fit into based on their vibe."
      : "Analyze this image specifically for physical defects, damage, and age-related degradation. Look for scratches, dust, tears, discoloration, fading, noise, blurriness, or artifacts. Provide a concise list of what needs to be repaired to restore it to pristine condition.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
};

/**
 * Generates a creative prompt based on the image using gemini-3-pro-preview
 */
export const generateCreativePrompt = async (base64Image: string): Promise<string> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    const prompt = "Act as an expert AI prompt engineer. Analyze this image and generate a high-quality, detailed text prompt that could be used to recreate this exact image using an AI image generator. Include specific details about the subject, pose, facial expression, clothing, textures, lighting, camera angle, depth of field, and overall artistic style/mood. Output ONLY the raw prompt text, no conversational filler.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Prompt generation failed:", error);
    throw new Error("Failed to generate prompt.");
  }
};

/**
 * Generates a time-travel version of the image using gemini-2.5-flash-image
 */
export const timeTravel = async (
  base64Image: string, 
  era: Era, 
  style: ImageStyle = ImageStyle.REALISTIC,
  resolution: Resolution = Resolution.STANDARD,
  detailLevel: number = 50
): Promise<string> => {
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  
  const stylePrompt = getStylePrompt(style);
  const resolutionPrompt = getResolutionPrompt(resolution, detailLevel);

  const prompt = `
    Transform this image into a scene from the ${era}.
    Keep the person's facial features and likeness exactly as they are in the original photo, but change their clothing and the background to match the ${era}.
    ${stylePrompt}
    ${resolutionPrompt}
  `;

  return processImage(cleanBase64, prompt);
};

/**
 * Custom text-based edit using gemini-2.5-flash-image
 */
export const customEdit = async (
  base64Image: string, 
  customPrompt: string, 
  style: ImageStyle = ImageStyle.REALISTIC,
  resolution: Resolution = Resolution.STANDARD,
  detailLevel: number = 50
): Promise<string> => {
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  
  const stylePrompt = getStylePrompt(style);
  const resolutionPrompt = getResolutionPrompt(resolution, detailLevel);
  
  const fullPrompt = `${customPrompt}. ${stylePrompt} ${resolutionPrompt}`;
  
  return processImage(cleanBase64, fullPrompt);
};

/**
 * Magic Edit using mask and prompt using gemini-2.5-flash-image
 */
export const magicEdit = async (
  base64Image: string,
  base64Mask: string,
  editPrompt: string
): Promise<string> => {
  const cleanImage = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  const cleanMask = base64Mask.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const prompt = `
    You are an expert image editor. I have provided two images.
    1. The original image.
    2. A mask image where the white area indicates the specific region to edit.
    
    Task: Edit the original image by changing the content of the masked area to match this instruction: '${editPrompt}'.
    
    Rules:
    - Seamlessly blend the edited area with the surrounding pixels (inpainting).
    - Do NOT modify any part of the image that corresponds to the black area of the mask.
    - Maintain the lighting, perspective, and quality of the original image.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanImage,
              mimeType: 'image/jpeg',
            },
          },
          {
            inlineData: {
              data: cleanMask,
              mimeType: 'image/png',
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Magic edit failed:", error);
    throw new Error("Failed to edit image. Please try again.");
  }
};

const getStylePrompt = (style: ImageStyle): string => {
  switch (style) {
    case ImageStyle.CINEMATIC: return "Cinematic lighting, dramatic atmosphere, movie still quality, color graded, widescreen aspect ratio.";
    case ImageStyle.VINTAGE: return "Vintage film grain, sepia tones, slightly faded, daguerreotype style, authentic period look.";
    case ImageStyle.PAINTING: return "Oil painting style, visible brushstrokes, classical art composition, textured canvas look.";
    case ImageStyle.CYBER: return "Neon lighting, high contrast, glowing accents, futuristic aesthetic, cybernetic details.";
    case ImageStyle.SKETCH: return "Charcoal sketch, pencil lines, artistic shading, monochrome, hand-drawn style.";
    case ImageStyle.STUDIO: return "Professional studio lighting, softbox, neutral background, high key, perfect portrait.";
    case ImageStyle.STEAMPUNK: return "Steampunk aesthetic, brass gears, copper accents, steam-powered machinery background, victorian industrial style.";
    case ImageStyle.ART_DECO: return "Art Deco style, geometric patterns, gold and black color palette, lavish 1920s luxury, symmetrical composition.";
    case ImageStyle.RETRO_FUTURISM: return "Retro-futurism, 1950s atomic age sci-fi, chrome surfaces, flying cars, vibrant colors, space age optimism.";
    case ImageStyle.REALISTIC: default: return "Photorealistic, natural lighting, sharp focus, true to life colors.";
  }
};

const getResolutionPrompt = (resolution: Resolution, detailLevel: number): string => {
    let base = "Standard resolution.";
    let detailDesc = "balanced details";

    if (resolution === Resolution.HIGH) {
        base = "High quality, detailed, sharp focus.";
    } else if (resolution === Resolution.ULTRA_4K) {
        base = "4K resolution, ultra sharp, highly detailed, masterful quality.";
    }

    if (detailLevel < 30) {
        detailDesc = "soft edges, smooth textures, dreamy quality";
    } else if (detailLevel > 70) {
        detailDesc = "intricate micro-details, hyper-realistic textures, extremely sharp edges, high fidelity";
    }

    return `${base} Ensure the image has ${detailDesc}.`;
};

/**
 * Helper to call the image generation/editing model
 */
const processImage = async (base64Data: string, textPrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: textPrompt,
          },
        ],
      },
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Image generation failed:", error);
    throw new Error("Failed to generate image. Please try again.");
  }
};
