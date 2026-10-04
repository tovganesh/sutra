#!/usr/bin/env node
/**
 * Sutra Enterprise Operating System - Unified Docker Management CLI
 * 
 * Provides unified lifecycle management for all Sutra Docker containers,
 * services, profiles, health probes, log streaming, and database seeding.
 * 
 * Usage:
 *   node scripts/sutra-docker.mjs <command> [options]
 *   ./sutra.ps1 <command> [options]
 *   ./sutra.sh <command> [options]
 * 
 * Commands:
 *   up | start           Start all containers (use --ai for Ollama LLM profile)
 *   down | stop          Stop all containers (use --clean / -v to wipe volumes)
 *   restart [service]    Restart all or specific service
 *   build [service]      Build or rebuild container images (supports --no-cache)
 *   rebuild              Rebuild and start all containers fresh
 *   ps | status          Show status, ports, and health of all Sutra containers
 *   logs [service]       Stream container logs (supports -f, --tail=N)
 *   health               Probe HTTP & TCP endpoints for all services
 *   seed [plain|demo]    Seed database with Platform Admin (plain) or full demo personas (demo)
 *   reset [plain|demo]   Full wipe & fresh rebuild + startup + database seed
 *   exec <service> <cmd> Run arbitrary command inside a service container
 */

import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import net from 'node:net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const command = (args[0] || 'help').toLowerCase();
const subArgs = args.slice(1);

function run(cmd, cmdArgs, options = {}) {
  return spawnSync(cmd, cmdArgs, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    ...options,
  });
}

function runAsync(cmd, cmdArgs) {
  const child = spawn(cmd, cmdArgs, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });
  return new Promise((resolve) => {
    child.on('close', (code) => resolve(code));
  });
}

function checkPort(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function checkHttp(url, timeoutMs = 2500) {
  return new Promise((resolve) => {
    try {
      const req = http.get(url, { timeout: timeoutMs }, (res) => {
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, status: 'TIMEOUT' });
      });
      req.on('error', (err) => {
        resolve({ ok: false, status: err.code || 'ERR' });
      });
    } catch (e) {
      resolve({ ok: false, status: 'ERR' });
    }
  });
}

async function showHealth() {
  console.log(`\n==================================================================`);
  console.log(`🩺 SUTRA ENTERPRISE OS - CONTAINER & SERVICE HEALTH PROBES`);
  console.log(`==================================================================\n`);

  const services = [
    { name: 'PostgreSQL 16 (pgvector)', type: 'tcp', host: 'localhost', port: 5432 },
    { name: 'MinIO Document Vault', type: 'http', url: 'http://localhost:9000/minio/health/live' },
    { name: 'Valkey In-Memory Cache', type: 'tcp', host: 'localhost', port: 6379 },
    { name: 'Sutra API Gateway', type: 'http', url: 'http://localhost:4000/api/v1/health' },
    { name: 'Sutra Web Cockpit', type: 'http', url: 'http://localhost:3000/' },
    { name: 'Ollama Sovereign LLM (Optional)', type: 'http', url: 'http://localhost:11434/api/tags' },
  ];

  for (const s of services) {
    if (s.type === 'tcp') {
      const open = await checkPort(s.host, s.port);
      const icon = open ? '🟢 [ONLINE]' : '🔴 [OFFLINE]';
      console.log(`  ${icon.padEnd(12)} ${s.name.padEnd(35)} Port: ${s.port}`);
    } else {
      const res = await checkHttp(s.url);
      const icon = res.ok ? '🟢 [ONLINE]' : '🔴 [OFFLINE]';
      const statusText = res.ok ? `HTTP ${res.status}` : (res.status === 'ECONNREFUSED' ? 'NOT RUNNING' : `HTTP ${res.status}`);
      console.log(`  ${icon.padEnd(12)} ${s.name.padEnd(35)} Status: ${statusText} (${s.url})`);
    }
  }
  console.log(`\n==================================================================\n`);
}

async function main() {
  const hasAiFlag = subArgs.includes('--ai') || subArgs.includes('--profile=local-ai');
  const profileArgs = hasAiFlag ? ['--profile', 'local-ai'] : [];

  switch (command) {
    case 'up':
    case 'start': {
      console.log(`\n🚀 Starting Sutra Enterprise Containers${hasAiFlag ? ' (with Local AI / Ollama profile)' : ''}...`);
      const composeArgs = ['compose', ...profileArgs, 'up', '-d', ...subArgs.filter((a) => !a.startsWith('--ai') && !a.startsWith('--profile'))];
      run('docker', composeArgs);
      console.log(`\nContainer launch requested. Probing service availability...\n`);
      await new Promise((r) => setTimeout(r, 2000));
      await showHealth();
      break;
    }

    case 'down':
    case 'stop': {
      const isClean = subArgs.includes('--clean') || subArgs.includes('-v');
      console.log(`\n🛑 Stopping Sutra Enterprise Containers${isClean ? ' (WIPING VOLUMES)' : ''}...`);
      const composeArgs = ['compose', '--profile', 'local-ai', 'down', ...subArgs.filter((a) => a !== '--clean')];
      run('docker', composeArgs);
      console.log(`✓ Containers stopped successfully.\n`);
      break;
    }

    case 'restart': {
      console.log(`\n🔄 Restarting Sutra Containers...`);
      const targetService = subArgs.filter((a) => !a.startsWith('-'))[0];
      const composeArgs = targetService
        ? ['compose', 'restart', targetService]
        : ['compose', '--profile', 'local-ai', 'restart'];
      run('docker', composeArgs);
      console.log(`✓ Restart complete.\n`);
      break;
    }

    case 'build': {
      console.log(`\n🔨 Building Sutra Container Images...`);
      const composeArgs = ['compose', 'build', ...subArgs];
      run('docker', composeArgs);
      console.log(`✓ Build complete.\n`);
      break;
    }

    case 'rebuild': {
      console.log(`\n🔨 Rebuilding and recreating Sutra Containers...`);
      const composeArgs = ['compose', ...profileArgs, 'up', '-d', '--build', ...subArgs.filter((a) => !a.startsWith('--ai'))];
      run('docker', composeArgs);
      console.log(`\nWaiting for containers to initialize...\n`);
      await new Promise((r) => setTimeout(r, 3000));
      await showHealth();
      break;
    }

    case 'ps':
    case 'status': {
      console.log(`\n📊 Sutra Docker Process Status:`);
      run('docker', ['compose', '--profile', 'local-ai', 'ps', '-a']);
      await showHealth();
      break;
    }

    case 'logs': {
      const composeArgs = ['compose', '--profile', 'local-ai', 'logs', ...subArgs];
      if (!subArgs.some((a) => a === '-f' || a === '--follow' || a.startsWith('--tail'))) {
        composeArgs.push('-f');
      }
      run('docker', composeArgs);
      break;
    }

    case 'health': {
      await showHealth();
      break;
    }

    case 'seed': {
      const mode = subArgs.includes('demo') ? 'demo' : 'plain';
      console.log(`\n🌱 Running Sutra Database Seeding in [${mode.toUpperCase()}] mode...`);
      const installScript = path.join(rootDir, 'scripts', 'install-system.mjs');
      run('node', [installScript, `--mode=${mode}`, ...subArgs.filter((a) => a !== 'demo' && a !== 'plain')]);
      break;
    }

    case 'reset': {
      const mode = subArgs.includes('demo') ? 'demo' : 'plain';
      console.log(`\n⚠️  FULL RESET REQUESTED`);
      console.log(`   1. Stopping containers and wiping volumes...`);
      run('docker', ['compose', '--profile', 'local-ai', 'down', '-v']);
      console.log(`   2. Rebuilding and starting containers...`);
      run('docker', ['compose', 'up', '-d', '--build']);
      console.log(`   3. Waiting for PostgreSQL 16 to become ready...`);
      let pgReady = false;
      for (let i = 0; i < 20; i++) {
        process.stdout.write('.');
        pgReady = await checkPort('localhost', 5432);
        if (pgReady) break;
        await new Promise((r) => setTimeout(r, 1500));
      }
      console.log(pgReady ? ' Ready!' : ' Timeout waiting for Postgres');
      console.log(`   4. Provisioning system in [${mode.toUpperCase()}] mode...`);
      const installScript = path.join(rootDir, 'scripts', 'install-system.mjs');
      run('node', [installScript, `--mode=${mode}`]);
      await showHealth();
      break;
    }

    case 'exec': {
      if (subArgs.length < 2) {
        console.error(`Usage: sutra exec <service> <command> [args...]`);
        console.error(`Example: sutra exec postgres psql -U sutra_admin -d sutra_db`);
        process.exit(1);
      }
      const [service, ...cmd] = subArgs;
      run('docker', ['compose', 'exec', service, ...cmd]);
      break;
    }

    case 'help':
    default: {
      console.log(`
==================================================================
🌟 SUTRA ENTERPRISE OS - UNIFIED DOCKER MANAGEMENT CLI
==================================================================
Usage:
  node scripts/sutra-docker.mjs <command> [options]
  ./sutra.ps1 <command> [options]
  ./sutra.sh <command> [options]

Commands:
  start | up [--ai]        Launch all containers (add --ai to include Ollama)
  stop | down [--clean]    Stop containers (--clean wipes data volumes)
  restart [service]        Restart all services or a specific container
  build [service]          Build container images (--no-cache supported)
  rebuild [--ai]           Rebuild images and restart containers
  status | ps              Display container statuses and active ports
  health                   Probe HTTP and TCP endpoints of all services
  logs [service] [-f]      Tail logs across all containers or specific service
  seed [plain|demo]        Seed database (plain: Super Admin only; demo: all personas)
  reset [plain|demo]       Full wipe of volumes, fresh rebuild, startup, and seed
  exec <service> <cmd...>  Run commands directly inside a running container

Examples:
  ./sutra.ps1 up
  ./sutra.ps1 rebuild
  ./sutra.ps1 status
  ./sutra.ps1 seed plain
  ./sutra.ps1 seed demo
  ./sutra.ps1 logs api -f
  ./sutra.ps1 exec postgres psql -U sutra_admin -d sutra_db
==================================================================
`);
      break;
    }
  }
}

main().catch((err) => {
  console.error('Fatal CLI error:', err);
  process.exit(1);
});
