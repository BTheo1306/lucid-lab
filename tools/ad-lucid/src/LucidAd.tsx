import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion'

import { Paper } from './ui/Paper'
import { Hook } from './scenes/Hook'
import { Scattered } from './scenes/Scattered'
import { SecondBrain } from './scenes/SecondBrain'
import { Question } from './scenes/Question'
import { Automation } from './scenes/Automation'
import { Proof } from './scenes/Proof'
import { Cta } from './scenes/Cta'

/** Scene plan in frames (30 fps). */
export const PLAN = {
  hook: { from: 0, length: 90 },
  scattered: { from: 90, length: 120 },
  secondBrain: { from: 210, length: 180 },
  question: { from: 390, length: 150 },
  automation: { from: 540, length: 270 },
  proof: { from: 810, length: 150 },
  cta: { from: 960, length: 180 },
} as const

export const TOTAL_FRAMES = PLAN.cta.from + PLAN.cta.length

// Set REMOTION_MUSIC=music.mp3 (file in public/) to mix a licensed track under the film.
const MUSIC = process.env.REMOTION_MUSIC

export function LucidAd() {
  return (
    <AbsoluteFill>
      <Paper />
      <Sequence from={PLAN.hook.from} durationInFrames={PLAN.hook.length}>
        <Hook length={PLAN.hook.length} />
      </Sequence>
      <Sequence from={PLAN.scattered.from} durationInFrames={PLAN.scattered.length}>
        <Scattered length={PLAN.scattered.length} />
      </Sequence>
      <Sequence from={PLAN.secondBrain.from} durationInFrames={PLAN.secondBrain.length}>
        <SecondBrain length={PLAN.secondBrain.length} />
      </Sequence>
      <Sequence from={PLAN.question.from} durationInFrames={PLAN.question.length}>
        <Question length={PLAN.question.length} />
      </Sequence>
      <Sequence from={PLAN.automation.from} durationInFrames={PLAN.automation.length}>
        <Automation length={PLAN.automation.length} />
      </Sequence>
      <Sequence from={PLAN.proof.from} durationInFrames={PLAN.proof.length}>
        <Proof length={PLAN.proof.length} />
      </Sequence>
      <Sequence from={PLAN.cta.from} durationInFrames={PLAN.cta.length}>
        <Cta length={PLAN.cta.length} />
      </Sequence>
      {MUSIC ? <Audio src={staticFile(MUSIC)} volume={(f) => (f > TOTAL_FRAMES - 60 ? Math.max(0, (TOTAL_FRAMES - f) / 60) : 0.85)} /> : null}
    </AbsoluteFill>
  )
}
