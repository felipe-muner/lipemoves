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
  subtitle: "Food, movement, breath — a body built for life",
  author: "Felipe Muner",
  edition: "May 2026",
  chapterLabel: "Chapter",
  coverBlurb:
    "Years in motion. One simple formula.\nHere it is.",

  manifesto: "Move every day.\nBreath is everything.\nEat like your ancestors.",
  manifestoCaption: "The essential fits in three lines.",

  tocTitle: "What's inside",
  tocSubtitle:
    "A short, direct guide — read in 20 minutes, apply for the rest of your life.",

  chapters: [
    {
      title: "Who I am",
      dek: "Built for life, not for the mirror.",
      lead: "I'm Felipe. I lived the western loop — 8h sleep, 8h office, chasing the pump for social validation. Strong upper body, weak legs, horrible mobility — a body built for the mirror, useless for life.",
      body: "In 2018 I left and started specializing my life in movement across different countries. The goal is simple: never have a problem with my body, and live this experience fully. Stuck during covid with flexibility legends from Vietnam and India, I saw it clearly — each nation shapes the body of its people. There, people live in a deep squat, hips always working.\n\nThe western chair destroyed ours and made us weak, physically and mentally. We've forgotten how our ancestors moved. We sit, we shrink, we age fast. They sit low, stay open, age slow.\n\nI rebuilt from the ground up. Mobility first. Flexibility next. Stability and balance after. Only then muscle — and now it actually works. I sit on the floor without thinking. I lift, twist, run, fall, get back up.\n\nThat's what this guide is. Not a diet, not a hack — the exact thing I do, after years of trying, failing and adjusting. Read it in 20 minutes. Apply it for the rest of your life. Share it with the people you love, and if you want me to walk this path with you, I'll be waiting at the end of the book.",
    },
    {
      title: "The formula",
      dek: "Everything in one paragraph.",
      lead: "In the morning, lemon with Himalayan salt. During the day, breath and controlled mindful movement: yoga, calisthenics, kettlebell. After food+sunset, turn off artificial lights and sleep as early as you can. Personally, I aim for longevity — I'd rather play with free weights, bodyweight and balance than sit on a gym machine. One meal a day (sunset time), abundant and simple: fruit, vegetables and protein.",
      body: "That's it. The rest of this guide is about the why and the how.\n\nYes — this is one meal a day (OMAD). You won't starve. The body adapts faster than you think, and the next chapter shows you how to ease in.\n\nHonestly: I don't do this every day. But the more I do it, the better I feel — and no other approach I've tried comes close.",
    },
    {
      title: "How to start",
      dek: "Three weeks. Slow and steady.",
      lead: "You don't change overnight. The body adapts in waves — push too hard, you quit. Push slowly, it sticks. Here's the path I'd give a friend.",
      body: "Week 1 — Skip breakfast. Lemon and salt in the morning instead. Move 5 minutes a day, anywhere: a few squats, a stretch, a walk. That's it.\n\nWeek 2 — Push lunch later, hour by hour. Drink water and tea during the day. Add one real session — kettlebell, yoga, calisthenics — twice this week. Sleep earlier.\n\nWeek 3 — 5pm starts to feel natural. Train daily, even if it's 10 minutes. Stay with your breath. Anchor your eyes. Notice how you feel — that's the proof, not the scale.\n\nConsistency beats intensity. Move every day, even if just 5 minutes. This is my path — find yours.",
    },
    {
      title: "Fasting until 5pm",
      dek: "The body thanks you.",
      lead: "Our ancestors went days without food. Today we live with the biggest food availability in human history — a little hunger isn't an emergency, it's normal. The body settles — no spikes, no weight of digestion.",
      body: "I aim for one meal a day at 5pm. Honestly, I often break earlier — a smoothie around 2pm, some fruit, something light. The point isn't to be rigid, it's to give the body long stretches without digestion. Ease in: push your last meal 15 minutes later each day.\n\nThis is not for everyone. If you're pregnant, breastfeeding, underweight, on medication, or have a history of disordered eating — talk to a doctor first or skip this part. The movement and food principles work without the fasting.",
    },
    {
      title: "Lemon + Himalayan salt",
      dek: "My breakfast.",
      lead: "In the morning: a glass of water (sometimes none), lemon juice, a generous pinch of pink Himalayan salt. Hydrates, mineralizes, wakes the body. No caffeine, no sugar, no heavy digestion. Simple and powerful.",
      body: "Why not coffee? Caffeine borrows energy from later — you spike, crash, reach for another. Lemon and salt replace what you lost overnight and let the body wake on its own clock. No dependency, no jitters, no afternoon dip.\n\nCold morning? Heat water and steep ginger, turmeric, black pepper, cinnamon, a few drops of propolis. Anti-inflammatory, warming. Same idea — feed the body, don't stimulate it.",
    },
    {
      title: "Food",
      dek: "The one meal, built right.",
      lead: "When you eat once a day, the plate matters. Build it in this order — fruit first, then vegetables, then slow carbs, then protein. Each layer does a job: quick energy, fiber, slow fuel, repair.",
      body: "Fruit, and lots of it. The best move is a juice at 5pm — variety always. Mango, papaya, banana, watermelon, coconut water, pineapple. Blend in ginger, turmeric, cinnamon, oats, chia, flaxseed, cherries, goji. Fruit sugar with fiber and water is clean fuel: instant energy, no inflammation. Some days I eat ten pieces.\n\nVegetables — volume without weight. Greens, cucumber, tomato, carrot, lettuce, sprouts. Olive oil, lemon, salt, herbs — never heavy dressings. Fiber, minerals, fullness. The heavy plate, but light in the body.\n\nSlow-burning carbs. Sweet potato, rice, cassava. Sweet potato (roasted or steamed) brings vitamin A, fiber, slow energy. Rice: brown or pigmented when I can. Cassava is dense and ancestral — perfect on training days.\n\nSimple protein, last. Grilled, steamed, or boiled. Never fried, never industrial sauces. When you eat once a day, this is what rebuilds you — don't skimp. The flavor comes from the food itself, not what you put on top.",
    },
    {
      title: "Kettlebell",
      dek: "One weight, the whole body.",
      lead: "Kettlebells are amazing to train your body for real life — functional strength that shows up in your daily activities. The biggest benefit comes from rotational, ballistic, pendulum-like moves: the whole body has to work stability, balance, and switch sides under load.",
      body: "I've had enough of static machines. They're great to isolate muscles, but personally I don't want a lot of muscle if I'm not flexible enough to use it properly. Since I switched to kettlebells, I gained way more stability and definition — the rotational, ballistic moves fire up every small stabilizer the machines never touch. If you train for longevity, this is the work: a body ready to catch a slip, absorb a fall, recover from the unexpected — that's where serious injuries start, and that's where this training pays off.",
    },
    {
      title: "Breath + muscle",
      dek: "The secret isn't the weight.",
      lead: "It's how you move. Squeeze the muscle, contract with intention, sync your breath and your gaze with the movement. Each motion is a conversation between mind and body.",
      body: "Don't isolate, integrate. Move the whole body as one — that's where real strength and balance live.",
    },
    {
      title: "Eyes focused",
      dek: "Where the eyes go, the body follows.",
      lead: "Train your gaze like you train your body. Fix your eyes on a single point during a kettlebell swing, on the horizon during a get-up, on the hand that moves during a clean. The eyes anchor the nervous system — they tell the body it is safe, focused, and in control — that's where balance comes from.",
      body: "Soft gaze, hard intention. No darting around, no checking the mirror, no looking at the phone. When the eyes settle, the breath settles, and the movement becomes precise. Keep the prana flowing.",
    },
    {
      title: "Mindfulness in motion",
      dek: "To train is to meditate.",
      lead: "When I train, I train. Outdoors when possible, sunrise if I can — no phone, no music, no AC or fan, no sitting, no rush. I feel each movement, fully.",
      body: "Training becomes active meditation. You leave better than you came in — and not just physically.",
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
    "z_carbs.jpg",
    "z_fruits.jpg",
    "z_lemon.jpg",
    "z_protein.jpg",
  ],
  chapterPhoto: [4, 5, 9, 6, 15, 14, 11, 2, 3, 10],
  layouts: ["a", "b", "c", "a", "b", "c", "a", "b", "c", "a"],
  manifestoPhoto: 5,
  coverSlots: [3, 1, 0, 6],
  quoteAfter: { 1: 4, 2: 6 },
}
