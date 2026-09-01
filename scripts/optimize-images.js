#!/usr/bin/env node
/**
 * Pipeline de otimização de imagens — DPS Gestão Imobiliária
 * -----------------------------------------------------------
 * Lê toda imagem de `media-fonte/` e gera, dentro de `images/`, três
 * variantes WebP (mobile / tablet / desktop) prontas para uso em
 * srcset, sem nunca alargar uma imagem além do tamanho original.
 *
 * Uso:
 *   npm run optimize-images          → processa tudo que estiver em media-fonte/ uma vez
 *   npm run optimize-images:watch    → como acima, mas continua rodando e observando novos arquivos
 *
 * Não mexe no HTML do site — só gera os arquivos de imagem. A troca dos
 * <img> por <picture>/srcset é um passo separado, propositalmente.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'media-fonte');
const OUT_DIR = path.join(ROOT, 'images');

// Três larguras — mobile / tablet / desktop — cobrindo os breakpoints do site (700px e 1024px).
const WIDTHS = [
  { label: 'mobile', width: 480 },
  { label: 'tablet', width: 1024 },
  { label: 'desktop', width: 1920 },
];

const QUALITY = 80;
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.gif']);
const SKIP_EXTENSIONS = new Set(['.svg', '.webp']); // vetor não precisa de raster; webp já otimizado não é reprocessado

function slugify(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function processImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const baseName = path.basename(filePath, ext);

  if (SKIP_EXTENSIONS.has(ext)) {
    console.log(`  ↷ ignorado (${ext} não precisa de conversão): ${path.basename(filePath)}`);
    return;
  }
  if (!VALID_EXTENSIONS.has(ext)) {
    console.log(`  ↷ ignorado (extensão não suportada): ${path.basename(filePath)}`);
    return;
  }

  const slug = slugify(baseName);
  const image = sharp(filePath);
  const metadata = await image.metadata();

  console.log(`\n▶ ${path.basename(filePath)} (${metadata.width}×${metadata.height}px original)`);

  for (const { label, width } of WIDTHS) {
    const outName = `${slug}-${width}w.webp`;
    const outPath = path.join(OUT_DIR, outName);

    // Nunca alarga além do tamanho original — se a imagem é menor que o alvo,
    // gera na maior largura possível (a original) em vez de esticar.
    const targetWidth = Math.min(width, metadata.width || width);

    await sharp(filePath)
      .resize({ width: targetWidth, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outPath);

    const { size } = fs.statSync(outPath);
    const kb = (size / 1024).toFixed(1);
    const note = targetWidth < width ? ` (original é menor que ${width}px, usado ${targetWidth}px)` : '';
    console.log(`  ✓ ${label.padEnd(7)} ${outName}  —  ${kb} KB${note}`);
  }
}

async function run() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`Pasta não encontrada: ${SRC_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(SRC_DIR).filter((f) => !f.startsWith('.'));
  if (files.length === 0) {
    console.log('media-fonte/ está vazia — nada para processar.');
    return;
  }

  console.log(`Processando ${files.length} arquivo(s) de media-fonte/ → images/ ...`);
  for (const file of files) {
    const fullPath = path.join(SRC_DIR, file);
    if (fs.statSync(fullPath).isDirectory()) continue;
    try {
      await processImage(fullPath);
    } catch (err) {
      console.error(`  ✗ erro ao processar ${file}: ${err.message}`);
    }
  }
  console.log('\nConcluído.');
}

function watch() {
  console.log(`Observando ${SRC_DIR} — adicione imagens ali que elas são otimizadas automaticamente.`);
  console.log('(Ctrl+C para parar)\n');
  run();

  let pending = new Set();
  let timer = null;
  fs.watch(SRC_DIR, (_eventType, filename) => {
    if (!filename || filename.startsWith('.')) return;
    pending.add(filename);
    clearTimeout(timer);
    // debounce: espera o arquivo terminar de ser copiado antes de processar
    timer = setTimeout(async () => {
      const toProcess = [...pending];
      pending = new Set();
      for (const file of toProcess) {
        const fullPath = path.join(SRC_DIR, file);
        if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) continue;
        try {
          await processImage(fullPath);
        } catch (err) {
          console.error(`  ✗ erro ao processar ${file}: ${err.message}`);
        }
      }
    }, 400);
  });
}

if (process.argv.includes('--watch')) {
  watch();
} else {
  run();
}
