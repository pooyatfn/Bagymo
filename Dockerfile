FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
# No apt step: psycopg2-binary and the other deps install from pre-built wheels
# (deb.debian.org is slow/unreachable from some networks).

FROM base AS dependencies
COPY requirements.txt .
# If ./wheels has packages (see wheels/README.md) install offline, otherwise use PyPI.
COPY wheels/ /tmp/wheels/
RUN if ls /tmp/wheels/*.whl >/dev/null 2>&1; then \
        pip install --no-cache-dir --no-index --find-links /tmp/wheels -r requirements.txt; \
    else \
        pip install --no-cache-dir -r requirements.txt; \
    fi \
    && rm -rf /tmp/wheels

FROM dependencies AS runtime
COPY . .
RUN rm -rf wheels
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
