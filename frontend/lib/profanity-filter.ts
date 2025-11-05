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

