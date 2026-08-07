// ============================================
// TYPEBIZ - UI КОМПОНЕНТИ (КАСТОМНІ МОДАЛКИ)
// ============================================

// ============= РОЛІ / РАНГИ =============

var ROLE_INFO = {
    owner: { label: 'Засновник', emoji: '👑', color: '#8B5CF6' },
    admin: { label: 'Адміністратор', emoji: '⭐', color: '#E2503E' },
    moderator: { label: 'Модератор', emoji: '🛡️', color: '#F59E0B' },
    user: { label: 'Користувач', emoji: '👤', color: '#46C9B8' }
};

function getRoleInfo(role) {
    return ROLE_INFO[role] || ROLE_INFO.user;
}

function isStaffRole(role) {
    return role === 'owner' || role === 'admin' || role === 'moderator';
}

function getRoleBadgeHtml(role) {
    var info = getRoleInfo(role);
    return '<span class="badge" style="background:' + info.color + '20;color:' + info.color + ';">' + info.emoji + ' ' + info.label + '</span>';
}

function showToast(message, type, duration) {
    if (type === undefined) type = 'info';
    if (duration === undefined) duration = 3500;
    
    var container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 
            'position:fixed;top:20px;right:20px;z-index:999999;display:flex;flex-direction:column;gap:10px;max-width:380px;width:100%;pointer-events:none;';
        document.body.appendChild(container);
    }
    
    var icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    var colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#4f46e5'
    };
    
    var toast = document.createElement('div');
    toast.style.cssText = 
        'background:var(--ink-soft);border:1px solid var(--ink-line);border-left:4px solid ' + colors[type] + ';' +
        'border-radius:8px;padding:14px 18px;display:flex;align-items:center;gap:12px;' +
        'box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:slideInRight 0.3s ease;' +
        'pointer-events:auto;color:var(--text-onink);font-family:"IBM Plex Sans",sans-serif;';
    
    toast.innerHTML = 
        '<span style="color:' + colors[type] + ';font-size:1.2rem;flex-shrink:0;">' +
            '<i class="fas ' + (icons[type] || icons.info) + '"></i>' +
        '</span>' +
        '<span style="flex:1;font-size:0.9rem;">' + message + '</span>' +
        '<button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem;padding:0 4px;">' +
            '<i class="fas fa-times"></i>' +
        '</button>';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        if (toast.parentElement) {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(function() {
                if (toast.parentElement) toast.remove();
            }, 300);
        }
    }, duration);
}

function showAlert(message, type, title) {
    if (type === undefined) type = 'info';
    if (title === undefined) {
        var titles = {
            success: 'Успішно!',
            error: 'Помилка!',
            warning: 'Увага!',
            info: 'Інформація'
        };
        title = titles[type] || 'Інформація';
    }
    
    return new Promise(function(resolve) {
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = 
            'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);' +
            'backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;' +
            'animation:fadeIn 0.2s ease;';
        
        var icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        var colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#4f46e5'
        };
        
        overlay.innerHTML = 
            '<div style="background:var(--ink-soft);border:1px solid var(--ink-line);border-radius:12px;padding:2rem;max-width:440px;width:90%;box-shadow:0 30px 80px rgba(0,0,0,0.6);animation:modalSlideIn 0.3s ease;">' +
                '<div style="text-align:center;font-size:3rem;color:' + colors[type] + ';margin-bottom:1rem;">' +
                    '<i class="fas ' + (icons[type] || icons.info) + '"></i>' +
                '</div>' +
                '<h3 style="text-align:center;font-size:1.2rem;font-weight:700;margin-bottom:0.5rem;color:var(--text-onink);">' + title + '</h3>' +
                '<p style="text-align:center;color:var(--muted);margin-bottom:1.5rem;font-size:0.95rem;">' + message + '</p>' +
                '<div style="display:flex;justify-content:center;gap:0.75rem;">' +
                    '<button class="btn btn-gold" id="alertOkBtn" style="min-width:100px;justify-content:center;">OK</button>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(overlay);
        
        var okBtn = overlay.querySelector('#alertOkBtn');
        okBtn.addEventListener('click', function() {
            overlay.remove();
            resolve(true);
        });
        
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.remove();
                resolve(true);
            }
        });
        
        setTimeout(function() {
            okBtn.focus();
        }, 100);
    });
}

function showConfirm(message, title, confirmText, cancelText) {
    if (title === undefined) title = 'Підтвердження';
    if (confirmText === undefined) confirmText = 'Так';
    if (cancelText === undefined) cancelText = 'Ні';
    
    return new Promise(function(resolve) {
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = 
            'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);' +
            'backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;' +
            'animation:fadeIn 0.2s ease;';
        
        overlay.innerHTML = 
            '<div style="background:var(--ink-soft);border:1px solid var(--ink-line);border-radius:12px;padding:2rem;max-width:440px;width:90%;box-shadow:0 30px 80px rgba(0,0,0,0.6);animation:modalSlideIn 0.3s ease;">' +
                '<div style="text-align:center;font-size:3rem;color:#f59e0b;margin-bottom:1rem;">' +
                    '<i class="fas fa-question-circle"></i>' +
                '</div>' +
                '<h3 style="text-align:center;font-size:1.2rem;font-weight:700;margin-bottom:0.5rem;color:var(--text-onink);">' + title + '</h3>' +
                '<p style="text-align:center;color:var(--muted);margin-bottom:1.5rem;font-size:0.95rem;">' + message + '</p>' +
                '<div style="display:flex;justify-content:center;gap:0.75rem;">' +
                    '<button class="btn btn-outline" data-result="false" style="min-width:100px;justify-content:center;">' + cancelText + '</button>' +
                    '<button class="btn btn-gold" data-result="true" style="min-width:100px;justify-content:center;">' + confirmText + '</button>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(overlay);
        
        overlay.querySelectorAll('.btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var result = this.getAttribute('data-result') === 'true';
                overlay.remove();
                resolve(result);
            });
        });
        
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

function showPrompt(message, defaultValue, title) {
    if (defaultValue === undefined) defaultValue = '';
    if (title === undefined) title = 'Введіть значення';
    
    return new Promise(function(resolve) {
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = 
            'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);' +
            'backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;' +
            'animation:fadeIn 0.2s ease;';
        
        overlay.innerHTML = 
            '<div style="background:var(--ink-soft);border:1px solid var(--ink-line);border-radius:12px;padding:2rem;max-width:440px;width:90%;box-shadow:0 30px 80px rgba(0,0,0,0.6);animation:modalSlideIn 0.3s ease;">' +
                '<div style="text-align:center;font-size:2.5rem;color:#4f46e5;margin-bottom:1rem;">' +
                    '<i class="fas fa-edit"></i>' +
                '</div>' +
                '<h3 style="text-align:center;font-size:1.2rem;font-weight:700;margin-bottom:0.5rem;color:var(--text-onink);">' + title + '</h3>' +
                '<p style="text-align:center;color:var(--muted);margin-bottom:1.5rem;font-size:0.95rem;">' + message + '</p>' +
                '<div class="form-group" style="margin-bottom:1.5rem;">' +
                    '<input type="text" class="form-control" id="promptInput" value="' + defaultValue + '" style="width:100%;padding:0.75rem 1rem;background:var(--ink);border:1px solid var(--ink-line);border-radius:6px;color:var(--text-onink);font-size:1rem;">' +
                '</div>' +
                '<div style="display:flex;justify-content:center;gap:0.75rem;">' +
                    '<button class="btn btn-outline" data-result="cancel" style="min-width:100px;justify-content:center;">Скасувати</button>' +
                    '<button class="btn btn-gold" data-result="ok" style="min-width:100px;justify-content:center;">OK</button>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(overlay);
        
        var input = overlay.querySelector('#promptInput');
        input.focus();
        input.select();
        
        overlay.querySelectorAll('.btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (this.getAttribute('data-result') === 'ok') {
                    overlay.remove();
                    resolve(input.value);
                } else {
                    overlay.remove();
                    resolve(null);
                }
            });
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                overlay.remove();
                resolve(input.value);
            } else if (e.key === 'Escape') {
                overlay.remove();
                resolve(null);
            }
        });
        
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.remove();
                resolve(null);
            }
        });
    });
}

var style = document.createElement('style');
style.textContent = 
    '@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } ' +
    '@keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } } ' +
    '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } ' +
    '@keyframes modalSlideIn { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }';
document.head.appendChild(style);

// ============================================
// ФОРМАТУВАННЯ ДАТИ/ЧАСУ ЗА КИЇВСЬКИМ ЧАСОМ
// (IANA "Europe/Kyiv" сам враховує перехід на літній/зимовий час)
// ============================================

var TYPEBIZ_TIMEZONE = 'Europe/Kyiv';

function formatDateTimeKyiv(dateValue, options) {
    try {
        var d = (dateValue instanceof Date) ? dateValue : new Date(dateValue);
        if (isNaN(d.getTime())) return '';
        var opts = { timeZone: TYPEBIZ_TIMEZONE };
        if (options) {
            for (var key in options) opts[key] = options[key];
        }
        return d.toLocaleString('uk-UA', opts);
    } catch (e) {
        return '';
    }
}

function formatDateKyiv(dateValue) {
    return formatDateTimeKyiv(dateValue, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatTimeKyiv(dateValue) {
    return formatDateTimeKyiv(dateValue, { hour: '2-digit', minute: '2-digit' });
}

window.formatDateTimeKyiv = formatDateTimeKyiv;
window.formatDateKyiv = formatDateKyiv;
window.formatTimeKyiv = formatTimeKyiv;

// ============================================
// СИСТЕМНІ НАЛАШТУВАННЯ: НАЗВА САЙТУ + ОГОЛОШЕННЯ
// (реальне застосування налаштувань з панелі засновника)
// ============================================

async function applySiteBranding() {
    try {
        if (!window.db || !window.db.getSystemSettings) return;
        var settings = await window.db.getSystemSettings();
        var siteName = settings['site_name'];
        if (!siteName || siteName === 'Typebiz') return;

        if (document.title) {
            document.title = document.title.replace(/Typebiz/g, siteName);
        }
        document.querySelectorAll('.brand-name').forEach(function (el) {
            el.textContent = siteName;
        });
    } catch (e) {
        // тихо ігноруємо — стандартна назва залишиться
    }
}

async function renderGlobalAnnouncements(containerId) {
    if (containerId === undefined) containerId = 'globalAnnouncements';
    var container = document.getElementById(containerId);
    if (!container || !window.db || !window.db.getActiveAnnouncements) return;

    try {
        var announcements = await window.db.getActiveAnnouncements();
        if (!announcements || announcements.length === 0) {
            container.innerHTML = '';
            return;
        }

        var dismissed = [];
        try {
            dismissed = JSON.parse(sessionStorage.getItem('dismissedAnnouncements') || '[]');
        } catch (e) {}

        var html = '';
        for (var i = 0; i < announcements.length; i++) {
            var a = announcements[i];
            if (dismissed.indexOf(a.id) !== -1) continue;

            html +=
                '<div class="global-announcement" data-announcement-id="' + a.id + '" style="background:var(--gold-glow,rgba(242,169,59,0.16));border:1px solid var(--gold,#F2A93B);border-radius:8px;padding:0.85rem 1.1rem;margin-bottom:1.2rem;display:flex;align-items:center;gap:0.75rem;">' +
                    '<i class="fas fa-bullhorn" style="color:var(--gold,#F2A93B);flex-shrink:0;"></i>' +
                    '<span style="flex:1;font-size:0.92rem;">' + a.message + '</span>' +
                    '<button onclick="dismissGlobalAnnouncement(\'' + a.id + '\', \'' + containerId + '\')" style="background:none;border:none;color:inherit;cursor:pointer;opacity:0.6;font-size:0.9rem;" title="Приховати">' +
                        '<i class="fas fa-times"></i>' +
                    '</button>' +
                '</div>';
        }

        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '';
    }
}

function dismissGlobalAnnouncement(id, containerId) {
    var dismissed = [];
    try {
        dismissed = JSON.parse(sessionStorage.getItem('dismissedAnnouncements') || '[]');
    } catch (e) {}

    if (dismissed.indexOf(id) === -1) dismissed.push(id);
    sessionStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissed));

    var el = document.querySelector('[data-announcement-id="' + id + '"]');
    if (el) el.remove();
}

window.applySiteBranding = applySiteBranding;
window.renderGlobalAnnouncements = renderGlobalAnnouncements;
window.dismissGlobalAnnouncement = dismissGlobalAnnouncement;

document.addEventListener('DOMContentLoaded', function () {
    // Назва сайту застосовується всюди, де підключено ui.js + db.js
    if (window.db) applySiteBranding();
});

window.showToast = showToast;
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showPrompt = showPrompt;
window.getRoleInfo = getRoleInfo;
window.isStaffRole = isStaffRole;
window.getRoleBadgeHtml = getRoleBadgeHtml;
