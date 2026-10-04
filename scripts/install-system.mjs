#!/usr/bin/env node
/**
 * Sutra Enterprise Operating System - System Installation & Provisioning Engine
 * 
 * Usage:
 *   node scripts/install-system.mjs --mode=plain [options]
 *   node scripts/install-system.mjs --mode=demo [options]
 * 
 * Options:
 *   --mode=<plain|demo>       Installation mode (plain: super admin only, demo: all personas)
 *   --admin-email=<email>     Platform Super Admin email (default: admin@sutra.local)
 *   --admin-password=<pwd>    Platform Super Admin password (default: admin123)
 *   --org-name=<name>         Client organization legal name
 *   --org-admin-email=<email> Organization Administrator email (demo default: org.admin@enterprise.in)
 *   --org-admin-password=<p>  Organization Administrator password (demo default: orgadmin123)
 *   --reset                   Wipe existing records before seeding
 *   --database-url=<url>      PostgreSQL connection URL
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Parse CLI Flags
const args = process.argv.slice(2);
function getArg(key, fallback) {
  const match = args.find((a) => a.startsWith(`--${key}=`));
  if (match) return match.split('=')[1];
  const idx = args.indexOf(`--${key}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return fallback;
}
const hasFlag = (key) => args.includes(`--${key}`);

const mode = getArg('mode', process.env.SUTRA_INSTALL_MODE || 'plain').toLowerCase();
const adminEmail = getArg('admin-email', process.env.SUPERADMIN_EMAIL || 'admin@sutra.local').trim().toLowerCase();
const adminPassword = getArg('admin-password', process.env.SUPERADMIN_PASSWORD || 'admin123');
const orgName = getArg('org-name', mode === 'demo' ? 'Bharat Tech Manufacturing Ltd' : 'Client Organization');
const orgAdminEmail = getArg('org-admin-email', 'org.admin@enterprise.in').trim().toLowerCase();
const orgAdminPassword = getArg('org-admin-password', 'orgadmin123');
const isReset = hasFlag('reset') || process.env.SUTRA_RESET === 'true';
const dbUrl = getArg('database-url', process.env.DATABASE_URL || 'postgresql://sutra_admin:sutra_secure_pass@localhost:5432/sutra_db');

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const SUPERADMIN_ROLE_ID = '00000000-0000-0000-0000-000000000010';
const ORGADMIN_ROLE_ID = '00000000-0000-0000-0000-000000000011';

async function runInstallation() {
  console.log(`\n==================================================================`);
  console.log(`🚀 SUTRA ENTERPRISE OS - SYSTEM INSTALLATION ENGINE`);
  console.log(`==================================================================`);
  console.log(`Target Mode:        ${mode.toUpperCase()}`);
  console.log(`Super Admin Email:  ${adminEmail}`);
  console.log(`Organization Name:  ${orgName}`);
  console.log(`Database URL:       ${dbUrl.replace(/:[^:@]*@/, ':****@')}`);
  console.log(`==================================================================\n`);

  const pool = new pg.Pool({ connectionString: dbUrl });

  try {
    const client = await pool.connect();
    console.log(`✓ Connected to PostgreSQL 16 database successfully`);

    // 1. Verify schema tables exist; if not, execute 01-init.sql
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users';
    `);

    if (tableCheck.rows.length === 0) {
      console.log(`⚡ Core tables not found. Executing 01-init.sql schema migrations...`);
      const initSqlPath = path.join(rootDir, 'docker', 'postgres-init', '01-init.sql');
      if (fs.existsSync(initSqlPath)) {
        const initSql = fs.readFileSync(initSqlPath, 'utf8');
        await client.query(initSql);
        console.log(`✓ Core database schema initialized successfully`);
      }
    } else {
      console.log(`✓ Core database schema verified`);
    }

    // 2. Handle Reset if requested
    if (isReset) {
      console.log(`🧹 Reset flag detected. Cleaning previous records...`);
      await client.query(`DELETE FROM user_roles;`);
      await client.query(`DELETE FROM users;`);
      console.log(`✓ Previous users and session records cleared`);
    }

    // 3. Ensure Default Tenant Exists
    await client.query(`
      INSERT INTO tenants (id, name, code, country, base_currency, is_active)
      VALUES ($1, $2, 'DEFAULT_ORG', 'IN', 'INR', true)
      ON CONFLICT (id) DO UPDATE SET name = $2;
    `, [DEFAULT_TENANT_ID, orgName]);
    console.log(`✓ Tenant verified: ${orgName} (${DEFAULT_TENANT_ID})`);

    // 4. Ensure Roles Exist
    await client.query(`
      INSERT INTO roles (id, tenant_id, name, description, is_system)
      VALUES ($1, $2, 'EnterpriseAdministrator', 'Full platform superadmin authority', true)
      ON CONFLICT (id) DO NOTHING;
    `, [SUPERADMIN_ROLE_ID, DEFAULT_TENANT_ID]);

    await client.query(`
      INSERT INTO roles (id, tenant_id, name, description, is_system)
      VALUES ($1, $2, 'OrgAdministrator', 'Tenant-level organizational administrator', true)
      ON CONFLICT (id) DO NOTHING;
    `, [ORGADMIN_ROLE_ID, DEFAULT_TENANT_ID]);

    // 5. Seed Platform Super Administrator (Always seeded)
    const saltRounds = 10;
    const adminHash = await bcrypt.hash(adminPassword, saltRounds);

    const superAdminRes = await client.query(`
      INSERT INTO users (id, tenant_id, email, password_hash, full_name, designation, department, is_active, is_superadmin)
      VALUES (
        '00000000-0000-0000-0000-000000000020',
        $1, $2, $3, 'Platform Super Administrator', 'Chief Architect', 'Platform Setup & Administration', true, true
      )
      ON CONFLICT (tenant_id, email) DO UPDATE SET 
        password_hash = $3,
        is_superadmin = true,
        is_active = true
      RETURNING id, email, full_name;
    `, [DEFAULT_TENANT_ID, adminEmail, adminHash]);

    const adminUserId = superAdminRes.rows[0].id;

    await client.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING;
    `, [adminUserId, SUPERADMIN_ROLE_ID]);

    console.log(`✓ Platform Super Administrator seeded: ${adminEmail}`);

    // 6. Mode-Specific Provisioning
    if (mode === 'plain') {
      console.log(`\n🔒 PLAIN INSTALLATION MODE:`);
      console.log(`   - ONLY the Platform Super Administrator is seeded.`);
      console.log(`   - No demo users or sample transactions have been added.`);
      console.log(`   - Platform Super Admin must log in to configure modules and provision the Org Admin.`);
    } else {
      console.log(`\n✨ DEMO INSTALLATION MODE: Provisioning complete business personas...`);

      // 6.1 Provision Demo Organization Administrator
      const orgAdminHash = await bcrypt.hash(orgAdminPassword, saltRounds);
      const orgAdminRes = await client.query(`
        INSERT INTO users (id, tenant_id, email, password_hash, full_name, designation, department, is_active, is_superadmin)
        VALUES (
          '00000000-0000-0000-0000-000000000021',
          $1, $2, $3, 'Vikramaditya Singhania', 'Organization Administrator', 'Corporate Operations', true, false
        )
        ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = $3, is_active = true
        RETURNING id, email, full_name;
      `, [DEFAULT_TENANT_ID, orgAdminEmail, orgAdminHash]);

      await client.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING;
      `, [orgAdminRes.rows[0].id, ORGADMIN_ROLE_ID]);
      console.log(`   ✓ Org Administrator seeded: ${orgAdminEmail}`);

      // 6.2 Seed Functional Personas
      const personas = [
        {
          id: '00000000-0000-0000-0000-000000000022',
          email: 'finance.lead@sutra.local',
          password: 'finance123',
          name: 'Anita Desai',
          designation: 'VP Finance & Controller',
          department: 'Corporate Finance',
        },
        {
          id: '00000000-0000-0000-0000-000000000023',
          email: 'sc.director@sutra.local',
          password: 'supply123',
          name: 'Vikram Mehta',
          designation: 'Supply Chain Director',
          department: 'Global Supply Chain',
        },
        {
          id: '00000000-0000-0000-0000-000000000024',
          email: 'auditor@sutra.local',
          password: 'audit123',
          name: 'Sunil Kulkarni',
          designation: 'Chief Internal Auditor',
          department: 'Internal Audit & Governance',
        },
      ];

      for (const p of personas) {
        const pHash = await bcrypt.hash(p.password, saltRounds);
        await client.query(`
          INSERT INTO users (id, tenant_id, email, password_hash, full_name, designation, department, is_active, is_superadmin)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, false)
          ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = $4, is_active = true;
        `, [p.id, DEFAULT_TENANT_ID, p.email, pHash, p.name, p.designation, p.department]);
        console.log(`   ✓ Functional persona seeded: ${p.email} (${p.designation})`);
      }
    }

    client.release();
    await pool.end();

    // Summary Report
    console.log(`\n==================================================================`);
    console.log(`✅ SUTRA INSTALLATION COMPLETED SUCCESSFULLY`);
    console.log(`==================================================================`);
    console.log(`Web Cockpit URL:    http://localhost:3000`);
    console.log(`API Gateway URL:    http://localhost:4000`);
    console.log(`Platform Admin:     ${adminEmail} (pwd: ${adminPassword})`);
    if (mode === 'demo') {
      console.log(`Org Administrator:  ${orgAdminEmail} (pwd: ${orgAdminPassword})`);
      console.log(`VP Finance / CFO:   finance.lead@sutra.local (pwd: finance123)`);
      console.log(`Supply Chain Lead:  sc.director@sutra.local (pwd: supply123)`);
      console.log(`Internal Auditor:   auditor@sutra.local (pwd: audit123)`);
    } else {
      console.log(`\n👉 NEXT STEP FOR CLIENT DEPLOYMENT:`);
      console.log(`   1. Open http://localhost:3000`);
      console.log(`   2. Sign in as Platform Super Admin: ${adminEmail}`);
      console.log(`   3. Navigate to "Platform Admin" to configure client profile,`);
      console.log(`      select licensed modules, and provision the Org Admin.`);
    }
    console.log(`==================================================================\n`);
  } catch (err) {
    console.error(`\n❌ Installation failed with error:`, err.message);
    if (pool) await pool.end();
    process.exit(1);
  }
}

runInstallation();
