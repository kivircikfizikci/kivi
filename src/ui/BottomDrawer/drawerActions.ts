export function toggleDrawer(open: boolean, onOpen: () => void, onClose: () => void) {
  if (open) onClose()
  else onOpen()
}
