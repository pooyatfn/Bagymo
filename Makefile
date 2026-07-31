# bagym.ir - developer Makefile
ENV ?= . .venv/bin/activate
PY ?= $(CURDIR)/venv/bin/python
WEB := $(CURDIR)/web

.PHONY: help install-dev migrate seed run-dev run-web test lint check

help:
	@echo "make install-dev   -> create venv + install deps"
	@echo "make migrate       -> run migrations"
	@echo "make seed          -> seed demo data"
	@echo "make run-dev       -> start Django API (localhost:8000)"
	@echo "make run-web       -> start Next.js frontend (localhost:3000)"
	@echo "make test          -> pytest"
	@echo "make lint          -> ruff + mypy (install ruff if missing)"
	@echo "make check         -> python manage.py check"

install-dev:
	python3 -m venv venv
	./venv/bin/pip install --upgrade pip setuptools wheel
	./venv/bin/pip install django djangorestframework djangorestframework-simplejwt \
		django-celery-beat celery redis python-dotenv kavenegar requests pytest pytest-django
	@command -v nvm >/dev/null && (export NVM_DIR="$$HOME/.nvm"; . $$NVM_DIR/nvm.sh; nvm install 20 >/dev/null; : ) || true

migrate:
	$(PY) manage.py migrate

seed:
	$(PY) manage.py migrate
	$(PY) manage.py seed_bagym

run-dev:
	$(PY) manage.py runserver 127.0.0.1:8000

run-web:
	cd $(WEB) && npx next dev -p 3000

test:
	$(PY) -m pytest -q

lint:
	@command -v ./venv/bin/ruff >/dev/null || ./venv/bin/pip install ruff
	./venv/bin/ruff check .
	check:
	$(PY) manage.py check
