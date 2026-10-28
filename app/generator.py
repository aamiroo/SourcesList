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