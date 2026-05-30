import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const backendRoot = join(repoRoot, '..', '..', 'flexboot4');

const modules = [
  {
    name: 'admin',
    packagePath: 'packages/business/admin-web',
    starterPath: 'flexboot4-admin-starter',
  },
  {
    name: 'cms',
    packagePath: 'packages/business/cms-web',
    starterPath: 'flexboot4-cms-starter',
  },
  {
    name: 'media',
    packagePath: 'packages/business/media-web',
    starterPath: 'flexboot4-media-starter',
  },
  {
    name: 'sms4j',
    packagePath: 'packages/business/sms4j-web',
    starterPath: 'flexboot4-sms4j-starter',
  },
  {
    name: 'kb',
    packagePath: 'packages/business/kb-web',
    starterPath: 'flexboot4-kb-starter',
  },
];

function walkVueFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkVueFiles(fullPath, files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(fullPath);
    }
  }
  return files;
}

function normalizeComponentPath(path) {
  if (!path || path === 'BasicLayout' || path === 'IFrameView') {
    return null;
  }
  if (!path.startsWith('/')) {
    return null;
  }
  return path.endsWith('.vue') ? path.slice(0, -4) : path;
}

function extractSqlComponents(sqlPath) {
  const sql = readFileSync(sqlPath, 'utf8');
  const components = new Set();
  const regex =
    /(?:VALUES\s*)?\([^;]*?'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'/gims;
  for (const match of sql.matchAll(regex)) {
    const component = normalizeComponentPath(match[5]);
    if (component) {
      components.add(component);
    }
  }
  return [...components].toSorted();
}

function collectPageKeys(packagePath) {
  const viewsDir = join(repoRoot, packagePath, 'src', 'views');
  return new Set(
    walkVueFiles(viewsDir)
      .map(
        (file) =>
          `/${relative(viewsDir, file)
            .replaceAll('\\', '/')
            .replace(/\.vue$/, '')}`,
      )
      .toSorted(),
  );
}

const missing = [];

for (const module of modules) {
  const sqlPath = join(
    backendRoot,
    module.starterPath,
    'src',
    'main',
    'resources',
    'db',
    'menu_data.sql',
  );
  if (!existsSync(sqlPath)) {
    missing.push(`${module.name}: missing ${sqlPath}`);
    continue;
  }

  const pageKeys = collectPageKeys(module.packagePath);
  for (const component of extractSqlComponents(sqlPath)) {
    if (!pageKeys.has(component)) {
      missing.push(`${module.name}: ${component}`);
    }
  }
}

if (missing.length > 0) {
  console.error('FlexBoot route contract check failed:');
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log('FlexBoot route contract check passed.');
