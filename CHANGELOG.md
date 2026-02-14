# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-02-14

### Added
- **Folder Reordering**: Drag and drop functionality to reorder folders.
- **Bookmark Reordering**: Drag and drop functionality to reorder bookmarks within a folder.

## [1.0.0] - 2026-02-14

### Added
- **New Tab Override**: Replaces the default new tab page.
- **Masonry Grid Layout**: Dynamic column distribution based on screen width.
- **Theme Support**: Light and Dark mode with persistence.
- **Folder Management**:
  - Create/Edit/Delete folders.
  - Custom Icon URLs for folders.
  - "Open by default" setting per folder.
- **Bookmark Management**: CRUD operations for bookmarks within folders.
- **Import/Export**:
  - JSON Export/Import for backup.
  - **Export to Chrome HTML**: Netscape Bookmark File Format support.
- **UI Enhancements**:
  - Footer version display.
  - Settings menu.
  - Footer blocker to hide native Chrome elements.
  - Responsive dialogs.

### Fixed
- Fixed column jumping issue by implementing JS-based distribution.
- Fixed "Cancel" button visibility in dialogs.
- Fixed layout gaps using column-based approach.
