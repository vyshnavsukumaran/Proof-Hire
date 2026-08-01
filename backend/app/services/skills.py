def split_skills(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = raw.replace(";", ",").split(",")
    return [p.strip() for p in parts if p.strip()]


def normalize(s: str) -> str:
    return s.strip().lower()
