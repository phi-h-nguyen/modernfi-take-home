import dayjs, { Dayjs } from "dayjs";

export const getLastBusinessDay = (now?: string | number | Date) => {
  const d = dayjs(now);
  const dow = d.day();
  const back = dow === 0 ? 2 : dow === 6 ? 1 : 0;
  return d.subtract(back, "day");
}

export const lastBusinessDayISO = (now?: string | number | Date) => {
  return getLastBusinessDay(now).format("YYYY-MM-DD");
}

export const disableWeekends = (current: Dayjs) => {
  const day = current.day();
  return day === 0 || day === 6;
};
