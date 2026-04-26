'use client'

import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, spring, Easing } from 'remotion'

const COLORS = {
  bg: '#0d1117',
  surface: '#161b22',
  border: '#30363d',
  text: '#e6edf3',
  muted: '#7d8590',
  accent: '#d4a27f',
  green: '#3fb950',
  red: '#f85149',
  yellow: '#d29922',
  blue: '#58a6ff',
}

const MONO = '"JetBrains Mono", "Consolas", "Courier New", monospace'
const SANS = 'Inter, system-ui, -apple-system, sans-serif'

const EASE_OUT = Easing.out(Easing.cubic)

function fade(frame, inStart, outStart, duration = 10) {
  return interpolate(
    frame,
    [inStart, inStart + duration, outStart, outStart + duration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
}

function TerminalChrome({ title = 'Terminal' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '10px 16px',
      background: '#1c2128',
      borderBottom: `1px solid ${COLORS.border}`,
    }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
      <span style={{ color: COLORS.muted, fontSize: 12, fontFamily: MONO, marginLeft: 'auto', marginRight: 'auto' }}>
        {title}
      </span>
    </div>
  )
}

function Typewriter({ text, startFrame, endFrame }) {
  const frame = useCurrentFrame()
  const count = Math.floor(
    interpolate(frame, [startFrame, endFrame], [0, text.length], {
      extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    })
  )
  const showCursor = frame < endFrame + 8 && Math.floor(frame / 7) % 2 === 0
  return (
    <span>
      {text.slice(0, count)}
      <span style={{ opacity: showCursor ? 1 : 0 }}>█</span>
    </span>
  )
}

// Scene 1: git push (frames 0–70)
function Scene1GitPush() {
  const frame = useCurrentFrame()
  const opacity = fade(frame, 0, 58, 10)
  const responseOpacity = interpolate(frame, [36, 48], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const responseY = interpolate(frame, [36, 48], [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT })

  return (
    <AbsoluteFill style={{ opacity, padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ background: COLORS.surface, borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: 'hidden', maxWidth: 660, margin: '0 auto', width: '100%' }}>
        <TerminalChrome />
        <div style={{ padding: '20px 22px', minHeight: 160 }}>
          <div style={{ color: COLORS.green, fontFamily: MONO, fontSize: 13.5 }}>
            <Typewriter text="$ git push origin feature/user-auth" startFrame={6} endFrame={30} />
          </div>
          <div style={{ marginTop: 14, opacity: responseOpacity, transform: `translateY(${responseY}px)` }}>
            <div style={{ color: COLORS.muted, fontFamily: MONO, fontSize: 12.5, lineHeight: 1.85 }}>
              <div>Enumerating objects: 15, done.</div>
              <div>Counting objects: 100% (15/15), done.</div>
              <div>Writing objects: 100% (9/9), 2.41 KiB, done.</div>
            </div>
            <div style={{ marginTop: 10, color: COLORS.green, fontFamily: MONO, fontSize: 13.5, fontWeight: 'bold' }}>
              ✓  Pushed 3 commits to feature/user-auth
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// Scene 2: /candid-review (frames 60–140)
function Scene2CandidReview() {
  const frame = useCurrentFrame()
  const opacity = fade(frame, 0, 65, 10)
  const analysisOpacity = interpolate(frame, [25, 36], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const progressWidth = interpolate(frame, [35, 65], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const dotPhase = Math.floor((frame - 25) / 7) % 3

  return (
    <AbsoluteFill style={{ opacity, padding: 36, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ background: COLORS.surface, borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: 'hidden', maxWidth: 660, margin: '0 auto', width: '100%' }}>
        <TerminalChrome title="Claude Code" />
        <div style={{ padding: '20px 22px', minHeight: 160 }}>
          <div style={{ color: COLORS.accent, fontFamily: MONO, fontSize: 13.5 }}>
            <Typewriter text="> /candid-review" startFrame={4} endFrame={20} />
          </div>

          <div style={{ marginTop: 18, opacity: analysisOpacity }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ color: dotPhase === i ? COLORS.accent : COLORS.border, fontSize: 20, lineHeight: 1 }}>●</span>
              ))}
              <span style={{ color: COLORS.muted, fontFamily: MONO, fontSize: 12.5, marginLeft: 4 }}>
                Analyzing 847 lines across 12 files…
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: COLORS.muted, fontFamily: MONO, fontSize: 11.5 }}>Deep review in progress</span>
                <span style={{ color: COLORS.accent, fontFamily: MONO, fontSize: 11.5 }}>{Math.round(progressWidth)}%</span>
              </div>
              <div style={{ height: 4, background: COLORS.border, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${progressWidth}%`, background: COLORS.accent, borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// Scene 3: Review results (frames 130–225)
function Scene3ReviewResults() {
  const frame = useCurrentFrame()
  const opacity = fade(frame, 0, 80, 10)

  const panelX = interpolate(frame, [5, 22], [50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT })
  const panelOpacity = interpolate(frame, [5, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const comments = [
    { label: 'Security',    line: 23, msg: 'SQL injection — user input not sanitized', color: COLORS.red,    in: [22, 33] },
    { label: 'Type Error',  line: 25, msg: 'user.posts may be undefined',               color: COLORS.yellow, in: [35, 46] },
    { label: 'Performance', line: 27, msg: 'N+1 query in loop — batch fetch instead',   color: COLORS.blue,   in: [48, 59] },
  ]

  const code = [
    { n: 21, text: 'async function getUser(req, res) {',         hl: null },
    { n: 22, text: '  const id = req.params.id',                 hl: null },
    { n: 23, text: '  const q = `SELECT * WHERE id=${id}`',      hl: COLORS.red },
    { n: 24, text: '  const user = await db.raw(q)',             hl: null },
    { n: 25, text: '  const posts = user.posts.map(p => p)',     hl: COLORS.yellow },
    { n: 26, text: '  for (const tag of user.tags) {',          hl: null },
    { n: 27, text: '    await db.query(`SELECT...`, [tag])',     hl: COLORS.blue },
    { n: 28, text: '  }',                                        hl: null },
    { n: 29, text: '  res.json({ user, posts })',                hl: null },
    { n: 30, text: '}',                                          hl: null },
  ]

  return (
    <AbsoluteFill style={{ opacity, padding: 22 }}>
      <div style={{ display: 'flex', gap: 14, height: '100%', alignItems: 'center', maxWidth: 760, margin: '0 auto', width: '100%' }}>
        <div style={{
          flex: '0 0 320px',
          background: COLORS.surface,
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          overflow: 'hidden',
          transform: `translateX(${panelX}px)`,
          opacity: panelOpacity,
        }}>
          <TerminalChrome title="user-auth.js" />
          <div style={{ padding: '10px 0' }}>
            {code.map(line => (
              <div key={line.n} style={{
                display: 'flex',
                padding: '2.5px 0',
                background: line.hl ? `${line.hl}18` : 'transparent',
                borderLeft: line.hl ? `3px solid ${line.hl}` : '3px solid transparent',
              }}>
                <span style={{ color: COLORS.border, fontFamily: MONO, fontSize: 10.5, width: 28, textAlign: 'right', paddingRight: 10, flexShrink: 0 }}>
                  {line.n}
                </span>
                <span style={{ color: line.hl ?? COLORS.text, fontFamily: MONO, fontSize: 10.5, opacity: line.hl ? 1 : 0.8 }}>
                  {line.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ color: COLORS.text, fontFamily: SANS, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
            3 issues found
          </div>
          {comments.map(c => {
            const op = interpolate(frame, c.in, [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
            const ty = interpolate(frame, c.in, [10, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT })
            return (
              <div key={c.line} style={{
                opacity: op, transform: `translateY(${ty}px)`,
                background: COLORS.surface,
                border: `1px solid ${c.color}40`,
                borderLeft: `3px solid ${c.color}`,
                borderRadius: 8,
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ background: `${c.color}22`, color: c.color, fontFamily: MONO, fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                    {c.label}
                  </span>
                  <span style={{ color: COLORS.muted, fontFamily: MONO, fontSize: 10.5 }}>Line {c.line}</span>
                </div>
                <div style={{ color: COLORS.text, fontFamily: SANS, fontSize: 12.5, lineHeight: 1.4 }}>{c.msg}</div>
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// Scene 4: Apply fixes (frames 220–305)
function Scene4ApplyFixes() {
  const frame = useCurrentFrame()
  const opacity = fade(frame, 0, 70, 10)

  const fixes = [
    { label: 'Security',    msg: 'Parameterize SQL query',          color: COLORS.red,    range: [10, 32] },
    { label: 'Type Error',  msg: 'Add optional chaining ?.map()',   color: COLORS.yellow, range: [28, 50] },
    { label: 'Performance', msg: 'Replace loop with batchGetTags()', color: COLORS.blue,   range: [46, 66] },
  ]

  const labelOpacity = interpolate(frame, [4, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ maxWidth: 540, width: '100%' }}>
        <div style={{ color: COLORS.accent, fontFamily: MONO, fontSize: 13, marginBottom: 20, opacity: labelOpacity }}>
          Applying fixes…
        </div>

        {fixes.map((fix, i) => {
          const progress = interpolate(frame, fix.range, [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const done = progress >= 1
          return (
            <div key={i} style={{
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '13px 16px',
              marginBottom: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ background: `${fix.color}22`, color: fix.color, fontFamily: MONO, fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                    {fix.label}
                  </span>
                  <span style={{ color: COLORS.text, fontFamily: SANS, fontSize: 13 }}>{fix.msg}</span>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: done ? COLORS.green : COLORS.border,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {done && (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5L4.5 8L9 3" stroke="#0d1117" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
              <div style={{ height: 3, background: COLORS.border, borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${progress * 100}%`, background: done ? COLORS.green : fix.color, borderRadius: 2 }} />
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// Scene 5: Ship (frames 300–390)
function Scene5Ship() {
  const frame = useCurrentFrame()
  const opacity = fade(frame, 0, 78, 10)

  const successOpacity = interpolate(frame, [34, 48], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const successScale = spring({ fps: 30, frame: Math.max(0, frame - 34), config: { damping: 14, stiffness: 180 } })

  const tags = ['Security', 'Type Error', 'Performance']

  return (
    <AbsoluteFill style={{ opacity, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: COLORS.surface, borderRadius: 10, border: `1px solid ${COLORS.border}`, overflow: 'hidden', maxWidth: 540, width: '100%' }}>
        <TerminalChrome title="Claude Code" />
        <div style={{ padding: '22px 24px' }}>
          <div style={{ color: COLORS.accent, fontFamily: MONO, fontSize: 13.5, marginBottom: 22 }}>
            <Typewriter text="> /candid-ship" startFrame={6} endFrame={24} />
          </div>

          <div style={{ opacity: successOpacity, transform: `scale(${successScale})`, textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `${COLORS.green}1a`,
              border: `2px solid ${COLORS.green}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <path d="M4 13L10 19L22 7" stroke={COLORS.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{ color: COLORS.text, fontFamily: SANS, fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              All issues resolved
            </div>
            <div style={{ color: COLORS.muted, fontFamily: SANS, fontSize: 13.5, marginBottom: 18 }}>
              Shipped with confidence ✓
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  background: `${COLORS.green}1a`,
                  color: COLORS.green,
                  fontFamily: MONO,
                  fontSize: 11,
                  padding: '3px 9px',
                  borderRadius: 4,
                }}>
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

export default function WorkflowComposition() {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Sequence from={0} durationInFrames={70}>
        <Scene1GitPush />
      </Sequence>
      <Sequence from={60} durationInFrames={80}>
        <Scene2CandidReview />
      </Sequence>
      <Sequence from={130} durationInFrames={95}>
        <Scene3ReviewResults />
      </Sequence>
      <Sequence from={220} durationInFrames={85}>
        <Scene4ApplyFixes />
      </Sequence>
      <Sequence from={300} durationInFrames={90}>
        <Scene5Ship />
      </Sequence>
    </AbsoluteFill>
  )
}
