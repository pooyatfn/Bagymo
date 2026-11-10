# Offline Python packages for the Docker build

If PyPI is slow or unreachable inside Docker, fill this folder from your machine
(where pip already works) and the backend image installs from here offline:

    .venv/bin/pip wheel -w wheels -r requirements.txt

Re-run it after changing requirements.txt. Folder contents (except this file) are git-ignored.
