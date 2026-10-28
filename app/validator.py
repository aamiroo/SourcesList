from urllib.parse import urlparse

def valid_release(release: str, data: dict) -> bool:
    return release in data["suites"]


def valid_components(components: list[str], data: dict) -> bool:
    
    if not components:
        return False
    
    valid_components_set = set(data["components"])
    return all (
        components in valid_components_set
        for component in components
    )


def valid_suites(suites: list[str], data: dict, release: str) -> bool:

    if not suites:
        return False

    release_data = data["suites"].get(release)
    valid_suites_set = set(
        release_data.get("entries", []) + release_data.get("security",[])
    )

    return all (
        suite in valid_suites_set for suite in suites
    )


def valid_mirror(mirror: str, data: dict) -> bool:
    if not isinstance(mirror , str) or not mirror:
        return False
    valid_mirrors = set(data["official_mirrors"].values())
    if mirror in valid_mirrors:
        return True
    parsed = urlparse(mirror)
    return (
        parsed.scheme in {"http", "https"} and parsed.hostname is not None
    )