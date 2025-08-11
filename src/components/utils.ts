export const getCategoryLabel = (parentId: boolean) => {
  if (parentId) {
    return 'Group'
  }
  return 'Element'
}
