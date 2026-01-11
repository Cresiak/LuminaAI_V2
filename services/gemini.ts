
import { GoogleGenAI } from "@google/genai";
import { EnhancementQuality, IntegrityMode, ExportResolution } from "../types";

const getIntegrityInstructions = (mode: IntegrityMode) => {
  switch (mode) {
    case IntegrityMode.EXPRESSION:
      return `
1. EXPRESSION INTEGRITY (MAXIMUM):
   - Treat the human face (eyes, mouth, nose, facial muscles) as an IMMUTABLE ZONE. 
   - You MUST NOT change the shape, position, or expression of any facial feature. 
   - The subject's mood and micro-expressions must remain identical to the original.
`;
    case IntegrityMode.GEOMETRY:
      return `
1. GEOMETRY & STRUCTURE INTEGRITY:
   - Focus on man-made structures, architecture, and straight lines.
   - Do NOT warp any perspective or bend any lines that are straight in the original.
   - Maintain the exact proportions and structural thickness of all objects.
`;
    case IntegrityMode.TEXTURE:
      return `
1. TEXTURE & GRAIN INTEGRITY:
   - Zero-smoothing policy. Preserve 100% of the original surface texture, film grain, or digital noise character.
   - Only shift the luminance and color values; do not apply any denoising that might blur fine details or patterns.
`;
    case IntegrityMode.COLOR_ONLY:
      return `
1. PHOTOREALISTIC COLOR INTEGRITY:
   - No sharpening or edge enhancement. 
   - Only perform lighting (exposure) recovery and color correction.
   - Ensure the image remains "soft" if the original was soft; do not introduce AI-generated clarity or fake edges.
`;
    default:
      return "";
  }
};

const getPromptByQuality = (quality: EnhancementQuality, mode: IntegrityMode, resolution: ExportResolution, customPrompt?: string) => {
  const is8K = resolution === ExportResolution.K8;
  const baseInstructions = `
Act as a professional technical photo editor. Your primary goal is "Technical Restoration," not "Generative Alteration."
${getIntegrityInstructions(mode)}

2. LIGHTING RESTORATION:
   - Correct backlighting (HDR recovery). Bring the subject out of the shadows.
   - Balance global exposure. Recover details in clipped highlights and crushed shadows.
   - Use intelligent local contrast to make the subject visible without changing their physical form.

3. COLOR FIDELITY:
   - Restore natural white balance and saturation levels consistent with a high-end RAW development process.
${is8K ? "\n4. ULTRA-HIGH DETAIL: This is an 8K target. Use maximum sub-pixel rendering to define edge micro-textures without introducing artifacts." : ""}
`;

  const qualitySpecifics = {
    [EnhancementQuality.LOW]: `
5. PROCESSING: Basic HDR recovery and essential color balance.
`,
    [EnhancementQuality.MEDIUM]: `
5. PROCESSING: Advanced shadow extraction and noise-aware restoration.
`,
    [EnhancementQuality.HIGH]: `
5. PROCESSING: Ultra-HD reconstruction focusing on micro-contrast and deep dynamic range mapping.
`
  };

  let fullPrompt = baseInstructions + qualitySpecifics[quality];

  if (customPrompt && customPrompt.trim().length > 0) {
    fullPrompt += `\n\n6. USER-SPECIFIC OVERRIDE: 
   - The user context: "${customPrompt.trim()}"
   - Adhere to this ONLY if it does not violate the selected Integrity Mode.
`;
  }

  fullPrompt += "\nOUTPUT: Return ONLY the processed image. No text.";
  return fullPrompt;
};

export async function enhanceImage(
  base64Data: string, 
  mimeType: string, 
  quality: EnhancementQuality = EnhancementQuality.MEDIUM,
  mode: IntegrityMode = IntegrityMode.EXPRESSION,
  resolution: ExportResolution = ExportResolution.FHD,
  customPrompt?: string
): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Map internal ExportResolution to Gemini API imageSize
    let apiImageSize: "1K" | "2K" | "4K" = "1K";
    let modelName = 'gemini-2.5-flash-image';

    if (resolution === ExportResolution.K2) {
      apiImageSize = "2K";
      modelName = 'gemini-3-pro-image-preview';
    } else if (resolution === ExportResolution.K4 || resolution === ExportResolution.K8) {
      apiImageSize = "4K";
      modelName = 'gemini-3-pro-image-preview';
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data.split(',')[1],
              mimeType: mimeType,
            },
          },
          {
            text: getPromptByQuality(quality, mode, resolution, customPrompt)
          },
        ],
      },
      config: modelName === 'gemini-3-pro-image-preview' ? {
        imageConfig: {
          imageSize: apiImageSize,
          aspectRatio: "1:1" // Aspect ratio is required, 1:1 is safe as base.
        }
      } : undefined
    });

    let enhancedBase64 = '';
    
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          enhancedBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!enhancedBase64) {
      throw new Error("Gemini did not return an enhanced image part.");
    }

    return enhancedBase64;
  } catch (error: any) {
    console.error("Gemini Enhancement Error:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_ERROR");
    }
    throw new Error(error.message || "Failed to enhance image");
  }
}
