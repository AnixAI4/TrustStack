/** Fixed-position styles for a menu anchored to a trigger, clamped to the viewport. */
export type AnchoredMenuStyle = {
  top?: number | "auto";
  bottom?: number | "auto";
  left?: number;
  right?: number;
  maxHeight: number;
  width?: number;
};

/**
 * Place a floating menu next to `trigger`, preferring `preferUp` when both sides fit.
 * Returns CSS pixel values for `position: fixed` + a safe `maxHeight`.
 */
export function placeAnchoredMenu(
  trigger: DOMRect,
  {
    preferUp = false,
    gap = 8,
    pad = 8,
    maxHeightCap = 384,
    width,
  }: {
    preferUp?: boolean;
    gap?: number;
    pad?: number;
    maxHeightCap?: number;
    width?: number;
  } = {},
): AnchoredMenuStyle {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceAbove = Math.max(0, trigger.top - pad);
  const spaceBelow = Math.max(0, vh - trigger.bottom - pad);
  // Top-of-viewport triggers (e.g. platform/site headers) must open downward
  // even when measured space is noisy - otherwise the list goes off-screen.
  const nearTop = trigger.top < Math.min(120, vh * 0.2);
  const openUp = nearTop
    ? false
    : preferUp
      ? spaceAbove >= 160 || spaceAbove >= spaceBelow
      : spaceBelow >= 160 || spaceBelow >= spaceAbove;

  const available = Math.max(160, (openUp ? spaceAbove : spaceBelow) - gap);
  const maxHeight = Math.min(maxHeightCap, available);
  // Never wider than the viewport; callers may pass a preferred width.
  const menuWidth = Math.min(width ?? 240, vw - pad * 2);
  const right = Math.max(pad, vw - trigger.right);
  // Keep the menu's right edge near the trigger without spilling off-screen left.
  const maxRight = Math.max(pad, vw - menuWidth - pad);
  const clampedRight = Math.min(right, maxRight);

  if (openUp) {
    return {
      top: "auto",
      bottom: vh - trigger.top + gap,
      right: clampedRight,
      maxHeight,
      width: menuWidth,
    };
  }
  return {
    top: trigger.bottom + gap,
    bottom: "auto",
    right: clampedRight,
    maxHeight,
    width: menuWidth,
  };
}
