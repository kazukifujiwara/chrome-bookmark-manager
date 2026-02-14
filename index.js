// State
let bookmarksData = [];
const STORAGE_KEY = 'bookmarks_data';
const THEME_KEY = 'theme_preference';

// DOM Elements
const container = document.getElementById('bookmark-container');
const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const themeToggle = document.getElementById('theme-toggle');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const addFolderBtn = document.getElementById('add-folder-btn');

// Dialog Elements
const folderDialog = document.getElementById('folder-dialog');
const folderForm = document.getElementById('folder-form');
const folderNameInput = document.getElementById('folder-name');
const folderIconInput = document.getElementById('folder-icon');
const folderIdInput = document.getElementById('folder-id');
const folderDialogTitle = document.getElementById('folder-dialog-title');
const cancelFolderBtn = document.getElementById('cancel-folder');

const bookmarkDialog = document.getElementById('bookmark-dialog');
const bookmarkForm = document.getElementById('bookmark-form');
const bookmarkTitleInput = document.getElementById('bookmark-title');
const bookmarkUrlInput = document.getElementById('bookmark-url');
const bookmarkIdInput = document.getElementById('bookmark-id');
const bookmarkParentIdInput = document.getElementById('bookmark-parent-id');
const bookmarkDialogTitle = document.getElementById('bookmark-dialog-title');
const cancelBookmarkBtn = document.getElementById('cancel-bookmark');

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await loadTheme();
    await loadBookmarks();
    renderBookmarks();
    setupEventListeners();
    displayVersion();
});

function displayVersion() {
    const manifest = chrome.runtime.getManifest();
    const footer = document.getElementById('app-footer');
    if (footer) {
        footer.textContent = `v${manifest.version}`;
    }
}

// Storage
async function loadBookmarks() {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            if (result[STORAGE_KEY]) {
                bookmarksData = result[STORAGE_KEY];
                // Apply default open state
                bookmarksData.forEach(folder => {
                    if (folder.defaultOpen !== undefined) {
                        folder.expanded = folder.defaultOpen;
                    } else {
                        // Migration for existing folders, default to open (or closed? taking open as safe bet)
                        folder.expanded = true;
                        folder.defaultOpen = true; // Save this preference
                    }
                });
            } else {
                // Initial Sample Data
                bookmarksData = [
                    {
                        id: generateId(),
                        title: "Work Resources",
                        children: [
                            { id: generateId(), title: "GitHub", url: "https://github.com" },
                            { id: generateId(), title: "Slack", url: "https://slack.com" }
                        ]
                    },
                    {
                        id: generateId(),
                        title: "News",
                        children: [
                            { id: generateId(), title: "Hacker News", url: "https://news.ycombinator.com" }
                        ]
                    }
                ];
                saveBookmarks();
            }
            resolve();
        });
    });
}

function saveBookmarks() {
    chrome.storage.local.set({ [STORAGE_KEY]: bookmarksData });
    renderBookmarks();
}

async function loadTheme() {
    chrome.storage.local.get([THEME_KEY], (result) => {
        if (result[THEME_KEY] === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
        }
    });
}

// Rendering
function renderBookmarks() {
    container.innerHTML = '';

    // Determine column count
    const width = window.innerWidth;
    let colCount = 3;
    if (width <= 600) colCount = 1;
    else if (width <= 900) colCount = 2;

    // Create column elements
    const columns = [];
    for (let i = 0; i < colCount; i++) {
        const col = document.createElement('div');
        col.className = 'bookmark-column';
        columns.push(col);
        container.appendChild(col);
    }

    // Distribute folders
    bookmarksData.forEach((folder, folderIndex) => {
        const card = createFolderCard(folder, folderIndex);
        const colIndex = folderIndex % colCount;
        columns[colIndex].appendChild(card);
    });
}

// Debounce for resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        renderBookmarks();
    }, 200);
});

function createFolderCard(folder, folderIndex) {
    const card = document.createElement('div');
    card.className = 'folder-card';

    // Header
    const header = document.createElement('div');
    header.className = 'folder-header';

    // Title Group
    const titleGroup = document.createElement('div');
    titleGroup.className = 'folder-title-group';

    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'toggle-icon';
    toggleIcon.textContent = '▶';

    titleGroup.appendChild(toggleIcon);

    if (folder.icon) {
        const iconImg = document.createElement('img');
        iconImg.src = folder.icon;
        iconImg.className = 'folder-icon-img';
        iconImg.onerror = () => { iconImg.style.display = 'none'; }; // Hide if broken
        titleGroup.appendChild(iconImg);
    }

    const title = document.createElement('span');
    title.className = 'folder-title';
    title.textContent = folder.title;

    titleGroup.appendChild(title);

    // Folder Actions
    const actions = document.createElement('div');
    actions.className = 'folder-actions';

    const openAllBtn = document.createElement('button');
    openAllBtn.className = 'action-btn';
    openAllBtn.title = 'Open All';
    openAllBtn.textContent = 'Open All';
    openAllBtn.onclick = (e) => {
        e.stopPropagation();
        openAllTabs(folder.children);
    };

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.title = 'Edit Folder';
    editBtn.textContent = 'Edit';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        openFolderDialog(folder);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn';
    deleteBtn.title = 'Delete Folder';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Delete folder "${folder.title}" and all its bookmarks?`)) {
            deleteFolder(folder.id);
        }
    };

    actions.appendChild(openAllBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    header.appendChild(titleGroup);
    header.appendChild(actions);

    // Content
    const content = document.createElement('div');
    content.className = 'folder-content';
    if (folder.expanded) {
        content.classList.add('expanded');
        header.classList.add('expanded');
        toggleIcon.style.transform = 'rotate(90deg)';
    }

    const list = document.createElement('ul');
    list.className = 'bookmark-list';

    folder.children.forEach(bookmark => {
        const item = createBookmarkItem(bookmark, folder.id);
        list.appendChild(item);
    });

    const addBtnWrapper = document.createElement('div');
    addBtnWrapper.className = 'folder-add-btn-wrapper';
    const addBmBtn = document.createElement('button');
    addBmBtn.className = 'btn add-bm-btn';
    addBmBtn.textContent = '+ Add Bookmark';
    addBmBtn.onclick = () => openBookmarkDialog(folder.id);
    addBtnWrapper.appendChild(addBmBtn);

    content.appendChild(list);
    content.appendChild(addBtnWrapper);

    card.appendChild(header);
    card.appendChild(content);

    // Accordion Logic
    header.addEventListener('click', (e) => {
        // Ignore if clicked on actions
        if (e.target.closest('.action-btn')) return;

        const isExpanded = content.classList.contains('expanded');
        if (isExpanded) {
            content.classList.remove('expanded');
            header.classList.remove('expanded');
            toggleIcon.style.transform = 'rotate(0deg)';
            folder.expanded = false;
        } else {
            content.classList.add('expanded');
            header.classList.add('expanded');
            toggleIcon.style.transform = 'rotate(90deg)';
            folder.expanded = true;
        }
    });

    // Drag and Drop Logic
    card.setAttribute('draggable', 'true');

    card.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', folderIndex);
        card.classList.add('dragging');
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.folder-card').forEach(c => c.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const toIndex = folderIndex;

        if (fromIndex !== toIndex) {
            // Reorder array
            const movedItem = bookmarksData.splice(fromIndex, 1)[0];
            bookmarksData.splice(toIndex, 0, movedItem);
            saveBookmarks(); // This will also renderBookmarks()
        }
        card.classList.remove('drag-over');
    });

    return card;
}

function createBookmarkItem(bookmark, parentId) {
    const item = document.createElement('li');
    item.className = 'bookmark-item';

    const linkWrapper = document.createElement('div');
    linkWrapper.className = 'bookmark-link-wrapper';

    const link = document.createElement('a');
    link.href = bookmark.url;
    link.className = 'bookmark-link';

    const faviconUrl = `/_favicon/?pageUrl=${encodeURIComponent(bookmark.url)}&size=32`;
    const icon = document.createElement('img');
    icon.src = faviconUrl;
    icon.className = 'favicon';
    icon.alt = '';

    const name = document.createElement('span');
    name.textContent = bookmark.title;

    link.appendChild(icon);
    link.appendChild(name);
    linkWrapper.appendChild(link);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'bookmark-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.textContent = 'Edit';
    editBtn.onclick = (e) => {
        e.stopPropagation();
        openBookmarkDialog(null, bookmark, parentId);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Delete bookmark "${bookmark.title}"?`)) {
            deleteBookmark(parentId, bookmark.id);
        }
    };

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(linkWrapper);
    item.appendChild(actions);

    return item;
}

// Logic - CRUD
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function openAllTabs(bookmarks) {
    if (!bookmarks || bookmarks.length === 0) return;
    bookmarks.forEach(bookmark => {
        chrome.tabs.create({ url: bookmark.url, active: false });
    });
}

function deleteFolder(id) {
    bookmarksData = bookmarksData.filter(f => f.id !== id);
    saveBookmarks();
}

function deleteBookmark(parentId, bookmarkId) {
    const folder = bookmarksData.find(f => f.id === parentId);
    if (folder) {
        folder.children = folder.children.filter(b => b.id !== bookmarkId);
        saveBookmarks();
    }
}

// Dialog Logic
function setupEventListeners() {
    // Settings Menu
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsMenu.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
            settingsMenu.classList.add('hidden');
        }
    });

    // Prevent closing when clicking inside the menu
    settingsMenu.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Theme
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.body.removeAttribute('data-theme');
            themeToggle.textContent = '🌙';
            chrome.storage.local.set({ [THEME_KEY]: 'light' });
        } else {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.textContent = '☀️';
            chrome.storage.local.set({ [THEME_KEY]: 'dark' });
        }
    });

    // Export JSON
    exportBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(bookmarksData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookmarks_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Export to Chrome HTML
    document.getElementById('export-chrome-btn').addEventListener('click', () => {
        try {
            console.log('Starting Chrome export...');
            const htmlContent = generateNetscapeHTML(bookmarksData);
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chrome_bookmarks_${new Date().toISOString().slice(0, 10)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed! Error: ' + error.message);
        }
    });

    // Import
    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (Array.isArray(data)) {
                    bookmarksData = data;
                    saveBookmarks();
                    alert('Bookmarks imported successfully!');
                } else {
                    alert('Invalid file format: Data must be an array.');
                }
            } catch (err) {
                alert('Error parsing JSON file.');
                console.error(err);
            }
            importFile.value = '';
        };
        reader.readAsText(file);
    });

    // Folder Dialog
    addFolderBtn.addEventListener('click', () => openFolderDialog());
    cancelFolderBtn.addEventListener('click', () => folderDialog.close());

    folderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = folderIdInput.value;
        const name = folderNameInput.value;
        const icon = folderIconInput.value;
        const defaultOpen = document.getElementById('folder-default-open').checked;

        if (id) {
            // Edit
            const folder = bookmarksData.find(f => f.id === id);
            if (folder) {
                folder.title = name;
                folder.icon = icon;
                folder.defaultOpen = defaultOpen;
            }
        } else {
            // Create
            bookmarksData.push({
                id: generateId(),
                title: name,
                icon: icon,
                defaultOpen: defaultOpen,
                children: []
            });
        }
        saveBookmarks();
        folderDialog.close();
    });

    // Bookmark Dialog
    cancelBookmarkBtn.addEventListener('click', () => bookmarkDialog.close());

    bookmarkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = bookmarkIdInput.value;
        const parentId = bookmarkParentIdInput.value;
        const title = bookmarkTitleInput.value;
        let url = bookmarkUrlInput.value;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const folder = bookmarksData.find(f => f.id === parentId);
        if (!folder) return;

        if (id) {
            // Edit
            const bookmark = folder.children.find(b => b.id === id);
            if (bookmark) {
                bookmark.title = title;
                bookmark.url = url;
            }
        } else {
            // Add
            folder.children.push({
                id: generateId(),
                title,
                url
            });
        }
        saveBookmarks();
        bookmarkDialog.close();
    });
}

function openFolderDialog(folder = null) {
    if (folder) {
        folderDialogTitle.textContent = 'Edit Folder';
        folderIdInput.value = folder.id;
        folderNameInput.value = folder.title;
        folderIconInput.value = folder.icon || '';
        document.getElementById('folder-default-open').checked = !!folder.defaultOpen;
    } else {
        folderDialogTitle.textContent = 'New Folder';
        folderIdInput.value = '';
        folderNameInput.value = '';
        folderIconInput.value = '';
        document.getElementById('folder-default-open').checked = true; // Default to open for new folders? Or false? Let's say true.
    }
    folderDialog.showModal();
}

function openBookmarkDialog(parentId, bookmark = null, existingParentId = null) {
    const parent = existingParentId || parentId;
    bookmarkParentIdInput.value = parent;

    if (bookmark) {
        bookmarkDialogTitle.textContent = 'Edit Bookmark';
        bookmarkIdInput.value = bookmark.id;
        bookmarkTitleInput.value = bookmark.title;
        bookmarkUrlInput.value = bookmark.url;
    } else {
        bookmarkDialogTitle.textContent = 'New Bookmark';
        bookmarkIdInput.value = '';
        bookmarkTitleInput.value = '';
        bookmarkUrlInput.value = '';
    }
    bookmarkDialog.showModal();
}

function generateNetscapeHTML(data) {
    const now = Math.floor(Date.now() / 1000);
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

    data.forEach(folder => {
        html += `    <DT><H3 ADD_DATE="${now}" LAST_MODIFIED="${now}">${folder.title}</H3>\n`;
        html += `    <DL><p>\n`;

        if (folder.children) {
            folder.children.forEach(bookmark => {
                html += `        <DT><A HREF="${bookmark.url}" ADD_DATE="${now}">${bookmark.title}</A>\n`;
            });
        }

        html += `    </DL><p>\n`;
    });

    html += `</DL><p>`;
    return html;
}
