# Plugin Hub for SiteBuilder Pro

The **Plugin Hub** is a standalone web application designed to manage, distribute, and showcase plugins for SiteBuilder Pro. It provides a platform for users to browse, download, rate, and comment on plugins, while offering administrative capabilities for plugin management.

## Features

-   **User Authentication**: Secure registration and login using JWT.
-   **Admin Management**: Admin users can upload new plugins.
-   **Plugin Browsing**: Users can browse available plugins on the home page.
-   **Plugin Details**: Detailed view for each plugin including descriptions, versions, and author info.
-   **Interactive Features**: Users can rate and comment on plugins.
-   **File Downloads**: Secure downloading of plugin files.

## Prerequisites

-   [Node.js](https://nodejs.org/) (v14+ recommended)
-   [MongoDB](https://www.mongodb.com/) (Local or Atlas)
-   [Docker](https://www.docker.com/) (Optional, for containerized run)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/sitebuilder-plugin-hub
JWT_SECRET=your_jwt_secret_key_here
ADMIN_EMAIL=admin@example.com      # Optional: Seeds admin user on startup
ADMIN_PASSWORD=securepassword      # Optional: Seeds admin user on startup
```

## Installation & Setup

### Local Method

1.  **Clone the repository** (if applicable) or navigate to the project directory.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start MongoDB**.
4.  **Run the application**:
    ```bash
    npm start
    # Or for development with auto-restart:
    npm run dev
    ```
5.  Access the app at `http://localhost:4000`.

### Docker Method

1.  **Build the Docker Image**:
    ```bash
    docker build -t plugin-hub .
    ```

2.  **Run the Container**:
    ```powershell
    docker run -d \
      -p 4000:4000 \
      --name plugin-hub \
      -e MONGO_URI=mongodb://host.docker.internal:27017/sitebuilder-plugin-hub \
      -e JWT_SECRET=your_secret \
      -e ADMIN_EMAIL=admin@example.com \
      -e ADMIN_PASSWORD=securepassword \
      plugin-hub
    ```

## Folder Structure

-   `server.js`: Main entry point.
-   `routes/`: Route definitions (`auth.js`, `index.js`).
-   `models/`: Mongoose models (`User.js`, `Plugin.js`).
-   `middleware/`: Custom middleware (e.g., `auth.js`).
-   `views/`: EJS templates for the frontend.
-   `public/`: Static assets (CSS, JS, images).
-   `uploads/`: Directory for storing uploaded plugin files.

## API / Usage

-   **Home**: `GET /` - List all plugins.
-   **Register**: `GET /auth/register` & `POST /auth/register` - Create a new user account.
-   **Login**: `GET /auth/login` & `POST /auth/login` - Authenticate user.
-   **Upload Plugin**: `GET /upload` & `POST /upload` - Admin interface to upload plugins.
-   **Download**: `GET /download/:id` - Download plugin file.
