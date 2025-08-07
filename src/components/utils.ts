import type { ICellRendererParams, CellClassParams } from 'ag-grid-community'

export const isGroupByParams = (params: ICellRendererParams | CellClassParams) =>
  params.node && params.node.group

export const getCategoryLabel = (params: ICellRendererParams) => {
  if (isGroupByParams(params)) {
    return 'Группа'
  }
  return 'Элемент'
}
