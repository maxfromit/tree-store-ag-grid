export const getCategoryLabel = (parent: boolean) => {
  if (parent) {
    return 'Группа'
  }
  return 'Элемент'
}
