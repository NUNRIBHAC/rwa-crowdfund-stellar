// Display names for social sign-in providers. These are brand names, so they
// stay in English in every locale (LinkedIn, GitHub...); the locale catalogs
// only carry the surrounding sentence.
export const SOCIAL_PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  discord: 'Discord',
};

export const socialProviderDisplayName = (provider: string): string => SOCIAL_PROVIDER_DISPLAY_NAMES[provider] ?? provider;
