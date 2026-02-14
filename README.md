# Chrome Bookmark Manager

A modern, card-style bookmark manager extension for Chrome that replaces the "New Tab" page.

## Features

- **Masonry Layout**: beautiful card-based layout for folders.
- **Dark Mode**: Support for Light and Dark themes (persisted).
- **Folder Management**:
    - Create, Edit, Delete folders.
    - Custom Icon support (URL).
    - **Default Open/Close State**: Choose whether a folder is expanded by default.
    - **Reorder**: Drag and drop folders to change their order.
- **Bookmark Management**:
    - Add, Edit, Delete bookmarks.
    - Favicon support.
- **Import/Export**:
    - **Export to Chrome HTML**: Generate a Netscape Bookmark File format HTML file compatible with Chrome/Firefox import.
    - **JSON Backup**: Full backup and restore functionality.

## Installation

1.  Clone this repository.
2.  Open Chrome and go to `chrome://extensions/`.
3.  Enable **Developer mode** (top right).
4.  Click **Load unpacked**.
5.  Select the directory containing this project.

## Usage

- **New Tab**: Open a new tab to see your bookmarks.
- **Settings**: Click the gear icon (⚙️) in the top right to:
    - Toggle Theme.
    - Export Data (JSON or HTML).
    - Import Data (JSON).
- **Edit/Delete**: Hover over a folder or bookmark to see options.

## Technologies

- HTML5, CSS3, JavaScript (Vanilla)
- Chrome Extensions API (Manifest V3)
