// ============================================
// TYPEBIZ - UI КОМПОНЕНТИ (КРАСИВІ СПОВІЩЕННЯ)
// ============================================

// ===== ТОСТ-СПОВІЩЕННЯ (ЗВЕРХУ ПРАВОРУЧ) =====
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

// ===== КРАСИВИЙ ALERT (МОДАЛКА) =====
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

// ===== КРАСИВИЙ CONFIRM =====
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

// ===== КРАСИВИЙ PROMPT =====
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

// ===== АНІМАЦІЇ (ДОДАЄМО В HEAD) =====
var style = document.createElement('style');
style.textContent = 
    '@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } ' +
    '@keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } } ' +
    '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } ' +
    '@keyframes modalSlideIn { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }';
document.head.appendChild(style);

// ===== ГЛОБАЛЬНІ ФУНКЦІЇ =====
window.showToast = showToast;
window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showPrompt = showPrompt;

console.log('✅ UI module loaded');
