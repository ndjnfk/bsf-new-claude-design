# Starts the portable MariaDB used for local development (loopback only, port 3306).
# MongoDB and Redis are expected to already be running as local services.
# The data lives in .localdb\data and persists between runs.
$ErrorActionPreference = 'Stop'
$base = Join-Path $PSScriptRoot '.localdb\mariadb-10.11.9-winx64'
$data = Join-Path $PSScriptRoot '.localdb\data'
if (-not (Test-Path $base)) { throw "MariaDB not found in .localdb — re-run the setup." }
Write-Host "Starting MariaDB on 127.0.0.1:3306 ... (Ctrl+C to stop)"
& "$base\bin\mysqld.exe" --no-defaults --basedir="$base" --datadir="$data" --port=3306 --bind-address=127.0.0.1 --console
