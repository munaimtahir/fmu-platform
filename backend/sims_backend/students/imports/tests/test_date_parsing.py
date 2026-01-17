"""
Tests for date parsing in bulk upload
"""
import pytest
from sims_backend.students.imports.utils import parse_date_strict


class TestDateParsing:
    """Tests for multi-format date parsing"""

    def test_iso_format(self):
        """Parse YYYY-MM-DD format"""
        assert parse_date_strict("2000-01-15") == "2000-01-15"
        assert parse_date_strict("1995-12-31") == "1995-12-31"

    def test_european_format(self):
        """Parse DD/MM/YYYY format"""
        assert parse_date_strict("15/01/2000") == "2000-01-15"
        assert parse_date_strict("31/12/1995") == "1995-12-31"

    def test_two_digit_year(self):
        """Parse DD/MM/YY format with 2-digit year"""
        # Years 00-30 -> 2000-2030
        assert parse_date_strict("15/01/00") == "2000-01-15"
        assert parse_date_strict("15/01/25") == "2025-01-15"
        # Years 31-99 -> 1931-1999
        assert parse_date_strict("15/01/95") == "1995-01-15"
        assert parse_date_strict("31/12/99") == "1999-12-31"

    def test_us_format(self):
        """Parse MM/DD/YYYY format"""
        assert parse_date_strict("01/15/2000") == "2000-01-15"
        assert parse_date_strict("12/31/1995") == "1995-12-31"

    def test_slash_iso_format(self):
        """Parse YYYY/MM/DD format"""
        assert parse_date_strict("2000/01/15") == "2000-01-15"

    def test_dash_european_format(self):
        """Parse DD-MM-YYYY format"""
        assert parse_date_strict("15-01-2000") == "2000-01-15"

    def test_excel_serial_format(self):
        """Parse Excel serial date (numeric)"""
        # Excel serial 44927 = 2023-01-01
        assert parse_date_strict("44927") == "2023-01-01"
        # Excel serial 36526 = 2000-01-01
        assert parse_date_strict("36526") == "2000-01-01"

    def test_invalid_formats(self):
        """Invalid date formats return None"""
        assert parse_date_strict("") is None
        assert parse_date_strict(None) is None
        assert parse_date_strict("not-a-date") is None
        assert parse_date_strict("32/13/2000") is None  # Invalid day/month
        assert parse_date_strict("2000-13-01") is None  # Invalid month

    def test_year_range_validation(self):
        """Dates outside reasonable year range are rejected"""
        assert parse_date_strict("01/01/1850") is None  # Too old
        assert parse_date_strict("01/01/2150") is None  # Too far future
        assert parse_date_strict("01/01/1900") == "1900-01-01"  # Minimum valid
        assert parse_date_strict("01/01/2100") == "2100-01-01"  # Maximum valid
