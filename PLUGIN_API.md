# SiteBuilder Pro Plugin API

The **Plugin API** allows you to extend the builder with new components, properties, styles, and behaviors. Plugins run in a secure sandbox and communicate with the core builder via the global `builderAPI` object.

## Core Concepts

- **Sandboxing:** Plugins execute within a sandboxed `iframe`. You cannot access the parent window's DOM directly.
- **Communication:** Use the `builderAPI` to register components, properties, and trigger actions.
- **Reactivity:** The `element` object passed to callbacks is a **proxy**. Any changes you make to it (e.g., `element.styles.color = 'red'`) are automatically synced to the builder canvas.

---

## Global Object: `builderAPI`

The `builderAPI` object is globally available in your plugin code.

### 1. `registerComponent(id, config)`

Registers a new drag-and-drop component.

**Parameters:**
- `id` (string): Unique identifier for the component type (e.g., `'my-hero'`).
- `config` (object):
  - `label` (string): Display name in the sidebar.
  - `icon` (string): FontAwesome class (e.g., `'fa-star'`) plus Tailwind colors (e.g., `'text-red-500 bg-red-100'`).
  - `tagName` (string): HTML tag to render (e.g., `'div'`, `'h1'`, `'button'`, `'img'`, `'input'`, `'form'`).
  - `canDrop` (boolean): If `true`, other elements can be dropped inside this component.
  - `defaultContent` (string): Initial text content.
  - `defaultStyles` (object): Initial CSS styles (camelCase).

**Example:**
```javascript
builderAPI.registerComponent('custom-card', {
    label: 'Custom Card',
    icon: 'fa-id-card text-purple-500 bg-purple-100',
    tagName: 'div',
    canDrop: true,
    defaultStyles: {
        padding: '20px',
        border: '2px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    }
});
```

### 2. `registerProperty(config)`

Adds a control to the Properties Panel when a specific component type is selected.

**Parameters:**
- `config` (object):
  - `targetType` (string): The component `id` this property applies to.
  - `type` (string): Control type (`'text'`, `'select'`, `'button'`).
  - `label` (string): Label text (for inputs/selects).
  - `text` (string): Button text (only for type `'button'`).
  - `key` (string): The property key to bind to (e.g., `'src'`, `'action'`).
  - `options` (array): Options for `'select'` type.
  - `onChange` (function(element, value)): Callback when value changes.
  - `onClick` (function(element)): Callback when button is clicked.

**Example (Text Input):**
```javascript
builderAPI.registerProperty({
    targetType: 'custom-card',
    label: 'Card Title',
    type: 'text',
    key: 'title', // Custom property stored on element
    onChange: (element, value) => {
        element.title = value; // Auto-syncs to builder
    }
});
```

**Example (Button Action):**
```javascript
builderAPI.registerProperty({
    targetType: 'custom-card',
    type: 'button',
    text: 'Add Header',
    onClick: (element) => {
        // IMPORTANT: You must generate unique IDs for new children
        element.children.push({
            id: 'h_' + Math.random().toString(36).substr(2, 9),
            type: 'header',
            tagName: 'h3',
            content: 'New Header',
            styles: { fontSize: '20px' }
        });
        builderAPI.refreshCanvas(); // Refresh to show changes
    }
});
```

### 3. `addGlobalStyle(css)`

Injects global CSS into the builder and preview. Useful for keyframes, utility classes, or font imports.

**Example:**
```javascript
builderAPI.addGlobalStyle(`
    @keyframes spin { 
        0% { transform: rotate(0deg); } 
        100% { transform: rotate(360deg); } 
    }
    .my-custom-class { 
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
    }
`);
```

### 4. `refreshCanvas()`

Forces a re-render of the canvas. Call this after modifying `element.children` or properties in a way that might not trigger an auto-update (e.g., complex array manipulations).

### 5. `save()`

Triggers a local history save (undo/redo checkpoint) and updates local storage.

### 6. `alert(message)`

Displays a browser alert to the user. Since standard `alert()` is blocked in some sandboxes, use this to communicate errors or information.

### 7. `getSelectedElement()`

Returns the currently selected element in the builder canvas, or `null` if no element is selected.

**Returns:** `Element` | `null`

---

## Element Structure

When working with `element` in callbacks, you are interacting with a JSON object.

**Standard Properties:**
- `id` (string): **Required.** Unique identifier.
- `type` (string): Component ID (e.g., `'header'`, `'custom-card'`).
- `tagName` (string): HTML tag (e.g., `'div'`, `'a'`, `'img'`).
- `children` (array): Array of child elements.
- `styles` (object): CSS styles in camelCase (e.g., `backgroundColor`).
- `content` (string): Inner text content.

**Specific Properties:**
- `src` (string): For `img` tags.
- `href` (string): For `a` tags.
- `placeholder` (string): For `input` tags.
- `action` (string): For `form` tags.
- `method` (string): For `form` tags (`'GET'`, `'POST'`).

**Example Element:**
```json
{
  "id": "abc123456",
  "type": "custom-card",
  "tagName": "div",
  "styles": {
    "backgroundColor": "#fff",
    "padding": "20px"
  },
  "children": [
    {
      "id": "img_987654321",
      "type": "image",
      "tagName": "img",
      "src": "https://example.com/image.jpg",
      "styles": { "width": "100%" }
    }
  ]
}
```

## External APIs

You can use `fetch` to make network requests to external APIs (e.g., AI services, weather data), provided the external server supports CORS.

**Example:**
```javascript
builderAPI.registerProperty({
    type: 'button',
    text: 'Fetch Data',
    targetType: 'my-widget',
    onClick: async (element) => {
        try {
            const res = await fetch('https://api.example.com/data');
            const data = await res.json();
            element.content = data.message;
            builderAPI.refreshCanvas();
        } catch (err) {
            alert('Failed to fetch data');
        }
    }
});
```

## Best Practices

1. **Unique IDs:** Always generate unique IDs (e.g., using `Math.random()`) when creating new elements programmatically. Duplicate IDs will cause rendering issues.
2. **Proxies:** Direct property assignment (`el.prop = val`) works because of the sandbox proxy. You don't need to manually send update messages.
3. **Styles:** Use camelCase for CSS properties (`backgroundColor`, not `background-color`). Unitless numbers (like `opacity: 0.5`) are fine, but dimensions usually need units (`width: '100px'`).
4. **Security:** Do not try to inject `<script>` tags into `element.content`; they will not execute. All logic must reside within your plugin definition.


---

## Dashboard API (`dashboardAPI`)

The `dashboardAPI` object allows plugins to extend the Dashboard UI and manage data securely. It is available globally in the plugin execution context within the Dashboard.

### 1. `addComponent(location, config)`

Injects UI components (like buttons) into specific areas of the Dashboard.

**Parameters:**
- `location` (string): Where to add the component. Supported values:
  - `'sidebar'`: The secondary navigation bar (e.g., alongside "Dashboard", "Media").
  - `'topbar'`: The top-right navigation area.
- `config` (object):
  - `id` (string): Unique identifier.
  - `label` (string): Button text.
  - `icon` (string): FontAwesome class (e.g., `'fa-bolt'`).
  - `onClick` (function): Callback function when clicked.

**Example:**
```javascript
dashboardAPI.addComponent('sidebar', {
    id: 'my-plugin-btn',
    label: 'My Features',
    icon: 'fa-star',
    onClick: () => {
        alert('Button clicked!');
        // logic to open a modal or route
    }
});
```

### 2. `registerPage(id, label, icon, renderer)`

Allows registering custom views within the dashboard's main content area. This adds a navigation item to the dashboard's secondary menu.

**Parameters:**
- `id` (string): Unique identifier for the page (URL-friendly).
- `label` (string): Display name in navigation.
- `icon` (string): FontAwesome class.
- `renderer` (function): Callback receiving the container element.

**Example:**
```javascript
dashboardAPI.registerPage('analytics', 'Analytics', 'fa-chart-line', (container) => {
    container.innerHTML = '<h1>My Custom Page</h1><p>Welcome to analytics!</p>';
});
```

### 3. `openMediaPicker(callback)`

Opens the global Media Manager modal. Allows users to select an image from their library or upload a new one.

**Parameters:**
- `callback` (function(url)): Function called when an image is selected. Returns the absolute URL of the file.

**Example:**
```javascript
dashboardAPI.openMediaPicker((url) => {
    console.log('Selected image:', url);
});
```

### 4. `getPages()`

Fetches all sites and pages created by the current user. Useful for creating internal links or visibility settings.

**Returns:** Promise<Array<Site>>

**Example:**
```javascript
const pages = await dashboardAPI.getPages();
pages.forEach(p => console.log(p.name, p.slug));
```

---

## Secure Data API

Plugins can store, retrieve, update, and delete their own data collections. All data is **automatically scoped** to the current user and the specific plugin ID, ensuring security and isolation.

### Helper Methods (in `dashboardAPI`)

The `dashboardAPI` provides convenience methods to interact with the backend data endpoints.

#### `getData(pluginId, collection)`
Retrieves all documents in a collection.
- **Returns:** Promise<Array>

#### `createData(pluginId, collection, data)`
Saves a new document.
- **data** (object): Arbitrary JSON object.
- **Returns:** Promise<Object> (The created document with `_id`)

#### `deleteData(pluginId, collection, docId)`
Deletes a specific document by ID.
- **Returns:** Promise<void>

### Example Usage (Todo App)

```javascript
// 1. Load Data
async function loadTasks() {
    const tasks = await dashboardAPI.getData(pluginId, 'todos'); 
    console.log(tasks);
}

// 2. Save Data
async function addTask(text) {
    await dashboardAPI.createData(pluginId, 'todos', { 
        text: text, 
        completed: false, 
        priority: 'high' 
    });
}

// 3. Delete Data
async function removeTask(id) {
    await dashboardAPI.deleteData(pluginId, 'todos', id);
}
```

### HTTP Endpoints

If you are developing a backend-heavy plugin or need to access data via `fetch` manually:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/pl-data/:pluginId/:collection` | List all documents |
| `GET` | `/api/pl-data/:pluginId/:collection/:id` | Get single document |
| `POST` | `/api/pl-data/:pluginId/:collection` | Create document |
| `PUT` | `/api/pl-data/:pluginId/:collection/:id` | Update document |
| `DELETE` | `/api/pl-data/:pluginId/:collection/:id` | Delete document |
