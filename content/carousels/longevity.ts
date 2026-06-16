// Edit this file in VS Code. The dashboard page at /dashboard/carousels/longevity
// renders these slides at Instagram 4:5 (1080×1350).
// Export to PNG slides: pnpm dev, then `npx tsx scripts/export-carousel.ts`.
//
// Photos live in /public/ebooks/photos — swap any `photo` filename freely.

export type CarouselSlide = {
  // cover  -> photo background + big headline (hook)
  // photo  -> photo background + statement text
  // text   -> cream background, large centered/left text
  // pillar -> cream background, big number + title + body + photo accent
  // cta    -> accent background, closing call to action
  kind: "cover" | "photo" | "text" | "pillar" | "cta"
  eyebrow?: string
  index?: string // e.g. "01" for pillar slides
  title: string
  kicker?: string // short italic line under the title
  body?: string // paragraphs separated by \n\n
  photo?: string // filename inside /public/ebooks/photos
  swipe?: boolean // show the "swipe →" hint (auto on for cover)
}

export type CarouselContent = {
  brand: string
  handle: string
  title: string
  slides: CarouselSlide[]
}

export const longevity: CarouselContent = {
  brand: "FELIPE MUNER",
  handle: "@lipemoves",
  title: "Mobility · Flexibility · Muscle",

  slides: [
    // 1 — HOOK
    {
      kind: "cover",
      eyebrow: "Longevity",
      title: "Everyone trains for the mirror.\nAlmost no one trains for 80.",
      kicker: "Mobility · Flexibility · Muscle",
      photo: "2SN09046.jpg",
    },

    // 2 — THE POINT
    {
      kind: "photo",
      eyebrow: "The real goal",
      title: "What's the point of living to 90\nif you can't get up off the floor?",
      body: "I don't want to be kept alive. I want to be alive.\n\nTo sit on the floor and get back up without thinking about it. To play with my grandkids and still move like myself. That's what I'm training for.",
      photo: "2SN09105.jpg",
    },

    // 3 — BE HONEST WITH YOURSELF
    {
      kind: "text",
      eyebrow: "First, be honest",
      title: "What are you really\ntraining for?",
      body: "If you want to be huge, that's bodybuilding — heavy, static, mirror work. Nothing wrong with it.\n\nBut most of us want something else: a body that feels good and moves freely. And there's no point in muscle you can't actually use.\n\nIf longevity is the goal, the work is daily. It's finding your own balance between muscle, mobility and flexibility.",
    },

    // 4 — THE THREE THINGS
    {
      kind: "text",
      eyebrow: "It comes down to three things",
      title: "Mobility.\nFlexibility.\nMuscle.",
      kicker:
        "I rebuilt my body after 30 — mobility first, then flexibility, then muscle. In that order. And this time it actually worked.",
    },

    // 5 — MOBILITY
    {
      kind: "pillar",
      index: "01",
      eyebrow: "Pillar one",
      title: "Mobility",
      kicker: "Control through your range.",
      body: "Strength means nothing if you can't get into the position. Mobility is your body actually owning its joints — squatting deep, reaching overhead, twisting, getting up off the floor with control.\n\nIt was the first thing I rebuilt, and it's the first thing to go if you ignore it.",
      photo: "2SN07573.jpg",
    },

    // 6 — FLEXIBILITY
    {
      kind: "pillar",
      index: "02",
      eyebrow: "Pillar two",
      title: "Flexibility",
      kicker: "The range itself.",
      body: "Mobility is control. Flexibility is having the room to move in the first place — hips and shoulders that open instead of locking up.\n\nThis is where yoga comes in. For me it's a 24-hour practice, for life. It keeps the body soft instead of stiff.",
      photo: "z_yoga.jpg",
    },

    // 7 — MUSCLE
    {
      kind: "pillar",
      index: "03",
      eyebrow: "Pillar three",
      title: "Muscle",
      kicker: "Strength to own the range.",
      body: "Now you protect it. Muscle is the armor around your joints and the engine that carries you up the stairs and up off the ground at 80.\n\nNot mirror muscle — real, usable strength, built through full range. The kind that keeps you independent for life.",
      photo: "1SN03021.jpg",
    },

    // 8 — WHY THE KETTLEBELL
    {
      kind: "photo",
      eyebrow: "The tool that does all three",
      title: "Why the kettlebell",
      body: "The weight sits off to one side and pulls. Your whole body has to answer from the other — bracing, balancing, holding it together on every rep.\n\nThat's the feeling I love: load on one side, my body counterbalancing from the other. Strength, mobility and control in one move. A mace or a club does the same — offset, alive, never static.",
      photo: "z_kettlebell_rack.jpg",
    },

    // 9 — CTA
    {
      kind: "cta",
      eyebrow: "Build a body that lasts",
      title: "Find your balance.",
      body: "This is my path — you'll find your own. Follow along for daily movement, and grab my free Move Better guide: breath, food, movement and rest, in 20 minutes.\n\nI'm here to help you get there.",
      kicker: "lipemoves.com",
    },
  ],
}
