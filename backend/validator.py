def valid_release(release: str, data: dict) -> bool:
    return release in data["suites"]


def valid_components(components: list[str], data: dict) -> bool:
    valid_components = set(data["components"])

    return all(
        component in valid_components
        for component in components
    )


def valid_suites(suites: list[str], data: dict, release: str) -> bool:
    release_data = data["suites"].get(release)

    if not release_data:
        return False

    valid_suites = set(
        release_data.get("entries", [])
        + release_data.get("security", [])
    )

    return all(
        suite in valid_suites
        for suite in suites
    )


def valid_mirror(mirror: str, data: dict) -> bool:
    valid_mirrors = set(
        data["official_mirrors"].values()
    )

    return mirror in valid_mirrors