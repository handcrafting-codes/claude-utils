import { expect, mock, test } from 'claude-code/testing'

const MODE = { component: 'SessionMode', props: { modes: ['focus'] } } as const

type Dollar = { session: { measure: (input: never) => Promise<unknown> } }

const measure = ($: Dollar, rateLimits: unknown[], changed: string[]) =>
  $.session.measure({ context: { window: 200000 }, rateLimits, changed } as never)

test('row shows both windows with a meter and the percentage', async ($, on) => {
  mock.clock(on)
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('ui.render', ($, e) => { const { Box } = $.ui.resolve(e); return <Box /> })
  await measure($, [{ kind: 'five_hour', percentUsed: 42.4 }, { kind: 'seven_day', percentUsed: 18 }], ['rateLimits'])

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'usage-limits', surface, ...MODE })
    expect(await ui.find({ type: 'Text', text: 'focus' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '5h' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /▰▰▰▱▱▱▱▱/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '42%' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '18%' })).toBeDefined()
    await ui.unmount()
  }
})

test('the figure turns amber from 60% and red from 85%', async ($, on) => {
  mock.clock(on)
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('ui.render', ($, e) => { const { Box } = $.ui.resolve(e); return <Box /> })
  await measure($, [{ kind: 'five_hour', percentUsed: 72 }, { kind: 'seven_day', percentUsed: 91 }], ['rateLimits'])

  const ui = await $.ui.mount({ plugin: 'usage-limits', surface: 'terminal', ...MODE })
  expect((await ui.find({ type: 'Text', text: '72%' }))?.props?.color).toBe('#E5B75C')
  expect((await ui.find({ type: 'Text', text: '91%' }))?.props?.color).toBe('#E5646E')
  await ui.unmount()
})

test('nothing is drawn before a rate-limit reading', async ($, on) => {
  mock.clock(on)
  on('ui.render', ($, e) => { const { Box } = $.ui.resolve(e); return <Box /> })
  const ui = await $.ui.mount({ plugin: 'usage-limits', surface: 'terminal', ...MODE })
  expect(await ui.find({ type: 'Text', text: /%/ })).toBeUndefined()
  await ui.unmount()
})
