// Shared non-reactive channel between TetraShard (3D) and WorkView (UI).
// Plain object so reads/writes don't trigger Vue reactivity overhead.
export const galleryBridge = {
  raycast: null as ((mx: number, my: number) => number) | null,
  getCardScreenPos: null as ((idx: number) => { left: number; top: number; width: number; height: number } | null) | null,
  hoveredIndex: -1,
  navigateSection: null as ((dir: 1 | -1) => void) | null,
}
