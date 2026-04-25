'use client'

import dynamic from 'next/dynamic'

const WorkflowPlayer = dynamic(() => import('./WorkflowPlayer'), { ssr: false })

export default function WorkflowAnimation() {
  return <WorkflowPlayer />
}
