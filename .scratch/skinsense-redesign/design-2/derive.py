# Derives state variants and the 390 web copies from the base screens in src/, so a fix to a base
# screen reaches its variants on the next run. Usage: python3 derive.py && node build.mjs page-5
import re
import shutil
from pathlib import Path

SRC = Path(__file__).parent / 'src'
END = '__END__'


def sub(text, old, new, regex):
    if old == END:
        i = text.rstrip().rfind('</div>')
        return text[:i] + new + text[i:]
    out, n = re.subn(old, lambda _: new, text, count=1, flags=re.S) if regex else (text.replace(old, new, 1), text.count(old))
    if not n:
        raise SystemExit(f'pattern not found: {old[:70]!r}')
    return out


def derive(base, name, *steps):
    text = (SRC / f'{base}.html').read_text()
    for old, new, *regex in steps:
        text = sub(text, old, new, bool(regex))
    (SRC / f'{name}.html').write_text(text)


def alert(msg, style=''):
    return f'<p role="alert" class="row" style="gap:8px; {style}color:var(--danger); font-size:14px;"><!--I:alert:16-->{msg}</p>'


def dialog(pos, title, body, cancel, action, danger):
    fill = ' background:var(--danger); color:var(--on-accent);' if danger else ''
    return (
        '  <div style="position:absolute; left:0; right:0; top:0; bottom:0; background:color-mix(in oklab, var(--bg) 72%, transparent); backdrop-filter:blur(3px);"></div>\n'
        f'  <div role="alertdialog" class="card" style="position:absolute; {pos} display:flex; flex-direction:column; gap:14px; padding:24px; background:var(--surface-2); box-shadow:0 24px 60px rgba(0, 0, 0, 0.32);">\n'
        f'    <h2 style="font-family:var(--display); font-size:28px; font-weight:400; line-height:1.2;">{title}</h2>\n'
        f'    <p style="font-size:15px; font-weight:300; line-height:1.55; text-wrap:pretty;">{body}</p>\n'
        f'    <div class="row" style="gap:10px; padding-top:8px;"><div class="btn-o" style="flex-grow:1; height:48px; padding:0 12px;">{cancel}</div><div class="btn" style="flex-grow:1; height:48px; padding:0 12px;{fill}">{action}</div></div>\n'
        '  </div>\n'
    )


ANDROID_DIALOG = 'left:20px; right:20px; top:260px;'
WEB_DIALOG = 'left:500px; top:300px; width:440px;'
TOAST = ('  <div role="status" class="row" style="position:absolute; right:32px; bottom:32px; gap:10px; padding:14px 18px; border-radius:4px; background:var(--surface-2); '
         'border:1px solid color-mix(in oklab, var(--fg) 14%, transparent); box-shadow:0 16px 40px rgba(0, 0, 0, 0.28); font-size:14px;"><span style="color:var(--good);"><!--I:check:18--></span>Đã gửi góp ý. Cảm ơn bạn!</div>\n')
RELATIVE = ('<div style="display:flex; width:1440px;', '<div style="position:relative; display:flex; width:1440px;')
EDIT_FIELD = '<span class="row" style="height:40px; margin-left:-10px; padding:0 10px; border-radius:4px; border:1px solid var(--fg); font-size:15.5px;">Serum trị mụn buổi tối<span style="width:1px; height:20px; margin-left:2px; background:var(--fg);"></span></span>'
NEW_STEP = '<div class="row" style="gap:2px; height:54px; padding:0 18px; border-radius:4px; border:1px solid var(--fg);"><span style="width:1px; height:20px; background:var(--fg);"></span><span class="muted" style="font-size:15px; font-weight:300;">Bước mới</span></div>'
PROGRESS = ('<div role="status" style="display:flex; flex-direction:column; gap:10px;"><div class="row" style="justify-content:space-between; font-size:14px;"><span>Đang tạo tệp…</span><span class="muted">5/12 ảnh</span></div>'
            '<div style="height:1px; background:var(--line);"><div style="width:42%; height:1px; background:var(--fg);"></div></div></div>')
EMPTY_CHART = '<div class="row muted" style="justify-content:center; height:{h}px; font-size:14px; font-weight:300;">Chưa có ảnh trong khoảng này</div>'
EMPTY_COMPARE = '<div class="row muted" style="justify-content:center; aspect-ratio:{ratio}; border-radius:10px; border:1px dashed var(--line); font-size:14px; font-weight:300;">Cần ít nhất 2 ảnh trong khoảng này</div>'
DEMO_BANNER = '''<div style="position:relative; z-index:1; display:flex; flex-direction:column; gap:8px; padding:12px 16px 10px 18px; background:var(--surface-2); border-bottom:1px solid var(--line);">
    <div class="row" style="justify-content:space-between; gap:8px;">
      <span style="font-size:13.5px; font-weight:500;">Dữ liệu mẫu · Xem thử</span>
      <a href="#" class="row" style="min-height:44px; padding:0 4px; font-size:13px;">Đặt lại</a>
    </div>
    <span class="muted" style="margin-top:-8px; font-size:12.5px; font-weight:300;">Hồ sơ mẫu: Da dầu, mụn ở má · 90 ngày. Mọi thay đổi chỉ lưu trên {where} này.</span>
    <span class="btn-o" style="height:44px; font-size:14px;"><!--I:google:16-->Đăng nhập bằng Google</span>
  </div>
  '''
WEB_DEMO_BANNER = '''
    <div class="row" style="position:relative; z-index:1; gap:16px; min-height:64px; padding:0 64px; background:var(--surface-2); border-bottom:1px solid var(--line); font-size:14px;">
      <span style="font-weight:500;">Dữ liệu mẫu · Xem thử</span>
      <span class="muted" style="font-weight:300;">Mọi thay đổi chỉ lưu trên trình duyệt này.</span>
      <span style="padding:4px 12px; border-radius:4px; border:1px solid color-mix(in oklab, var(--fg) 14%, transparent); font-size:13px;">Hồ sơ mẫu: Da dầu, mụn ở má · 90 ngày</span>
      <a href="#" class="row" style="min-height:44px; margin-left:auto; font-size:13.5px;">Đặt lại</a>
      <span class="btn-o" style="height:44px; font-size:14px;"><!--I:google:16-->Đăng nhập bằng Google</span>
    </div>'''

for screen in ['Today', 'Spots', 'Trends', 'Routine', 'History']:
    shutil.copy(SRC / f'Android{screen}.html', SRC / f'Phone{screen}.html')

ROOT_390 = '<div style="position:relative; width:390px; height:844px; overflow:hidden; background:var(--bg); color:var(--fg);">'
for name, where in [('AndroidDemoToday', 'máy'), ('PhoneDemoToday', 'trình duyệt')]:
    derive('AndroidToday', name,
           (ROOT_390, ROOT_390 + '\n  ' + DEMO_BANNER.format(where=where)),
           ('top:0; height:420px;', 'top:160px; height:420px;'),
           ('top:0; height:420px;', 'top:160px; height:420px;'),
           ('left:0; top:0; opacity:0.22;', 'left:0; top:160px; opacity:0.22;'),
           ('top:16px; right:16px;', 'top:176px; right:16px;'),
           ('padding:64px 18px 96px;', 'padding:28px 18px 96px;'))
derive('WebToday', 'WebDemoToday',
       ('<div style="position:relative; flex-grow:1; min-width:0;">', '<div style="position:relative; flex-grow:1; min-width:0;">' + WEB_DEMO_BANNER),
       ('padding:64px 64px 56px;', 'padding:40px 64px 56px;'))

LIGHT_OK = '<span style="width:6px; height:6px; border-radius:999px; background:var(--good);"></span>Đủ sáng'
derive('AndroidCapture', 'AndroidCaptureIssue', (LIGHT_OK, '<!--I:alert:15-->Thiếu sáng'))
derive('WebCapture', 'WebCaptureIssue', (LIGHT_OK, '<!--I:alert:15-->Thiếu sáng'))

derive('AndroidCaptureReview', 'AndroidCaptureSaveError',
       (' filter:brightness(0.72);', ''),
       (r'<div role="alert" class="card".*?Nhìn thẳng vào camera</div>\s*</div>', alert('Lưu thất bại. Vui lòng thử lại.', 'margin:14px 24px 0; '), 1),
       ('>Vẫn lưu<', '>Lưu<'))

derive('AndroidSpots', 'AndroidSpotsNoFace',
       (r'<span style="position:absolute; left:153px.*?left:158px.*?</span></span>',
        '<div role="alert" style="position:absolute; left:0; right:0; top:0; bottom:0; display:flex; align-items:center; justify-content:center; padding:40px; background:color-mix(in oklab, var(--bg) 55%, transparent); text-align:center; font-size:15px; font-weight:300; line-height:1.55;">Không thấy khuôn mặt trong ảnh này nên không gán được nốt vào vùng.</div>', 1),
       (r'\s*<div style="display:flex; align-items:center; justify-content:center; gap:8px; padding:18px.*?Lưu</div>\s*</div>', '', 1))
derive('AndroidSpots', 'AndroidSpotsError',
       (r'<span style="width:8px; height:8px; border-radius:999px; background:var\(--accent\);"></span>\s*3 nốt đã đánh dấu — chạm vào ảnh để thêm',
        '<span style="flex-shrink:0; color:var(--danger);"><!--I:alert:16--></span>Chạm vào da trong các vùng mặt (trán, má, mũi, cằm)', 1),
       ('<div style="margin-top:auto; padding:20px 20px 32px;">', '<div style="margin-top:auto; padding:20px 20px 32px;">\n    ' + alert('Lưu thất bại. Vui lòng thử lại.', 'justify-content:center; padding-bottom:12px; ')))
derive('WebSpots', 'WebSpotsError',
       (r'<span style="flex-shrink:0; width:8px; height:8px; border-radius:999px; background:var\(--accent\);"></span>\s*3 nốt đã đánh dấu — chạm vào ảnh để thêm',
        '<span style="flex-shrink:0; color:var(--danger);"><!--I:alert:16--></span>Chạm vào da trong các vùng mặt (trán, má, mũi, cằm)', 1),
       ('<div style="display:flex; align-items:center; justify-content:center; width:200px;', alert('Lưu thất bại. Vui lòng thử lại.', 'padding-top:4px; ') + '\n        <div style="display:flex; align-items:center; justify-content:center; width:200px;'))

SPOTS_ONE = '1<span style="font-family:var(--font); font-size:13px; font-weight:300; color:var(--muted);"> / Trán</span>'
derive('AndroidTrends', 'AndroidTrendsEmpty',
       (r'<span style="font-size:12px; font-weight:500; color:var\(--good\);">↓ đang giảm</span>\s*</div>\s*<svg viewBox="0 0 328 160".*?</svg>\s*<div style="display:flex; justify-content:flex-end;">.*?</div>\s*<div style="display:flex; justify-content:space-between; font-size:11px;.*?</div>',
        '</div>\n      ' + EMPTY_CHART.format(h=190), 1),
       (SPOTS_ONE, '—'),
       (r'<svg width="64" height="20".*?</svg>', '', 1),
       (r'<div style="position:relative; aspect-ratio:16 / 9;.*?placeholder</span>\s*</div>', EMPTY_COMPARE.format(ratio='16 / 9'), 1))
derive('WebTrends', 'WebTrendsEmpty',
       (r'<div style="display:flex; align-items:baseline; gap:16px;">.*?</div>', '', 1),
       (r'<svg viewBox="0 0 560 200".*?</svg>\s*<div style="display:flex; justify-content:space-between; font-size:11px;.*?</div>', EMPTY_CHART.format(h=240), 1),
       (SPOTS_ONE, '—'),
       (r'<svg width="64" height="20".*?</svg>', '', 1),
       (r'<div style="position:relative; aspect-ratio:3 / 4; max-height:460px;.*?placeholder</span>\s*</div>', EMPTY_COMPARE.format(ratio='3 / 4; max-height:460px'), 1))

for platform in ['Android', 'Web']:
    derive(f'{platform}Routine', f'{platform}RoutineEdit',
           (r'\s*<!-- Open menu for "Serum trị mụn" -->.*?Xóa</span>\s*</div>', '', 1),
           ('border-radius:999px; background:color-mix(in oklab, var(--fg) 10%, transparent); color:var(--fg);', 'color:var(--muted);'),
           ('<span style="font-size:15.5px; font-weight:400;">Serum trị mụn</span>', EDIT_FIELD),
           (r'<div style="display:flex; align-items:center; gap:10px; height:54px;.*?Thêm bước\s*</div>', NEW_STEP, 1))

derive('AndroidSignIn', 'AndroidSignInError',
       ('<div style="display:flex; flex-direction:column; align-items:flex-start; font-size:12.5px;', alert('Đăng nhập thất bại: [thông báo lỗi]') + '\n    <div style="display:flex; flex-direction:column; align-items:flex-start; font-size:12.5px;'))

derive('AndroidDelete', 'AndroidDeleting',
       ('<div class="btn-o" style="flex-grow:1; padding:0 12px;">Hủy</div>', '<div class="btn-o" style="flex-grow:1; padding:0 12px; opacity:0.4;">Hủy</div>'),
       ('color:var(--on-accent);">Xóa tài khoản</div>', 'color:var(--on-accent); opacity:0.8;"><span style="width:16px; height:16px; border-radius:999px; border:2px solid currentColor; border-right-color:transparent;"></span>Đang xóa…</div>'))
derive('WebDelete', 'WebDeleting', ('Không thể khôi phục.</p>', 'Không thể khôi phục.</p>\n    ' + alert('Xóa không thành công. Thử lại sau.')))

PHOTO_DIALOG = ('Xóa ảnh này?', 'Xóa ảnh, nốt mụn, chỉ số và ghi chú của đêm 13 thg 9. Không thể khôi phục.', 'Hủy', 'Xóa ảnh', True)
derive('AndroidPhoto', 'AndroidPhotoDelete', (END, dialog(ANDROID_DIALOG, *PHOTO_DIALOG)))
derive('WebPhoto', 'WebPhotoDelete', RELATIVE, (END, dialog(WEB_DIALOG, *PHOTO_DIALOG)))

derive('AndroidExport', 'AndroidExportProgress',
       (r'<div class="btn"><!--I:download:18-->Tạo tệp \.zip</div>\s*<span class="muted"[^>]*>Tệp được lưu vào thư mục Tải xuống\.</span>', PROGRESS + '\n    <div class="btn-o" style="margin-top:8px;">Hủy</div>', 1))
derive('WebExport', 'WebExportProgress',
       ('<div class="btn" style="align-self:flex-start; margin-top:8px;"><!--I:download:18-->Tạo tệp .zip</div>', PROGRESS + '\n      <div class="btn-o" style="align-self:flex-start; margin-top:8px;">Hủy</div>'))

derive('WebSettings', 'WebFeedbackSent', RELATIVE, (END, TOAST))

derive('AndroidReminder', 'AndroidReminderDenied',
       ('Nhắc mỗi tối <!--TOG:on--></div>',
        'Nhắc mỗi tối <!--TOG:off--></div>\n    <div role="alert" class="card" style="display:flex; flex-direction:column; gap:12px; padding:16px 18px; border-color:color-mix(in oklab, var(--danger) 45%, transparent);">'
        '<div class="row" style="gap:10px; font-size:14.5px; font-weight:500;"><span style="color:var(--danger);"><!--I:bell:18--></span>Thông báo đang tắt cho SkinSense</div>'
        '<p class="muted" style="font-size:13.5px; font-weight:300; line-height:1.5;">Bật lại trong cài đặt của Android để nhận nhắc lúc 21:30.</p>'
        '<div class="btn-o" style="height:44px; font-size:14px;">Mở cài đặt thông báo</div></div>'),
       ('align-items:center; gap:2px; padding:22px 18px;">', 'align-items:center; gap:2px; padding:22px 18px; opacity:0.45;">'),
       ('grid-template-columns:repeat(7, minmax(0, 1fr)); justify-items:center;">', 'grid-template-columns:repeat(7, minmax(0, 1fr)); justify-items:center; opacity:0.45;">'))

for screen in ['Photo', 'Compare', 'Share', 'Export']:
    shutil.copy(SRC / f'Android{screen}.html', SRC / f'Phone{screen}.html')
derive('AndroidFeedback', 'PhoneFeedback', ('Đính kèm phiên bản ứng dụng và loại máy', 'Đính kèm trình duyệt và phiên bản ứng dụng'))
derive('AndroidOnboarding1', 'PhoneOnboarding')

EXPORT_FAIL = 'Không tạo được tệp. Kiểm tra dung lượng trống rồi thử lại.'
SEND_FAIL = 'Gửi thất bại. Vui lòng thử lại.'
derive('AndroidExport', 'AndroidExportError',
       ('<div style="display:flex; flex-direction:column; gap:10px; margin:auto 20px 28px;">', '<div style="display:flex; flex-direction:column; gap:10px; margin:auto 20px 28px;">\n    ' + alert(EXPORT_FAIL, 'justify-content:center; ')))
derive('WebExport', 'WebExportError',
       ('<div class="btn" style="align-self:flex-start; margin-top:8px;"><!--I:download:18-->Tạo tệp .zip</div>', alert(EXPORT_FAIL, 'padding-top:4px; ') + '\n      <div class="btn" style="align-self:flex-start; margin-top:8px;"><!--I:download:18-->Tạo tệp .zip</div>'))
derive('AndroidFeedback', 'AndroidFeedbackError',
       ('<div class="btn" style="margin:auto 20px 28px;">Gửi góp ý</div>', alert(SEND_FAIL, 'justify-content:center; margin:auto 20px 12px; ') + '\n  <div class="btn" style="margin:0 20px 28px;">Gửi góp ý</div>'))
derive('WebFeedback', 'WebFeedbackError',
       ('<div class="btn" style="align-self:flex-start; margin-top:8px;">Gửi góp ý</div>', alert(SEND_FAIL, 'padding-top:4px; ') + '\n      <div class="btn" style="align-self:flex-start; margin-top:8px;">Gửi góp ý</div>'))

derive('AndroidSettings', 'AndroidLockNotEnrolled',
       (END, dialog(ANDROID_DIALOG, 'Máy chưa cài vân tay', 'Thêm vân tay trong cài đặt bảo mật của Android rồi bật lại Khóa bằng vân tay.', 'Để sau', 'Mở cài đặt', False)))

print('derived ok')
