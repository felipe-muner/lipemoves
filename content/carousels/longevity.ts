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
  focus?: string // CSS object-position for the photo, e.g. "center 60%"
  photoRatio?: string // pillar photo row height, e.g. "61%" (default 46%)
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
  handle: "lipemoves.com",
  title: "Mobility · Flexibility · Muscle",

  slides: [
    // 1 — HOOK
    {
      kind: "cover",
      eyebrow: "Longevity",
      title: "Everyone trains for the mirror.\nAlmost no one trains to move for life.",
      kicker: "Mobility · Flexibility · Muscle",
      photo: "1SN01474.jpg",
    },

    // 2 — THE POINT
    {
      kind: "photo",
      eyebrow: "The real goal",
      title: "What's the point of muscle\nif you can't move freely?",
      body: "You can be strong and still stiff. Strong and stuck.\n\nMuscle with zero mobility or flexibility is just for show. I want to sit on the floor, reach overhead, play with my grandkids — and still move like myself, for as long as I live.",
      photo: "GAB00148.jpg",
    },

    // 3 — THE MODERN ENEMY
    {
      kind: "text",
      eyebrow: "The real enemy",
      title: "Chairs wreck your hips.\nPhones hunch your back.",
      body: "We were built to squat, hang, walk and climb — not to fold into a chair all day, then curl over a phone all night.\n\nThe damage is everywhere: hips that won't open, and the modern hump — upper back rounded, head drifting forward.\n\nAnd we've been sold it all as normal — comfort marketed as progress, a breaking body passed off as just modern life.\n\nBut none of it is normal. Strength alone won't undo it. Mobility and flexibility will.",
    },

    // 4 — BE HONEST WITH YOURSELF
    {
      kind: "text",
      eyebrow: "First, be honest",
      title: "What are you really\ntraining for?",
      body: "If you want to be huge, that's bodybuilding — heavy, static, mirror work. Nothing wrong with it.\n\nBut most of us want something else: a body that feels good and moves freely. And there's no point in muscle you can't actually use.\n\nIf longevity is the goal, the work is daily. It's finding your own balance between muscle, mobility and flexibility.",
    },

    // 5 — THE THREE THINGS
    {
      kind: "text",
      eyebrow: "It comes down to three things",
      title: "Mobility.\nFlexibility.\nMuscle.",
      kicker:
        "I rebuilt my body after 30 — mobility first, then flexibility, then muscle. In that order. And this time it actually worked.",
    },

    // 6 — MOBILITY
    {
      kind: "pillar",
      index: "01",
      eyebrow: "Pillar one",
      title: "Mobility",
      kicker: "Control through your range.",
      body: "Strength means nothing if you can't get into the position. Mobility is owning your joints — squat deep, reach overhead, get up off the floor.",
      photo: "GAB00162-2.jpg",
      focus: "center 53%",
      photoRatio: "58%",
    },

    // 7 — FLEXIBILITY
    {
      kind: "pillar",
      index: "02",
      eyebrow: "Pillar two",
      title: "Flexibility",
      kicker: "The range itself.",
      body: "Mobility is control. Flexibility is having the room to move in the first place — hips and shoulders that open instead of locking up.\n\nThis is where yoga comes in. For me it's a 24-hour practice, for life. It keeps the body soft instead of stiff.",
      photo: "z_yoga.jpg",
      focus: "center 65%",
    },

    // 8 — MUSCLE
    {
      kind: "pillar",
      index: "03",
      eyebrow: "Pillar three",
      title: "Muscle",
      kicker: "Strength to own the range.",
      body: "Now you protect it. Muscle is the armor around your joints and the engine that carries you up the stairs and up off the ground, decade after decade.\n\nNot mirror muscle — real, usable strength, built through full range. The kind that keeps you independent for life.",
      photo: "IMG_7149.jpg",
      focus: "center 71%",
      photoRatio: "53%",
    },

    // 9 — CTA
    {
      kind: "cta",
      eyebrow: "1-on-1 coaching",
      title: "Train with me.",
      body: "I coach a small number of people one-on-one — a plan built around your body, your goals and your life. We rebuild it in the right order: mobility, flexibility, then strength.\n\nNo generic programs. Just you, me, and the work that actually lasts.",
      kicker: "lipemoves.com",
    },
  ],
}
