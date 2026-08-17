# Sources list Generator

Generate APT repository configuration files for Debian-based Linux distributions with a modern and intuitive web interface.

## Overview

Sources list Generator is an open-source web application that simplifies creating APT repository configuration files such as `sources.list` and `debian.sources`.

Instead of manually writing repository entries, users can select their Linux distribution, release, mirrors, repository components, and update channels. The application then generates a valid configuration that can be copied or downloaded instantly.

## Features

### Current

* Generate `sources.list`
* Generate `debian.sources`
* Debian support
* Select Debian release
* Select repository components
* Select update suites
* Copy generated output
* Download generated file

## Tech Stack

### Backend

* Python
* FastAPI

### Frontend

* 
* 

### Data

* JSON
* Official Debian repository information

## Project Structure

```text
repository-generator/

├── backend/
│   ├── main.py
│   ├── generator.py
│   ├── repository_data.json
│   ├── 
│   └── 
│
├── frontend/
│   ├── 
│   ├── 
│   ├── 
│   └── 
│
└── README.md
```

## Goals

* 
* 
* 
* 
* 

## Contributing

Contributions, bug reports, feature requests, and pull requests are welcome.

## License

This project is licensed under the MIT License.

