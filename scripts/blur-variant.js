#!/usr/bin/env node
/**
 * Gera variantes com leve borrão ("soft focus") de imagens já otimizadas em images/,
 * para uso como fundo atmosférico atrás de legenda ou em cards de destaque.
 *
 * Parte dos arquivos WebP que `optimize-images.js` já gerou (não recomprime a partir
 * da origem) e produz `<slug>-<largura>w-blur.webp` ao lado de cada um.
 *
 * Uso:
 *   node scripts/blur-variant.js <slug1> [<slug2> ...]
 *   npm run blur-variant -- equipe-comemoracao-reserva-perfetto
 *
 * Sigma fixo em 1.8 — de propósito leve. Uma primeira versão usava sigma proporcional
 * à largura (chegando a ~13.7 nas variantes desktop), o que deixava as fotos
 * praticamente ilegíveis. 1.8 dá só uma textura de "fundo", sem destruir rostos,
 * placas e letreiros — testado visualmente contra 1.2/1.8/2.5/3.5 antes de fixar aqui.
 * Se algum caso de uso futuro precisar de mais borrão, ajuste a constante abaixo — não
 * calcule em função da largura de novo.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');
const WIDTHS = [480, 1024, 1920];
const SIGMA = 1.8;
const QUALITY = 85;

async function run() {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.error('Uso: node scripts/blur-variant.js <slug1> [<slug2> ...]');
    console.error('(o slug é o nome do arquivo em images/ sem "-<largura>w.webp")');
    process.exit(1);
  }

  for (const slug of slugs) {
    console.log(`\n▶ ${slug}`);
    for (const w of WIDTHS) {
      const input = path.join(IMAGES_DIR, `${slug}-${w}w.webp`);
      const output = path.join(IMAGES_DIR, `${slug}-${w}w-blur.webp`);
      if (!fs.existsSync(input)) {
        console.warn(`  ↷ não encontrado, pulei: ${path.basename(input)}`);
        continue;
      }
      await sharp(input).blur(SIGMA).webp({ quality: QUALITY }).toFile(output);
      const { size } = fs.statSync(output);
      console.log(`  ✓ ${path.basename(output)} — ${(size / 1024).toFixed(1)} KB (sigma ${SIGMA})`);
    }
  }
  console.log('\nConcluído.');
}

run();
