/**
 * Profanity filter utility using WebPurify-like API with multi-language support
 * This implementation uses a custom profanity detection approach with Filipino support
 */

// Comprehensive profanity list - English and Filipino
const profanityList = {
  en: [
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap', 'piss',
    'dick', 'cock', 'pussy', 'bastard', 'whore', 'slut', 'fag',
    'nigger', 'nigga', 'cunt', 'motherfucker', 'asshole', 'bullshit',
    'jackass', 'dumbass', 'dipshit', 'shithead', 'fucked', 'fucking',
    'motherfucking', 'goddamn', 'prick', 'twat', 'wanker', 'douche'
  ],
  fil: [
    'putang ina', 'putangina', 'tangina', 'tang ina', 'puta', 'putang',
    'gago', 'gaga', 'tarantado', 'tarantada', 'tanga', 'tangina mo',
    'bobo', 'ulol', 'inutil', 'hayop', 'hayop ka', 'peste', 'pesteng yawa',
    'pakyu', 'pak you', 'leche', 'letse', 'punyeta', 'puñeta', 'pakshet',
    'paksheet', 'bwisit', 'buwisit', 'kupal', 'kingina', 'tangena',
    'hinayupak', 'hinampak', 'shunga', 'gunggong', 'animal ka',
    'walang hiya', 'walang kwenta', 'yawa', 'lintik', 'lintek',
    'pisting yawa', 'piste', 'anak ng', 'putang inang',
    'pokpok', 'puta ka', 'gago ka', 'unggoy', 'aso ka', 'demonyo'
  ]
};

/**
 * Normalize text for better matching (handles spacing, special chars)
 */
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/\s+/g, ' ')  // normalize spaces
    .replace(/[^\w\s]/g, '') // remove special chars
    .trim();
}

/**
 * Create regex pattern with leetspeak variations
 */
function createFlexiblePattern(word: string): RegExp {
  const pattern = word.split('').map(char => {
    if (char === 'a') return '[a@4]';
    if (char === 'e') return '[e3]';
    if (char === 'i') return '[i!1l]';
    if (char === 'o') return '[o0]';
    if (char === 's') return '[s$5z]';
    if (char === 't') return '[t+7]';
    if (char === 'u') return '[uv]';
    if (char === ' ') return '[\\s\\-_]*';
    return char;
  }).join('');
  
  return new RegExp(`\\b${pattern}\\b`, 'i');
}

/**
 * Check if text contains profanity in English or Filipino
 * @param text The text to check
 * @returns Promise that resolves to true if profanity is detected
 */
export async function containsProfanity(text: string): Promise<boolean> {
  if (!text) return false;
  
  const normalized = normalizeText(text);
  
  // Check English profanity
  for (const word of profanityList.en) {
    const flexRegex = createFlexiblePattern(word);
    if (flexRegex.test(normalized)) {
      return true;
    }
  }
  
  // Check Filipino profanity
  for (const word of profanityList.fil) {
    const flexRegex = createFlexiblePattern(word);
    if (flexRegex.test(normalized)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get censored version of text with profanity replaced
 * @param text The text to censor
 * @returns Promise that resolves to censored text
 */
export async function censorProfanity(text: string): Promise<string> {
  if (!text) return text;
  
  let censored = text;
  
  // Censor English profanity
  for (const word of profanityList.en) {
    const flexRegex = createFlexiblePattern(word);
    const replacement = '*'.repeat(Math.max(4, word.length));
    censored = censored.replace(new RegExp(flexRegex, 'gi'), replacement);
  }
  
  // Censor Filipino profanity
  for (const word of profanityList.fil) {
    const flexRegex = createFlexiblePattern(word);
    const replacement = '*'.repeat(Math.max(4, word.replace(/\s/g, '').length));
    censored = censored.replace(new RegExp(flexRegex, 'gi'), replacement);
  }
  
  return censored;
}

/**
 * Get array of profane words detected in text
 * @param text The text to check
 * @returns Promise that resolves to array of detected profane words
 */
export async function getProfaneWords(text: string): Promise<string[]> {
  if (!text) return [];
  
  const normalized = normalizeText(text);
  const detected: string[] = [];
  
  // Check English profanity
  for (const word of profanityList.en) {
    const flexRegex = createFlexiblePattern(word);
    if (flexRegex.test(normalized)) {
      detected.push(word);
    }
  }
  
  // Check Filipino profanity
  for (const word of profanityList.fil) {
    const flexRegex = createFlexiblePattern(word);
    if (flexRegex.test(normalized)) {
      detected.push(word);
    }
  }
  
  return detected;
}

/**
 * Log profanity violation to the server
 * @param violationData - Data about the violation
 * @returns Promise that resolves when violation is logged
 */
export async function logProfanityViolation(violationData: {
  user_id: number;
  context_type: 'forum_post' | 'forum_comment' | 'chat_message' | 'general';
  context_id?: number | null;
  attempted_content: string;
  detected_words: string[];
  severity?: 'low' | 'medium' | 'high';
}): Promise<void> {
  try {
    const response = await fetch('https://api.cictpeerlearninghub.com/api/profanity-violations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(violationData)
    });

    if (!response.ok) {
      console.error('Failed to log profanity violation:', response.statusText);
    }
  } catch (error) {
    console.error('Error logging profanity violation:', error);
  }
}

/**
 * Check for profanity and log violation if found
 * @param text - The text to check
 * @param user_id - The user ID
 * @param context_type - The context where profanity was attempted
 * @param context_id - The ID of the context (forum_id, comment_id, etc.)
 * @returns Promise that resolves to object with profanity detection result and detected words
 */
export async function checkAndLogProfanity(
  text: string, 
  user_id: number, 
  context_type: 'forum_post' | 'forum_comment' | 'chat_message' | 'general',
  context_id?: number | null
): Promise<{ hasProfanity: boolean; detectedWords: string[] }> {
  const detectedWords = await getProfaneWords(text);
  const hasProfanity = detectedWords.length > 0;
  
  if (hasProfanity) {
    // Determine severity based on number of profane words
    let severity: 'low' | 'medium' | 'high' = 'medium';
    if (detectedWords.length >= 5) {
      severity = 'high';
    } else if (detectedWords.length <= 1) {
      severity = 'low';
    }

    // Log the violation
    await logProfanityViolation({
      user_id,
      context_type,
      context_id,
      attempted_content: text,
      detected_words: detectedWords,
      severity
    });
  }
  
  return { hasProfanity, detectedWords };
}

