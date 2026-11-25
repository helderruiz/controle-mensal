/**
 * Utilitário universal para envio de WhatsApp no Controle Mensal.
 * 
 * No Kodular (Android WebView), o aplicativo escuta o evento WebViewStringChange
 * procurando por "whatsapp://". Quando detectado, o Kodular abre o WhatsApp nativo
 * via Activity Starter sem tentar navegar no WebView, evitando a tela branca net::ERR_UNKNOWN_URL_SCHEME.
 */
export function openSafeWhatsApp(options: {
  phone?: string;
  text: string;
  onFeedback?: (msg: string) => void;
}) {
  const rawPhone = (options.phone || '').replace(/\D/g, '');
  const encodedText = encodeURIComponent(options.text);

  // URL nativa para o Kodular interceptar via ponte nativa
  const nativeWhatsAppUrl = rawPhone
    ? `whatsapp://send?phone=${rawPhone}&text=${encodedText}`
    : `whatsapp://send?text=${encodedText}`;

  // URL web padrão
  const webWhatsAppUrl = rawPhone
    ? `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  const nativeBridge = (window as any).Kodular || (window as any).AppInventor;
  const isKodularWebView = typeof nativeBridge?.setWebViewString === 'function';
  const isAndroidWebView = /;\s*wv\)|\bWebView\b/i.test(navigator.userAgent);

  if (isKodularWebView) {
    if (options.onFeedback) options.onFeedback('Abrindo WhatsApp...');
    try {
      nativeBridge.setWebViewString(nativeWhatsAppUrl);
      return;
    } catch (e) {
      console.warn('Falha na ponte Kodular:', e);
    }
  }

  // Se for WebView do Android sem ponte acessível, copiar texto e alertar em vez de crashar
  if (isAndroidWebView && !isKodularWebView) {
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(options.text).then(() => {
        if (options.onFeedback) {
          options.onFeedback('Texto copiado! Abra o WhatsApp para compartilhar.');
        } else {
          alert('Texto copiado! Abra o WhatsApp para compartilhar.');
        }
      });
      return;
    }
  }

  // Navegador Desktop ou Mobile padrão
  window.open(webWhatsAppUrl, '_blank');
}
