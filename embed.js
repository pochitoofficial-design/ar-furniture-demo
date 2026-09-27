/* ROOMFIT embed — 商品ページに「自分の部屋に置いてみる」を付ける
 * 使い方: <script src="https://…/embed.js" data-sku="SOFA-001"></script>
 * 任意属性: data-catalog="…/catalog.json"  data-label="ボタン文言"  data-height="360"
 * 計測: window.dataLayer / gtag に roomfit_ar イベント（action: shown | start | fail | variant）
 */
(function () {
  var script = document.currentScript; if (!script) return;
  var sku = script.dataset.sku; if (!sku) { console.warn('[roomfit] data-sku がありません'); return; }
  var base = script.src.replace(/[^/]*$/, '');
  var catalogUrl = script.dataset.catalog || base + 'catalog.json';
  var label = script.dataset.label || '自分の部屋に置いてみる';
  var height = script.dataset.height || '360';
  var MV = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer.min.js';

  function track(action, extra) {
    var ev = Object.assign({ event: 'roomfit_ar', action: action, sku: sku }, extra || {});
    try { (window.dataLayer = window.dataLayer || []).push(ev); } catch (e) {}
    try { if (typeof window.gtag === 'function') window.gtag('event', 'roomfit_ar_' + action, { sku: sku }); } catch (e) {}
    try { document.dispatchEvent(new CustomEvent('roomfit:ar', { detail: ev })); } catch (e) {}
  }
  function abs(u) { return /^(https?:)?\/\//.test(u) || u.indexOf('data:') === 0 ? u : base + u; }
  function ensureMV(cb) {
    if (customElements.get('model-viewer')) return cb();
    if (!document.querySelector('script[data-roomfit-mv]')) { var s = document.createElement('script'); s.type = 'module'; s.src = MV; s.dataset.roomfitMv = '1'; document.head.appendChild(s); }
    customElements.whenDefined('model-viewer').then(cb);
  }
  var css = '.rf-box{font-family:system-ui,-apple-system,"Hiragino Sans",sans-serif;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;background:#fff;margin:12px 0}' +
    '.rf-box model-viewer{width:100%;height:' + height + 'px;background:#f5f5f3;--poster-color:transparent}' +
    '.rf-ar{position:absolute;left:12px;bottom:12px;font:700 14px system-ui,sans-serif;padding:12px 18px;border:0;border-radius:10px;background:#1c1c1c;color:#fff;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.2)}' +
    '.rf-meta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 12px;font-size:12px;color:#666}' +
    '.rf-meta b{font-family:ui-monospace,Menlo,monospace;color:#1c1c1c;font-weight:500}' +
    '.rf-chip{font:13px system-ui,sans-serif;min-height:34px;padding:0 12px;border:1px solid #ddd;border-radius:999px;background:#fff;color:#1c1c1c;cursor:pointer}' +
    '.rf-chip[aria-pressed="true"]{border-color:#1c1c1c;background:#1c1c1c;color:#fff}' +
    '.rf-note{padding:0 12px 10px;font-size:12px;color:#888}';
  if (!document.getElementById('rf-style')) { var st = document.createElement('style'); st.id = 'rf-style'; st.textContent = css; document.head.appendChild(st); }

  fetch(catalogUrl).then(function (r) { return r.json(); }).then(function (cat) {
    var item = cat[sku]; if (!item) { console.warn('[roomfit] SKU がカタログにありません: ' + sku); return; }
    ensureMV(function () {
      var box = document.createElement('div'); box.className = 'rf-box';
      var mv = document.createElement('model-viewer');
      mv.setAttribute('src', abs(item.glb)); if (item.usdz) mv.setAttribute('ios-src', abs(item.usdz));
      mv.setAttribute('alt', item.name || sku); mv.setAttribute('ar', ''); mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
      mv.setAttribute('ar-scale', 'fixed'); mv.setAttribute('ar-placement', 'floor'); mv.setAttribute('camera-controls', ''); mv.setAttribute('touch-action', 'pan-y');
      mv.setAttribute('shadow-intensity', '1'); mv.setAttribute('environment-image', 'neutral'); mv.setAttribute('loading', 'lazy');
      var btn = document.createElement('button'); btn.className = 'rf-ar'; btn.slot = 'ar-button'; btn.textContent = label; mv.appendChild(btn);
      box.appendChild(mv);
      var meta = document.createElement('div'); meta.className = 'rf-meta';
      if (item.size) meta.innerHTML = '<span>幅 <b>' + item.size.w + '</b> × 奥行 <b>' + item.size.d + '</b> × 高さ <b>' + item.size.h + '</b> cm</span>';
      box.appendChild(meta);
      var note = document.createElement('div'); note.className = 'rf-note'; box.appendChild(note);
      script.parentNode.insertBefore(box, script.nextSibling);

      mv.addEventListener('load', function () {
        var vs = mv.availableVariants || []; var names = item.variants || {};
        if (vs.length > 1) { vs.forEach(function (v) { var c = document.createElement('button'); c.className = 'rf-chip'; c.type = 'button'; c.textContent = names[v] || v; c.setAttribute('aria-pressed', v === mv.variantName); c.addEventListener('click', function () { mv.variantName = v; meta.querySelectorAll('.rf-chip').forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); track('variant', { variant: v }); }); meta.appendChild(c); }); }
        setTimeout(function () { if (mv.canActivateAR) track('shown'); else note.textContent = 'スマートフォンで開くと、カメラで実寸のまま部屋に置けます。'; }, 300);
      });
      mv.addEventListener('ar-status', function (e) { if (e.detail.status === 'session-started') track('start'); if (e.detail.status === 'failed') track('fail'); });
    });
  }).catch(function (e) { console.warn('[roomfit] カタログを読めません', e); });
})();
