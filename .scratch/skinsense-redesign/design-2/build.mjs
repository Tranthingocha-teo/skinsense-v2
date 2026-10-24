// Writes the light/dark twins of every src/<Platform><Screen>.html from packages/tokens/tokens.json,
// wraps each body in the .dc.html shell, expands the shared snippets below, and writes canvas.json
// (frame size = the root element's width/height). Contrast is gated by packages/tokens/build.mjs.
// Android Today dark doubles as Main.dc.html. Usage: node build.mjs [launch page id]
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const here = (p) => new URL(p, import.meta.url);
const T = JSON.parse(readFileSync(here('../../../packages/tokens/tokens.json'), 'utf8'));

const PAGES = [
  {
    id: 'page-1',
    name: 'App core',
    note: 'App core · C3 Night photo\nNoto Serif Display 300/400 + Manrope, màu từ packages/tokens/tokens.json.\n\nẢnh và khung camera là placeholder gradient.',
    rows: [
      ['AndroidToday', 'AndroidCapture', 'AndroidSpots', 'AndroidTrends', 'AndroidRoutine'],
      ['WebToday', 'WebCapture', 'WebSpots', 'WebTrends', 'WebRoutine'],
    ],
  },
  {
    id: 'page-2',
    name: 'Tài khoản & trạng thái',
    note: 'Tài khoản, dialog và trạng thái\nWeb không có màn đăng nhập riêng: nút Google nằm trên landing (trang Trang web).\n\nCài đặt vẽ ở trạng thái cuối, đã có hàng cho các tính năng mới. Tên, email là placeholder trong ngoặc vuông.',
    rows: [
      ['AndroidSignIn', 'AndroidSettings', 'AndroidDelete', 'AndroidFirstRun', 'AndroidLoading', 'AndroidLoadError', 'AndroidCaptureReview', 'AndroidCaptureSaved', 'AndroidCameraDenied'],
      ['WebSettings', 'WebDelete', 'WebFirstRun', 'WebLoading', 'WebLoadError', 'WebCaptureReview', 'WebCaptureSaved', 'WebCameraDenied'],
    ],
  },
  {
    id: 'page-3',
    name: 'Trang web',
    note: 'Trang web công khai\nLanding và case study có bản 1440 và 390 (Lighthouse chấm theo mobile). Privacy và 404 chỉ một cột nên chỉ vẽ 1440.\n\nCase study bằng tiếng Anh; số liệu chưa đo nằm trong ngoặc vuông.',
    rows: [
      ['WebLanding', 'WebCaseStudy', 'WebPrivacy', 'WebNotFound'],
      ['PhoneLanding', 'PhoneCaseStudy'],
    ],
  },
  {
    id: 'page-4',
    name: 'Tính năng mới',
    note: 'Tính năng mới\nNhắc routine, giới thiệu & giấy phép, khóa vân tay chỉ có trên Android.\n\nTag, giờ nhắc, dung lượng xuất là dữ liệu mẫu.',
    rows: [
      ['AndroidOnboarding1', 'AndroidOnboarding2', 'AndroidOnboarding3', 'AndroidHistory', 'AndroidPhoto', 'AndroidCompare', 'AndroidShare', 'AndroidReminder', 'AndroidExport', 'AndroidFeedback', 'AndroidAbout', 'AndroidLock'],
      ['WebOnboarding', 'WebHistory', 'WebPhoto', 'WebCompare', 'WebShare', 'WebExport', 'WebFeedback'],
    ],
  },
  {
    id: 'page-5',
    name: 'Hoàn thiện',
    note: 'Hoàn thiện cho production\nHàng 1: /app ở 390 (Lighthouse chấm mobile mọi trang). Hôm nay, Đánh dấu, Xu hướng, Routine, Lịch sử giống hệt Android; web khác ở Chụp (trình duyệt điện thoại chưa hỗ trợ) và Cài đặt (không có nhắc, khóa, giới thiệu).\nHàng 2–3: Xem thử và lỗi riêng từng màn. Hàng 3 cuối: trạng thái tương tác web.\nHàng 4: icon, splash, ảnh OG — bản light/dark là hai biến thể để chọn.',
    rows: [
      ['PhoneToday', 'PhoneCapture', 'PhoneSpots', 'PhoneTrends', 'PhoneRoutine', 'PhoneHistory', 'PhoneSettings', 'PhoneDemoToday', 'PhoneOnboarding', 'PhonePhoto', 'PhoneCompare', 'PhoneShare', 'PhoneExport', 'PhoneFeedback'],
      ['AndroidDemoToday', 'AndroidCaptureIssue', 'AndroidCaptureSaveError', 'AndroidSpotsNoFace', 'AndroidSpotsError', 'AndroidTrendsEmpty', 'AndroidRoutineEdit', 'AndroidSignInError', 'AndroidDeleting', 'AndroidPhotoDelete', 'AndroidExportProgress', 'AndroidExportError', 'AndroidFeedbackSent', 'AndroidFeedbackError', 'AndroidReminderDenied', 'AndroidLockNotEnrolled'],
      ['WebDemoToday', 'WebCaptureIssue', 'WebSpotsError', 'WebTrendsEmpty', 'WebRoutineEdit', 'WebDeleting', 'WebPhotoDelete', 'WebExportProgress', 'WebExportError', 'WebFeedbackSent', 'WebFeedbackError', 'WebInteraction'],
      ['BrandIcon', 'BrandSplash', 'BrandOG', 'BrandMotion'],
    ],
  },
];
const PLATFORM = { Android: 'Android', Web: 'Web', Phone: 'Web 390', Brand: 'Brand' };
const SCREEN = {
  Today: 'Hôm nay', Capture: 'Chụp', Spots: 'Đánh dấu nốt', Trends: 'Xu hướng', Routine: 'Routine',
  SignIn: 'Đăng nhập', Settings: 'Cài đặt', Delete: 'Xóa tài khoản', FirstRun: 'Lần đầu, chưa có ảnh', Loading: 'Đang tải',
  LoadError: 'Lỗi tải', CaptureReview: 'Chụp · xem lại', CaptureSaved: 'Chụp · đã lưu', CameraDenied: 'Không có camera',
  Landing: 'Landing', CaseStudy: 'Case study', Privacy: 'Chính sách riêng tư', NotFound: '404',
  Onboarding: 'Onboarding', Onboarding1: 'Onboarding 1/3', Onboarding2: 'Onboarding 2/3', Onboarding3: 'Onboarding 3/3',
  History: 'Lịch sử ảnh', Photo: 'Chi tiết ảnh · ghi chú, tag', Compare: 'Chọn 2 ngày so sánh', Share: 'Chia sẻ trước/sau',
  Reminder: 'Nhắc routine', Export: 'Xuất dữ liệu', Feedback: 'Góp ý', About: 'Giới thiệu & giấy phép', Lock: 'Khóa vân tay',
  DemoToday: 'Xem thử · Hôm nay', CaptureIssue: 'Chụp · ánh sáng kém', CaptureSaveError: 'Chụp · lưu lỗi',
  SpotsNoFace: 'Đánh dấu · không thấy mặt', SpotsError: 'Đánh dấu · ngoài vùng, lưu lỗi', TrendsEmpty: 'Xu hướng · chưa đủ ảnh',
  RoutineEdit: 'Routine · đổi tên, thêm bước', SignInError: 'Đăng nhập · lỗi', Deleting: 'Xóa tài khoản · đang xóa, lỗi',
  PhotoDelete: 'Xóa ảnh · xác nhận', ExportProgress: 'Xuất dữ liệu · đang tạo', FeedbackSent: 'Góp ý · đã gửi',
  ReminderDenied: 'Nhắc · chưa cho phép thông báo', LockNotEnrolled: 'Khóa · máy chưa cài vân tay',
  Interaction: 'Trạng thái tương tác', Icon: 'Icon app & favicon', Splash: 'Splash', OG: 'Ảnh OG 1200×630',
  ExportError: 'Xuất dữ liệu · lỗi', FeedbackError: 'Góp ý · gửi lỗi', Motion: 'Motion (theo DESIGN.md)',
};

const ICONS = {
  today: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"></path>',
  capture: '<rect x="3" y="7" width="18" height="13" rx="2.5"></rect><path d="M8 7l1.6-2.5h4.8L16 7"></path><circle cx="12" cy="13.2" r="3.4"></circle>',
  trends: '<path d="M4 16l5-5 4 3 7-7"></path><path d="M15 7h5v5"></path>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"></path><circle cx="16" cy="7" r="2"></circle><circle cx="8" cy="17" r="2"></circle>',
  back: '<path d="M15 5l-7 7 7 7"></path>',
  chevron: '<path d="M9 5l7 7-7 7"></path>',
  check: '<path d="M5 13l4 4L19 7"></path>',
  plus: '<path d="M12 5v14M5 12h14"></path>',
  close: '<path d="M6 6l12 12M18 6L6 18"></path>',
  kebab: '<circle cx="12" cy="5.5" r="0.9"></circle><circle cx="12" cy="12" r="0.9"></circle><circle cx="12" cy="18.5" r="0.9"></circle>',
  alert: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5.5"></path><path d="M12 16.4v.2"></path>',
  cameraoff: '<rect x="3" y="7" width="18" height="13" rx="2.5"></rect><path d="M8 7l1.6-2.5h4.8L16 7"></path><path d="M3 3l18 18"></path>',
  cloudoff: '<path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 9.2 4.5 4.5 0 0 0 7 18z"></path><path d="M4 4l16 16"></path>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"></path><path d="M20 4v7h-7"></path>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"></path><path d="M10 20.5a2 2 0 0 0 4 0"></path>',
  download: '<path d="M12 4v11"></path><path d="M7 10l5 5 5-5"></path><path d="M5 20h14"></path>',
  share: '<path d="M12 15V4"></path><path d="M8 8l4-4 4 4"></path><path d="M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7"></path>',
  info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v6"></path><path d="M12 7.6v.2"></path>',
  message: '<path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H5a1 1 0 0 1-1-1z"></path>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"></rect><circle cx="9" cy="10" r="1.8"></circle><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"></path>',
  tag: '<path d="M3.5 12.5v-8a1 1 0 0 1 1-1h8l8 8-9 9z"></path><circle cx="8" cy="8" r="1.3"></circle>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"></rect><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"></path>',
  fingerprint: '<path d="M4 9a9 9 0 0 1 16 0"></path><path d="M5.5 16.5c.6-1.6 1-3 1-4.5a5.5 5.5 0 0 1 11 0c0 1.5-.1 3-.4 4.5"></path><path d="M8.5 20c1-2 1-4.5 1-8a2.5 2.5 0 0 1 5 0c0 2-.2 4-.8 6"></path><path d="M12 12c0 3.5-.6 6-1.8 8.5"></path>',
  google: '<path d="M20 12a8 8 0 1 1-2.34-5.66"></path><path d="M20 12h-7"></path>',
  swap: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"></path>',
  file: '<path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z"></path><path d="M14 3.5V8h4"></path>',
  external: '<path d="M14 4h6v6"></path><path d="M20 4l-9 9"></path><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"></path>',
  sun: '<circle cx="12" cy="12" r="4"></circle><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"></path>',
};
const NAV = ['today', 'capture', 'trends', 'settings'];
const LABELS = { today: 'Hôm nay', capture: 'Chụp', trends: 'Xu hướng', settings: 'Cài đặt' };
const icon = (k, s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;

const SNIPPETS = [
  [/<!--TABS:(\w+)-->/g, (_, active) =>
    `<div style="position:absolute; left:0; right:0; bottom:0; display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); height:72px; padding-bottom:6px; background:color-mix(in oklab, var(--bg) 82%, transparent); border-top:1px solid var(--line); backdrop-filter:blur(18px);">` +
    NAV.map((k) => `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; color:var(${k === active ? '--fg' : '--muted'}); font-size:11px; font-weight:${k === active ? 600 : 400}; letter-spacing:0.04em;">${icon(k, 23)}${LABELS[k]}</div>`).join('') +
    '</div>'],
  [/<!--NAV:(\w+)-->/g, (_, active) =>
    `<nav style="position:relative; display:flex; flex-direction:column; gap:28px; width:240px; flex-shrink:0; padding:24px 16px; background:var(--bg); border-right:1px solid var(--line);"><span style="padding:0 12px; font-family:var(--display); font-size:26px; font-weight:300; line-height:1.2;">SkinSense</span><div style="display:flex; flex-direction:column; gap:4px;">` +
    NAV.map((k) => `<div style="display:flex; align-items:center; gap:12px; min-height:44px; padding:0 12px; border-radius:4px; font-size:14.5px; ${k === active ? 'background:color-mix(in oklab, var(--fg) 8%, transparent); color:var(--fg); font-weight:500;' : 'color:var(--muted); font-weight:400;'}">${icon(k, 20)}${LABELS[k]}</div>`).join('') +
    '</div></nav>'],
  [/<!--I:(\w+):(\d+)-->/g, (_, k, s) => icon(k, s)],
  [/<!--TICK-->/g, () => '<span style="display:flex; align-items:center; justify-content:center; flex-shrink:0; width:22px; height:22px; border-radius:999px; background:var(--accent); color:var(--on-accent);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"></path></svg></span>'],
  [/<!--TICKOFF-->/g, () => '<span style="flex-shrink:0; width:22px; height:22px; border-radius:999px; border:1px solid var(--fg);"></span>'],
  [/<!--TOG:(on|off)-->/g, (_, s) => s === 'on'
    ? '<span style="display:flex; align-items:center; justify-content:flex-end; flex-shrink:0; width:52px; height:32px; padding:4px; border-radius:999px; background:var(--accent);"><span style="width:24px; height:24px; border-radius:999px; background:var(--on-accent);"></span></span>'
    : '<span style="display:flex; align-items:center; flex-shrink:0; width:52px; height:32px; padding:4px; border-radius:999px; background:var(--surface-2); border:1px solid var(--line);"><span style="width:22px; height:22px; border-radius:999px; background:var(--muted);"></span></span>'],
  [/<!--MARKDRAW:(\d+)-->/g, (_, s) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64" fill="none"><circle class="draw" cx="28" cy="32" r="18" style="stroke:var(--fg); stroke-width:1.6;"></circle><circle class="draw" cx="36" cy="32" r="18" style="stroke:var(--fg); stroke-opacity:0.45; stroke-width:1.6; animation-delay:0.25s;"></circle><circle class="draw-dot" cx="32" cy="14.45" r="2.2" style="fill:var(--fg);"></circle></svg>`],
  [/<!--MARK:(\d+)-->/g, (_, s) => `<svg width="${s}" height="${s}" viewBox="0 0 64 64" fill="none"><circle cx="28" cy="32" r="18" style="stroke:var(--fg); stroke-width:1.6;"></circle><circle cx="36" cy="32" r="18" style="stroke:var(--fg); stroke-opacity:0.45; stroke-width:1.6;"></circle><circle cx="32" cy="14.45" r="2.2" style="fill:var(--fg);"></circle></svg>`],
];

const shell = (tokens, body) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+Display:wght@300;400&family=Manrope:wght@300;400;500;600&display=swap">
  <style>
    :root { ${tokens} --display: 'Noto Serif Display', Georgia, 'Times New Roman', serif; --font: 'Manrope', 'Segoe UI', system-ui, sans-serif; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--fg); font-family: var(--font); }
    a { color: var(--fg); text-decoration: underline; text-underline-offset: 4px; }
    a:hover { color: var(--muted); }
    h1, h2, h3, p { margin: 0; }
    .d { font-family: var(--display); font-weight: 300; }
    .lbl { font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
    .muted { color: var(--muted); }
    .card { border-radius: 18px; background: var(--surface); border: 1px solid color-mix(in oklab, var(--fg) 10%, transparent); }
    .glass { border-radius: 18px; background: color-mix(in oklab, var(--surface) 72%, transparent); border: 1px solid color-mix(in oklab, var(--fg) 14%, transparent); backdrop-filter: blur(18px); }
    .btn { display: flex; align-items: center; justify-content: center; gap: 10px; height: 52px; padding: 0 24px; border-radius: 4px; background: var(--accent); color: var(--on-accent); font-size: 15px; font-weight: 500; }
    .btn-o { display: flex; align-items: center; justify-content: center; gap: 10px; height: 52px; padding: 0 24px; border-radius: 4px; border: 1px solid color-mix(in oklab, var(--fg) 55%, transparent); font-size: 15px; font-weight: 400; }
    .chip { display: flex; align-items: center; gap: 6px; height: 44px; padding: 0 16px; border-radius: 4px; border: 1px solid color-mix(in oklab, var(--fg) 14%, transparent); font-size: 14px; color: var(--muted); }
    .chip-on { display: flex; align-items: center; gap: 6px; height: 44px; padding: 0 16px; border-radius: 4px; background: var(--accent); color: var(--on-accent); font-size: 14px; font-weight: 500; }
    .ph { padding: 4px 10px; border: 1px dashed color-mix(in oklab, var(--fg) 45%, transparent); border-radius: 999px; font-size: 11px; }
    .photo { background: radial-gradient(40% 34% at 50% 46%, color-mix(in oklab, var(--photo-c) 38%, transparent), transparent 72%), radial-gradient(90% 70% at 20% 85%, var(--photo-a), transparent 75%), linear-gradient(180deg, var(--photo-b), var(--photo-a)); }
    .night { background: radial-gradient(60% 60% at 75% 10%, color-mix(in oklab, var(--photo-c) 32%, transparent), transparent 70%), linear-gradient(180deg, var(--photo-b), var(--bg)); }
    .row { display: flex; align-items: center; }
    .hit { display: flex; align-items: center; justify-content: center; flex-shrink: 0; width: 44px; height: 44px; }
    .line { border-top: 1px solid var(--line); }
    .cal { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; height: 44px; font-size: 14px; }
    .cal-on { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; width: 44px; height: 44px; margin: 0 auto; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: 14px; font-weight: 500; }
    .dot { width: 4px; height: 4px; border-radius: 999px; background: currentColor; }
    .tile { position: relative; aspect-ratio: 3 / 4; border-radius: 6px; overflow: hidden; }
    @keyframes fade-in-down { from { opacity: 0; transform: translateY(-12px); } }
    @keyframes fade { from { opacity: 0; } }
    @keyframes grow-x { from { transform: scaleX(0); } }
    @keyframes draw { from { stroke-dashoffset: 113.1; } }
    .in { animation: fade-in-down 460ms ease-out both; }
    .grow { transform-origin: left; animation: grow-x 360ms ease-out both; }
    .draw { stroke-dasharray: 113.1; animation: draw 1.4s cubic-bezier(0.65, 0, 0.35, 1) both; }
    .draw-dot { animation: fade 0.4s ease-out 1.2s both; }
    @media (prefers-reduced-motion: reduce) { .in { animation-name: fade; } .grow, .draw { animation: none; } }
    .tile-meta { position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: space-between; padding: 16px 7px 6px; background: linear-gradient(180deg, transparent, color-mix(in oklab, var(--bg) 82%, transparent)); font-size: 11px; font-weight: 500; }
  </style>
</helmet>
${body}
</x-dc>
</body>
</html>
`;

const artboards = [];
const annotations = [];
for (const page of PAGES) {
  let pageY = 0;
  annotations.push({ id: `note-${page.id}`, x: -400, y: pageY, w: 320, page: page.id, text: page.note });
  for (const row of page.rows) {
    let x = 0;
    let rowH = 0;
    for (const name of row) {
      if (!existsSync(here(`./src/${name}.html`))) continue;
      const body = SNIPPETS.reduce((s, [re, fn]) => s.replace(re, fn), readFileSync(here(`./src/${name}.html`), 'utf8'));
      const [, w, h] = body.match(/width:(\d+)px; height:(\d+)px/).map(Number);
      const [, platform, screen] = name.match(/^(Android|Web|Phone|Brand)(\w+)$/);
      for (const theme of ['Light', 'Dark']) {
        const tokens = Object.entries(T.color[theme.toLowerCase()]).map(([k, v]) => `--${k}: ${v};`).join(' ');
        const file = name === 'AndroidToday' && theme === 'Dark' ? 'Main' : `${name}${theme}`;
        writeFileSync(here(`./${file}.dc.html`), shell(tokens, body));
        artboards.push({ file: `${file}.dc.html`, title: `${PLATFORM[platform]} · ${SCREEN[screen]} · ${theme.toLowerCase()}`, x, y: pageY, w, h, page: page.id });
        x += w + 80;
      }
      x += 80;
      rowH = Math.max(rowH, h);
    }
    if (rowH) pageY += rowH + 180;
  }
}
const launch = process.argv[2] ?? 'page-1';
writeFileSync(here('./canvas.json'), `${JSON.stringify({ pages: PAGES.map(({ id, name }) => ({ id, name })), artboards, annotations, launch: { view: 'canvas', page: launch } }, null, 2)}\n`);
console.log(`built ${artboards.length} artboards, launch ${launch}`);
