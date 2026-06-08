"use client"

import { motion, useReducedMotion, type Variants } from "framer-motion"

/** Shared "out-expo" easing for a smooth, premium settle. */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

/** Re-fire each time the element scrolls into view (set `once` to true to fire only once). */
const VIEWPORT = { once: true, amount: 0.25 } as const

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay },
  }),
}

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: EASE } },
}

type RevealProps = {
  children: React.ReactNode
  className?: string
  /** Extra delay (s) before this element animates. */
  delay?: number
}

/** Single block that fades + slides up when scrolled into view. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      custom={delay}
      variants={revealVariants}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  )
}

/**
 * Container that staggers its children — wrap a grid/list with this and use
 * <RevealItem> for each child so they "pop" in one by one.
 */
export function RevealGroup({ children, className }: RevealProps) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={groupVariants}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  )
}

/** A single staggered child of <RevealGroup>. */
export function RevealItem({ children, className }: RevealProps) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}
