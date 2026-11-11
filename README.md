# Sources List Generator

A web-based application for generating APT repository configuration files for Debian-based Linux distributions.

Sources List Generator provides a simple interface for configuring repository mirrors, distributions, components, and update suites. It validates the selected options and generates ready-to-use APT configuration files in both traditional `sources.list` and modern Deb822 (`debian.sources`) formats.

## Features

- Generate traditional `sources.list` configuration files.
- Generate modern Deb822 (`debian.sources`) configuration files.
- Debian repository support.
- Select Debian releases and codenames.
- Choose official Debian mirrors or provide custom mirrors.
- Select repository components.
- Configure repository suites and update channels.
- Support for Debian security repositories.
- Support for backports and proposed updates where available.
- Preview generated configurations.
- Copy generated configurations to the clipboard.
- Download generated configuration files.
- Publish generated APT configurations as shareable Pastebin links.
- Light and dark themes.
- Load repository metadata from a separate JSON file.
- Backend-side validation of repository configuration.
- REST API powered by FastAPI.
- PostgreSQL database integration.
- Containerized deployment using Docker or Podman Compose.

## Tech Stack

### Backend

- **Python 3.13**
- **FastAPI** — REST API framework.
- **Pydantic** — request validation and data schemas.
- **SQLAlchemy** — database interaction and ORM.
- **PostgreSQL** — relational database.
- **Uvicorn** — ASGI application server.
- **uv** — Python dependency and project management.

### Frontend

- **HTML5**
- **CSS3**
- **Vanilla JavaScript**
- **Fetch API**
- **Browser Clipboard API**
- **Browser Local Storage**

### Infrastructure

- **Docker / Podman**
- **Docker Compose / Podman Compose**
- **PostgreSQL 17**
- **Multi-stage Docker build**

## Architecture

The application consists of three main parts:

1. **Frontend:** Provides the user interface and sends configuration requests to the backend.
2. **Backend:** Validates configuration options, processes requests, and generates APT repository files.
3. **Database:** PostgreSQL provides persistent relational data storage.

The repository metadata is maintained separately from the application logic, allowing repository information to be updated without mixing it with the configuration-generation code.

## Requirements

### Recommended: Containerized Setup

For the easiest setup, use one of the following:

- Docker Engine with Docker Compose.
- Podman with Podman Compose.

You also need Git to clone the repository.

### Local Development

For running the application directly on your machine:

- Python 3.13 or newer.
- `uv`.
- PostgreSQL 17 or a compatible PostgreSQL version.
- A modern web browser.

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SourcesList
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
DB_PASSWORD=replace-with-a-strong-password
DATABASE_URL=postgresql://sourceslist:replace-with-a-strong-password@db:5432/sourceslist
```

The variables are used by Docker Compose:

| Variable | Description |
|---|---|
| `DB_PASSWORD` | Password assigned to the PostgreSQL user. |
| `DATABASE_URL` | Connection URL used by the backend to connect to PostgreSQL. |

**Important:**

- Replace the example password with a strong password.
- The hostname `db` is the PostgreSQL service name inside the Compose network. Do not replace it with `localhost` when the backend runs inside Compose.
- If your password contains URL-reserved characters, URL-encode them in `DATABASE_URL`.
- Never commit `.env` to a public repository.

## Running with Docker Compose

The recommended way to run the application is through Docker Compose.

### 1. Build and Start the Services

```bash
docker compose up -d --build
```

Or, with Podman:

```bash
podman compose up -d --build
```

This command:

- Builds the application image.
- Creates the application and database containers.
- Creates the Compose network.
- Creates the persistent PostgreSQL volume if it does not already exist.
- Starts the services in the background.

### 2. Check Container Status

```bash
docker compose ps
```

Or:

```bash
podman compose ps
```

### 3. View Application Logs

```bash
docker compose logs -f app
```

For PostgreSQL:

```bash
docker compose logs -f db
```

### 4. Open the Application

Once the services are running, open:

```text
http://localhost:8000
```

FastAPI interactive API documentation:

```text
http://localhost:8000/docs
```

The application is exposed through port `8000`.

## Container Management

The following commands are useful for everyday operation.

| Command | Description |
|---|---|
| `compose up -d` | Create and start services in the background. |
| `compose up -d --build` | Rebuild the application image and start services. |
| `compose stop` | Stop running containers without removing them. |
| `compose start` | Start previously created containers. |
| `compose restart` | Restart services. |
| `compose ps` | Display service status. |
| `compose logs -f` | Follow service logs. |
| `compose down` | Stop and remove containers and the Compose network. |

Use the appropriate command prefix:

```bash
docker compose
```

or:

```bash
podman compose
```

### Database Persistence

PostgreSQL data is stored in a named volume:

```yaml
volumes:
  postgres_data:
```

This means database data is preserved when containers are stopped or removed using:

```bash
podman compose down
```

To remove the containers and the database volume as well:

```bash
podman compose down -v
```

**Warning:** The `-v` option permanently removes the Compose-managed database volume and its stored data. Do not use it unless you intentionally want to delete the database.

## Local Development

Containerized deployment is recommended for normal usage. However, you can also run the backend directly on your machine.

### 1. Install Dependencies

Make sure Python 3.13 and `uv` are installed.

Create a virtual environment and install the locked dependencies:

```bash
uv sync --frozen
```

### 2. Configure the Database

Start a PostgreSQL instance and configure `DATABASE_URL` to point to it.

For example, when PostgreSQL is running directly on the host:

```env
DATABASE_URL=postgresql://sourceslist:your-password@localhost:5432/sourceslist
```

The database and the required database user must exist before starting the application.

### 3. Start the Backend

From the project root:

```bash
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

The frontend is served by the application, so you can access it through the backend address rather than opening the HTML file directly.

### 4. Stop the Development Server

Press:

```text
Ctrl + C
```

## API

The backend is powered by FastAPI and exposes HTTP endpoints for application functionality.

Interactive API documentation is available at:

```text
http://localhost:8000/docs
```

The documentation provides the available routes, request schemas, response formats, and endpoint testing interface.

## Configuration Generation

The application supports two output formats:

### Traditional `sources.list`

Example:

```text
deb https://deb.debian.org/debian trixie main contrib non-free non-free-firmware
deb https://deb.debian.org/debian trixie-updates main contrib non-free non-free-firmware
```

### Deb822 `debian.sources`

Example:

```text
Types: deb
URIs: https://deb.debian.org/debian
Suites: trixie trixie-updates
Components: main contrib non-free non-free-firmware
```

The actual output depends on the selected distribution release, mirror, components, suites, and output format.

## Development Notes

- Repository metadata should remain separate from configuration-generation logic.
- Configuration requests must be validated by the backend.
- Database credentials should be supplied through environment variables.
- Do not commit `.env` or other files containing secrets.
- When application source files change, rebuild and recreate the application container to apply the changes:

```bash
podman compose up -d --build
```

The PostgreSQL volume is preserved during this process.

## Troubleshooting

### Application Cannot Connect to PostgreSQL

Check that both services are running:

```bash
podman compose ps
```

Inspect the database logs:

```bash
podman compose logs db
```

Verify that `DATABASE_URL` uses the Compose service hostname:

```text
db
```

Also verify that the database username, password, and database name match the PostgreSQL configuration.

### Database Authentication Failed

PostgreSQL initializes its user and password when its data directory is first created. Changing `DB_PASSWORD` in `.env` does not automatically change the password of an already initialized database user.

Update the existing PostgreSQL role password when necessary, then restart the application.

### Changes Are Not Visible

If you changed application source files, rebuild the image:

```bash
podman compose up -d --build
```

### Port 8000 Is Already in Use

Check which process is using the port:

```bash
ss -ltnp | grep ':8000'
```

Stop the conflicting process or change the host-side port mapping in `compose.yaml`.

## Future Improvements

Potential areas for future development include:

- Ubuntu support.
- Support for additional Debian-based distributions.
- Expanded Deb822 configuration options.
- Automatic distribution detection.
- Automatic mirror selection.
- Mirror availability checks.
- Repository configuration presets.
- More detailed validation and error reporting.
- Automated backend and frontend tests.
- CI/CD integration.
- Improved mobile and responsive design.

## Contributing

Contributions are welcome.

You can help by:

- Reporting bugs.
- Suggesting improvements.
- Improving documentation.
- Adding support for additional distributions.
- Improving repository metadata and validation.
- Submitting pull requests.

Please test your changes and update the documentation when necessary.

## License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.

See the `LICENSE` file for the complete license text.
