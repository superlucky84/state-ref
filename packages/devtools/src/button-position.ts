export const buttonPositions = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const;

export type ButtonPosition = (typeof buttonPositions)[number];

export function isButtonPosition(value: unknown): value is ButtonPosition {
  return buttonPositions.some(position => position === value);
}
