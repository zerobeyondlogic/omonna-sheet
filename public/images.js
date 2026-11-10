globalThis.OmonnaImages = (() => {
  const D = globalThis.OMONNA_DATA;
  const paper = '#e4e5e8';
  const ink = '#ff33c4';
  const dark = '#4a2140';
  const yellow = '#ffed4d';
  const soft = '#ffc2ec';
  const circles = ['①', '②', '③'];
  const site = 'zerobeyondlogic.github.io/omonna-sheet';
  const locale = {
    zh: {
      title: '重女判定表',
      choices: ['开心', '开心，但有点沉重', '沉重'],
      answers: '我的回答',
      invitation: '和健屋一起填填看！',
      note: '自由填写',
      credit: '原题：健屋花那 / 网页制作：beyondlogic',
      font: '"Sheet Chinese","Microsoft YaHei","PingFang SC",sans-serif',
    },
    ja: {
      title: 'これって重い？判定シート',
      choices: ['嬉しい', '嬉しいけど重い', '重い'],
      answers: '自分の回答',
      invitation: '健屋と一緒に埋めてみよう！',
      note: '自由記入',
      credit: '原案：健屋花那 / ウェブ制作：beyondlogic',
      font: '"Zen Maru Gothic","Yu Gothic","Meiryo",sans-serif',
    },
  };

  function wrap(g, value, width) {
    const lines = [''];
    for (const char of String(value)) {
      const current = lines.length - 1;
      if (char === '\n') lines.push('');
      else if (lines[current] && g.measureText(lines[current] + char).width > width) lines.push(char);
      else lines[current] += char;
    }
    return lines;
  }

  function drawText(g, value, x, y, width, size, {
    weight = 700, color = ink, align = 'left', lineHeight = 1.3, minSize = size, maxLines = 1, outline,
    font = g.canvas.dataset.font,
  } = {}) {
    let lines;
    for (;;) {
      g.font = String(weight) + ' ' + size + 'px ' + font;
      lines = wrap(g, value, width);
      if (lines.length <= maxLines || size <= minSize) break;
      size -= 1;
    }
    g.fillStyle = color;
    g.textAlign = align;
    g.textBaseline = 'top';
    lines.forEach((line, i) => {
      const baseline = y + i * size * lineHeight;
      if (outline) {
        g.strokeStyle = outline;
        g.lineWidth = 3;
        g.lineJoin = 'round';
        g.strokeText(line, x, baseline);
      }
      g.fillText(line, x, baseline);
    });
  }

  function frame(g, label, bottom) {
    const { width, height } = g.canvas;
    const center = width / 2;
    g.fillStyle = paper;
    g.fillRect(0, 0, width, height);
    drawText(g, '× × ×', 56, 42, 250, 48, { weight: 900 });
    drawText(g, '× × ×', width - 56, 42, 250, 48, { weight: 900, align: 'right' });
    g.fillStyle = ink;
    g.beginPath();
    g.roundRect(center - 280, 44, 560, 55, 28);
    g.fill();
    drawText(g, label, center, 57, 500, 27, { color: 'white', align: 'center', weight: 900 });
    g.fillStyle = ink;
    for (const x of [48, width - 62]) {
      g.beginPath();
      g.roundRect(x, 140, 14, bottom - 140, 7);
      g.fill();
    }
  }

  function rule(g, x, y, width) {
    g.fillStyle = ink;
    g.fillRect(x, y, width, 3);
  }

  function check(g, x, y, size) {
    g.save();
    g.strokeStyle = dark;
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(x + size * .16, y + size * .51);
    g.lineTo(x + size * .4, y + size * .78);
    g.lineTo(x + size * .87, y + size * .15);
    g.stroke();
    g.restore();
  }

  function drawCredit(g, u, y) {
    const center = g.canvas.width / 2;
    drawText(g, u.credit, center, y, 1000, 22, { color: dark, align: 'center' });
    drawText(g, site, center, y + 36, 1000, 20, { color: dark, align: 'center' });
  }

  function drawSheet(g, s, u, page) {
    const [start, end] = D.groups[page];
    frame(g, String(page + 1) + ' / ' + D.groups.length, 1856);
    drawText(g, u.invitation, 750, 144, 1100, 28, { align: 'center' });
    drawText(g, u.title, 750, 202, 1240, 69, { weight: 900, align: 'center', minSize: 46 });
    g.fillStyle = yellow;
    g.fillRect(135, 307, 1230, 59);
    g.strokeStyle = ink;
    g.lineWidth = 3;
    g.strokeRect(135, 307, 1230, 59);
    u.choices.forEach((choice, i) => drawText(g, circles[i] + ' ' + choice, [335, 750, 1165][i], 319, 395, 29, { color: dark, align: 'center' }));

    const cols = [1120, 1215, 1310];
    cols.forEach((x, i) => drawText(g, i + 1, x, 398, 75, 39, { weight: 900, align: 'center' }));
    const top = 455;
    const lastPage = page === D.groups.length - 1;
    const rowHeight = Math.floor(((lastPage ? 1525 : 1830) - top) / (end - start));
    for (let i = start; i < end; i++) {
      const y = top + (i - start) * rowHeight;
      drawText(g, String(i + 1).padStart(2, '0') + '.', 140, y + 22, 105, 44, { weight: 900, color: yellow, outline: ink, minSize: 35 });
      drawText(g, D.questions[s.lang][i], 245, y + 23, 820, 30, { weight: 700, minSize: 24, maxLines: 2 });
      cols.forEach((x, k) => {
        g.strokeStyle = ink;
        g.lineWidth = 4;
        g.strokeRect(x - 24, y + 21, 48, 48);
        if (s.answers[i] === k + 1) check(g, x - 24, y + 21, 48);
      });
      rule(g, 135, y + rowHeight - 10, 1230);
    }
    if (lastPage) {
      drawText(g, u.note, 150, 1560, 1200, 32, { weight: 900 });
      g.strokeStyle = ink;
      g.lineWidth = 3;
      g.strokeRect(135, 1609, 1230, 222);
      const note = (s.note || '').trim();
      const text = note.split('\n').length <= 3 ? note : note.replace(/\s*\n\s*/g, ' ');
      drawText(g, text, 157, 1631, 1185, 30, { color: dark, maxLines: 5, minSize: 23 });
    }
    drawCredit(g, u, 1894);
  }

  function drawResult(g, s, u) {
    frame(g, 'R E S U L T', 1139);
    drawText(g, u.title, 600, 192, 1020, 74, { weight: 900, align: 'center', minSize: 50 });
    drawText(g, u.answers, 600, 310, 1000, 36, { color: dark, align: 'center' });
    const fills = [ink, soft, paper];
    u.choices.forEach((choice, i) => {
      const x = 110 + i * 330;
      g.fillStyle = fills[i];
      g.fillRect(x, 398, 320, 170);
      g.strokeStyle = ink;
      g.lineWidth = 5;
      g.strokeRect(x, 398, 320, 170);
      const color = i === 0 ? 'white' : dark;
      const count = s.answers.filter(a => a === i + 1).length;
      drawText(g, count, x + 160, 412, 295, 85, { weight: 900, color, align: 'center' });
      drawText(g, circles[i] + ' ' + choice, x + 160, 519, 290, 25, { weight: 900, color, align: 'center', minSize: 22 });
    });

    s.answers.forEach((answer, i) => {
      const x = 184 + i % 10 * 84;
      const y = 650 + Math.floor(i / 10) * 86;
      g.fillStyle = fills[answer - 1] || paper;
      g.fillRect(x, y, 76, 76);
      g.strokeStyle = ink;
      g.lineWidth = 4;
      g.strokeRect(x + 2, y + 2, 72, 72);
      drawText(g, String(i + 1).padStart(2, '0'), x + 38, y + 8, 70, 24, { weight: 900, color: answer === 1 ? 'white' : dark, align: 'center' });
      if (answer) drawText(g, circles[answer - 1], x + 38, y + 36, 70, 24, { weight: 900, color: answer === 1 ? 'white' : dark, align: 'center' });
    });
    rule(g, 147, 1002, 906);
    drawCredit(g, u, 1042);
  }

  async function create(s, page) {
    const u = locale[s.lang];
    const isResult = page === null;
    const canvas = document.createElement('canvas');
    canvas.width = isResult ? 1200 : 1500;
    canvas.height = isResult ? 1200 : 2000;
    canvas.dataset.font = u.font;
    const g = canvas.getContext('2d');
    if (!g) throw new Error('Canvas is unavailable');
    const font = s.lang === 'ja' ? '"Zen Maru Gothic"' : '"Sheet Chinese"';
    const words = [u.title, u.answers, u.invitation, u.note, u.credit, ...u.choices, ...D.questions[s.lang], s.note].join('');
    await Promise.all([document.fonts.load('700 30px ' + font, words), document.fonts.load('900 30px ' + font, words)]);
    if (isResult) drawResult(g, s, u);
    else drawSheet(g, s, u, page);
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image encoding failed')), 'image/png');
    });
  }

  return { create };
})();
