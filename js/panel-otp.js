// ============================================
// panel-otp.js - Одноразовий код на пошту для входу
// в адмін-панель / панель засновника.
//
// Логіка: код прив'язується до session_id ПОТОЧНОЇ сесії Supabase
// (JWT-claim session_id) і зберігається в localStorage. Це означає:
//   - поки юзер сидить в тій самій сесії (не виходив з акаунту) -
//     код питається лише 1 раз, на наступних заходах у панель - ні;
//   - новий вхід в акаунт (новий логін) АБО вхід з іншого пристрою/
//     браузера створює НОВУ сесію з іншим session_id - і оскільки
//     localStorage локальний для пристрою/браузера, там про попереднє
//     підтвердження нічого нема - код попросять знову.
// ============================================

function _panelOtpDecodeJwt(token) {
    try {
        var base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        var json = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

async function _panelOtpSessionKey() {
    var { data } = await window.sb.auth.getSession();
    var session = data && data.session;
    if (!session) return null;
    var payload = _panelOtpDecodeJwt(session.access_token);
    var sid = (payload && (payload.session_id || payload.sid)) || session.access_token.slice(-32);
    return 'panelOtpVerified_' + sid;
}

async function isPanelOtpVerified() {
    var key = await _panelOtpSessionKey();
    if (!key) return false;
    return localStorage.getItem(key) === 'true';
}

async function markPanelOtpVerified() {
    var key = await _panelOtpSessionKey();
    if (key) localStorage.setItem(key, 'true');
}

// Викликається при виході з акаунту / новому вході - щоб наступна сесія
// (навіть у цьому ж браузері) знову запитала код.
function clearAllPanelOtpFlags() {
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('panelOtpVerified_') === 0) toRemove.push(k);
    }
    toRemove.forEach(function (k) { localStorage.removeItem(k); });
}

// Показує модалку введення коду. Автоматично надсилає код при відкритті.
// Повертає Promise<boolean> (true - код підтверджено).
function showPanelOtpModal(email, panelLabel) {
    return new Promise(function (resolve) {
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText =
            'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);' +
            'backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;' +
            'padding:1rem;';

        overlay.innerHTML =
            '<div style="background:var(--ink-soft,#171A21);border:1px solid var(--ink-line,#2A2E38);border-radius:12px;' +
            'padding:2rem;max-width:420px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.6);' +
            'color:var(--text-onink,#E7E4DA);font-family:\'IBM Plex Sans\',sans-serif;">' +
                '<div style="text-align:center;font-size:2.5rem;color:var(--gold,#F2A93B);margin-bottom:1rem;">' +
                    '<i class="fas fa-shield-halved"></i>' +
                '</div>' +
                '<h3 style="text-align:center;font-size:1.15rem;font-weight:700;margin-bottom:0.5rem;">' +
                    'Підтвердження входу до ' + panelLabel +
                '</h3>' +
                '<p style="text-align:center;color:var(--muted,#8B93A6);margin-bottom:1.25rem;font-size:0.9rem;">' +
                    'Одноразовий код надіслано на <strong>' + email + '</strong>. Введіть 6-значний код з листа.' +
                '</p>' +
                '<input type="text" id="panelOtpInput" maxlength="6" inputmode="numeric" autocomplete="one-time-code" ' +
                'placeholder="000000" style="width:100%;text-align:center;letter-spacing:0.5em;font-size:1.5rem;' +
                'font-family:\'IBM Plex Mono\',monospace;padding:0.75rem 1rem;background:var(--ink,#0F1115);' +
                'border:1px solid var(--ink-line,#2A2E38);border-radius:6px;color:inherit;margin-bottom:0.75rem;">' +
                '<div id="panelOtpMsg" style="text-align:center;font-size:0.8rem;color:var(--muted,#8B93A6);margin-bottom:1rem;min-height:1.2em;"></div>' +
                '<div style="display:flex;gap:0.75rem;">' +
                    '<button id="panelOtpCancel" type="button" style="flex:1;padding:0.7rem;border-radius:6px;' +
                    'border:1px solid var(--ink-line,#2A2E38);background:transparent;color:inherit;cursor:pointer;font-weight:600;">' +
                        'Скасувати' +
                    '</button>' +
                    '<button id="panelOtpSubmit" type="button" style="flex:2;padding:0.7rem;border-radius:6px;' +
                    'border:none;background:var(--gold,#F2A93B);color:#0F1115;font-weight:700;cursor:pointer;">' +
                        'Підтвердити' +
                    '</button>' +
                '</div>' +
                '<div style="text-align:center;margin-top:1rem;">' +
                    '<a href="#" id="panelOtpResend" style="color:var(--teal,#46C9B8);font-size:0.85rem;text-decoration:none;">' +
                        'Надіслати код повторно' +
                    '</a>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var input = overlay.querySelector('#panelOtpInput');
        var msg = overlay.querySelector('#panelOtpMsg');
        var submitBtn = overlay.querySelector('#panelOtpSubmit');
        var resendLink = overlay.querySelector('#panelOtpResend');
        var cancelBtn = overlay.querySelector('#panelOtpCancel');
        var resendCooldown = false;

        function setMsg(text, isError) {
            msg.textContent = text || '';
            msg.style.color = isError ? '#E2503E' : 'var(--muted,#8B93A6)';
        }

        async function sendCode() {
            setMsg('Надсилаємо код...');
            try {
                // shouldCreateUser:false - юзер вже існує, просто шлемо йому
                // одноразовий OTP-код на пошту (не створюємо нового акаунту).
                var { error } = await window.sb.auth.signInWithOtp({
                    email: email,
                    options: { shouldCreateUser: false }
                });
                if (error) throw error;
                setMsg('Код надіслано на пошту.');
            } catch (e) {
                setMsg('Не вдалося надіслати код: ' + e.message, true);
            }
        }

        sendCode();
        setTimeout(function () { input.focus(); }, 50);

        resendLink.addEventListener('click', function (e) {
            e.preventDefault();
            if (resendCooldown) return;
            resendCooldown = true;
            sendCode();
            var seconds = 30;
            resendLink.style.opacity = '0.5';
            var original = 'Надіслати код повторно';
            var iv = setInterval(function () {
                seconds--;
                resendLink.textContent = 'Повторно через ' + seconds + 'с';
                if (seconds <= 0) {
                    clearInterval(iv);
                    resendLink.textContent = original;
                    resendLink.style.opacity = '1';
                    resendCooldown = false;
                }
            }, 1000);
        });

        async function trySubmit() {
            var code = input.value.trim();
            if (code.length !== 6) {
                setMsg('Введіть 6-значний код', true);
                return;
            }
            submitBtn.disabled = true;
            submitBtn.textContent = 'Перевірка...';
            try {
                var { error } = await window.sb.auth.verifyOtp({ email: email, token: code, type: 'email' });
                if (error) throw error;
                await markPanelOtpVerified();
                overlay.remove();
                resolve(true);
            } catch (e) {
                setMsg('Невірний або прострочений код', true);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Підтвердити';
            }
        }

        submitBtn.addEventListener('click', trySubmit);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') trySubmit();
        });
        input.addEventListener('input', function () {
            input.value = input.value.replace(/\D/g, '').slice(0, 6);
        });

        cancelBtn.addEventListener('click', function () {
            overlay.remove();
            resolve(false);
        });
    });
}

// Головна функція - викликати на старті admin.html / owner-panel.html
// перед показом вмісту панелі. Повертає true, якщо доступ підтверджено.
async function requirePanelOtp(panelLabel) {
    var user = (window.auth && auth.getCurrentUser) ? auth.getCurrentUser() : null;
    if (!user) {
        window.location.href = '/login';
        return false;
    }

    var already = await isPanelOtpVerified();
    if (already) return true;

    var ok = await showPanelOtpModal(user.email, panelLabel || 'панелі керування');
    if (!ok) {
        window.location.href = '/dashboard';
        return false;
    }
    return true;
}

window.requirePanelOtp = requirePanelOtp;
window.isPanelOtpVerified = isPanelOtpVerified;
window.markPanelOtpVerified = markPanelOtpVerified;
window.clearAllPanelOtpFlags = clearAllPanelOtpFlags;
