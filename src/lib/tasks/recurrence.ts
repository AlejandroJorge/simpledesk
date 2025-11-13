import dayjs from "$lib/dayjs";

export const RECURRENCE_VALUES = ["daily", "workday"] as const;
export type RecurrenceValue = (typeof RECURRENCE_VALUES)[number];

export const normalizeRecurrence = (value: string | null | undefined): RecurrenceValue | null =>
  RECURRENCE_VALUES.includes(value as RecurrenceValue) ? (value as RecurrenceValue) : null;

const isWeekend = (value: dayjs.Dayjs) => value.day() === 0 || value.day() === 6;

const alignTime = (base: dayjs.Dayjs, template: dayjs.Dayjs) =>
  base
    .hour(template.hour())
    .minute(template.minute())
    .second(template.second())
    .millisecond(template.millisecond());

const ensureFutureBase = (template: dayjs.Dayjs, now: dayjs.Dayjs) => {
  if (!template.isBefore(now))
    return template;
  let adjusted = alignTime(now.clone(), template);
  if (adjusted.isBefore(now))
    adjusted = adjusted.add(1, "day");
  return adjusted;
};

const advanceToNextWorkday = (value: dayjs.Dayjs) => {
  let cursor = value;
  while (isWeekend(cursor))
    cursor = cursor.add(1, "day");
  return cursor;
};

export const computeNextOccurrence = (currentDue: Date | null, recurrence: RecurrenceValue): Date => {
  const now = dayjs.utc();
  const template = dayjs.utc(currentDue ?? now);
  const base = ensureFutureBase(template, now);
  let next = base.add(1, "day");
  if (recurrence === "workday")
    next = advanceToNextWorkday(next);
  return next.toDate();
};

export const computeTodayOrNextWorkday = (currentDue: Date | null, recurrence: RecurrenceValue): Date => {
  const now = dayjs.utc();
  const template = dayjs.utc(currentDue ?? now);
  let target = alignTime(now.clone(), template);
  if (recurrence === "workday")
    target = advanceToNextWorkday(target);
  return target.toDate();
};
