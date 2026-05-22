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
  subtitle: "Food and movement routine",
  author: "Felipe Muner",
  edition: "Edition 01 · 2026",
  chapterLabel: "Chapter",
  coverBlurb:
    "After years in motion, I arrived at a simple formula that works for me. Here it is, no fluff.",

  manifesto: "Eat fewer times.\nMove every day.\nBreathe slowly.",
  manifestoCaption: "The essential fits in three lines.",

  tocTitle: "What's inside",
  tocSubtitle:
    "A short, direct guide — read in 20 minutes, apply for the rest of your life.",

  chapters: [
    {
      title: "Who I am",
      dek: "Built for life, not for the mirror.",
      lead: "I'm Felipe. I was stuck in the same western loop — 8h sleeping, 8h at the office, chasing the pump just for social validation. Strong upper body, weak legs, horrible mobility... a body built for the mirror, useless for life. Sound familiar?",
      body: "In 2018 I left my country, and since then I've been traveling the globe and specializing my life in movement across different countries — the goal is simple: never have a problem with my body, and live this experience as fully as I can. Stuck during covid with flexibility legends from Vietnam and India, that's when it hit me: each nationality sets the body. There, people live in bakasana — hips always working, ready for anything. The western chair destroyed ours and made us weak — not just physically, but mentally and spiritually too. We've also forgotten how our ancestors moved — we can't stay this disconnected from something so fundamental. We sit, we shrink, we age fast. They sit low, they stay open, they age slow.\n\nI rebuilt myself from the ground up. Mobility first. Flexibility next. Stability and balance after. Only then I let myself chase muscle — and now the muscle actually works. I sit on the floor without thinking. I lift, twist, run, fall, get back up. Body that looks good and moves better — every day, all year round.\n\nThat's what this guide is. Not a diet. Not a hack. The exact thing I do, after years of trying, failing and adjusting. Read it in 20 minutes. Apply it for the rest of your life.\n\nShare it with the people you love. And if you want me to walk this path with you directly, I'll be waiting for you at the end of the book.",
    },
    {
      title: "The formula",
      dek: "Everything in one paragraph.",
      lead: "In the morning, lemon with Himalayan salt. During the day, breath and controlled mindful movement: yoga, calisthenics, kettlebell. One meal a day (sunset time), abundant and simple: fruit, vegetables and protein. After food+sunset, turn on artificial lights and sleep as early as you can.  Personally, I aim for longevity — I'd rather play with free weights, bodyweight and balance than sit on a gym machine.",
      body: "That's it. The rest of this guide is about the why and the how.\n\nHonestly: I don't do this every day. But the more I do it, the better I feel — and no other approach I've tried comes close.",
    },
    {
      title: "Fasting until 5pm",
      dek: "The body thanks you.",
      lead: "No solid food during the day. Water, water with lemon and salt, tea. The body settles into a calm, focused state — no spikes, no weight of digestion. All effort/focus activities should be done before the fast is broken. With time, it will sharpen your life positively.",
      body: "To ease in, push your last meal 15 minutes later each day. The body needs time to adjust — forcing it all at once just creates anxious hunger and you quit. Move at your own pace, stay honest with your goal, and 5pm starts to feel natural.\n\nA great way to think about it: our ancestors went days without food. Today we live with the biggest food availability in human history — feeling a little hunger isn't an emergency, it's a return to normal.\n\nIf you do break the fast, lean toward protein and light food — avoid loading the body with heavy carbs before sleep. It changes your sleep, your recovery, and how you wake up the next day.",
    },
    {
      title: "Lemon + Himalayan salt",
      dek: "My breakfast.",
      lead: "In the morning: a glass of water (sometimes none), lemon juice, a generous pinch of pink Himalayan salt. Hydrates, mineralizes, wakes the body. No caffeine, no sugar, no heavy digestion. Simple and powerful.",
      body: "Why not coffee? Caffeine borrows energy from later — you spike, crash, reach for another. Lemon and salt replace what you lost overnight and let the body wake on its own clock. No dependency, no jitters, no afternoon dip.\n\nCold morning? Heat water and steep ginger, turmeric, black pepper, cinnamon, a few drops of propolis. Anti-inflammatory, warming. Same idea — feed the body, don't stimulate it.",
    },
    {
      title: "Fruit, and lots of it",
      dek: "Some days I eat 10.",
      lead: "The best scenario is to make a juice at 5pm — variety always. Mango, papaya, banana, watermelon, coconut water, pineapple — whatever is ripe and sweet at the market.",
      body: "Never forget to mix in ginger, turmeric, cinnamon, oats, chia, flaxseed, cherries, goji berries — seeds and roots are welcome. Just blend it all together. Fruit sugar with fiber and water is clean fuel: instant energy, no inflammation.",
    },
    {
      title: "Vegetables",
      dek: "Volume without weight.",
      lead: "After fruit: salad and vegetables. Greens, cucumber, tomato, carrot, lettuce, sprouts. No heavy dressings — olive oil, lemon, salt, herbs.",
      body: "Fiber, minerals, fullness. The heavy plate of the routine, but light in the body.",
    },
    {
      title: "Smart carbs",
      dek: "Slow-burning fuel.",
      lead: "Living on the island, fresh produce is everywhere. My go-to carbs: sweet potato, pumpkin (fak thong) and papaya — green or ripe. Ripe papaya is great for digestion and gives quick carbs plus enzymes; green papaya turns into som tam, the savory side. Pumpkin shows up in Thai curries and stir-fries; roasted sweet potato is sold at every market.",
      body: "I blend raw or steamed sweet potato into my juices — it thickens the drink and stretches the energy for hours. Slow-digesting, rich in fiber and micronutrients, perfect on kettlebell training days.",
    },
    {
      title: "Simple protein",
      dek: "Chicken, fish, eggs.",
      lead: "Last, the protein: grilled, steamed or boiled. Never fried, never with industrial sauces or packaged seasonings.",
      body: "The flavor comes from the food itself, not what you put on top.",
    },
    {
      title: "Kettlebell",
      dek: "One weight, the whole body.",
      lead: "Kettlebells are amazing to train your body for real life — functional strength that shows up in your daily activities. The biggest benefit comes from rotational, ballistic, pendulum-like moves: the whole body has to work stability, balance, and switch sides under load.",
      body: "I've had enough of static machines. They're great to isolate muscles, but personally I don't want a lot of muscle if I can't use it properly.",
    },
    {
      title: "Breath + muscle",
      dek: "The secret isn't the weight.",
      lead: "It's how you move. Squeeze the muscle, contract with intention, sync your breath and your gaze with the movement. Each motion is a conversation between mind and body.",
      body: "Fast movement without awareness is just burning calories. Slow, attentive movement builds real strength and balance.",
    },
    {
      title: "Eyes focused",
      dek: "Where the eyes go, the body follows.",
      lead: "Train your gaze like you train your body. Fix your eyes on a single point during a kettlebell swing, on the horizon during a get-up, on the hand that moves during a clean. The eyes anchor the nervous system — they tell the body it is safe, focused, and in control.",
      body: "Soft gaze, hard intention. No darting around, no checking the mirror, no looking at the phone. When the eyes settle, the breath settles, and the movement becomes precise. Keep the prana flowing.",
    },
    {
      title: "Mindfulness in motion",
      dek: "To train is to meditate.",
      lead: "When I train, I train. No phone, no loud music, no sitting, no rush. I feel each movement, fully.",
      body: "Training becomes active meditation. You leave better than you came in — and not just physically.",
    },
    {
      title: "How to start",
      dek: "Slow and steady.",
      lead: "Extend the fast gradually: skip breakfast first, then push lunch. In a few weeks, 5pm becomes easy.",
      body: "Move every day, even if just 5 minutes. Consistency beats intensity. This is my path — find yours.",
    },
  ],

  quote1: "“The essential is\nto eat fewer times\nand move better.”",
  quote2: "“Slow attentive\nmovement builds\nreal strength.”",

  ctaEyebrow: "Next step",
  ctaTitle: "Stay in touch",
  ctaText:
    "If this guide helped you, let me know. Reach me on Instagram or by email — I love hearing your story.",

  offers: [
    {
      eyebrow: "1:1 Coaching",
      title: "Work with me directly",
      text: "I take a few 1:1 clients each month. We build your full plan — movement, nutrition, fasting, rest, breath and mindset — adapted to your body and goals. You also get my own platform to track your movement daily, so we both see what's happening. Message me and I'll tell you if it's a fit.",
      ctaLabel: "Apply for 1:1 on WhatsApp →",
      ctaHref:
        "https://wa.me/5521984852802?text=Hi%20Felipe%2C%20I%27m%20interested%20in%201%3A1%20coaching",
    },
    {
      eyebrow: "Live my lifestyle",
      title: "Movement on the road",
      text: "8 years traveling the planet and I never broke my routine — not once. If you're a digital nomad or just love to travel, I build your trip around movement, nutrition and rest: where to train, what to eat in each country, how to sleep and recover across time zones, simple daily practice that fits hotels, beaches, jungles, airports. Travel without losing yourself.",
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
    "This guide is an honest summary of what I do. It is not medical advice and not a promise. It's an invitation for you to experiment, listen to your body and build your own formula.",
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
  ],
  chapterPhoto: [4, 5, 6, 7, 8, 12, 10, 0, 11, 2, 3, 4, 5],
  layouts: ["a", "b", "c", "a", "b", "c", "a", "b", "c", "a", "b", "c", "a"],
  manifestoPhoto: 5,
  coverSlots: [3, 2, 1, 0],
  quoteAfter: { 1: 3, 2: 8 },
}
