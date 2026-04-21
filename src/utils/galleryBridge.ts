// plain object that lets TetraShard and WorkView talk to each other
// without going through Vue reactivity — tried a reactive approach first, it was a mess
export const galleryBridge = {
  raycast: null as ((mx: number, my: number) => number) | null,
  getCardScreenPos: null as ((idx: number) => { left: number; top: number; width: number; height: number } | null) | null,
  hoveredIndex: -1,
  navigateSection: null as ((dir: 1 | -1) => void) | null,
}
