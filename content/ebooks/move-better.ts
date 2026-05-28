// Edit this file in VS Code. The dashboard page at /dashboard/ebooks/move-better
// renders these fields. Cmd+P in the browser to export to PDF.

export type Chapter = {
  title: string
  dek: string
  lead: string
  body: string // paragraphs separated by \n\n
}

export type OfferCard = {
  eyebrow: string
  title: string
  text: string
  ctaLabel: string
  ctaHref: string
}

export type EbookContent = {
  brand: string
  title: string
  subtitle: string
  author: string
  edition: string
  chapterLabel: string
  coverBlurb: string

  manifesto: string // newlines = line breaks in display
  manifestoCaption: string

  tocTitle: string
  tocSubtitle: string

  chapters: Chapter[]

  quote1: string
  quote2: string

  ctaEyebrow: string
  ctaTitle: string
  ctaText: string

  offers: OfferCard[]

  ctaLinks: { label: string; href: string }[]

  closingTitle: string
  closingText: string
  closingSign: string

  // Photo file names inside /public/ebooks/photos
  photos: string[]
  // Index into photos[] for each chapter
  chapterPhoto: number[]
  // Layout per chapter ("a" | "b" | "c")
  layouts: ("a" | "b" | "c")[]
  // Index into photos[] for manifesto bg
  manifestoPhoto: number
  // Indices for the 4 cover slots (top to bottom)
  coverSlots: number[]
  // Insert quote pages after these chapter indices (0-based)
  quoteAfter: { 1: number; 2: number }
}

export const moveBetter: EbookContent = {
  brand: "FELIPE MUNER",
  title: "Move Better",
  subtitle: "Breath, food, movement, rest — a body built for life",
  author: "Felipe Muner",
  edition: "May 2026",
  chapterLabel: "Chapter",
  coverBlurb: "Years in motion. One simple formula.",

  manifesto: "Move every day.\nStay with the breath.\nEat like your ancestors.",
  manifestoCaption: "The essential fits in three lines.",

  tocTitle: "What's inside",
  tocSubtitle:
    "A short, direct guide — read in 20 minutes, apply for the rest of your life.",

  chapters: [
    {
      title: "Who I am",
      dek: "Built for life, not for the mirror.",
      lead: "I'm Felipe. Until I was 28 I lived the typical western loop: 8 hours of sleep, 8 hours at the office, 3 meals a day, an hour at the gym. My legs were weak, my mobility was awful, and my body looked fine in the mirror but couldn't actually do much in real life. The worst part isn't how it looks — it's how fragile it makes you. The more imbalanced your body gets, the easier it is to get hurt.",
      body: "In 2018 I left my country to travel the world, and while I was trying to enjoy it, my body was falling apart. During covid I got stuck in Vietnam, and for the first time I became really consistent with yoga, practicing every day with locals and learning from Indian masters.\n\nSo I started rebuilding from the ground up, and the wild part is that all of it happened after 30. Mobility, then flexibility, then stability and balance. Only after all of that did I add muscle, and this time it actually works. I sit on the floor without thinking about it. I lift, I twist, I run, I fall and get back up. Honestly, I'm going to hit 40 feeling better than I did in my 20s. And I'm here to help you get there too.\n\nThat's all this guide is. Not a diet, not some hack. It's the exact stuff I do, after years of trying, failing, and adjusting. You can read it in about 20 minutes and then apply it for the rest of your life. Share it with the people you care about. And if you want me to walk this path with you, I'll be waiting at the end of the book.",
    },
    {
      title: "The formula",
      dek: "Everything in one paragraph.",
      lead: "I do all my focus work fasted, before food. The body burns fat and isn't busy digesting. Skip the coffee, go for lemon with Himalayan salt. Move through the day: yoga, calisthenics, kettlebell. Eat once, at sunset — fruit, vegetables, protein. Sleep early.",
      body: "That's the whole thing. The rest is just the why and the how.\n\nYes, it's one meal a day (OMAD). You won't starve. The body adapts faster than you'd think, and the next chapter shows you how to ease in.\n\nIf you need more than one meal, eat between midday and 5pm — and put the carbs as early as you can. The body uses them better when there's still daylight.\n\nI don't do this every day either. But the more I lean in, the better I feel.",
    },
    {
      title: "How to start",
      dek: "Three weeks. Slow and steady.",
      lead: "You're not going to flip overnight. Push too hard and you'll quit in a week. Push slow and it sticks. Here's the path I'd give a friend.",
      body: "Week 1. Skip breakfast. Lemon and salt instead. Move 5 minutes a day, anywhere. A few squats, a stretch, a walk. That's it.\n\nWeek 2. Push lunch later, hour by hour. Water and tea through the day. Add one real session twice this week (kettlebell, yoga, or calisthenics). Start sleeping earlier.\n\nWeek 3. 5pm starts to feel normal. Train every day, even if it's just 10 minutes. Stay with your breath. Notice how you feel, because that's the real proof, not the scale.\n\nConsistency beats intensity. This is my path. Find yours.",
    },
    {
      title: "Fasting until 5pm",
      dek: "The body thanks you.",
      lead: "Our ancestors went days without food. We live in the most food-saturated moment in human history, so a little hunger isn't an emergency, it's how the body is supposed to feel most of the day.",
      body: "Digestion is heavy work. When you're not doing it, the body cleans up, repairs, and burns what it has stored. Energy stays steady, the mind sharpens, sleep deepens.\n\nNot for everyone. If you're pregnant, breastfeeding, underweight, on medication, or have a history of disordered eating, talk to a doctor or skip this part.",
    },
    {
      title: "Lemon + Himalayan salt",
      dek: "My breakfast.",
      lead: "A glass of water, fresh lemon juice, a good pinch of pink Himalayan salt. That's my morning. It hydrates, it mineralizes, and it wakes the body up without caffeine or sugar.",
      body: "Coffee borrows energy from later in the day. You spike, you crash, you reach for another. Lemon and salt just replace what you lost overnight and let you wake up on your own clock.\n\nSometimes I steep ginger, turmeric, black pepper, cinnamon, and a few drops of propolis in hot water. Same idea: feed the body, don't stimulate it.",
    },
    {
      title: "Food",
      dek: "The one meal, built right.",
      lead: "Eat as clean as you can. The less processed and industrial it is, the better your body will run. When you only eat once a day, the plate really matters.",
      body: "Build it in this order: fruit, vegetables, slow carbs, protein. Each layer does a job — quick energy, fiber, slow fuel, repair.\n\nI add almost every day: oats, chia, flaxseed, cinnamon, turmeric, ginger, and nutritional yeast. Cheap, simple, packed with what the body actually needs.",
    },
    {
      title: "Yoga",
      dek: "A 24-hour practice, for life.",
      lead: "Before 30 I had already lost the basics — I couldn't fold forward, couldn't squat, couldn't really use the range of motion I was born with. Yoga is how I calm my nervous system down and get those movements back: a long spine, open shoulders, open hips, ankles that bend, joints that work with me. And once they're healthier, the muscle has somewhere to go.",
      body: "But this isn't only about stretching. The postures (asanas) are just the entry.\n\nThe real yoga is finding your most balanced version — honest and humble — and working on it every day. A practice to keep alive until your last day.",
    },
    {
      title: "Kettlebell",
      dek: "One weight, the whole body.",
      lead: "Kettlebells are the closest thing I've found to training for real life. The reason is simple: they move through a much bigger range of motion than any static machine, so you build strength, mobility, and balance all at once.",
      body: "I'm done with machines. They isolate muscles, sure, but I don't want muscle I can't actually use. The rotational, ballistic, pendulum-like swings hit every small stabilizer the machines never touch, and they force both sides of the body to work under load.\n\nIf you're training for longevity, this is the work. A body that can catch a slip, absorb a fall, and bounce back from the unexpected.",
    },
    {
      title: "Mindfulness in motion",
      dek: "Breath, eyes, then movement.",
      lead: "When I train, I train. Bring love, or you're wasting time. No pain, no gain. Outdoors when possible, sunrise if I can — no phone, no music, no AC or fan, no talking, no sitting, no rush. Live each movement, fully.",
      body: "Breath first, eyes next, then the movement follows. Soft gaze, hard intention — keep the eyes focused and the body knows it's safe.\n\nEven between sets, stay with the breath. That's where the practice really lives — not just during the rep, but in the pause too. Don't break the thread. This is real Prana.\n\nTraining becomes active meditation. You leave better than you came in — and not just physically.",
    },
  ],

  quote1: "“Build a body\nfor life,\nnot the mirror.”",
  quote2: "“Controlled\nmovement builds\nreal strength.”",

  ctaEyebrow: "Next step",
  ctaTitle: "Stay in touch",
  ctaText:
    "If this guide helped you, let me know. Reach me on one of the contacts below — I love hearing your story.",

  offers: [
    {
      eyebrow: "1:1 Coaching",
      title: "Your full plan, built with me",
      text: "A few clients each month. We build your movement, nutrition, fasting, rest and breath into one plan that fits your body and goals — then I track it with you daily through a private dashboard. Message me and I'll tell you if it's a fit.",
      ctaLabel: "Apply for 1:1 on WhatsApp →",
      ctaHref:
        "https://wa.me/5521984852802?text=Hi%20Felipe%2C%20I%27m%20interested%20in%201%3A1%20coaching",
    },
    {
      eyebrow: "Travel · On the road",
      title: "Travel without losing yourself",
      text: "8 years on the road, routine never broken. I build your next trip around movement, nutrition and rest — where to train, what to eat in each country, how to sleep across time zones. A simple daily practice that fits hotels, beaches, jungles, airports.",
      ctaLabel: "Plan my trip on WhatsApp →",
      ctaHref:
        "https://wa.me/5521984852802?text=Hi%20Felipe%2C%20I%27m%20interested%20in%20a%20travel%20movement%20plan",
    },
  ],

  ctaLinks: [
    {
      label: "WhatsApp · +55 21 98485-2802",
      href: "https://wa.me/5521984852802",
    },
    {
      label: "Instagram · @felipeenjoylife",
      href: "https://instagram.com/felipeenjoylife",
    },
    { label: "Email · felipe.muner@gmail.com", href: "mailto:felipe.muner@gmail.com" },
  ],

  closingTitle: "Thank you",
  closingText:
    "This guide is a summary of what I do. It is not medical advice and not a promise. It's an invitation for you to experiment, listen to your body and build your own formula.",
  closingSign: "With gratitude,\nFelipe Muner",

  // Photo files in /public/ebooks/photos (alphabetical order matches old Python indices)
  photos: [
    "1SN01213.jpg",
    "1SN01314.jpg",
    "1SN02012.jpg",
    "1SN02109.jpg",
    "1SN03021.jpg",
    "1SN03111.jpg",
    "2SN07354.jpg",
    "2SN07573.jpg",
    "2SN09046.jpg",
    "2SN09105.jpg",
    "2SN09729.jpg",
    "z_kettlebell_rack.jpg",
    "z_thai_vegetables.jpg",
    "z_carbs.jpg",
    "z_fruits.jpg",
    "z_lemon.jpg",
    "z_protein.jpg",
    "z_planning.jpg",
    "z_breath.jpg",
    "z_fasting.jpg",
    "z_start.jpg",
    "z_yoga.jpg",
  ],
  chapterPhoto: [4, 5, 20, 19, 15, 14, 21, 11, 18],
  layouts: ["a", "b", "c", "a", "b", "c", "a", "b", "c"],
  manifestoPhoto: 5,
  coverSlots: [3, 1, 0, 6],
  quoteAfter: { 1: 4, 2: 7 },
}
