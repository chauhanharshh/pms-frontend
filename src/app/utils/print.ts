export function printHtml(html: string) {
  const errorScript = `
    <script>
      function handleLogoError(img) {
        if (!img) return;
        img.onerror = null;
        var stage = img.getAttribute('data-stage') || 'primary';
        var currentSrc = img.src;

        if (stage === 'primary') {
          // 1. Try local dev fallback
          if (window.location.hostname === 'localhost' && !currentSrc.includes('localhost:5000')) {
            img.setAttribute('data-stage', 'dev-local');
            try {
              var url = new URL(currentSrc);
              img.src = 'http://localhost:5000' + url.pathname + url.search;
              return;
            } catch (e) {}
          }

          // 2. Try production fallback
          if (!currentSrc.includes('148.230.97.88')) {
            img.setAttribute('data-stage', 'prod-fallback');
            try {
              var url = new URL(currentSrc);
              img.src = 'http://148.230.97.88' + url.pathname + url.search;
              return;
            } catch (e) {}
          }
        }

        if (stage === 'dev-local' && !currentSrc.includes('148.230.97.88')) {
            img.setAttribute('data-stage', 'prod-fallback');
            try {
                var url = new URL(currentSrc);
                img.src = 'http://148.230.97.88' + url.pathname + url.search;
                return;
            } catch (e) {}
        }

        img.style.display = 'none';
        var parent = img.parentElement;
        if (parent && (parent.classList.contains('invoice-watermark') || parent.classList.contains('center'))) {
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
