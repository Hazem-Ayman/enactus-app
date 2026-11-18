import { createAvatar } from '@dicebear/core';
import { bottts, adventurer, funEmoji } from '@dicebear/collection';
import { AvatarConfig, AvatarStyle } from '@/types';

export const styleMap = {
  bottts,
  adventurer,
  funEmoji,
} as const;

export interface StyleOptionMeta {
  id: AvatarStyle;
  label: string;
  icon: string;
  description: string;
}

export const AVATAR_STYLES: StyleOptionMeta[] = [
  {
    id: 'bottts',
    label: 'Robot 🤖',
    icon: '🤖',
    description: 'Mechanized tech bots with customizable antennas, visors & sensors',
  },
  {
    id: 'adventurer',
    label: 'Human 👤',
    icon: '👤',
    description: 'Stylized explorers with custom hairstyles, glasses & smiles',
  },
  {
    id: 'funEmoji',
    label: 'Playful 👾',
    icon: '👾',
    description: 'Animated, expressive character faces with fun moods & shades',
  },
];

export const COLOR_PALETTES = [
  { id: 'cyan', hex: '06b6d4', label: 'Cyan', bgClass: 'bg-cyan-500' },
  { id: 'amber', hex: 'f59e0b', label: 'Gold', bgClass: 'bg-amber-500' },
  { id: 'emerald', hex: '10b981', label: 'Emerald', bgClass: 'bg-emerald-500' },
  { id: 'purple', hex: '8b5cf6', label: 'Purple', bgClass: 'bg-purple-500' },
  { id: 'pink', hex: 'ec4899', label: 'Rose Pink', bgClass: 'bg-pink-500' },
  { id: 'blue', hex: '3b82f6', label: 'Royal Blue', bgClass: 'bg-blue-500' },
  { id: 'slate', hex: '334155', label: 'Slate Dark', bgClass: 'bg-slate-700' },
];

export const BOTTTS_TOPS = [
  { id: 'antenna', label: 'Antenna 📡' },
  { id: 'horns', label: 'Horns ⚡' },
  { id: 'bulb01', label: 'Light Bulb 💡' },
  { id: 'radar', label: 'Radar Dish 🛰️' },
  { id: 'lights', label: 'Siren Lights 🚨' },
  { id: 'pyramid', label: 'Pyramid 🔺' },
  { id: 'glowingBulb01', label: 'Glow Orb 🔮' },
];

export const BOTTTS_EYES = [
  { id: 'happy', label: 'Happy 😊' },
  { id: 'hearts', label: 'Heart Eyes 😍' },
  { id: 'glow', label: 'Neon Glow ✨' },
  { id: 'sensor', label: 'Optic Sensor 🔴' },
  { id: 'robocop', label: 'VR Visor 🥽' },
  { id: 'round', label: 'Classic Dots 👀' },
  { id: 'shade01', label: 'Cool Shades 😎' },
  { id: 'bulging', label: 'Alert Bulge 😳' },
];

export const BOTTTS_MOUTHS = [
  { id: 'smile01', label: 'Friendly Smile' },
  { id: 'smile02', label: 'Wide Grin' },
  { id: 'grill01', label: 'Speaker Grill' },
  { id: 'bite', label: 'Robo Teeth' },
  { id: 'diagram', label: 'Audio Wave' },
  { id: 'square01', label: 'Pixel Box' },
];

export const ADVENTURER_HAIRS = [
  { id: 'short01', label: 'Short Crop' },
  { id: 'short04', label: 'Fade' },
  { id: 'short07', label: 'Side Part' },
  { id: 'short10', label: 'Wavy' },
  { id: 'short14', label: 'Buzz' },
  { id: 'long01', label: 'Long Waves' },
  { id: 'long05', label: 'Ponytail' },
  { id: 'long10', label: 'Braids' },
  { id: 'long15', label: 'Curly Flow' },
];

export const ADVENTURER_GLASSES = [
  { id: 'none', label: 'None' },
  { id: 'variant01', label: 'Round Specs 👓' },
  { id: 'variant02', label: 'Square Frames 🕶️' },
  { id: 'variant03', label: 'Thin Metal' },
  { id: 'variant04', label: 'Sunglasses 😎' },
];

export const ADVENTURER_MOUTHS = [
  { id: 'variant01', label: 'Warm Smile' },
  { id: 'variant04', label: 'Open Laugh' },
  { id: 'variant08', label: 'Confident Smirk' },
  { id: 'variant15', label: 'Friendly Grin' },
  { id: 'variant20', label: 'Neutral Chill' },
];

export const FUN_EMOJI_EYES = [
  { id: 'cute', label: 'Sparkle Eyes 🥺' },
  { id: 'love', label: 'Heart Eyes 😍' },
  { id: 'stars', label: 'Star Eyes 🤩' },
  { id: 'shades', label: 'Cool Shades 😎' },
  { id: 'wink', label: 'Playful Wink 😉' },
  { id: 'glasses', label: 'Nerd Glasses 🤓' },
  { id: 'plain', label: 'Classic Calm 🙂' },
];

export const FUN_EMOJI_MOUTHS = [
  { id: 'wideSmile', label: 'Big Smile 😄' },
  { id: 'lilSmile', label: 'Gentle Smile 😊' },
  { id: 'cute', label: 'Cute Smirk 😽' },
  { id: 'tongueOut', label: 'Tongue Out 😋' },
  { id: 'kissHeart', label: 'Kiss Heart 😘' },
  { id: 'smileLol', label: 'Laughing 😂' },
  { id: 'faceMask', label: 'Mystery Mask 😷' },
];

/**
 * Normalizes any avatar config (including legacy or partial objects) into a valid DiceBear AvatarConfig.
 */
export function normalizeAvatarConfig(
  config?: Partial<AvatarConfig> | Record<string, unknown>,
  fallbackSeed: string = 'EnactusMember'
): AvatarConfig {
  if (
    config &&
    (config.style === 'bottts' || config.style === 'adventurer' || config.style === 'funEmoji')
  ) {
    return {
      style: config.style,
      seed: (config.seed as string) || fallbackSeed,
      backgroundColor: (config.backgroundColor as string[]) || ['06b6d4'],
      radius: (config.radius as number) ?? 50,
      eyes: config.eyes as string[],
      mouth: config.mouth as string[],
      top: config.top as string[],
      sides: config.sides as string[],
      baseColor: config.baseColor as string[],
      hair: config.hair as string[],
      hairColor: config.hairColor as string[],
      glasses: config.glasses as string[],
      skinColor: config.skinColor as string[],
    };
  }

  // Gracefully handle legacy objects { type: 'robot' | 'human' | 'monster' | 'alien', ... }
  if (config && config.type) {
    if (config.type === 'human') {
      return {
        style: 'adventurer',
        seed: fallbackSeed,
        backgroundColor: ['f59e0b'],
        radius: 50,
        hair: ['short01'],
        glasses:
          config.accessory === 'sunglasses'
            ? ['variant04']
            : config.accessory === 'glasses'
            ? ['variant01']
            : [],
        mouth: ['variant01'],
      };
    } else if (config.type === 'monster' || config.type === 'alien') {
      return {
        style: 'funEmoji',
        seed: fallbackSeed,
        backgroundColor: ['8b5cf6'],
        radius: 50,
        eyes: config.accessory === 'heart_eyes' ? ['love'] : ['stars'],
        mouth: ['wideSmile'],
      };
    } else {
      // Default to bottts
      return {
        style: 'bottts',
        seed: fallbackSeed,
        backgroundColor: ['06b6d4'],
        radius: 50,
        top:
          config.accessory === 'horns'
            ? ['horns']
            : config.accessory === 'antenna'
            ? ['antenna']
            : ['bulb01'],
        eyes: config.accessory === 'heart_eyes' ? ['hearts'] : ['happy'],
        mouth: ['smile01'],
      };
    }
  }

  // Complete fallback default
  return {
    style: 'bottts',
    seed: fallbackSeed,
    backgroundColor: ['06b6d4'],
    radius: 50,
    top: ['antenna'],
    eyes: ['happy'],
    mouth: ['smile01'],
  };
}

/**
 * Synchronously generates an SVG Data URI for the given avatar config.
 */
export function getAvatarDataUri(
  config?: AvatarConfig | Record<string, unknown>,
  fallbackSeed: string = 'Hero'
): string {
  const normalized = normalizeAvatarConfig(config, fallbackSeed);
  const styleFn = styleMap[normalized.style] || bottts;

  const options: Record<string, unknown> = {
    seed: normalized.seed,
    radius: normalized.radius ?? 50,
  };

  if (normalized.backgroundColor && normalized.backgroundColor.length > 0) {
    options.backgroundColor = normalized.backgroundColor;
  }

  if (normalized.style === 'bottts') {
    if (normalized.eyes && normalized.eyes.length > 0) options.eyes = normalized.eyes;
    if (normalized.mouth && normalized.mouth.length > 0) options.mouth = normalized.mouth;
    if (normalized.top && normalized.top.length > 0) {
      options.top = normalized.top;
      options.topProbability = 100;
    }
    if (normalized.sides && normalized.sides.length > 0) options.sides = normalized.sides;
    if (normalized.baseColor && normalized.baseColor.length > 0) options.baseColor = normalized.baseColor;
  } else if (normalized.style === 'adventurer') {
    if (normalized.hair && normalized.hair.length > 0) {
      options.hair = normalized.hair;
      options.hairProbability = 100;
    }
    if (normalized.hairColor && normalized.hairColor.length > 0) options.hairColor = normalized.hairColor;
    if (normalized.glasses && normalized.glasses.length > 0 && normalized.glasses[0] !== 'none') {
      options.glasses = normalized.glasses;
      options.glassesProbability = 100;
    } else {
      options.glassesProbability = 0;
    }
    if (normalized.mouth && normalized.mouth.length > 0) options.mouth = normalized.mouth;
    if (normalized.skinColor && normalized.skinColor.length > 0) options.skinColor = normalized.skinColor;
  } else if (normalized.style === 'funEmoji') {
    if (normalized.eyes && normalized.eyes.length > 0) options.eyes = normalized.eyes;
    if (normalized.mouth && normalized.mouth.length > 0) options.mouth = normalized.mouth;
  }

  try {
    return (
      createAvatar as unknown as (
        style: unknown,
        opts: unknown
      ) => { toDataUri: () => string }
    )(styleFn, options).toDataUri();
  } catch (err) {
    console.error('Error generating DiceBear avatar:', err);
    // Safe deterministic fallback
    return createAvatar(bottts, { seed: fallbackSeed, radius: 50 }).toDataUri();
  }
}

/**
 * Creates a fun randomized avatar config for the selected style.
 */
export function getRandomAvatarConfig(style: AvatarStyle = 'bottts', seedPrefix: string = 'User'): AvatarConfig {
  const randomSeed = `${seedPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
  const randomColor = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)].hex;

  if (style === 'bottts') {
    const randomTop = BOTTTS_TOPS[Math.floor(Math.random() * BOTTTS_TOPS.length)].id;
    const randomEyes = BOTTTS_EYES[Math.floor(Math.random() * BOTTTS_EYES.length)].id;
    const randomMouth = BOTTTS_MOUTHS[Math.floor(Math.random() * BOTTTS_MOUTHS.length)].id;

    return {
      style: 'bottts',
      seed: randomSeed,
      backgroundColor: [randomColor],
      radius: 50,
      top: [randomTop],
      eyes: [randomEyes],
      mouth: [randomMouth],
    };
  }

  if (style === 'adventurer') {
    const randomHair = ADVENTURER_HAIRS[Math.floor(Math.random() * ADVENTURER_HAIRS.length)].id;
    const randomGlasses = ADVENTURER_GLASSES[Math.floor(Math.random() * ADVENTURER_GLASSES.length)].id;
    const randomMouth = ADVENTURER_MOUTHS[Math.floor(Math.random() * ADVENTURER_MOUTHS.length)].id;

    return {
      style: 'adventurer',
      seed: randomSeed,
      backgroundColor: [randomColor],
      radius: 50,
      hair: [randomHair],
      glasses: randomGlasses === 'none' ? [] : [randomGlasses],
      mouth: [randomMouth],
    };
  }

  // funEmoji
  const randomEyes = FUN_EMOJI_EYES[Math.floor(Math.random() * FUN_EMOJI_EYES.length)].id;
  const randomMouth = FUN_EMOJI_MOUTHS[Math.floor(Math.random() * FUN_EMOJI_MOUTHS.length)].id;

  return {
    style: 'funEmoji',
    seed: randomSeed,
    backgroundColor: [randomColor],
    radius: 50,
    eyes: [randomEyes],
    mouth: [randomMouth],
  };
}
