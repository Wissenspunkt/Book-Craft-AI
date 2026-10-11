import { BookProject } from '../types';

/**
 * Formats bibliography entries into a clean citations string
 */
export function formatBibliographyText(project: BookProject): string {
  if (!project.bibliography || project.bibliography.length === 0) {
    return 'Keine Quellen im Verzeichnis vorhanden.';
  }

  return project.bibliography
    .map((src, idx) => {
      switch (project.citationStyle) {
        case 'APA':
          return `[${idx + 1}] ${src.author} (${src.year}). ${src.title}. ${src.publisher}.${src.url ? ` URL: ${src.url}` : ''}`;
        case 'MLA':
          return `[${idx + 1}] ${src.author}. "${src.title}." ${src.publisher}, ${src.year}.${src.url ? ` ${src.url}` : ''}`;
        case 'Harvard':
          return `[${idx + 1}] ${src.author} (${src.year}) '${src.title}', ${src.publisher}.${src.url ? ` Available at: ${src.url}` : ''}`;
        case 'Chicago':
          return `[${idx + 1}] ${src.author}. ${src.title}. ${src.publisher}, ${src.year}.`;
        case 'IEEE':
          return `[${idx + 1}] ${src.author}, "${src.title}," ${src.publisher}, ${src.year}.`;
        default:
          return `[${idx + 1}] ${src.author} (${src.year}): ${src.title}. ${src.publisher}`;
      }
    })
    .join('\n\n');
}

/**
 * TXT Export: Markdown/Plaintext export with Klappentext, Vorwort, Inhaltsverzeichnis, Fazit, Quellen
 */
export function exportToTxt(project: BookProject) {
  let content = `${project.title}\n`;
  if (project.subtitle) content += `${project.subtitle}\n`;
  content += `Autor: ${project.author}\n`;
  content += `Genre: ${project.genre} | Stil: ${project.style}\n`;
  content += `Zitationsstil: ${project.citationStyle}\n`;
  content += `=========================================\n\n`;

  if (project.blurb) {
    content += `KLAPPENTEXT:\n${project.blurb}\n\n`;
    content += `-----------------------------------------\n\n`;
  }

  content += `INHALTSVERZEICHNIS:\n`;
  if (project.foreword) content += `• Vorwort\n`;
  project.chapters.forEach((chap) => {
    content += `• Kapitel ${chap.chapterNumber}: ${chap.title}\n`;
  });
  if (project.conclusion) content += `• Fazit & Schlusswort\n`;
  content += `• Quellverzeichnis (${project.citationStyle})\n\n`;
  content += `-----------------------------------------\n\n`;

  if (project.foreword) {
    content += `VORWORT:\n\n${project.foreword}\n\n`;
    content += `-----------------------------------------\n\n`;
  }

  project.chapters.forEach((chap) => {
    content += `KAPITEL ${chap.chapterNumber}: ${chap.title}\n\n`;
    if (chap.summary) content += `Kapitelübersicht: ${chap.summary}\n\n`;
    content += `${chap.content || '[Kapitel noch nicht verfasst]'}\n\n`;
    content += `-----------------------------------------\n\n`;
  });

  if (project.conclusion) {
    content += `FAZIT & SCHLUSSWORT:\n\n${project.conclusion}\n\n`;
    content += `-----------------------------------------\n\n`;
  }

  content += `QUELLENVERZEICHNIS (${project.citationStyle}):\n\n`;
  content += formatBibliographyText(project);

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_Book.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Kindle HTML / MOBI compatible Export
 */
export function exportToKindle(project: BookProject) {
  let html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${project.title}</title>
  <style>
    body { font-family: "Georgia", "Charis SIL", serif; line-height: 1.6; margin: 5%; color: #111; }
    h1.title { text-align: center; font-size: 2em; margin-top: 15%; margin-bottom: 10px; }
    h2.subtitle { text-align: center; font-size: 1.2em; font-weight: normal; color: #444; margin-bottom: 20px; }
    .author { text-align: center; font-style: italic; font-size: 1.1em; margin-bottom: 30px; }
    .blurb-box { background: #f4f4f6; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; font-style: italic; }
    .toc { margin-top: 30px; margin-bottom: 50px; }
    .toc h2 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    .toc ul { list-style-type: none; padding-left: 0; }
    .toc li { margin-bottom: 10px; }
    .toc a { text-decoration: none; color: #0066cc; font-weight: 500; }
    .chapter { margin-top: 20px; }
    .chapter-title { font-size: 1.6em; border-bottom: 2px solid #333; padding-bottom: 8px; margin-top: 30px; }
    .illustration { text-align: center; margin: 25px 0; }
    .illustration img { max-width: 100%; height: auto; border-radius: 4px; }
    blockquote { border-left: 3px solid #666; padding-left: 12px; margin-left: 0; font-style: italic; color: #333; }
    .mbp-pagebreak { page-break-after: always; display: block; height: 1px; }
    .biblio { margin-top: 50px; }
  </style>
</head>
<body>

  <!-- COVER / TITLE PAGE -->
  <h1 class="title">${project.title}</h1>
  ${project.subtitle ? `<h2 class="subtitle">${project.subtitle}</h2>` : ''}
  <p class="author">von ${project.author}</p>
  
  ${project.blurb ? `<div class="blurb-box"><strong>Klappentext:</strong><br/>${project.blurb.replace(/\n/g, '<br/>')}</div>` : ''}

  <div class="mbp-pagebreak"></div>

  <!-- TABLE OF CONTENTS WITH DIRECT LINKS -->
  <div class="toc" id="inhaltsverzeichnis">
    <h2>Inhaltsverzeichnis</h2>
    <ul>
      ${project.foreword ? `<li><a href="#vorwort">&bull; Vorwort</a></li>` : ''}
      ${project.chapters.map(c => `<li><a href="#chap_${c.chapterNumber}">Kapitel ${c.chapterNumber}: ${c.title}</a></li>`).join('')}
      ${project.conclusion ? `<li><a href="#fazit">&bull; Fazit & Schlusswort</a></li>` : ''}
      <li><a href="#quellverzeichnis">&bull; Quellverzeichnis (${project.citationStyle}) &rarr;</a></li>
    </ul>
  </div>

  <div class="mbp-pagebreak"></div>

  <!-- FOREWORD -->
  ${project.foreword ? `
    <div className="chapter" id="vorwort">
      <h2 className="chapter-title">Vorwort</h2>
      <div>${project.foreword.replace(/\n\n/g, '</p><p>')}</div>
    </div>
    <div className="mbp-pagebreak"></div>
  ` : ''}

  <!-- CHAPTERS -->
  ${project.chapters.map(c => `
    <div class="chapter" id="chap_${c.chapterNumber}">
      <h2 class="chapter-title">Kapitel ${c.chapterNumber}: ${c.title}</h2>
      ${c.illustrationUrl ? `<div class="illustration"><img src="${c.illustrationUrl}" alt="Illustration ${c.title}" /></div>` : ''}
      <div>${(c.content || '<em>Kapitelinhalt in Erstellung.</em>').replace(/\n\n/g, '</p><p>').replace(/## (.*)/g, '<h3>$1</h3>')}</div>
    </div>
    <div class="mbp-pagebreak"></div>
  `).join('')}

  <!-- CONCLUSION -->
  ${project.conclusion ? `
    <div class="chapter" id="fazit">
      <h2 class="chapter-title">Fazit & Schlusswort</h2>
      <div>${project.conclusion.replace(/\n\n/g, '</p><p>')}</div>
    </div>
    <div class="mbp-pagebreak"></div>
  ` : ''}

  <!-- BIBLIOGRAPHY WITH BACK LINK -->
  <div class="biblio" id="quellverzeichnis">
    <h2>Quellverzeichnis (${project.citationStyle})</h2>
    <p><a href="#inhaltsverzeichnis" style="font-size:0.9em; color:#0066cc;">&larr; Zurück zum Inhaltsverzeichnis</a></p>
    <pre style="white-space: pre-wrap; font-family: inherit; margin-top:15px;">${formatBibliographyText(project)}</pre>
  </div>

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_Kindle.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * EPUB Export
 */
export function exportToEpub(project: BookProject) {
  let fullEpubText = `=== EPUB 3.0 BUNDLE PACKAGE ===\n\n`;
  fullEpubText += `Title: ${project.title}\nAuthor: ${project.author}\nLanguage: de\n\n`;

  if (project.blurb) {
    fullEpubText += `[blurb.xhtml]\n<h1>Klappentext</h1>\n${project.blurb}\n\n`;
  }

  fullEpubText += `[toc.xhtml]\n<h1>Inhaltsverzeichnis</h1>\n`;
  if (project.foreword) fullEpubText += `- <a href="#vorwort">Vorwort</a>\n`;
  project.chapters.forEach(c => {
    fullEpubText += `- <a href="#chap_${c.chapterNumber}">Kapitel ${c.chapterNumber}: ${c.title}</a>\n`;
  });
  if (project.conclusion) fullEpubText += `- <a href="#fazit">Fazit & Schlusswort</a>\n`;
  fullEpubText += `- <a href="#quellverzeichnis">Quellverzeichnis</a>\n\n`;

  if (project.foreword) {
    fullEpubText += `[foreword.xhtml]\n<h1>Vorwort</h1>\n${project.foreword}\n\n`;
  }

  project.chapters.forEach((c) => {
    fullEpubText += `[chap_${c.chapterNumber}.xhtml]\n`;
    fullEpubText += `<h1>Kapitel ${c.chapterNumber}: ${c.title}</h1>\n`;
    fullEpubText += `${c.content}\n\n`;
  });

  if (project.conclusion) {
    fullEpubText += `[conclusion.xhtml]\n<h1>Fazit & Schlusswort</h1>\n${project.conclusion}\n\n`;
  }

  fullEpubText += `[biblio.xhtml]\n<h1 id="quellverzeichnis">Quellverzeichnis</h1>\n`;
  fullEpubText += formatBibliographyText(project);

  const blob = new Blob([fullEpubText], { type: 'application/epub+zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}.epub`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * PDF Export (High Quality Print-ready rendering with Table of Contents & Anchors)
 */
export function exportToPdf(project: BookProject) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Bitte erlauben Sie Popups, um die PDF-Druckansicht zu öffnen.');
    return;
  }

  const printHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>${project.title} - PDF Export</title>
  <style>
    @page { size: A4; margin: 2.5cm; }
    body { font-family: 'Source Serif 4', Georgia, serif; line-height: 1.7; color: #1e293b; font-size: 11pt; }
    .cover { height: 90vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; }
    .cover-title { font-family: 'Cinzel', serif; font-size: 28pt; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
    .cover-subtitle { font-size: 14pt; color: #475569; font-weight: 400; margin-bottom: 30px; }
    .cover-author { font-size: 12pt; font-weight: 600; color: #1e293b; margin-bottom: 20px; }
    .cover-img { max-width: 75%; max-height: 320px; border-radius: 8px; margin-bottom: 20px; object-fit: cover; }
    .blurb-card { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; text-align: left; max-width: 90%; font-style: italic; color: #334155; }
    .page-break { page-break-after: always; }
    .toc { margin: 40px 0; }
    .toc h2 { font-family: 'Cinzel', serif; border-bottom: 2px solid #0f172a; padding-bottom: 5px; }
    .toc-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 11pt; text-decoration: none; color: #0f172a; }
    .toc-item a { text-decoration: none; color: #0f172a; font-weight: 500; }
    .toc-item a:hover { color: #2563eb; }
    .chapter { margin-top: 30px; }
    .chapter-header { font-family: 'Cinzel', serif; font-size: 18pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; color: #0f172a; margin-top: 20px; }
    .illustration { text-align: center; margin: 20px 0; }
    .illustration img { max-width: 100%; max-height: 320px; border-radius: 6px; }
    h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif; color: #334155; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; margin-left: 0; color: #334155; font-style: italic; background: #f8fafc; padding: 10px 16px; border-radius: 0 6px 6px 0; }
    .biblio { margin-top: 40px; }
    .biblio-entry { margin-bottom: 12px; font-size: 10pt; text-indent: -20px; padding-left: 20px; }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="position: fixed; top: 15px; right: 15px; background: #0f172a; color: white; padding: 12px 20px; border-radius: 8px; font-family: sans-serif; z-index: 9999; display: flex; gap: 10px; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
    <span>PDF-Export Vorschau</span>
    <button onclick="window.print()" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">Als PDF drucken / speichern</button>
  </div>

  <!-- COVER PAGE -->
  <div class="cover">
    ${project.coverImage ? `<img src="${project.coverImage}" class="cover-img" alt="Cover" />` : ''}
    <div class="cover-title">${project.title}</div>
    ${project.subtitle ? `<div class="cover-subtitle">${project.subtitle}</div>` : ''}
    <div class="cover-author">von ${project.author}</div>
    ${project.blurb ? `<div class="blurb-card"><strong>Klappentext:</strong><br/>${project.blurb.replace(/\n/g, '<br/>')}</div>` : ''}
    <div style="margin-top: 20px; font-size: 9pt; color: #94a3b8;">Format: ${project.genre} &bull; Zitationsstil: ${project.citationStyle}</div>
  </div>

  <!-- TOC -->
  <div class="toc page-break" id="inhaltsverzeichnis">
    <h2>Inhaltsverzeichnis</h2>
    ${project.foreword ? `
      <div class="toc-item">
        <a href="#vorwort">&bull; Vorwort</a>
      </div>
    ` : ''}
    ${project.chapters.map(c => `
      <div class="toc-item">
        <a href="#chap_${c.chapterNumber}">Kapitel ${c.chapterNumber}: ${c.title}</a>
        <span style="color: #64748b;">${c.actualWords} Wörter</span>
      </div>
    `).join('')}
    ${project.conclusion ? `
      <div class="toc-item">
        <a href="#fazit">&bull; Fazit & Schlusswort</a>
      </div>
    ` : ''}
    <div class="toc-item" style="margin-top: 15px; font-weight: bold;">
      <a href="#quellverzeichnis" style="color: #2563eb;">&bull; Link zum Quellenverzeichnis (${project.citationStyle}) &rarr;</a>
    </div>
  </div>

  <!-- FOREWORD -->
  ${project.foreword ? `
    <div class="chapter page-break" id="vorwort">
      <div class="chapter-header">Vorwort</div>
      <div style="margin-top: 20px;">
        ${project.foreword.replace(/\n\n/g, '</p><p>')}
      </div>
    </div>
  ` : ''}

  <!-- CHAPTERS -->
  ${project.chapters.map(c => `
    <div class="chapter page-break" id="chap_${c.chapterNumber}">
      <div class="chapter-header">Kapitel ${c.chapterNumber}: ${c.title}</div>
      ${c.illustrationUrl ? `<div class="illustration"><img src="${c.illustrationUrl}" alt="Illustration" /></div>` : ''}
      <div style="margin-top: 20px;">
        ${(c.content || '<p><em>Kapitelinhalt wird erstellt...</em></p>')
          .replace(/## (.*)/g, '<h2>$1</h2>')
          .replace(/### (.*)/g, '### $1')
          .replace(/\n\n/g, '</p><p>')}
      </div>
    </div>
  `).join('')}

  <!-- CONCLUSION -->
  ${project.conclusion ? `
    <div class="chapter page-break" id="fazit">
      <div class="chapter-header">Fazit & Schlusswort</div>
      <div style="margin-top: 20px;">
        ${project.conclusion.replace(/\n\n/g, '</p><p>')}
      </div>
    </div>
  ` : ''}

  <!-- BIBLIOGRAPHY -->
  <div class="biblio" id="quellverzeichnis">
    <h2 style="font-family: 'Cinzel', serif; border-bottom: 2px solid #0f172a; padding-bottom: 5px;">Quellverzeichnis (${project.citationStyle})</h2>
    <p class="no-print"><a href="#inhaltsverzeichnis" style="color: #2563eb; font-size: 10pt;">&larr; Zurück zum Inhaltsverzeichnis</a></p>
    ${project.bibliography && project.bibliography.length > 0 ? project.bibliography.map((src, i) => `
      <div class="biblio-entry">
        <strong>[${i + 1}]</strong> ${src.author} (${src.year}). <em>${src.title}</em>. ${src.publisher}.${src.url ? ` <a href="${src.url}">${src.url}</a>` : ''}
      </div>
    `).join('') : '<p>Keine Quellen eingetragen.</p>'}
  </div>

</body>
</html>`;

  printWindow.document.write(printHtml);
  printWindow.document.close();
}
