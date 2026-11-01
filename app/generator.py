"""
generate debian APT repository entries based on a mirror,
release, components, and suites.
"""

def generate(
        
    # Everyone should be a string.
    mirror: str,
    components: list[str],
    suites: list[str],
) -> str:

    lines = []

    for suite in suites:
        suite_name = suite

        line = (
            f"deb {mirror} "
            f"{suite_name} "
            f"{' '.join(components)}"
        )

        lines.append(line)

    return "\n".join(lines)

def generate_modern(
        mirror: str,
        components: list[str],
        suites: list[str],
)->str:
    if not mirror.strip():
        raise ValueError ("mirror cannot be emty")
    if not components:
        raise ValueError ("At least one component is required")
    if not suites:
        raise ValueError ("At least one component is required")

    lines = [
        "Type: deb",
        f"URIs: {mirror}",
        f"Suites: {' '.join(suites)}",
        f"Components: {' '.join(components)}",
        "Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg"
    ]

    return "\n".join(lines)