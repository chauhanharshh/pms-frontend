export function printHtml(html: string) {
  const errorScript = `
    <script>
      function handleLogoError(img) {
        if (!img) return;
        img.onerror = null;
        var stage = img.getAttribute('data-stage') || 'primary';
        if (stage === 'primary') {
          if (window.location.hostname === 'localhost' && !img.src.includes('localhost:5000')) {
            img.setAttribute('data-stage', 'dev-local');
            try {
              var url = new URL(img.src);
              img.src = 'http://localhost:5000' + url.pathname + url.search;
              return;
            } catch (e) {}
          }
        }
        img.style.display = 'none';
        var parent = img.parentElement;
        if (parent && (parent.classList.contains('invoice-watermark') || parent.classList.contains('center'))) {
          // If the image was in a dedicated center/watermark container, hide the container too
          // unless it has other content (heuristic)
          if (parent.children.length === 1) parent.style.display = 'none';
        }
      }
    </script>
  `;

  // Inject script into head if exists, otherwise body
  let finalHtml = html;
  if (html.includes('</head>')) {
    finalHtml = html.replace('</head>', `${errorScript}</head>`);
  } else if (html.includes('<body>')) {
    finalHtml = html.replace('<body>', `<body>${errorScript}`);
  } else {
    finalHtml = errorScript + html;
  }

  // Electron: use IPC
  if (typeof window !== 'undefined' && 
      (window as any).electronAPI?.printHtml) {
    (window as any).electronAPI.printHtml(finalHtml);
    return;
  }
  
  // Browser fallback
  const w = window.open('about:blank', '_blank');
  if (!w) return;
  w.document.write(finalHtml);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 500);
}
