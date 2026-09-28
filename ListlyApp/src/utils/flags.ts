export type Flag = 0 | 1;

export function isOn(flag: Flag): boolean {
  return flag === 1;
}

export function toFlag(value: boolean): Flag {
  return value ? 1 : 0;
}
