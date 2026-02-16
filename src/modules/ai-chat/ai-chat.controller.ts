import { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../../config';

const RISKY_KEYWORDS = ['kill myself', 'suicide', 'self harm', 'end my life', 'want to die'];

const CRISIS_RESPONSE = 
  "I'm really sorry you're feeling this way. You're not alone. Please consider speaking with a trusted adult, counselor, or healthcare professional. If you're in immediate danger, please contact emergency services.";

const MODEL = 'mistralai/Mistral-3B-Instruct-v0.2';
const ROUTER_URL = `https://router.huggingface.co/models/${MODEL}`;

export const chatWithAI = async (req: Request, res: Response) => {
  const { message } = req.body;

  // Safety filter for crisis situations
  const containsRiskyContent = RISKY_KEYWORDS.some(keyword => 
    message.toLowerCase().includes(keyword)
  );

  if (containsRiskyContent) {
    return res.json({ 
      success: true,
      reply: CRISIS_RESPONSE 
    });
  }

  try {
    const response = await axios.post(
      ROUTER_URL,
      {
        inputs: `You are a kind, supportive AI focused on menstrual hygiene, mental health awareness, and youth empowerment. Avoid diagnosis and give educational guidance only.\n\nUser: ${message}\nAssistant:`
      },
      {
        headers: {
          Authorization: `Bearer ${config.hfToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60s for large model
      }
    );

    // Router response sometimes returns generated_text directly
    const generatedText = response.data?.generated_text || response.data?.[0]?.generated_text || '';
    const reply = generatedText.split('Assistant:')[1]?.trim() || generatedText.trim();

    res.json({ 
      success: true,
      reply 
    });
  } catch (error: any) {
    console.error('Hugging Face API error:', error.response?.data || error.message);
    
    res.status(500).json({ 
      success: false,
      message: 'AI service temporarily unavailable. Please try again later.' 
    });
  }
};
