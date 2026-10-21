import { atom, read, update } from 'claude-code'
import type { Register, Timer } from 'claude-code'

import type { Limit } from '../types'

const limits = atom({ plugin: 'usage-limits', key: 'limits' } as const, [] as Limit[])
const tick = atom({ plugin: 'usage-limits', key: 'tick' } as const, 0)

const WINDOWS = [['five_hour', '5h'], ['seven_day', '7d']] as const
const REFRESH_SECONDS = 60
const CELLS = 8
const GREEN = '#6EBE78'
const AMBER = '#E5B75C'
const RED = '#E5646E'
const LABEL = '#8A8A92'
const DIM = '#6F6F76'

const percent = (value: number) => (value < 10 ? value.toFixed(1) : String(Math.round(value)))

const toneOf = (value: number) => (value >= 85 ? RED : value >= 60 ? AMBER : GREEN)

const meter = (value: number) => {
  const on = Math.min(CELLS, Math.max(0, Math.round((value / 100) * CELLS)))
  return '▰'.repeat(on) + '▱'.repeat(CELLS - on)
}

const resetIn = (resetsAt: string | undefined, at: number) => {
  const ms = resetsAt === undefined ? NaN : Date.parse(resetsAt) - at
  if (!Number.isFinite(ms) || ms <= 0) {
    return ''
  }
  const minutes = Math.round(ms / 60_000)
  return minutes >= 1440 ? `${Math.floor(minutes / 1440)}d${Math.floor((minutes % 1440) / 60)}h` : minutes >= 60 ? `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}m` : `${minutes}m`
}

const report = (readings: Limit[], at: number) => {
  const rows = WINDOWS.flatMap(([kind, label]) => {
    const l = readings.find(r => r.kind === kind)
    if (!l) {
      return []
    }
    const reset = resetIn(l.resetsAt, at)
    return [`${label}: ${percent(l.percentUsed)}% used${reset ? `, resets in ${reset}` : ''}`]
  })
  return rows.length > 0 ? rows.join('\n') : 'No rate-limit reading yet (none off a subscription, or before the first response).'
}

export const register: Register = on => {
  let ticker: Timer | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'limits', description: 'Show plan usage against the 5-hour and 7-day limits' })

    const usage = await $.session.usage().catch(() => null)
    if (usage) {
      await update($, limits, () => usage.rateLimits).catch(() => {})
    }

    // A window moves only on a whole point, but its countdown keeps ageing: redraw each minute.
    ticker?.cancel()
    let seconds = 0
    ticker = $.clock.every(1000, () => {
      seconds += 1
      if (seconds % REFRESH_SECONDS === 0) {
        void update($, tick, n => n + 1).catch(() => {})
      }
    })
    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) {
      await update($, limits, () => e.rateLimits).catch(() => {})
    }
    return next(e)
  })

  on('command.run', { command: 'limits' }, async $ => {
    const usage = await $.session.usage().catch(() => null)
    return { text: report(usage?.rateLimits ?? [], await $.clock.now()) }
  })

  // The right end of the prompt footer, beside the engine's own mode labels (`focus`, `memory paused`).
  // The labels are redrawn here, dim and joined by ` & ` as the engine does, so none is lost.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const readings = await read($, limits)
    await read($, tick)
    const present = WINDOWS.filter(([kind]) => readings.some(r => r.kind === kind))
    if (present.length === 0) {
      return next(e)
    }

    const at = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" gap={2}>
        {e.props.modes.length > 0 ? <Text color={DIM}>{e.props.modes.join(' & ')}</Text> : null}
        {present.map(([kind, label]) => {
          const l = readings.find(r => r.kind === kind)
          const value = l?.percentUsed ?? 0
          const color = toneOf(value)
          const reset = resetIn(l?.resetsAt, at)
          return (
            <Box key={`limit-${kind}`} flexDirection="row" gap={1}>
              <Text color={LABEL}>{label}</Text>
              <Text color={color}>{meter(value)}</Text>
              <Text color={color} bold>{percent(value)}%</Text>
              {reset ? <Text color={DIM}>↻{reset}</Text> : null}
            </Box>
          )
        })}
      </Box>
    )
  })
}
