<#
.SYNOPSIS
Sutra Enterprise Operating System - Docker Management CLI Wrapper

.DESCRIPTION
Unified control script for running, building, status reporting, log streaming,
and provisioning Sutra containers.

.EXAMPLE
./sutra.ps1 up
./sutra.ps1 rebuild
./sutra.ps1 status
./sutra.ps1 seed plain
./sutra.ps1 seed demo
./sutra.ps1 logs api
#>

param(
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DockerCLI = Join-Path $ScriptDir "scripts\sutra-docker.mjs"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is required but was not found in PATH."
    exit 1
}

if ($Arguments.Count -eq 0) {
    node $DockerCLI help
} else {
    node $DockerCLI @Arguments
}
