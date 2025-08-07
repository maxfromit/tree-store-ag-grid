# tree-store-ag-grid

## Description

Implementation of a tree data structure manager in TypeScript (TreeStore class) and a Vue 3 + AG Grid Enterprise table component for visualization and interaction.

The core is an array of objects with arbitrary `id` (number or string) and `parent` fields, allowing construction of trees of any depth. The table supports two modes: view and edit, with the ability to add, delete, rename items, and undo/redo changes.

## Tech Stack

- TypeScript
- Vue 3 (Composition API)
- Vite
- AG Grid Enterprise (community features)
- Tailwind CSS
- Lodash
- @vueuse/core (change history)
- Vitest (unit tests)
- ESLint

## How to Start

1. Clone the repo:
   ```sh
   git clone <repo-url>
   cd tree-store-ag-grid
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the project:
   ```sh
   npm run dev
   ```

## Structure & Features

- **TreeStore (TypeScript):**
  - Accepts an array of objects with id, parent, label, and arbitrary fields
  - Methods:
    - `getAll()` — returns the original array
    - `getItem(id)` — returns the object by id
    - `getChildren(id)` — direct children
    - `getAllChildren(id)` — all descendants at any depth
    - `getAllParents(id)` — parent chain up to the root
    - `addItem({...})` — adds an item
    - `removeItem(id)` — removes an item and all its descendants
    - `updateItem({...})` — updates an item
  - Protection against cycles, duplicate ids

- **Vue Table Component (AG Grid):**
  - Two modes: view and edit
  - In edit mode:
    - "+" button to add a child item
    - "x" button to delete an item and all descendants
    - Inline editing of item names
    - Change history (undo/redo) via arrows above the table
  - In view mode:
    - Tree fully expanded, items grouped
    - Row category determined by presence of children (Group/Element)
  - Stable expanded/collapsed state after changes

- **Unit Tests:**
  - Full coverage of TreeStore methods, including edge cases and performance

## Testing

- Run unit tests:
  ```sh
  npm run test:unit
  ```
- Test description: covers all TreeStore methods and edge cases

## Linting

- Run linter:
  ```sh
  npm run lint
  ```
