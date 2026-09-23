import csv
import io

REQUIRED_COLUMNS = [
    "first_name",
    "last_name",
    "registration_number",
    "program_id",
    "batch_id",
    "initial_password",
]
OPTIONAL_COLUMNS = ["middle_name", "group_id", "email", "mobile_number", "date_of_birth", "gender"]


def get_expected_columns() -> list[str]:
    return REQUIRED_COLUMNS + OPTIONAL_COLUMNS


def generate_csv_template() -> bytes:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=get_expected_columns())
    writer.writeheader()
    writer.writerow(
        {
            "first_name": "Amina",
            "last_name": "Khan",
            "registration_number": "2026-MBBS-001",
            "program_id": "1",
            "batch_id": "1",
            "initial_password": "Replace-With-Unique-Temporary-Password",
            "middle_name": "",
            "group_id": "",
            "email": "amina@example.edu",
            "mobile_number": "+923001234567",
            "date_of_birth": "2005-01-15",
            "gender": "female",
        }
    )
    return output.getvalue().encode("utf-8")
