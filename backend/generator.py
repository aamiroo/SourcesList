"""
generate debian APT repository entries based on a mirror,
release, components, and suites.
"""

def generate(
        
    # Everyone should be a string.
    mirror: str,
    release: str,
    components: list[str],
    suites: list[str],
) -> str:

    lines = []

    for suite in suites:

        if suite == "release":
            suite_name = release
        else:
            suite_name = f"{release}-{suite}"

        line = (
            f"deb {mirror} "
            f"{suite_name} "
            f"{' '.join(components)}"
        )

        lines.append(line)

    return "\n".join(lines)