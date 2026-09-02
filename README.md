# Sources List Generator

A modern and intuitive web application for generating APT repository configuration files for Debian-based Linux distributions.

## Overview

**Sources List Generator** makes it easier to create valid APT repository configurations without manually writing repository entries.

Users can select a Debian release, repository mirror, components, and update suites through a simple web interface. The application then generates the corresponding APT configuration, which can be copied to the clipboard or downloaded as a file.

The project supports both the traditional `sources.list` format and the modern `debian.sources` (Deb822) format.

## Features

### Current Features

* Generate APT `sources.list` configuration
* Generate `debian.sources` configuration
* Debian repository support
* Select Debian release
* Select official Debian mirrors
* Support for custom mirrors
* Select repository components
* Select repository suites and update channels
* Debian security repositories
* Debian backports and proposed-updates support where available
* Copy generated configuration to clipboard
* Download generated configuration
* Light and dark theme
* Automatic loading of repository information from JSON
* Backend validation of releases, components, mirrors, and suites
* REST API powered by FastAPI

## Supported Repository Data

Repository information is stored in `backend/repository_data.json`.

The data includes:

* Debian releases and codenames
* Official Debian repository mirrors
* Security repositories
* Debug repositories
* Repository components
* Available repository suites
* Deb822 configuration information
* Legacy `sources.list` format information

Keeping repository metadata separate from the application logic makes it easier to update repository information in the future.

## Tech Stack

### Backend

* **Python**
* **FastAPI**
* **Pydantic**
* **Uvicorn**
* **JSON**

The backend provides the API endpoints used by the frontend and validates user-provided repository configuration before generating the final output.

### Frontend

* **HTML5**
* **CSS3**
* **Vanilla JavaScript**
* **Fetch API**
* **Browser Clipboard API**
* **Browser Local Storage**

The frontend provides the configuration interface, communicates with the FastAPI backend, displays generated repository configurations, and provides copy/download functionality.

## API

The FastAPI backend exposes the following main endpoints:

### `GET /`

Returns a basic API status message.

### `GET /repository_data`

Returns the repository configuration data used by the frontend.

### `POST /generator`

Generates an APT repository configuration from the selected options.

Example request:

```json
{
  "mirror": "https://deb.debian.org/debian",
  "release": "stable",
  "components": [
    "main",
    "contrib",
    "non-free"
  ],
  "suites": [
    "release",
    "updates"
  ]
}
```

The backend validates the requested release, components, suites, and mirror before generating the configuration.

## Project Structure

```text
SourcesList/
│
├── backend/
│   ├── main.py
│   ├── generator.py
│   ├── validator.py
│   └── repository_data.json
│
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
│
└── README.md
```

### Backend Files

#### `main.py`

Defines the FastAPI application and API endpoints.

Responsibilities include:

* Starting the API application
* Enabling CORS
* Loading repository data
* Defining request models
* Validating repository configuration
* Calling the configuration generator

#### `generator.py`

Contains the logic responsible for generating APT repository entries from the selected configuration.

#### `validator.py`

Validates:

* Debian releases
* Repository components
* Repository suites
* Repository mirrors

This helps prevent invalid repository configurations from being generated.

#### `repository_data.json`

Contains Debian repository metadata used by the backend and frontend.

### Frontend Files

#### `index.html`

Defines the main user interface, including:

* Mirror selection
* Release selection
* Component selection
* Suite selection
* Output format selection
* Generated configuration preview
* Copy button
* Download button
* Theme toggle

#### `app.js`

Handles frontend application logic and communication with the FastAPI backend.

It is responsible for:

* Loading repository data
* Populating configuration controls
* Sending generation requests
* Displaying generated output
* Copying output to the clipboard
* Downloading generated files
* Managing light/dark theme preferences

#### `style.css`

Contains the application's visual design, responsive layout, form controls, panels, themes, and other UI styles.

## How It Works

The application follows a simple workflow:

```text
User
  │
  ▼
Web Interface
  │
  ├── Select Mirror
  ├── Select Release
  ├── Select Components
  ├── Select Suites
  └── Select Output Format
  │
  ▼
FastAPI Backend
  │
  ├── Validate Request
  ├── Load Repository Data
  └── Generate Configuration
  │
  ▼
Generated APT Configuration
  │
  ├── Copy
  └── Download
```

## Running the Project

### Requirements

Before running the project, make sure you have the following installed:

* Python 3.10 or newer
* `uv`
* A modern web browser

### 1. Clone the Repository

Clone the project and enter its directory:

```bash
git clone <repository-url>
cd SourcesList
```

### 2. Create a Virtual Environment

Create a Python virtual environment using `uv`:

```bash
uv venv
```

Activate the virtual environment if desired.

#### Linux / macOS

```bash
source .venv/bin/activate
```

#### Windows

```powershell
.venv\Scripts\activate
```

### 3. Install Backend Dependencies

Install the required Python packages:

```bash
uv pip install fastapi uvicorn pydantic
```

If the project contains a `requirements.txt` file, install the dependencies with:

```bash
uv pip install -r backend/requirements.txt
```

### 4. Start the Backend

Navigate to the backend directory:

```bash
cd backend
```

Start the FastAPI server using `uv`:

```bash
uv run uvicorn main:app --reload
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

### 5. Start the Frontend

The frontend is a static HTML/CSS/JavaScript application.

Simply open the following file in your browser:

```text
frontend/index.html
```

The browser will load the application directly from `index.html`.

Make sure the FastAPI backend is running before using the application, since the frontend communicates with the backend API.

### 6. Use the Application

After starting the backend and opening the frontend:

1. Open `frontend/index.html` in your browser.
2. Select the desired Debian release.
3. Select a repository mirror.
4. Select the required repository components.
5. Select the desired suites or update channels.
6. Choose the output format.
7. Generate the configuration.
8. Copy the generated configuration or download it as a file.

The frontend communicates with the FastAPI backend at:

```text
http://127.0.0.1:8000
```

### Development

For backend development, run:

```bash
cd backend
uv run uvicorn main:app --reload
```

The `--reload` option automatically restarts the server whenever backend source files are modified.

The frontend does not require a separate development server. Simply open:

```text
frontend/index.html
```

in your browser.

### Stopping the Backend

To stop the FastAPI development server, press:

```text
Ctrl + C
```

If you activated the virtual environment manually, you can deactivate it with:

```bash
deactivate
```

## Example Output

For a typical Debian configuration, the generated `sources.list` may look similar to:

```text
deb https://deb.debian.org/debian trixie main contrib non-free non-free-firmware
deb https://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware
```

The exact output depends on the release, mirror, components, and suites selected by the user.

## Goals

The main goals of the project are to:

* Make APT repository configuration easier and less error-prone
* Provide a simple graphical interface for generating repository files
* Support modern Debian repository configuration formats
* Keep repository metadata separate from application logic
* Provide validation before generating configuration files
* Make it easy to copy or download generated configurations
* Expand support for additional Debian-based distributions in the future

## Future Improvements

Possible future improvements include:

* Ubuntu support
* Support for additional Debian-based distributions
* Improved `debian.sources` generation
* Automatic detection of the user's Linux distribution
* Automatic mirror selection
* Mirror availability checking
* Repository configuration presets
* More detailed validation and error messages
* API documentation and examples
* Containerized deployment with Docker
* Automated tests
* Improved mobile and responsive support

## Contributing

Contributions are welcome!

You can contribute by:

* Reporting bugs
* Suggesting new features
* Improving the documentation
* Improving the frontend
* Adding support for additional distributions
* Improving repository validation
* Submitting pull requests

Before submitting a pull request, please make sure that your changes are tested and documented where appropriate.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
