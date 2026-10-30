export const BRAND = {
  "wordmark": "CAi",
  "fullName": "Cursed Assistant-inator",
  "tagline": "Productivity is our job. Your data is our passion.",
  "caseSensitive": true,
  "documentTitle": "CAi | Cursed Assistant-inator",
  "plainDescription": "A personal workplace dashboard for meetings, tasks, world clocks, and daily essentials.",
  "taglineLines": [
    "Productivity is our job.",
    "Your data is our passion."
  ],
  "taglinePresentation": {
    "preferredLines": 2,
    "equalVisualWeight": true,
    "preserveSentenceOrder": true,
    "allowNaturalWrappingWithinLine": true
  }
} as const;
export const BRAND_COPY = {
  "companyAI": {
  "title": "Our dedication to AI",
  "lead": "AI is the future. CAi is building the narrative to match.",
  "sections": [
    {
      "heading": "Intelligence, by design.",
      "body": "Our proprietary deterministic intelligence layer turns explicitly defined instructions into consistently repeatable outcomes. We consider predictability an emerging capability."
    },
    {
      "heading": "A scalable AI strategy.",
      "body": "We are model-agnostic, inference-free, and aggressively aligned with the intelligence economy. Our narrative scales independently of our compute requirements."
    },
    {
      "heading": "Investor-ready by default.",
      "body": "Our dedication to AI is reflected across our positioning, our roadmap language, and the lowercase i in our name. We continue to evaluate opportunities to bring that same dedication to the implementation."
    }
  ]
},
  "dashboard": "Your work, management's success story.",
  "emptyCalendar": "Go touch some grass before it's too late.",
  "emptyCalendarVariants": ["Go touch some grass before it's too late.", "Don't get too comfortable.", "Hopefully it stays this way <3", "Would be a shame if you were added to another meeting."],
  "about": "We're in the business of productivity, with a passion for your data."
} as const;
export function brandAssetUrl(file: string, base = import.meta.env.BASE_URL): string {
  if (!base.startsWith('/') || base.startsWith('//') || /[?#\\%]/.test(base) || base.split('/').some(part=>part==='.' || part==='..') || !/^[a-z0-9.-]+$/.test(file)) throw new Error('Brand assets require a local application base.');
  return `${base.endsWith('/') ? base : base+'/'}branding/cai/${file}`;
}

export function emptyCalendarMessage(dateKey: string): string {
  const day = Math.floor((Date.parse(`${dateKey}T12:00:00Z`) - Date.parse('2026-10-27T12:00:00Z')) / 86400000);
  const variants = BRAND_COPY.emptyCalendarVariants;
  return variants[((day % variants.length) + variants.length) % variants.length] ?? variants[0];
}
