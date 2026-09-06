import { Composition } from 'remotion'

import './fonts'
import { LucidAd, TOTAL_FRAMES } from './LucidAd'
import { FPS, HEIGHT, WIDTH } from './tokens'

export function Root() {
  return <Composition id="LucidAd" component={LucidAd} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
}
