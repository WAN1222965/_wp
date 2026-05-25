(function () {
  const BASE = window.BASE_URL || '';
  const postId = window.location.pathname.match(/\/post\/(\d+)/)?.[1];

  // ===== THEME =====
  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = theme === 'dark' ? '☀️ 淺色' : '🌙 深色';
  }
  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  };
  const savedTheme = localStorage.getItem('theme');
  applyTheme(savedTheme || getSystemTheme());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
  });

  // ===== READING PROGRESS BAR =====
  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.width = progress + '%';
  }
  window.addEventListener('scroll', updateProgress);
  window.addEventListener('resize', updateProgress);

  // ===== FLOATING TOC =====
  function buildTOC() {
    const article = document.getElementById('articleBody');
    const tocList = document.getElementById('tocList');
    if (!article || !tocList) return;
    const headings = article.querySelectorAll('h2, h3');
    if (headings.length === 0) { document.getElementById('tocSidebar')?.remove(); return; }

    headings.forEach((h, i) => { h.id = 'heading-' + i; });

    tocList.innerHTML = Array.from(headings).map((h, i) =>
      `<a href="#heading-${i}" class="toc-item ${h.tagName.toLowerCase()}" data-target="heading-${i}">${h.textContent}</a>`
    ).join('');

    const links = tocList.querySelectorAll('.toc-item');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          const link = tocList.querySelector(`[data-target="${entry.target.id}"]`);
          if (link) link.classList.add('active');
        }
      }
    }, { rootMargin: '-80px 0px -70% 0px' });
    headings.forEach(h => observer.observe(h));
  }

  // ===== CODE BLOCKS ENHANCEMENT =====
  // Run synchronously before Prism auto-init so line-numbers work correctly
  (function enhanceCodeBlocks() {
    const preBlocks = document.querySelectorAll('.article-body pre');
    preBlocks.forEach(pre => {
      if (pre.closest('.code-block-wrapper')) return;
      const code = pre.querySelector('code');
      if (!code) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const header = document.createElement('div');
      header.className = 'code-block-header';

      const filename = code.getAttribute('data-filename') || '';
      const lang = (code.className.match(/language-(\w+)/) || [])[1] || 'text';

      const filenameSpan = document.createElement('span');
      filenameSpan.className = 'filename';
      filenameSpan.textContent = filename || lang.toUpperCase();
      header.appendChild(filenameSpan);

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = '複製';
      copyBtn.addEventListener('click', () => {
        const text = code.textContent;
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = '已複製!';
            copyBtn.classList.add('copied');
            setTimeout(() => { copyBtn.textContent = '複製'; copyBtn.classList.remove('copied'); }, 2000);
          });
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed'; ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copyBtn.textContent = '已複製!';
          copyBtn.classList.add('copied');
          setTimeout(() => { copyBtn.textContent = '複製'; copyBtn.classList.remove('copied'); }, 2000);
        }
      });
      header.appendChild(copyBtn);

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      if (!pre.classList.contains('line-numbers')) {
        pre.classList.add('line-numbers');
      }
    });
  })();

  // ===== CODE PLAYGROUND =====
  function initPlayground() {
    const container = document.getElementById('playgroundContainer');
    if (!container) return;
    const playgrounds = document.querySelectorAll('.article-body [data-playground]');
    if (playgrounds.length === 0) { container.remove(); return; }

    playgrounds.forEach((el, idx) => {
      const html = el.getAttribute('data-html') || '';
      const css = el.getAttribute('data-css') || '';
      const js = el.getAttribute('data-js') || '';
      const id = 'playground-' + idx;

      const div = document.createElement('div');
      div.className = 'playground';
      div.innerHTML = [
        '<div class="playground-tabs">',
        '<div class="playground-tab active" onclick="switchPlaygroundTab(\'' + id + '\', \'html\', this)">HTML</div>',
        '<div class="playground-tab" onclick="switchPlaygroundTab(\'' + id + '\', \'css\', this)">CSS</div>',
        '<div class="playground-tab" onclick="switchPlaygroundTab(\'' + id + '\', \'js\', this)">JS</div>',
        '</div>',
        '<div class="playground-editor active" data-playground="' + id + '" data-type="html">',
        '<textarea id="' + id + '-html"></textarea>',
        '</div>',
        '<div class="playground-editor" data-playground="' + id + '" data-type="css">',
        '<textarea id="' + id + '-css"></textarea>',
        '</div>',
        '<div class="playground-editor" data-playground="' + id + '" data-type="js">',
        '<textarea id="' + id + '-js"></textarea>',
        '</div>',
        '<button class="playground-run" onclick="runPlayground(\'' + id + '\')">▶ 執行程式碼</button>',
        '<div class="playground-output" id="' + id + '-output"></div>',
        '</div>'
      ].join('');
      container.appendChild(div);

      document.getElementById(id + '-html').value = html;
      document.getElementById(id + '-css').value = css;
      document.getElementById(id + '-js').value = js;
    });
  }

  window.switchPlaygroundTab = function (id, type, btn) {
    const parent = btn.closest('.playground');
    parent.querySelectorAll('.playground-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    parent.querySelectorAll('.playground-editor').forEach(e => e.classList.remove('active'));
    parent.querySelector(`[data-playground="${id}"][data-type="${type}"]`).classList.add('active');
  };

  window.runPlayground = function (id) {
    const html = document.getElementById(id + '-html').value;
    const css = document.getElementById(id + '-css').value;
    const js = document.getElementById(id + '-js').value;

    const output = document.getElementById(id + '-output');
    const iframe = document.createElement('iframe');
    output.innerHTML = '';
    output.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write([
      '<!DOCTYPE html><html><head><style>', css, '</style></head>',
      '<body>', html, '<script>', js, '<\/script></body></html>'
    ].join(''));
    doc.close();
  };

  // ===== ANNOTATIONS =====
  function initAnnotations() {
    document.querySelectorAll('.article-body [data-annotation]').forEach(el => {
      const text = el.getAttribute('data-annotation');
      const popup = document.createElement('span');
      popup.className = 'annotation-popup';
      popup.textContent = text;
      el.style.position = 'relative';
      el.classList.add('annotation');
      el.appendChild(popup);
    });
  }

  // ===== SEARCH ENGINE (client-side index) =====
  let searchIndex = null;
  let searchIndexPromise = null;

  async function getSearchIndex() {
    if (searchIndex) return searchIndex;
    if (searchIndexPromise) return searchIndexPromise;
    searchIndexPromise = (async () => {
      try {
        const res = await fetch(BASE + '/api/search-index');
        searchIndex = await res.json();
        return searchIndex;
      } catch {
        searchIndex = [];
        return searchIndex;
      }
    })();
    return searchIndexPromise;
  }

  let searchTimeout;
  window.toggleSearch = function () {
    const overlay = document.getElementById('searchOverlay');
    const active = overlay.classList.toggle('active');
    if (active) setTimeout(() => document.getElementById('searchInput')?.focus(), 100);
  };
  window.closeSearch = function () {
    document.getElementById('searchOverlay')?.classList.remove('active');
  };
  window.doSearch = function (q) {
    clearTimeout(searchTimeout);
    const results = document.getElementById('searchResults');
    if (!q || q.length < 2) { results.innerHTML = ''; return; }
    searchTimeout = setTimeout(async () => {
      try {
        const index = await getSearchIndex();
        const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
        const scored = index.map(item => {
          let score = 0;
          const title = (item.title || '').toLowerCase();
          const excerpt = (item.excerpt || '').toLowerCase();
          const tags = (item.tags || []).join(' ').toLowerCase();
          for (const term of terms) {
            if (title.includes(term)) score += 10;
            if (excerpt.includes(term)) score += 3;
            if (tags.includes(term)) score += 5;
          }
          return { item, score };
        }).filter(s => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);
        results.innerHTML = scored.length
          ? scored.map(s => [
            '<div class="search-result-item" onclick="window.location.href=\'' + BASE + '/post/' + s.item.id + '\'">',
            '<h4>' + highlight(s.item.title, q) + '</h4>',
            '<p>' + highlight(s.item.excerpt || '', q) + '</p>',
            '</div>'
          ].join(''))
          : '<p style="color:var(--text-secondary);font-size:0.9rem;">找不到相關文章</p>';
      } catch { results.innerHTML = ''; }
    }, 150);
  };
  function highlight(text, q) {
    if (!text) return '';
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(re, '<mark style="background:#667eea33;padding:0 2px;border-radius:2px;">$1</mark>');
  }
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); window.toggleSearch(); }
    if (e.key === 'Escape') window.closeSearch();
  });

  // ===== TAG CLOUD =====
  async function loadTagCloud() {
    const container = document.getElementById('tagCloudItems');
    if (!container) return;
    try {
      const res = await fetch(BASE + '/api/tags');
      const tags = await res.json();
      if (tags.length === 0) { document.getElementById('tagCloudContainer')?.remove(); return; }
      container.innerHTML = tags.map(t =>
        '<a href="' + BASE + '/?tag=' + encodeURIComponent(t.name) + '" class="tag-cloud-item">' + escapeHtml(t.name) + ' (' + t.count + ')</a>'
      ).join('');
    } catch { }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  // ===== COMMENTS =====
  async function loadComments() {
    const list = document.getElementById('commentsList');
    if (!list || !postId) return;
    try {
      const res = await fetch(BASE + '/api/notes/' + postId + '/comments');
      const comments = await res.json();
      list.innerHTML = comments.length
        ? comments.map(c => [
          '<div class="comment-card">',
          '<div class="comment-author">' + escapeHtml(c.username || '匿名') + '</div>',
          '<div class="comment-text">' + escapeHtml(c.content) + '</div>',
          '<div class="comment-date">' + new Date(c.created_at).toLocaleDateString('zh-TW') + '</div>',
          '</div>'
        ].join(''))
        : '<p style="color:var(--text-secondary);font-size:0.9rem;">尚無留言，成為第一個留言的人！</p>';
    } catch { }
  }

  window.postComment = async function () {
    if (!postId) return;
    const name = document.getElementById('commentName').value.trim() || '匿名';
    const content = document.getElementById('commentInput').value.trim();
    if (!content) return;
    let userId = 0;
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) userId = user.id;
    } catch {}
    try {
      await fetch(BASE + '/api/notes/' + postId + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, content: name + '：' + content })
      });
      document.getElementById('commentInput').value = '';
      loadComments();
    } catch { }
  };

  // ===== NEWSLETTER =====
  window.subscribeNewsletter = async function () {
    const email = document.getElementById('newsletterEmail').value.trim();
    const msg = document.getElementById('newsletterMsg');
    if (!email || !email.includes('@')) { msg.textContent = '請輸入有效的 Email'; return; }
    try {
      const res = await fetch(BASE + '/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      msg.textContent = data.message || '訂閱成功！';
      document.getElementById('newsletterEmail').value = '';
    } catch { msg.textContent = '訂閱失敗，請稍後再試'; }
  };

  // ===== TOAST SYSTEM =====
  function ensureToastContainer() {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  window.showToast = function (message, type) {
    type = type || 'success';
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // ===== BACK TO TOP =====
  function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '↑';
    btn.id = 'backToTop';
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(btn);
    window.addEventListener('scroll', () => {
      btn.style.display = window.scrollY > 400 ? 'block' : 'none';
    });
  }

  // ===== SESSION AUTH CHECK =====
  async function checkAuth() {
    try {
      const res = await fetch(BASE + '/api/auth/me');
      const data = await res.json();
      if (data.authenticated) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch {}
  }

  // ===== FORM VALIDATION =====
  function validateForm(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      const group = field.closest('.form-group');
      if (!field.value.trim()) {
        valid = false;
        if (group) group.classList.add('has-error');
      } else {
        if (group) group.classList.remove('has-error');
      }
    });
    return valid;
  }

  document.addEventListener('submit', (e) => {
    if (e.target.matches('.needs-validation')) {
      if (!validateForm(e.target)) {
        e.preventDefault();
        showToast('請填寫所有必填欄位', 'error');
      }
    }
  }, true);

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', () => {
    buildTOC();
    initPlayground();
    initAnnotations();
    loadTagCloud();
    if (postId) loadComments();
    initBackToTop();
    checkAuth();
  });
})();
