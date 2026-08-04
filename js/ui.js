// ============================================
// TYPEBIZ - UI КОМПОНЕНТЫ (кастомные модалки)
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
                    <button class="btn btn-primary" id="alertOkBtn">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        
        const okBtn = overlay.querySelector('#alertOkBtn');
        okBtn.addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });

        // Закрытие по клику вне модалки
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(true);
            }
        });

        // Закрытие по Escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                resolve(true);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        // Фокус на кнопку OK
        setTimeout(() => okBtn.focus(), 100);
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
                    <button class="btn btn-secondary" data-result="false" id="confirmCancel">${cancelText}</button>
                    <button class="btn btn-primary" data-result="true" id="confirmOk">${confirmText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const cancelBtn = overlay.querySelector('#confirmCancel');
        const okBtn = overlay.querySelector('#confirmOk');

        cancelBtn.addEventListener('click', () => {
            overlay.remove();
            resolve(false);
        });

        okBtn.addEventListener('click', () => {
            overlay.remove();
            resolve(true);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                resolve(false);
            }
        });

        // Escape = отмена
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                resolve(false);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Фокус на кнопку OK
        setTimeout(() => okBtn.focus(), 100);
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
                    <button class="btn btn-secondary" data-result="cancel" id="promptCancel">Отмена</button>
                    <button class="btn btn-primary" data-result="ok" id="promptOk">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const input = overlay.querySelector('#promptInput');
        const cancelBtn = overlay.querySelector('#promptCancel');
        const okBtn = overlay.querySelector('#promptOk');

        input.focus();
        input.select();

        const resolveWith = (value) => {
            overlay.remove();
            resolve(value);
        };

        cancelBtn.addEventListener('click', () => {
            resolveWith(null);
        });

        okBtn.addEventListener('click', () => {
            resolveWith(input.value);
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

// Переопределяем глобальные функции
window.alert = showAlert;
window.confirm = showConfirm;
window.prompt = showPrompt;
window.showToast = showToast;

console.log('✅ UI module loaded');
