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
      kicker: "And nobody told you it was happening.",
      photo: "GAB00148.jpg",
      focus: "center 40%",
    },

    // 2 — THE POINT
    {
      kind: "photo",
      eyebrow: "The biggest joint you have",
      title: "Built to squat, climb\nand move — for life.",
      body: "The hip is the largest joint in your body, made for a huge range of motion.\n\nWe taught it to do almost nothing — and the whole body pays for it: stiff backs, weak legs, a body that can't get down to the floor and back up.",
      photo: "IMG_7149.jpg",
      focus: "center 55%",
    },

    // 3 — THE MODERN ENEMY
    {
      kind: "text",
      eyebrow: "How it happened",
      title: "School chair.\nOffice chair.\nCar. Couch.",
      body: "Nobody decided to ruin your hips. The system did it quietly, one chair at a time.\n\n~15,000 hours of sitting before you're even an adult. 80,000 more in a desk career. A third of your waking life folded into the same ninety-degree shape.\n\nSold to you as comfort. Marketed as progress. It's neither.",
    },

    // 4 — IT'S NOT AGE
    {
      kind: "text",
      eyebrow: "Be honest",
      title: "That stiffness\nisn't age.",
      body: "You try to sit on the floor and can't get comfortable. You squat and your heels lift, your back rounds, your knees complain.\n\nThat's not getting old. It's a lifetime of training the hip to be stiff — and the body did exactly what you asked.\n\nThe good news: it learns the opposite just as fast.",
    },

    // 5 — WHY IT MATTERS
    {
      kind: "text",
      eyebrow: "This is longevity work",
      title: "How well you age\nlives in your hips.",
      kicker:
        "The best predictor of how well you'll age isn't how much you can lift. It's whether you can still get down to the ground and back up on your own.",
    },

    // 6 — FLOOR
    {
      kind: "pillar",
      index: "01",
      eyebrow: "Step one",
      title: "Sit on the floor",
      kicker: "The cheapest fix there is.",
      body: "Half the world still eats and rests on the floor — and keeps their hips into old age without a single drill. Make the floor your default. Switch positions when you stiffen. The chair undid your hips; the floor undoes the chair.",
      photo: "z_yoga.jpg",
      focus: "center 65%",
    },

    // 7 — SQUAT
    {
      kind: "pillar",
      index: "02",
      eyebrow: "Step two",
      title: "The deep squat",
      kicker: "A resting position, not an exercise.",
      body: "Heels down, hips low, calm at the bottom — the position humans were built to rest in. Babies do it perfectly; most of us lost it to a desk. It's even how the body was built to empty itself, without straining. A minute a day and it comes back.",
      photo: "GAB00162-2.jpg",
      focus: "center 53%",
      photoRatio: "58%",
    },

    // 8 — EXPRESSION
    {
      kind: "pillar",
      index: "03",
      eyebrow: "Step three",
      title: "Open & express",
      kicker: "Expression lives in the hips.",
      body: "Every culture that moves with joy moves from the hips. Lock them and that expression locks too — a stiff hip doesn't just walk stiffly, it lives stiffly. Free them and you sway, you flow, you dance. You get more than range. You get yourself back.",
      photo: "1SN01474.jpg",
      focus: "center 35%",
      photoRatio: "53%",
    },

    // 9 — CTA
    {
      kind: "cta",
      eyebrow: "Free ebook",
      title: "Open your hips.",
      body: "I wrote the whole method down — 10 short chapters on undoing a lifetime of sitting: floor sitting, the deep squat, hip openers, loaded mobility, and moving like yourself again.\n\nRead it free. Then, if you want, we do it together one-on-one.",
      kicker: "lipemoves.com/books",
    },
  ],
}
