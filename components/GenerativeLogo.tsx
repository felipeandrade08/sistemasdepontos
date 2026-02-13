
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Clock } from 'lucide-react';

const GenerativeLogo: React.FC<{ size?: number }> = ({ size = 64 }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // We only generate the logo once or if it doesn't exist in session
    const cached = sessionStorage.getItem('app_gen_logo');
    if (cached) {
      setImageUrl(cached);
    } else {
      generateLogo();
    }
  }, []);

  const generateLogo = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: 'A professional, modern, high-quality flat vector logo for a workforce management app called "Sistema de Pontos Pro". The logo should feature elements like a sleek clock icon and a checkmark, using deep indigo, emerald green, and white colors. Minimalist design, professional corporate style, isolated on white background.',
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const url = `data:image/png;base64,${part.inlineData.data}`;
          setImageUrl(url);
          sessionStorage.setItem('app_gen_logo', url);
          break;
        }
      }
    } catch (error) {
      console.error("Failed to generate logo:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !imageUrl) {
    return (
      <div className="bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg" style={{ width: size, height: size }}>
        <Clock className="text-white animate-pulse" size={size * 0.6} />
      </div>
    );
  }

  return (
    <img 
      src={imageUrl} 
      alt="App Logo" 
      className="rounded-2xl shadow-lg border border-slate-100 object-cover" 
      style={{ width: size, height: size }} 
    />
  );
};

export default GenerativeLogo;
