"""
Django Jazzmin configuration for the FMU Student Information Management System.

This module contains the settings and UI tweaks for the `django-jazzmin`
admin theme, which provides a modern and responsive interface for the Django
admin panel.
"""

JAZZMIN_SETTINGS = {
    # The title displayed in the browser tab.
    "site_title": "FMU SIMS Admin",
    # The header text displayed at the top of the admin panel.
    "site_header": "FMU Student Information System",
    # The brand text displayed in the header.
    "site_brand": "FMU SIMS",
    # The welcome text on the login screen.
    "welcome_sign": "Manage students, courses, attendance, and results",
    # The path to the site logo, used in the header.
    "site_logo": "img/fmu_logo.png",
    # The path to the login logo, used on the login page.
    "login_logo": "img/fmu_logo.png",
    # CSS classes to apply to the site logo.
    "site_logo_classes": "img-circle",
    # Whether to show the UI builder.
    "show_ui_builder": False,
    # Links to display in the top menu.
    "topmenu_links": [
        {"name": "Home", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "API Docs", "url": "/api/docs/"},
        {"name": "ReDoc", "url": "/api/redoc/"},
        {"model": "auth.User"},
    ],
    # The order of apps in the sidebar.
    "order_with_respect_to": [
        "admissions",
        "academics",
        "attendance",
        "results",
        "assessments",
        "enrollment",
        "requests",
        "transcripts",
        "audit",
        "auth",
    ],
    # Icons for apps and models in the sidebar.
    "icons": {
        "auth": "fas fa-shield-alt",
        "auth.user": "fas fa-user",
        "auth.group": "fas fa-users",
        "admissions.student": "fas fa-id-badge",
        "academics.course": "fas fa-book",
        "academics.section": "fas fa-columns",
        "academics.program": "fas fa-graduation-cap",
        "attendance.attendance": "fas fa-user-check",
        "results.result": "fas fa-poll",
        "assessments.assessment": "fas fa-tasks",
        "assessments.assessmentscore": "fas fa-clipboard-check",
        "enrollment.enrollment": "fas fa-user-plus",
        "requests.request": "fas fa-envelope",
        "transcripts.transcript": "fas fa-file-alt",
        "audit.auditlog": "fas fa-history",
    },
    # Whether to show the sidebar.
    "show_sidebar": True,
    # Whether to expand the sidebar navigation by default.
    "navigation_expanded": True,
    # The default format for change forms.
    "changeform_format": "horizontal_tabs",
    # Overrides for the change form format for specific models.
    "changeform_format_overrides": {
        "admissions.student": "collapsible",
        "academics.course": "tabs",
    },
    # Whether to enable the related modal for foreign key fields.
    "related_modal_active": True,
}

JAZZMIN_UI_TWEAKS = {
    # The overall theme for the admin panel.
    "theme": "cosmo",
    # The theme to use when dark mode is enabled.
    "dark_mode_theme": "darkly",
    # CSS classes for the navbar.
    "navbar": "navbar-white navbar-light",
    # CSS classes for the sidebar.
    "sidebar": "sidebar-dark-primary",
    # The color of the brand in the header.
    "brand_colour": "navbar-primary",
    # Whether the footer should be fixed.
    "footer_fixed": False,
    # Whether the navbar should be fixed.
    "navbar_fixed": True,
    # Whether the sidebar should be fixed.
    "sidebar_fixed": True,
    # Whether the action buttons should be sticky at the top.
    "actions_sticky_top": True,
}
