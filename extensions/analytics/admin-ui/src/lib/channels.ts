// How people reached the site, in words a site owner uses.

export interface ChannelInfo {
  label: string;
  /** Completes "Most visitors found you through …". */
  phrase: string;
  /** One sentence for tooltips and table hints. */
  help: string;
}

export const CHANNELS: Record<string, ChannelInfo> = {
  direct: {
    label: "Direct",
    phrase: "your address directly (typed in, bookmarked or opened from an app)",
    help: "Typed your address, used a bookmark, or came from an app that doesn’t say where the link was.",
  },
  organic_search: {
    label: "Search engines",
    phrase: "search engines like Google",
    help: "Unpaid search results on Google, Bing, DuckDuckGo and others.",
  },
  paid_search: { label: "Search ads", phrase: "search ads", help: "Paid ads in search results." },
  organic_social: {
    label: "Social media",
    phrase: "social media",
    help: "Posts, profiles and messages on Instagram, Facebook, TikTok, Reddit and others.",
  },
  paid_social: { label: "Social ads", phrase: "social media ads", help: "Paid ads on social networks." },
  ai: {
    label: "AI assistants",
    phrase: "AI assistants like ChatGPT",
    help: "Links in answers from ChatGPT, Perplexity, Gemini and other AI assistants.",
  },
  email: { label: "Email", phrase: "email", help: "Links in emails and newsletters." },
  referral: {
    label: "Other websites",
    phrase: "links on other websites",
    help: "Links on other sites, such as review sites, partners and blogs.",
  },
  campaign: {
    label: "Campaigns",
    phrase: "your campaign links",
    help: "Links you tagged with campaign (utm_…) parameters.",
  },
};

export function channelInfo(value: string): ChannelInfo | undefined {
  return CHANNELS[value];
}
