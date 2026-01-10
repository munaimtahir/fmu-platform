"""
Django management command to test all admin URLs and identify which ones work
and which ones return 500 errors.
"""
import sys
from collections import defaultdict

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.test import Client, override_settings
from django.urls import reverse

User = get_user_model()


class Command(BaseCommand):
    help = 'Test all admin URLs and report which ones work and which ones return 500 errors'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='admin',
            help='Admin username to use for testing (default: admin)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Admin password to use for testing (default: admin123)',
        )

    @override_settings(
        DEBUG=True,
        SECURE_SSL_REDIRECT=False,
        ALLOWED_HOSTS=['*'],
        SECURE_PROXY_SSL_HEADER=None,
    )
    def handle(self, *args, **options):
        username = options['username']
        password = options['password']

        # Create test client (enforce_csrf_checks=False allows testing without CSRF)
        client = Client(enforce_csrf_checks=False)

        # Try to get or create superuser for testing
        self.stdout.write(f'\n🔐 Setting up authentication for: {username}')
        try:
            user = User.objects.get(username=username)
            if not user.is_superuser:
                self.stdout.write(self.style.WARNING(f'⚠️  User {username} exists but is not a superuser. Making it a superuser...'))
                user.is_superuser = True
                user.is_staff = True
                user.save()
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING(f'⚠️  User {username} does not exist. Creating superuser...'))
            user = User.objects.create_superuser(username=username, email=f'{username}@example.com', password=password)
        
        # Use force_login for testing (doesn't require password)
        client.force_login(user)
        self.stdout.write(self.style.SUCCESS('✅ Successfully authenticated'))

        # Get all registered models
        registered_models = {}
        for model, model_admin in admin.site._registry.items():
            app_label = model._meta.app_label
            model_name = model._meta.model_name
            model_key = f'{app_label}.{model_name}'
            registered_models[model_key] = {
                'model': model,
                'admin': model_admin,
                'app_label': app_label,
                'model_name': model_name,
            }

        # Group by app
        models_by_app = defaultdict(list)
        for model_key, model_info in registered_models.items():
            models_by_app[model_info['app_label']].append(model_key)

        self.stdout.write(f'\n📋 Found {len(registered_models)} registered admin models\n')
        self.stdout.write('=' * 80)

        # Test results
        working_urls = []
        error_500_urls = []
        error_403_urls = []
        error_404_urls = []
        other_errors = []

        # Test admin index first
        try:
            index_url = reverse('admin:index')
            response = client.get(index_url)
            if response.status_code == 200:
                working_urls.append(('Admin Index', index_url, response.status_code))
                self.stdout.write(self.style.SUCCESS(f'✅ Admin Index: {response.status_code}'))
            else:
                other_errors.append(('Admin Index', index_url, response.status_code))
                self.stdout.write(self.style.ERROR(f'❌ Admin Index: {response.status_code}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Admin Index: Exception - {e}'))
            other_errors.append(('Admin Index', 'N/A', f'Exception: {e}'))

        # Test each model
        for app_label in sorted(models_by_app.keys()):
            self.stdout.write(f'\n📦 App: {app_label.upper()}')
            self.stdout.write('-' * 80)

            for model_key in sorted(models_by_app[app_label]):
                model_info = registered_models[model_key]
                model_name = model_info['model_name']
                app_label_inner = model_info['app_label']

                # Test list view
                try:
                    list_url = reverse(f'admin:{app_label_inner}_{model_name}_changelist')
                    response = client.get(list_url)
                    status = response.status_code

                    if status == 200:
                        working_urls.append((f'{app_label_inner}.{model_name} (List)', list_url, status))
                        self.stdout.write(self.style.SUCCESS(f'  ✅ {model_name} (List): {status}'))
                    elif status == 500:
                        error_500_urls.append((f'{app_label_inner}.{model_name} (List)', list_url, status))
                        self.stdout.write(self.style.ERROR(f'  ❌ {model_name} (List): {status} - SERVER ERROR'))
                        # Try to get error details
                        try:
                            if hasattr(response, 'content'):
                                content = response.content.decode('utf-8', errors='ignore')
                                if 'Traceback' in content or 'Error' in content:
                                    error_line = content.split('\n')[0:5]  # First 5 lines
                                    self.stdout.write(self.style.ERROR(f'    Error: {error_line}'))
                        except:
                            pass
                    elif status == 403:
                        error_403_urls.append((f'{app_label_inner}.{model_name} (List)', list_url, status))
                        self.stdout.write(self.style.WARNING(f'  ⚠️  {model_name} (List): {status} - FORBIDDEN'))
                    elif status == 404:
                        error_404_urls.append((f'{app_label_inner}.{model_name} (List)', list_url, status))
                        self.stdout.write(self.style.WARNING(f'  ⚠️  {model_name} (List): {status} - NOT FOUND'))
                    elif status == 400:
                        # For 400 errors, let's check if it's a CSRF issue or something else
                        error_detail = ''
                        try:
                            if hasattr(response, 'content'):
                                content = response.content.decode('utf-8', errors='ignore')[:200]
                                if 'CSRF' in content or 'csrf' in content.lower():
                                    error_detail = ' (Possible CSRF issue)'
                                elif 'Bad Request' in content:
                                    error_detail = ' (Bad Request)'
                        except:
                            pass
                        other_errors.append((f'{app_label_inner}.{model_name} (List)', list_url, f'{status}{error_detail}'))
                        self.stdout.write(self.style.WARNING(f'  ⚠️  {model_name} (List): {status}{error_detail}'))
                    else:
                        other_errors.append((f'{app_label_inner}.{model_name} (List)', list_url, status))
                        self.stdout.write(self.style.WARNING(f'  ⚠️  {model_name} (List): {status}'))

                except Exception as e:
                    import traceback
                    error_detail = f'Exception: {str(e)}'
                    error_500_urls.append((f'{app_label_inner}.{model_name} (List)', 'N/A', error_detail))
                    self.stdout.write(self.style.ERROR(f'  ❌ {model_name} (List): {error_detail}'))

                # Test add view
                try:
                    add_url = reverse(f'admin:{app_label_inner}_{model_name}_add')
                    response = client.get(add_url)
                    status = response.status_code

                    if status == 200:
                        working_urls.append((f'{app_label_inner}.{model_name} (Add)', add_url, status))
                        # Don't print success for add views to keep output clean
                    elif status == 500:
                        error_500_urls.append((f'{app_label_inner}.{model_name} (Add)', add_url, status))
                        self.stdout.write(self.style.ERROR(f'  ❌ {model_name} (Add): {status} - SERVER ERROR'))
                    elif status == 403:
                        error_403_urls.append((f'{app_label_inner}.{model_name} (Add)', add_url, status))
                        # Don't print 403 for add views as they might be permission-based
                    elif status == 404:
                        error_404_urls.append((f'{app_label_inner}.{model_name} (Add)', add_url, status))
                        self.stdout.write(self.style.WARNING(f'  ⚠️  {model_name} (Add): {status} - NOT FOUND'))
                    else:
                        other_errors.append((f'{app_label_inner}.{model_name} (Add)', add_url, status))

                except Exception as e:
                    error_500_urls.append((f'{app_label_inner}.{model_name} (Add)', 'N/A', f'Exception: {e}'))
                    self.stdout.write(self.style.ERROR(f'  ❌ {model_name} (Add): Exception - {e}'))

        # Summary report
        self.stdout.write('\n' + '=' * 80)
        self.stdout.write(self.style.SUCCESS('\n📊 SUMMARY REPORT'))
        self.stdout.write('=' * 80)

        self.stdout.write(f'\n✅ Working URLs ({len(working_urls)}):')
        for name, url, status in working_urls:
            self.stdout.write(f'  • {name}: {status}')

        if error_500_urls:
            self.stdout.write(f'\n❌ 500 SERVER ERROR ({len(error_500_urls)}):')
            for name, url, status in error_500_urls:
                self.stdout.write(self.style.ERROR(f'  • {name}'))
                self.stdout.write(self.style.ERROR(f'    URL: {url}'))
                if isinstance(status, str) and 'Exception' in status:
                    self.stdout.write(self.style.ERROR(f'    Error: {status}'))
                self.stdout.write('')

        if error_403_urls:
            self.stdout.write(f'\n⚠️  403 FORBIDDEN ({len(error_403_urls)}):')
            for name, url, status in error_403_urls:
                self.stdout.write(self.style.WARNING(f'  • {name}: {status}'))

        if error_404_urls:
            self.stdout.write(f'\n⚠️  404 NOT FOUND ({len(error_404_urls)}):')
            for name, url, status in error_404_urls:
                self.stdout.write(self.style.WARNING(f'  • {name}: {status}'))

        if other_errors:
            self.stdout.write(f'\n⚠️  Other Errors ({len(other_errors)}):')
            for name, url, status in other_errors:
                self.stdout.write(self.style.WARNING(f'  • {name}: {status}'))

        # Final statistics
        total_tested = len(working_urls) + len(error_500_urls) + len(error_403_urls) + len(error_404_urls) + len(other_errors)
        self.stdout.write('\n' + '=' * 80)
        self.stdout.write(f'\n📈 Statistics:')
        self.stdout.write(f'  Total URLs tested: {total_tested}')
        self.stdout.write(self.style.SUCCESS(f'  ✅ Working: {len(working_urls)}'))
        self.stdout.write(self.style.ERROR(f'  ❌ 500 Errors: {len(error_500_urls)}'))
        self.stdout.write(f'  ⚠️  403 Forbidden: {len(error_403_urls)}')
        self.stdout.write(f'  ⚠️  404 Not Found: {len(error_404_urls)}')
        self.stdout.write(f'  ⚠️  Other Errors: {len(other_errors)}')
        self.stdout.write('=' * 80 + '\n')

        # Return appropriate exit code
        if error_500_urls:
            sys.exit(1)
        sys.exit(0)
