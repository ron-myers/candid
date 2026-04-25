'use client'

import { Player } from '@remotion/player'
import WorkflowComposition from './WorkflowComposition'

export default function WorkflowPlayer() {
  return (
    <Player
      component={WorkflowComposition}
      durationInFrames={390}
      compositionWidth={800}
      compositionHeight={450}
      fps={30}
      autoPlay
      loop
      style={{ width: '100%', aspectRatio: '16 / 9' }}
    />
  )
}
