(() => {
  'use strict';

  const data = globalThis.OMONNA_DATA;
  const total = data.questions.zh.length;
  const marks = ['①', '②', '③'];
  const storageKey = 'omonna-sheet-bilingual-v1';
  const url = 'https://zerobeyondlogic.github.io/omonna-sheet/';
  const ui = {
    zh: {
      html: 'zh-CN', top: '这算沉重吗？', title: '重女判定表', titleLine: '重女判定表',
      lead: '和健屋一起填填看！', description: '如果恋人这样做，你会觉得开心，还是有些沉重？选出最接近你感受的答案。',
      choices: ['开心', '开心，但有点沉重', '沉重'],
      start: '开始填写', resume: '继续填写', table: '整表填写', one: '逐题填写',
      previous: '上一题', next: '下一题', progress: '作答进度', missing: '继续填写剩余 {n} 题',
      note: '自由填写', noteHelp: '可选，最多 120 字。内容会出现在你下载的第 3 页判定表上。',
      result: '查看结果', resultTitle: '你的判定结果', edit: '修改答案', all: '查看全部答案',
      saveResult: '保存结果图', saveSheet: '保存判定表', page: '第 {n} 页', download: '下载第 {n} 页',
      x: '分享到 X', bilibili: '分享到 B 站', xhs: '分享到小红书', copy: '复制结果文字',
      copied: '已复制结果文字', copyFailed: '已选中文案，请手动复制',
      shared: '已下载结果图并复制文案。发布时粘贴文案并添加图片。',
      shareManual: '已下载结果图。请复制下方文案，并在发布时添加图片。',
      pending: '正在生成结果图', failed: '图片生成失败，请重试',
      downloaded: '图片已生成，请在下载列表中查看', unsaved: '浏览器无法自动保存本次填写',
      reset: '清空答案', resetTitle: '清空这份判定表？',
      resetDescription: '这会清空所有答案和自由填写内容。', cancel: '取消', confirm: '清空',
      original: '原题：健屋花那', creator: '网页制作：',
    },
    ja: {
      html: 'ja', top: 'これって重い？', title: 'これって重い？判定シート', titleLine: '判定シート',
      lead: '健屋と一緒に埋めてみよう！', description: '恋人にこうされたら、嬉しい？ それとも重い？ 自分の気持ちに近い答えを選んでみよう。',
      choices: ['嬉しい', '嬉しいけど重い', '重い'],
      start: 'はじめる', resume: '続きから', table: '一覧で回答', one: '一問ずつ回答',
      previous: '前の質問', next: '次の質問', progress: '回答の進み具合', missing: '残り{n}問に回答する',
      note: '自由記入', noteHelp: '任意・120文字まで。記入内容はダウンロードする判定シートの3枚目に入ります。',
      result: '結果を見る', resultTitle: 'あなたの判定結果', edit: '回答を修正', all: 'すべての回答を見る',
      saveResult: '結果画像を保存', saveSheet: '判定シートを保存', page: '{n}枚目', download: '{n}枚目をダウンロード',
      x: 'Xでシェア', bilibili: 'Bilibiliでシェア', xhs: '小紅書でシェア', copy: '結果テキストをコピー',
      copied: '結果をコピーしました', copyFailed: '選択したテキストを手動でコピーしてください',
      shared: '画像を保存し、テキストをコピーしました。投稿画面で貼り付け、画像を添付してください。',
      shareManual: '画像を保存しました。下のテキストをコピーして、投稿に画像を添付してください。',
      pending: '結果画像を作成中です', failed: '画像を作成できませんでした。もう一度お試しください',
      downloaded: '画像を作成しました。ダウンロードをご確認ください', unsaved: 'このブラウザでは回答を自動保存できません',
      reset: '回答を消去', resetTitle: 'このシートをリセットしますか？',
      resetDescription: 'すべての回答と自由記入を消去します。', cancel: 'キャンセル', confirm: '消去する',
      original: '原案：健屋花那', creator: 'ウェブ制作：',
    },
  };

  const byId = id => document.getElementById(id);
  const root = byId('root');
  const dialog = byId('reset-dialog');
  const pad = n => String(n).padStart(2, '0');
  const format = (message, n) => message.replace('{n}', n);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const trimNote = value => Array.from(value.replace(/\r\n?/g, '\n')).slice(0, 120).join('');
  const blank = (lang = 'zh') => ({ lang, view: 'intro', index: 0, answers: Array(total).fill(0), note: '' });
  let state = blank();
  let advanceTimer;
  let toastTimer;
  let generation = 0;
  let previewUrls = [];
  let resultBlob;
  let pending = false;

  const t = () => ui[state.lang];
  const question = i => data.questions[state.lang][i];
  const remaining = () => state.answers.filter(answer => !answer).length;
  const counts = () => [1, 2, 3].map(value => state.answers.filter(answer => answer === value).length);

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Array.isArray(saved.answers) && saved.answers.length === total) {
      state.lang = saved.lang === 'ja' ? 'ja' : 'zh';
      state.answers = saved.answers.map(value => [1, 2, 3].includes(value) ? value : 0);
      if (Number.isInteger(saved.index)) state.index = Math.min(total - 1, Math.max(0, saved.index));
      if (typeof saved.note === 'string') state.note = trimNote(saved.note);
      if (['question', 'sheet', 'note', 'result'].includes(saved.view)) state.view = saved.view;
      if (state.view === 'result' && remaining()) state.view = 'sheet';
    }
  } catch {
    // A blocked or invalid save starts a fresh sheet.
  }
  const queryLang = new URL(location.href).searchParams.get('lang');
  if (['zh', 'ja'].includes(queryLang)) state.lang = queryLang;

  function header() {
    const u = t();
    const answered = total - remaining();
    const label = { intro: 'START', note: 'LAST', result: 'RESULT', sheet: `${answered} / ${total}` }[state.view]
      ?? `${pad(state.index + 1)} / ${total}`;
    return `<div class="tools"><nav class="language-switch" aria-label="语言 / 言語">
      <button id="lang-zh" data-lang="zh" lang="zh-CN" aria-pressed="${state.lang === 'zh'}">简体中文</button>
      <button id="lang-ja" data-lang="ja" lang="ja" aria-pressed="${state.lang === 'ja'}">日本語</button></nav>
      <button class="link mode-link" data-action="toggle">${state.view === 'sheet' ? u.one : u.table}</button></div>
      <div class="topbar"><div class="xs" aria-hidden="true">✕✕</div>
      <div class="pill" role="progressbar" aria-label="${u.progress}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${answered}">
      <div class="fill" style="width:${answered / total * 100}%"></div><span>${label}</span></div>
      <div class="xs" aria-hidden="true">✕✕</div></div>`;
  }

  const legend = () => `<div class="legend">${t().choices.map((choice, i) => `<span>${marks[i]} ${choice}</span>`).join('')}</div>`;
  const resetButton = () => `<button class="link" data-action="reset">${t().reset}</button>`;
  const resultButton = () => `<button id="show-result" class="btn solid" data-action="result"${remaining() ? ' disabled' : ''}>${t().result}</button>`;
  const missingButton = () => remaining() ? `<button class="link" data-action="resume">${format(t().missing, remaining())}</button>` : '';

  function intro() {
    const u = t();
    const started = remaining() < total || state.note;
    return `<div class="intro"><p class="lead">${u.lead}</p>
      <h1 id="view-heading" tabindex="-1"><small>${u.top}</small><br>${u.titleLine}</h1>
      ${legend()}<p>${u.description}</p>
      <button class="btn solid" data-action="resume">${started ? u.resume : u.start}</button>${started ? resetButton() : ''}</div>`;
  }

  function one() {
    const u = t();
    const i = state.index;
    return `<div class="qwrap"><div class="qnum" aria-hidden="true">${pad(i + 1)}<span>.</span></div>
      <h2 class="qtext" id="view-heading" tabindex="-1">${esc(question(i))}</h2><hr class="rule">
      <div class="choices" role="group" aria-labelledby="view-heading">${u.choices.map((choice, k) => {
        const active = state.answers[i] === k + 1;
        return `<button class="choice${active ? ' on' : ''}" data-choice="${k + 1}" aria-pressed="${active}">
          <span class="box" aria-hidden="true">${active ? '✓' : ''}</span><span>${marks[k]} ${choice}</span></button>`;
      }).join('')}</div><div class="nav">
      <button class="link" data-action="previous">← ${u.previous}</button>
      <button id="next" class="link" data-action="next"${state.answers[i] ? '' : ' disabled'}>${u.next} →</button></div></div>`;
  }

  function noteField() {
    return `<div class="free-entry"><p id="note-help">${t().noteHelp}</p>
      <textarea id="free-note" class="share-text" aria-describedby="note-help"></textarea></div>`;
  }

  function note() {
    const u = t();
    return `<div class="qwrap"><div class="qnum final-num" aria-hidden="true">LAST<span>.</span></div>
      <h2 class="sheet-final" id="view-heading" tabindex="-1"><label for="free-note">${u.note}</label></h2>
      <hr class="rule">${noteField()}${resultButton()}${missingButton()}
      <div class="nav"><button class="link" data-action="back-note">← ${u.previous}</button></div></div>`;
  }

  function rows(start, end) {
    return state.answers.slice(start, end).map((answer, offset) => {
      const i = start + offset;
      return `<div class="table-row" role="radiogroup" aria-labelledby="row-${i}">
        <p class="row-text" id="row-${i}"><span class="n">${pad(i + 1)}.</span><span>${esc(question(i))}</span></p>
        ${t().choices.map((choice, k) => `<label class="table-choice">
          <input type="radio" name="row-${i}" value="${k + 1}" data-answer="${i}" aria-label="${choice}"${answer === k + 1 ? ' checked' : ''}>
          <span class="small-box" aria-hidden="true">${answer === k + 1 ? '✓' : ''}</span></label>`).join('')}</div>`;
    }).join('');
  }

  function sheet() {
    const u = t();
    return `<div class="sheet-content"><h1 id="view-heading" tabindex="-1" class="sheet-heading">${u.title}</h1>
      ${legend()}${data.groups.map(([start, end], k) => `<section class="sheet-chapter">
        <div class="table-head" aria-hidden="true"><span>${k + 1} / ${data.groups.length}</span><span>1</span><span>2</span><span>3</span></div>
        ${rows(start, end)}</section>`).join('')}
      <hr class="rule"><h2 class="sheet-final"><label for="free-note">${u.note}</label></h2>
      ${noteField()}${resultButton()}<div id="remaining">${missingButton()}</div>${resetButton()}</div>`;
  }

  function result() {
    const u = t();
    const totals = counts();
    const share = [u.title, ...totals.map((n, i) => `${marks[i]} ${u.choices[i]} × ${n}`),
      u.original, u.creator + 'beyondlogic', `${url}?lang=${state.lang}`].join('\n');
    const intent = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(share);
    return `<div class="result-content"><p class="lead result-lead">${u.title}</p>
      <h2 id="view-heading" tabindex="-1" class="res-type">${u.resultTitle}</h2>
      <div class="counts">${totals.map((n, i) => `<div class="count${i === 0 ? ' c1' : ''}"><b>${n}</b><small>${marks[i]} ${u.choices[i]}</small></div>`).join('')}</div>
      <img class="card-img" id="card-image" alt="${u.resultTitle}" width="1200" height="1200" hidden>
      <div class="actions">
      <button class="btn solid" data-download="result">${u.saveResult}</button>
      <a class="btn solid" href="${intent}" target="_blank" rel="noopener noreferrer">𝕏 ${u.x}</a>
      <a class="btn solid" href="https://t.bilibili.com/" target="_blank" rel="noopener noreferrer" data-platform>${u.bilibili}</a>
      <a class="btn solid" href="https://creator.xiaohongshu.com/publish/publish?target=image" target="_blank" rel="noopener noreferrer" data-platform>${u.xhs}</a>
      <p class="platform-share-status" id="share-status" role="status" hidden></p>
      <button class="link" data-action="copy">${u.copy}</button></div>
      <textarea id="share-text" class="share-text" aria-label="${u.copy}" readonly>${esc(share)}</textarea>
      <details id="sheet-export"><summary>${u.saveSheet}</summary><div class="export-pages">${data.groups.map((_, i) => `<div class="export-page">
        <img id="preview-${i}" alt="${format(u.page, i + 1)}" width="1500" height="2000" hidden>
        <button class="link" data-download="${i}">${format(u.download, i + 1)}</button></div>`).join('')}</div></details>
      <details><summary>${u.all}</summary><ol class="alist">${state.answers.map((answer, i) => `<li>
        <span class="n">${pad(i + 1)}.</span><span class="t">${esc(question(i))}</span>
        <button class="a k${answer}" data-jump="${i}" aria-label="${u.edit} ${pad(i + 1)} · ${u.choices[answer - 1]}">${marks[answer - 1]}</button></li>`).join('')}</ol></details>
      ${state.note ? `<p class="result-note"><strong>${u.note}</strong><br>${esc(state.note)}</p>` : ''}
      <div class="nav"><button class="link" data-action="edit">← ${u.edit}</button>${resetButton()}</div></div>`;
  }

  function footer() {
    const u = t();
    return `<footer class="credit">${u.original}（<a href="${data.source}" target="_blank" rel="noopener noreferrer">@sukosuko_sukoya</a>）<br>
      ${u.creator}<a href="${data.creator}" target="_blank" rel="noopener noreferrer">beyondlogic</a></footer>`;
  }

  function toast(message) {
    const element = byId('toast');
    element.textContent = message;
    element.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('show'), 2400);
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { toast(t().unsaved); }
  }

  function go(view, index = state.index) {
    state.view = view;
    state.index = index;
    save();
    render('view-heading');
    window.scrollTo(0, 0);
  }

  function resume() {
    const first = state.answers.indexOf(0);
    if (first < 0) go('note');
    else go('question', first);
  }

  function render(focusId) {
    clearTimeout(advanceTimer);
    const current = ++generation;
    previewUrls.forEach(src => URL.revokeObjectURL(src));
    previewUrls = [];
    resultBlob = undefined;
    pending = false;
    const u = t();
    const views = { intro, question: one, sheet, note, result };
    document.documentElement.lang = u.html;
    document.title = u.title;
    document.querySelector('meta[name="description"]').content = u.description;
    root.innerHTML = `<div class="wrap">${header()}<main class="sheet" id="content">${views[state.view]()}</main>${footer()}</div>`;
    const field = byId('free-note');
    if (field) field.value = state.note;
    byId('reset-title').textContent = u.resetTitle;
    byId('reset-description').textContent = u.resetDescription;
    byId('cancel-reset').textContent = u.cancel;
    byId('confirm-reset').textContent = u.confirm;
    if (focusId) byId(focusId)?.focus({ preventScroll: true });

    if (state.view === 'result') {
      const snapshot = structuredClone(state);
      pending = true;
      preview(snapshot, null, 'card-image', current);
      const details = byId('sheet-export');
      details.addEventListener('toggle', () => {
        if (!details.open || details.dataset.loaded || current !== generation) return;
        details.dataset.loaded = 'true';
        data.groups.forEach((_, i) => preview(snapshot, i, 'preview-' + i, current));
      });
    }
  }

  async function preview(snapshot, page, id, current) {
    try {
      const blob = await globalThis.OmonnaImages.create(snapshot, page);
      if (current !== generation) return;
      const src = URL.createObjectURL(blob);
      previewUrls.push(src);
      const image = byId(id);
      image.src = src;
      image.hidden = false;
      if (page === null) resultBlob = blob;
    } catch {
      if (current === generation) toast(t().failed);
    } finally {
      if (current === generation && page === null) pending = false;
    }
  }

  function next() {
    if (!state.answers[state.index]) return;
    if (state.index === total - 1) go('note');
    else go('question', state.index + 1);
  }

  function updateProgress() {
    const progress = root.querySelector('[role="progressbar"]');
    const answered = total - remaining();
    progress.setAttribute('aria-valuenow', answered);
    progress.firstElementChild.style.width = `${answered / total * 100}%`;
    if (state.view === 'sheet') progress.lastElementChild.textContent = `${answered} / ${total}`;
  }

  function choose(value) {
    state.answers[state.index] = value;
    save();
    updateProgress();
    root.querySelectorAll('[data-choice]').forEach(button => {
      const selected = Number(button.dataset.choice) === value;
      button.classList.toggle('on', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.querySelector('.box').textContent = selected ? '✓' : '';
    });
    byId('next').disabled = false;
    clearTimeout(advanceTimer);
    advanceTimer = setTimeout(next, 170);
  }

  function changeLanguage(lang) {
    if (state.lang === lang) return;
    const scroll = window.scrollY;
    state.lang = lang;
    save();
    try {
      const page = new URL(location.href);
      page.searchParams.set('lang', lang);
      history.replaceState(null, '', page);
    } catch {
      // The page can still switch languages when opened as a local file.
    }
    render('lang-' + lang);
    window.scrollTo(0, scroll);
  }

  async function copyShare() {
    const share = byId('share-text');
    try {
      await navigator.clipboard.writeText(share.value);
      return true;
    } catch {
      if (share.isConnected) {
        share.focus({ preventScroll: true });
        share.select();
      }
      return false;
    }
  }

  function saveImage(blob, page, lang) {
    const src = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = src;
    link.download = `omonna-sheet-${lang}-${page === null ? 'result' : 'page-' + (page + 1)}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(src), 1000);
  }

  async function download(page) {
    const snapshot = structuredClone(state);
    try {
      const blob = (page === null && resultBlob) || await globalThis.OmonnaImages.create(snapshot, page);
      saveImage(blob, page, snapshot.lang);
      toast(t().downloaded);
    } catch { toast(t().failed); }
  }

  function platformShare(event) {
    if (!resultBlob) {
      event.preventDefault();
      toast(pending ? t().pending : t().failed);
      return;
    }
    const status = byId('share-status');
    const u = t();
    const copied = copyShare();
    saveImage(resultBlob, null, state.lang);
    status.hidden = false;
    status.textContent = u.shareManual;
    copied.then(success => {
      if (success && status.isConnected) status.textContent = u.shared;
    });
  }

  const actions = {
    resume,
    toggle: () => go(state.view === 'sheet' ? 'question' : 'sheet'),
    previous: () => state.index ? go('question', state.index - 1) : go('intro'),
    next,
    'back-note': () => go('question', total - 1),
    result: () => { if (!remaining()) go('result'); },
    edit: () => go('sheet'),
    reset: () => {
      clearTimeout(advanceTimer);
      dialog.returnValue = '';
      dialog.showModal();
    },
    copy: async () => toast(await copyShare() ? t().copied : t().copyFailed),
  };

  root.addEventListener('click', event => {
    const target = event.target.closest('button, a');
    if (!target) return;
    const { action, choice, download: page, jump, lang, platform } = target.dataset;
    if (action) actions[action]();
    else if (choice) choose(Number(choice));
    else if (page !== undefined) download(page === 'result' ? null : Number(page));
    else if (jump !== undefined) go('question', Number(jump));
    else if (lang) changeLanguage(lang);
    else if (platform !== undefined) platformShare(event);
  });

  root.addEventListener('change', event => {
    const input = event.target;
    if (input.dataset.answer === undefined) return;
    const index = Number(input.dataset.answer);
    state.answers[index] = Number(input.value);
    state.index = index;
    save();
    input.closest('.table-row').querySelectorAll('input').forEach(radio => {
      radio.nextElementSibling.textContent = radio.checked ? '✓' : '';
    });
    byId('show-result').disabled = Boolean(remaining());
    byId('remaining').innerHTML = missingButton();
    updateProgress();
  });

  function saveNote(event) {
    const field = event.target;
    if (field.id !== 'free-note' || event.isComposing) return;
    const value = trimNote(field.value);
    if (value !== field.value) field.value = value;
    state.note = value;
    save();
  }
  root.addEventListener('input', saveNote);
  root.addEventListener('compositionend', saveNote);

  dialog.addEventListener('close', () => {
    if (dialog.returnValue !== 'reset') return;
    state = blank(state.lang);
    go('intro');
  });

  document.addEventListener('keydown', event => {
    if (state.view !== 'question' || event.ctrlKey || event.metaKey || event.altKey || event.repeat ||
        /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    if (/^[123]$/.test(event.key)) { event.preventDefault(); choose(Number(event.key)); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); actions.previous(); }
  });

  render();
})();
