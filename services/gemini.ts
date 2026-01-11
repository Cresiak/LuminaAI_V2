
import { GoogleGenAI } from "@google/genai";
import { EnhancementQuality } from "../types";

const getPromptByQuality = (quality: EnhancementQuality) => {
  const baseInstructions = `
Act as a professional high-end photo retoucher and lighting expert. 
Enhance this image following these specific instructions:

1. IDENTITY & EXPRESSION PRESERVATION (HIGHEST PRIORITY): 
   - You MUST keep all human faces exactly as they are in terms of anatomy, bone structure, and expression. 
   - Do NOT alter the person's identity, smile, eye shape, or subtle facial movements. 
   - The goal is to see the person better, not to change who they are or how they look.

2. BACKLIT CORRECTION & EXPOSURE: 
   - Specifically identify and fix backlit subjects. 
   - Use advanced shadow recovery to bring out details in silhouetted or underexposed subjects. 
   - Carefully tone down overexposed highlights in the background (like the sky or windows) to create a balanced, professional HDR look.

3. COLOR CORRECTION: 
   - Adjust white balance for natural, skin-friendly tones. 
   - Ensure skin tones remain realistic and consistent with the original lighting environment.
`;

  const qualitySpecifics = {
    [EnhancementQuality.LOW]: `
4. EFFICIENCY FOCUS: 
   - Focus on essential exposure correction and primary color balance. 
   - Use moderate sharpening.
   - Aim for a clean, natural look with standard processing depth.
`,
    [EnhancementQuality.MEDIUM]: `
4. PROFESSIONAL BALANCED ENHANCEMENT: 
   - Apply intelligent sharpening to emphasize textures and micro-contrasts.
   - Enhance color depth and vibrancy for a professional cinematic feel.
   - Smooth out noise in recovered shadow areas while meticulously preserving original skin textures and pores.
`,
    [EnhancementQuality.HIGH]: `
4. MAXIMUM DETAIL & ULTRA-HDR: 
   - Prioritize pixel-perfect texture recovery. 
   - Use extreme precision in shadow recovery to unveil the finest details previously hidden in the dark.
   - Apply multi-layered color grading for maximum depth and professional vibrancy.
   - Ensure the highest possible level of micro-contrast sharpening for a stunning "pop" effect.
   - Meticulous noise reduction that mimics high-end full-frame sensor output.
`
  };

  return baseInstructions + qualitySpecifics[quality] + "\nThe output must be ONLY the enhanced version of the image.";
};

export async function enhanceImage(base64Data: string, mimeType: string, quality: EnhancementQuality = EnhancementQuality.MEDIUM): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data.split(',')[1], // Remove prefix if present
              mimeType: mimeType,
            },
          },
          {
            text: getPromptByQuality(quality)
          },
        ],
      },
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
    throw new Error(error.message || "Failed to enhance image");
  }
}
