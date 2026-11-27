# LipeMoves cover style (YouTube thumbnails + Instagram covers)

Chosen by Felipe on 2026-11-25. Reference: `style-reference-flexform.png` and
`style-reference-flexform-2.png` (FLEXFORM by Shan's thumbnails). Copy the
layout and type hierarchy, not her photos or brand.

## The 3 rules that make the look (Felipe's corrections, 2026-11-25)
1. **Full-bleed photo.** The photo fills the whole cover: no blurred sides,
   no bars, no boxes. Crop the photo to the format.
2. **Text BEHIND the person.** The headline is placed in the scene and the
   person is layered on top (head, legs or a foot cross the letters), like
   FLEXFORM's "SPLITS" with her head in front of the L. Keep the word readable:
   only a letter or two may be covered.
3. **Flat colour, no shadow, no outline.**

The cutout comes from Apple Vision (`mask.swift`, compile with
`swiftc -sdk /Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk`), and the
masks are saved in `assets/covers/masks/`. Example covers and the script that
made them are in `assets/covers/examples/`.

## Photo
- A real photo of Felipe holding a clear, recognisable pose from the video:
  full body, **horizontal wide shot for YouTube**, the mat in frame.
- Bright natural-light room: light floor or wood, big windows, a plant or two.
  Clean background, no clutter.
- Pick the frame where the pose reads instantly as the topic (split, deep lunge,
  kettlebell at the top of a swing, handstand...).

## Text (2 levels, 5 words max in total)
1. **Headline**: the body area or benefit, ALL CAPS, 1–3 words, huge (about
   35–45% of the thumbnail width per line). Examples: TIGHT HIPS, STRONG CORE,
   RELIEVE BACK PAIN, FULL BODY STRETCH FLOW, MIDDLE SPLITS.
   - Font: heavy bold sans (Outfit 800/900 or Montserrat Black; Bebas Neue for
     condensed). `assets/fonts/Outfit-600.ttf` is too light for this; add a
     heavier weight.
   - Font in use: Futura Bold (already on the Mac).
   - Colour: one flat accent per video: teal `#268098`, coral `#EE7A52`,
     sky blue `#34A0C4`, pale yellow `#F8EC8C`, or white over sea or sky. No
     shadow.
   - Optional small **top line** above it in a second colour: RELEASE TIGHT,
     BUILD UP TO, UNLOCK YOUR.
   - The text may overlap the body, but **never the face** (see the
     reel-text-off-faces rule).
2. **Sub line**: the format, ALL CAPS, much smaller, in yellow/gold `#F5C518`
   or the accent colour, right-aligned under the headline or sitting on a pale
   box: 20 MIN ROUTINE, MASTERCLASS, FLEXIBILITY ROUTINE, 25 MIN STRETCH.
3. Optional corner tag, bottom right, small white: `30 MIN | ALL LEVELS`
   (keep it clear of YouTube's duration badge in the bottom-right corner).

## Sizes
- YouTube thumbnail: 1280×720 (16:9), under 2 MB, JPG.
- Instagram reel cover: 1080×1920. Keep the headline inside the centre
  1080×1350 so it survives the 4:5 grid crop; profile grid shows 3:4.
- The same photo and text in both: move the text block so it fits each crop.

## Matching video title
`25 MIN RELIEVE BACK PAIN & STIFFNESS | Full Back Stretch & Spinal Mobility`:
the minutes + the headline words in caps, then `|` and a plain-case detail line.
Add "(follow along)" or "No Talking" when it fits.
