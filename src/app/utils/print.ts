export function printHtml(html: string) {
  // Electron: use IPC
  if (typeof window !== 'undefined' && 
      (window as any).electronAPI?.printHtml) {
    (window as any).electronAPI.printHtml(html);
    return;
  }
  
  // Browser fallback
  const w = window.open('about:blank', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 500);
}
