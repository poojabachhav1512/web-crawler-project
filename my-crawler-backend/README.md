# Web Crawler Application

This is a full-stack web application designed to allow users to input a website URL, crawl it, and then display key information extracted from that web page.

## Features

### Backend Data Collection (per URL)

* **HTML Version:** Identifies the HTML version of the crawled page.
* **Page Title:** Extracts the title of the page.
* **Heading Tags Count:** Counts occurrences of H1, H2, H3, H4, H5, and H6 tags.
* **Internal vs. External Links:** Differentiates and counts internal and external hyperlinks.
* **Inaccessible Links:** Identifies and counts links returning 4xx or 5xx HTTP status codes, listing them with their status codes.
* **Login Form Presence:** Detects if a login form is present on the page.

### Frontend Features

1.  **URL Management:**
    * Add URLs for analysis via an input field.
    * Table displays URLs with their current processing status (queued, running, done, error).
    * Status updates are near real-time via polling.
2.  **Results Dashboard:**
    * Paginated, sortable table of analyzed URLs.
    * Column filters and a global search box for easy navigation.
    * Checkboxes for selecting multiple URLs.
3.  **Details View:**
    * Clicking a row navigates to a detailed page.
    * Displays all collected information, including:
        * Bar/donut chart visualizing internal vs. external link distribution.
        * A list of broken links with their status codes.
4.  **Bulk Actions:**
    * Re-run analysis on selected URLs.
    * Delete selected URLs.

## Technologies Used

### Frontend

* **React:** JavaScript library for building user interfaces.
* **TypeScript:** Typed superset of JavaScript that compiles to plain JavaScript.
* **Vite:** Fast development build tool.
* **Chakra UI:** A simple, modular, and accessible component library for React.
* **React Query (`@tanstack/react-query`):** Powerful data-fetching and caching library.
* **React Router (`react-router-dom`):** For declarative routing in React applications.
* **Recharts:** Composable charting library built on React components for data visualization.
* **Axios:** Promise-based HTTP client for the browser and Node.js.

### Backend

* **Go (Golang):** Compiled, statically typed programming language.
* **Gin Gonic:** High-performance HTTP web framework.
* **GORM:** An ORM library for Go, used for interacting with the database.
* **MySQL:** Relational database for data storage.
* **`goquery`:** Go library for HTML parsing, similar to jQuery.
* **`joho/godotenv`:** For loading environment variables from `.env` files.

## Setup and Installation

Follow these steps to get the application up and running on your local machine.

### Prerequisites

* Go (Go 1.22+)
* Node.js (LTS recommended, e.g., 20.x or 22.x) & npm (or Yarn/pnpm)
* MySQL Server

### 1. Database Setup

1.  **Start your MySQL server.**
2.  **Create a database:** Access your MySQL server (e.g., via MySQL Workbench, `mysql` command-line client, or phpMyAdmin) and create a new database.
    ```sql
    CREATE DATABASE my_web_crawler_db;
    -- Optional: Create a dedicated user if you don't want to use 'root'
    -- CREATE USER 'crawler_user'@'localhost' IDENTIFIED BY 'crawler_password';
    -- GRANT ALL PRIVILEGES ON my_web_crawler_db.* TO 'crawler_user'@'localhost';
    -- FLUSH PRIVILEGES;
    ```
3.  **Configure Backend `.env`:**
    * Navigate to the `my-web-crawler/my-crawler-backend` directory.
    * Create a file named `.env`.
    * Add the following content, **replacing placeholder values with your actual MySQL credentials**:
        ```dotenv
        # .env for my-crawler-backend
        PORT=8080
        DB_DSN="root:mysecretpassword@tcp(127.0.0.1:3306)/my_web_crawler_db?charset=utf8mb4&parseTime=True&loc=Local"
        ```
    * *(Note: The `initializers.SyncDatabase()` function in Go will automatically create the necessary tables within `my_web_crawler_db` when the backend starts.)*

### 2. Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd my-web-crawler/my-crawler-backend
    ```
2.  **Download Go modules:**
    ```bash
    go mod tidy
    ```
3.  **Run the backend server:**
    ```bash
    go run main.go
    ```
    The backend server should start on `http://localhost:9090`. You should see messages indicating successful database connection and migration in your terminal.

### 3. Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd my-web-crawler/my-crawler-ui
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install # Or yarn install / pnpm install
    ```
3.  **Configure Frontend `.env`:**
    * Create a file named `.env` in the `my-crawler-ui` directory.
    * Add the following content (ensure `VITE_API_BASE_URL` matches your backend's port):
        ```dotenv
        # .env for my-crawler-ui
        VITE_API_BASE_URL=http://localhost:9090
        ```

4.  **Run the frontend development server:**
    ```bash
    npm run dev # Or yarn dev / pnpm dev
    ```
    The frontend application should open in your browser, typically at `http://localhost:5173`.

## Usage

1.  **Add a URL:** On the Dashboard, enter a website URL (e.g., `https://www.google.com`, `https://react.dev`) into the input field and click "Add URL for Analysis".
2.  **Monitor Progress:** The table will update, showing the URL and its status (`queued`, `running`, `done`, `error`). The status will automatically refresh every few seconds.
3.  **View Details:** Click on any URL in the table to navigate to its detail page, showing comprehensive analysis results including charts and broken links.
4.  **Search & Filter:** Use the search bar to filter URLs by URL, title, or status.
5.  **Sort:** Click on table column headers to sort the data.
6.  **Bulk Actions:** Use the checkboxes to select multiple URLs, then use the "Re-run Analysis" or "Delete Selected" buttons.

