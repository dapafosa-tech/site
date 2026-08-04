// ============================================
// ORGSPACE - UI КОМПОНЕНТЫ (кастомные модалки)
// ============================================

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer') || createToastContainer();
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon ${type}">
            <i class="fas ${icons[type] || icons.info}"></i>
        </span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function showAlert(message, type = 'info', title = '') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'customAlert';

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const titles = {
            success: 'Успешно!',
            error: 'Ошибка!',
            warning: 'Внимание!',
            info: 'Информация'
        };

        overlay.innerHTML = `
            <div class="modal-box">
                <div class="modal-icon ${type}">
                    <i class="fas ${icons[type] || icons.info}"></i>
                </div>
                <h3>${title || titles[type] || 'Информация'}</h3>
                <p>${message}</p>
                <div class="modal-buttons">
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); resolve(true);">
                        OK
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay._resolve = resolve;
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(true);
            }
        });
    });
}

function showConfirm(message, title = 'Подтверждение', confirmText = 'Да', cancelText = 'Нет') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'customConfirm';

        overlay.innerHTML = `
            <div class="modal-box">
                <div class="modal-icon warning">
                    <i class="fas fa-question-circle"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-buttons">
                    <button class="btn btn-secondary" data-result="false">${cancelText}</button>
                    <button class="btn btn-primary" data-result="true">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelectorAll('.modal-buttons .btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const result = btn.dataset.result === 'true';
                overlay.remove();
                resolve(result);
            });
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });
    });
}

function showPrompt(message, defaultValue = '', title = 'Введите значение') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay active';
        overlay.id = 'customPrompt';

        overlay.innerHTML = `
            <div class="modal-box">
                <div class="modal-icon info">
                    <i class="fas fa-edit"></i>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="form-group">
                    <input type="text" class="form-control" id="promptInput" value="${defaultValue}" autofocus>
                </div>
                <div class="modal-buttons">
                    <button class="btn btn-secondary" data-result="cancel">Отмена</button>
                    <button class="btn btn-primary" data-result="ok">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const input = overlay.querySelector('#promptInput');
        input.focus();
        input.select();

        const resolveWith = (value) => {
            overlay.remove();
            resolve(value);
        };

        overlay.querySelectorAll('.modal-buttons .btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.result === 'ok') {
                    resolveWith(input.value);
                } else {
                    resolveWith(null);
                }
            });
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                resolveWith(input.value);
            } else if (e.key === 'Escape') {
                resolveWith(null);
            }
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                resolveWith(null);
            }
        });
    });
}

window.alert = showAlert;
window.confirm = showConfirm;
window.prompt = showPrompt;
window.showToast = showToast;

console.log('✅ UI module loaded');
