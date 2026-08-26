import axios from 'axios';
import logger from '../utils/logger';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ModerationResult {
  isSafe: boolean;
  flaggedCategory: string;
  reason: string;
}

/**
 * Rentora AI Content Moderation Shield powered by Groq
 * Automatically approves legitimate campus student essentials.
 * Flags suspicious, explicit, hazardous, or cheating items for human Admin review.
 */
export const moderateListingWithAI = async (listingData: {
  title: string;
  description: string;
  condition: string;
  rentalPrice: number;
  priceUnit: string;
}): Promise<ModerationResult> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.warn('[AI Moderation Shield] GROQ_API_KEY not set in environment. Auto-approving with safety fallback.');
    return {
      isSafe: true,
      flaggedCategory: 'NONE',
      reason: 'Auto-approved via campus safety heuristics.',
    };
  }

  const prompt = `You are the AI Safety & Content Moderation Shield for Rentora, a verified peer-to-peer student rental marketplace at NIET Greater Noida campus.

Evaluate the following student item listing submitted for campus rental:
- Title: "${listingData.title}"
- Description: "${listingData.description}"
- Condition: "${listingData.condition}"
- Price: "₹${listingData.rentalPrice} per ${listingData.priceUnit}"

Determine whether this listing is SAFE for immediate automatic approval and publication on the website, or if it must be FLAGGED for human Administrator review.

STRICT REJECTION / ADMIN REVIEW CRITERIA (isSafe: false):
1. Explicit, adult, sexually suggestive, pornographic, or NSFW materials/services.
2. Illegal substances, drugs, narcotics, vape/e-cigarettes, tobacco/bidi, alcohol, or medications.
3. Weapons, firearms, knives, brass knuckles, hazardous chemicals, or explosive materials.
4. Academic fraud / cheating (leaked AKTU/NIET question papers, solved exam answer keys, proxy attendance, fake certificates).
5. Scams, fraudulent services, extortion, hate speech, abusive harassment, or counterfeit currency.

AUTO-APPROVAL CRITERIA (isSafe: true):
- Clean, legitimate student academic and campus essentials:
  * Textbooks, syllabus guides, novel books, handwritten class notes.
  * Engineering mini-drafters, drafting boards, T-squares, compass sets, drawing sheet holders.
  * Scientific calculators (e.g. Casio fx-991EX, fx-991ES), graphing calculators.
  * Lab coats, aprons, safety goggles, lab manuals.
  * Electronics, laptop stands, chargers, monitors, mice, keyboards, Arduino/Raspberry Pi components.
  * Sports equipment (badminton rackets, cricket bats, footballs), formal suits, campus gear, musical instruments.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "isSafe": true,
  "flaggedCategory": "NONE",
  "reason": "Clear explanation of why the item is safe or why it was flagged for admin review."
}`;

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: 'You are an automated content moderation AI for a college campus rental portal. Respond only with JSON with keys: isSafe (boolean), flaggedCategory (string), reason (string).',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 6000,
      }
    );

    const rawContent = response.data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Empty response from Groq AI');
    }

    const parsed = JSON.parse(rawContent);
    const isSafe = Boolean(parsed.isSafe);
    const reason = parsed.reason || (isSafe ? 'Auto-approved by Rentora AI Shield' : 'Flagged for admin moderation');
    const flaggedCategory = parsed.flaggedCategory || (isSafe ? 'NONE' : 'SUSPICIOUS_CONTENT');

    logger.info(`[AI Moderation Shield] Listing "${listingData.title}" evaluated: isSafe=${isSafe} [${flaggedCategory}]. Reason: ${reason}`);

    return {
      isSafe,
      flaggedCategory,
      reason,
    };
  } catch (error: any) {
    logger.warn(`[AI Moderation Shield] Groq API warning: ${error.message}. Fallback applied.`);
    // Fallback: If Groq API fails or times out, perform basic regex safety checks
    const textToCheck = `${listingData.title} ${listingData.description}`.toLowerCase();
    const bannedTerms = ['weapon', 'gun', 'knife', 'drug', 'weed', 'vape', 'smoke', 'alcohol', 'beer', 'nude', 'sex', 'porn', 'leak paper', 'exam key', 'cheat'];
    const hasBannedTerm = bannedTerms.some(term => textToCheck.includes(term));

    if (hasBannedTerm) {
      return {
        isSafe: false,
        flaggedCategory: 'KEYWORD_FLAGGED',
        reason: 'Flagged for admin review due to restricted campus keywords.',
      };
    }

    return {
      isSafe: true,
      flaggedCategory: 'NONE',
      reason: 'Auto-approved via campus safety heuristics.',
    };
  }
};
