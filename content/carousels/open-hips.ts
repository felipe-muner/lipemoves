// Edit this file in VS Code. The dashboard page at /dashboard/carousels/open-hips
// renders these slides at Instagram 4:5 (1080×1350).
// Export to PNG slides: pnpm dev, then `npx tsx scripts/export-carousel.ts open-hips`.
//
// Photos live in /public/ebooks/photos — swap any `photo` filename freely.

import type { CarouselContent } from "@/content/carousels/longevity"

export const openHips: CarouselContent = {
  brand: "FELIPE MUNER",
  handle: "lipemoves.com",
  title: "Open Hips · Undo a lifetime of sitting",

  slides: [
    // 1 — HOOK
    {
      kind: "cover",
      eyebrow: "Open Hips",
      title: "Modern life stole\nyour hips.",
      titleSize: "72px",
      kicker: "And nobody told you it was happening.",
      photo: "stock/anatomy-cover.png",
      focus: "center 35%",
    },

    // 2 — THE POINT
    {
      kind: "photo",
      eyebrow: "The biggest joint you have",
      title: "Built to squat, climb and move. For life.",
      body: "The hip is the largest joint in your body, made for a huge range of motion.\n\nWe taught it to do almost nothing, and the whole body pays for it: stiff backs, weak legs, a body that can't get down to the floor and back up.",
      photo: "stock/anatomy-hip.png",
      focus: "center 35%",
    },

    // 3 — THE MODERN ENEMY
    {
      kind: "text",
      eyebrow: "How it happened",
      title: "School chair.\nOffice chair.\nCar. Couch.",
      photoStrip: [
        "stock/sit-school.png",
        "stock/sit-office.png",
        "stock/sit-car.png",
        "stock/sit-couch.png",
      ],
      body: "Nobody decided to ruin your hips. Western society did it quietly, one chair at a time.\n\n~15,000 hours of sitting before you're even an adult. 80,000 more in a desk career. A third of your waking life folded into the same ninety-degree shape.\n\nSold to you as comfort.\nMarketed as progress.\nIt's neither.",
    },

    // 4 — IT'S NOT AGE
    {
      kind: "text",
      eyebrow: "Be honest",
      title: "That stiffness isn't age.",
      body: "You try to sit on the floor and can't get comfortable. You squat and your heels lift, your back rounds, your knees complain.\n\nThat's not getting old. It's a lifetime of training the hip to be stiff, and the body did exactly what you asked.\n\nThe good news: it learns the opposite just as fast.",
    },

    // 5 — WHY IT MATTERS
    {
      kind: "text",
      eyebrow: "This is longevity work",
      title: "How well you age lives in your hips.",
      kicker:
        "The best predictor of how well you'll age isn't how much you can lift. It's whether you can still get down to the ground and back up on your own.",
    },

    // 6 — FLOOR
    {
      kind: "photo",
      eyebrow: "Step one",
      title: "Sit on the floor",
      kicker: "The cheapest fix there is.",
      body: "Half the world still eats and rests on the floor, and keeps their hips into old age without a single drill. Make the floor your default. Switch positions when you stiffen.",
      photo: "stock/anatomy-sit.png",
      focus: "center top",
    },

    // 7 — SQUAT
    {
      kind: "photo",
      eyebrow: "Step two",
      title: "The deep squat",
      kicker: "A resting position, not an exercise.",
      body: "Heels down, hips low, calm at the bottom. The position humans were built to rest in. Babies do it perfectly; most of us lost it to a desk. A minute a day and it comes back.",
      photo: "stock/anatomy-squat.png",
      focus: "center top",
    },

    // 8 — EXPRESSION
    {
      kind: "photo",
      eyebrow: "Step three",
      title: "Open & express",
      kicker: "Expression lives in the hips.",
      body: "Every culture that moves with joy moves from the hips. Free yours and you sway, you flow, you dance. You get more than range. You get yourself back. You forgot it was ever gone, and when it returns it feels like a superpower.",
      photo: "stock/anatomy-dance.png",
      focus: "center top",
    },

    // 9 — CTA
    {
      kind: "photo",
      swipe: false,
      eyebrow: "1-on-1 coaching",
      title: "Work with me.",
      body: "I coach a few people at a time, one-on-one. We build one plan around your body: mobility, strength, breath and rest, and track it together until your hips feel like yours again.\n\n💬  WhatsApp · +55 21 98485-2802\n\n📸  Instagram · @felipeenjoylife\n\n✉️  felipe.muner@gmail.com",
    },
  ],
}
