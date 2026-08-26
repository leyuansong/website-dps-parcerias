# DPS Gestão Imobiliária — Landing Page

Site institucional de página única para a DPS Gestão Imobiliária, empresa que faz a gestão de parcerias entre incorporadoras e imobiliárias.

## Stack

- HTML, CSS e JavaScript puros — sem framework, sem processo de build, sem dependências de pacotes.
- Fontes [Poppins](https://fonts.google.com/specimen/Poppins) e [Inter](https://fonts.google.com/specimen/Inter), carregadas via Google Fonts.
- Vídeos de fundo hospedados externamente (CloudFront).
- Animações e interações (scroll reveal, cursor customizado, fundo ambiente, partículas) escritas em JavaScript vanilla, sem bibliotecas.

## Estrutura

```
.
├── index.html                  # página única: todo o HTML, CSS e JS
├── images/
│   ├── logo-parceria-dps.jpg
│   ├── placeholder-avatar.svg
│   └── placeholder-team.svg
├── favicon.svg
├── robots.txt
└── .claude/
    └── launch.json              # configuração do servidor local de preview
```

## Rodando localmente

Qualquer servidor estático funciona. Com Python já instalado:

```bash
python -m http.server 5500
```

Depois acesse `http://localhost:5500`.

## Conteúdo pendente

Vários textos ainda têm placeholders entre colchetes (`[X]`, `[ano]`, `[Nome]`, `[Cargo]`, `[cidade/região]` etc.) — números de resultados, depoimentos, logos de parceiros e datas que precisam ser preenchidos com dados reais antes da publicação final.

## Deploy

Por ser um site estático de página única, pode ser publicado em qualquer serviço de hospedagem estática (Netlify, Vercel, GitHub Pages, Cloudflare Pages etc.) apontando para `index.html` na raiz — não há etapa de build.
