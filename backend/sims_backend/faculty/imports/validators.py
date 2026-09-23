"""Faculty CSV value validation."""


def validate_field_lengths(row: dict[str, str], row_num: int) -> list[dict[str, str]]:
    errors = []
    limits = {"reg_no": 32, "name": 255, "phone": 20}
    for field, limit in limits.items():
        if row.get(field) and len(row[field]) > limit:
            errors.append({"column": field, "message": f"{field} exceeds maximum length of {limit} characters"})
    return errors


def validate_email_format(email: str | None, row_num: int) -> list[dict[str, str]]:
    if email and ("@" not in email or "." not in email.split("@", 1)[1]):
        return [{"column": "email", "message": f"Invalid email format: '{email.strip()}'"}]
    return []
