export const getCategoryLabel = (parentId: boolean) => {
  if (parentId) {
    return 'Группа'
  }
  return 'Элемент'
}
