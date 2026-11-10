# bagymo.ir — developer shortcuts. Run `make help` for the list.
PY  ?= $(CURDIR)/.venv/bin/python
WEB := $(CURDIR)/web

.PHONY: help install-dev install-web migrate seed run-dev run-web test lint check web-check

help:
	@echo "make install-dev   create .venv and install Python deps"
	@echo "make install-web   install frontend deps (web/)"
	@echo "make migrate       apply database migrations"
	@echo "make seed          migrate + load demo data"
	@echo "make run-dev       Django API on http://127.0.0.1:8000"
	@echo "make run-web       Next.js on http://localhost:3000"
	@echo "make test          run the pytest suite"
	@echo "make lint          ruff (Python) + eslint/tsc (web)"
	@echo "make check         django system checks"

install-dev:
	python3 -m venv .venv
	$(PY) -m pip install --upgrade pip setuptools wheel
	$(PY) -m pip install -r requirements.txt -r requirements-dev.txt

install-web:
	cd $(WEB) && npm ci

migrate:
	$(PY) manage.py migrate

seed: migrate
	$(PY) manage.py seed_bagymo

run-dev:
	$(PY) manage.py runserver 127.0.0.1:8000

run-web:
	cd $(WEB) && npm run dev -- -p 3000

test:
	$(PY) -m pytest -q

lint:
	$(PY) -m ruff check .
	cd $(WEB) && npm run lint && npm run typecheck

check:
	$(PY) manage.py check
