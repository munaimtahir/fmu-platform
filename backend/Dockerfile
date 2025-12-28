FROM python:3.12-slim

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_ROOT_USER_ACTION=ignore \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       postgresql-client \
       build-essential \
       libpq-dev \
       curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --no-cache-dir --root-user-action=ignore -r requirements.txt \
    && pip install --no-cache-dir --root-user-action=ignore gunicorn==23.0.0

# Copy project
COPY . .

# Create directories for static and media files
RUN mkdir -p /app/static /app/media

# Collect static files (will be overridden by command in docker-compose)
# RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Default command (overridden in docker-compose)
CMD ["gunicorn", "sims_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
