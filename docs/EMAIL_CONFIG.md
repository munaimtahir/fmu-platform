# Email Configuration Guide

## Overview

FMU SIMS supports email delivery for various features including:
- Password reset requests
- Account notifications
- Document request notifications
- System alerts

## Configuration

Email settings are configured via environment variables in the `.env` file.

### Development/Testing (Console Backend)

For development and testing, emails are printed to the console:

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

This is the default setting. No additional configuration needed.

### Production (SMTP Backend)

For production deployment with actual email delivery, configure SMTP:

```env
# Email Backend
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend

# SMTP Server Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True

# Authentication
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-app-specific-password

# Default sender
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

## Popular Email Providers

### Gmail

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App-Specific Password:
   - Go to https://myaccount.google.com/security
   - Under "Signing in to Google", select "App passwords"
   - Generate a password for "Mail"
3. Use the generated password in `EMAIL_HOST_PASSWORD`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

### SendGrid

```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=your-sendgrid-api-key
```

### AWS SES

```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-ses-smtp-username
EMAIL_HOST_PASSWORD=your-ses-smtp-password
```

### Mailgun

```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=postmaster@your-domain.mailgun.org
EMAIL_HOST_PASSWORD=your-mailgun-password
```

## Testing Email Configuration

You can test email configuration using Django's management command:

```bash
# From within the backend container or virtual environment
python manage.py shell

# Then run:
from django.core.mail import send_mail

send_mail(
    'Test Email',
    'This is a test email from FMU SIMS.',
    'noreply@sims.edu',
    ['recipient@example.com'],
    fail_silently=False,
)
```

If using console backend, the email will appear in the console/logs.
If using SMTP backend, the email will be sent to the recipient.

## Troubleshooting

### Common Issues

1. **Authentication failed**
   - Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are correct
   - For Gmail, ensure you're using an App Password, not your regular password
   - Check if 2FA is enabled (required for Gmail)

2. **Connection timeout**
   - Verify EMAIL_HOST and EMAIL_PORT are correct
   - Check firewall settings
   - Ensure EMAIL_USE_TLS is set correctly

3. **Emails not sending**
   - Check Django logs for error messages
   - Verify FROM email address is authorized by your email provider
   - Check spam folder on recipient side

### Debug Mode

To see detailed email debug information, add to your `.env`:

```env
DJANGO_DEBUG=True
```

Then check the console/logs for detailed SMTP communication.

## Security Best Practices

1. **Never commit credentials**
   - Keep `.env` file in `.gitignore`
   - Use environment variables for sensitive data

2. **Use App-Specific Passwords**
   - Don't use your main account password
   - Generate app-specific passwords for services

3. **Limit Permissions**
   - Use email accounts dedicated to application use
   - Don't use personal email accounts

4. **Enable TLS**
   - Always use EMAIL_USE_TLS=True for secure connections
   - Use port 587 for TLS

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| EMAIL_BACKEND | Django email backend class | console.EmailBackend | No |
| EMAIL_HOST | SMTP server hostname | smtp.gmail.com | Yes (for SMTP) |
| EMAIL_PORT | SMTP server port | 587 | Yes (for SMTP) |
| EMAIL_USE_TLS | Use TLS encryption | True | Yes (for SMTP) |
| EMAIL_HOST_USER | SMTP username | (empty) | Yes (for SMTP) |
| EMAIL_HOST_PASSWORD | SMTP password | (empty) | Yes (for SMTP) |
| DEFAULT_FROM_EMAIL | Default sender address | noreply@sims.edu | No |

## Production Deployment

For production, ensure:

1. Set `EMAIL_BACKEND` to SMTP backend
2. Configure all SMTP settings
3. Use a reliable email service provider
4. Monitor email delivery logs
5. Set up SPF, DKIM, and DMARC records for your domain

## Additional Resources

- [Django Email Documentation](https://docs.djangoproject.com/en/stable/topics/email/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
