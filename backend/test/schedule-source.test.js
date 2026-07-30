const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildCalendarMonth,
  findPublishedMonth,
  listScheduleMonths,
  validateFeed
} = require('../src/schedule-source');

const feed = {
  schemaVersion: 1,
  generatedAt: '2026-07-30T12:00:00.000Z',
  months: [
    {
      year: 2026,
      month: 8,
      publishedAt: '2026-07-16T21:12:58.722Z',
      shifts: []
    },
    {
      year: 2026,
      month: 7,
      publishedAt: '2026-07-16T21:12:58.722Z',
      shifts: [
        { date: '2026-07-01', shift: '10a-10p', provider: 'Gutierrez' },
        { date: '2026-07-01', shift: '7p-7a', provider: 'Anderson' },
        { date: '2026-07-01', shift: '7a-7p', provider: 'Epema' },
        { date: '2026-07-02', shift: '7a-7p', provider: 'Alford' }
      ]
    }
  ]
};

test('lists published Automator months in calendar order', () => {
  assert.deepEqual(
    listScheduleMonths(feed).map(({ label }) => label),
    ['July 2026', 'August 2026']
  );
});

test('builds the dashboard calendar in 7a, 10a, 7p display order', () => {
  const result = buildCalendarMonth(feed, 'July', 2026);

  assert.equal(result.source, 'gvmh-schedule-automator');
  assert.equal(result.publishedAt, '2026-07-16T21:12:58.722Z');
  assert.deepEqual(result.calendar[1].providers, [
    'Epema',
    'Gutierrez',
    'Anderson'
  ]);
  assert.deepEqual(
    result.calendar[1].shifts.map(({ shift }) => shift),
    ['7a-7p', '10a-10p', '7p-7a']
  );
  assert.equal(result.calendar[1].dayOfWeek, 'wednesday');
  assert.equal(result.calendar[1].dayIndex, 3);
  assert.equal(result.verification.totalDays, 31);
  assert.equal(result.verification.daysWithProviders, 2);
  assert.equal(result.verification.shiftCount, 4);
});

test('returns null for an unpublished month', () => {
  assert.equal(findPublishedMonth(feed, 'September', 2026), null);
  assert.equal(buildCalendarMonth(feed, 'September', 2026), null);
});

test('rejects malformed public schedule feeds', () => {
  assert.throws(
    () => validateFeed({ schemaVersion: 1, months: [{ year: 2026, month: 0 }] }),
    /invalid published month/
  );
});
