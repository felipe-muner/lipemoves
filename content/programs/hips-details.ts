// Coaching detail shown on each exercise card of /hips/program: the muscles
// the exercise targets and two short cues. Keyed by exercise slug (see
// exerciseSlug in ./hips-clips).
//
// DRAFT: written from the exercise names, not from Felipe's own coaching.
// Felipe should read and correct these before the program is sold.
export type ExerciseDetail = { targets: string[]; cues: [string, string] }

export const HIPS_DETAILS: Record<string, ExerciseDetail> = {
  "single-leg-rdl": {
    targets: ["Hamstrings", "Glutes"],
    cues: ["Stand on one leg with a soft knee.", "Hinge forward with a flat back as the free leg lifts behind you, then stand tall."],
  },
  "lunge-pulse": {
    targets: ["Hip flexors", "Quads"],
    cues: ["Long stance, torso tall, hands on hips.", "Lower straight down until the back knee is just off the floor, then rise."],
  },
  "pigeon-stretch": {
    targets: ["Outer hip", "Glutes"],
    cues: ["Front shin across, back leg long behind you.", "Fold forward over the shin and keep the hips square."],
  },
  "butterfly-stretch": {
    targets: ["Inner thighs"],
    cues: ["Sit tall with the soles of the feet together.", "Let the knees sink and lean forward with a long spine."],
  },
  "standing-pancake-good-morning": {
    targets: ["Hamstrings", "Inner thighs"],
    cues: ["Feet wide, legs straight, hands on hips.", "Hinge forward with a flat back to parallel, then stand up."],
  },
  "90-90-extension": {
    targets: ["Glutes", "Hip rotators"],
    cues: ["Sit in 90/90: front shin across, back leg to the side.", "Lift the hips and rise onto the knees, then lower with control."],
  },
  "hip-flexor-lunge": {
    targets: ["Hip flexors"],
    cues: ["Low lunge, back knee down, arms overhead.", "Sink the hips forward without arching the lower back."],
  },
  "hamstring-lunge": {
    targets: ["Hamstrings"],
    cues: ["Half kneel with the front leg straight, toes up.", "Fold over the front leg with a flat back."],
  },
  "hamstring-kick": {
    targets: ["Hamstrings", "Hip flexors"],
    cues: ["Stand tall, hands on hips.", "Swing a straight leg up to hip height with control, then lower it."],
  },
  "deep-split-squat": {
    targets: ["Quads", "Hip flexors"],
    cues: ["Long split stance, back heel up.", "Drop straight down: front knee over the toes, back knee just off the floor."],
  },
  "frog-rock": {
    targets: ["Inner thighs"],
    cues: ["On your forearms, knees wide, shins parallel.", "Rock the hips back toward the heels, then forward."],
  },
  "90-90-switch": {
    targets: ["Hip rotators"],
    cues: ["Sit with the knees bent and the feet wide.", "Drop both knees to one side, then rotate them across to the other."],
  },
  "cossack-switch": {
    targets: ["Inner thighs", "Glutes"],
    cues: ["Deep side squat on one leg, the other leg straight with toes up.", "Stay low and shift across to the other side."],
  },
  "couch-stretch": {
    targets: ["Quads", "Hip flexors"],
    cues: ["Back shin up against a wall or box, front foot forward.", "Lift the chest and push the hips forward."],
  },
  "crossbody-leg-swings": {
    targets: ["Outer hip", "Inner thighs"],
    cues: ["Stand on one leg; hold something if you need to.", "Swing the free leg across the body, then out to the side."],
  },
  "donkey-kicks": {
    targets: ["Glutes"],
    cues: ["On all fours with a flat back.", "Lift one bent leg until the sole faces the ceiling, then lower with control."],
  },
  "figure-four-stretch": {
    targets: ["Outer hip", "Glutes"],
    cues: ["On your back, one ankle crossed over the opposite knee.", "Pull the bottom thigh toward your chest."],
  },
  "flat-back-hamstring-stretch": {
    targets: ["Hamstrings"],
    cues: ["Feet hip width apart, legs straight.", "Hinge forward with a flat back, hands on the shins, hips pushing back."],
  },
  "pancake-stretch": {
    targets: ["Inner thighs", "Hamstrings"],
    cues: ["Sit with the legs wide and straight, toes up.", "Walk the hands forward, folding from the hips and not the back."],
  },
  "pigeon-good-morning": {
    targets: ["Glutes", "Outer hip"],
    cues: ["Pigeon position, hands behind the head.", "Hinge forward over the shin with a flat back, then lift."],
  },
  "90-90-iso": {
    targets: ["Hip rotators", "Glutes"],
    cues: ["Sit in 90/90 and lean over the front shin.", "Press the front knee and ankle into the floor and hold the tension."],
  },
  "frog-stretch": {
    targets: ["Inner thighs"],
    cues: ["Knees wide, shins parallel, forearms down.", "Sink the hips back and down, and breathe into the stretch."],
  },
  "lunge-quad-stretch": {
    targets: ["Quads", "Hip flexors"],
    cues: ["Low lunge with the back knee down.", "Reach back, hold the back foot and draw the heel toward the glute."],
  },
  "standing-pancake": {
    targets: ["Hamstrings", "Inner thighs"],
    cues: ["Feet very wide, legs straight.", "Fold forward with the hands on the floor, chest toward the ground."],
  },
  "wall-deep-squat": {
    targets: ["Hips", "Ankles"],
    cues: ["Sink into a deep squat with the heels down.", "Press the knees out with the elbows and lift the chest."],
  },
  "elevated-pigeon": {
    targets: ["Outer hip", "Glutes"],
    cues: ["Front shin across a bench or box, back leg long.", "Fold forward over the shin."],
  },
  "middle-split-negatives": {
    targets: ["Inner thighs"],
    cues: ["Feet wide, hands on the floor in front of you.", "Let the feet slide apart slowly, pause at your lowest point, then pull back up."],
  },
  "seated-pancake-reach": {
    targets: ["Inner thighs", "Hamstrings"],
    cues: ["Sit with the legs wide and straight.", "Reach both arms forward, folding from the hips."],
  },
}
