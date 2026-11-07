// Typing for the JSON dataset imported lazily by src/lib/emoji-data.ts
// (the admin tsconfig does not enable resolveJsonModule).
declare module "unicode-emoji-json/data-by-group.json" {
  const groups: {
    name: string;
    slug: string;
    emojis: {
      emoji: string;
      skin_tone_support: boolean;
      name: string;
      slug: string;
      unicode_version: string;
      emoji_version: string;
    }[];
  }[];
  export default groups;
}
