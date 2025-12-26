// Система регистрации и авторизации
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('os5_users')) || {};
        this.currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;
        this.posts = JSON.parse(localStorage.getItem('os5_posts')) || [];
        this.comments = JSON.parse(localStorage.getItem('os5_comments')) || [];
        this.init();
    }

    init() {
        this.initializeVisitorCounter();
        this.createAuthModal();
        this.updateUI();
        this.initializeCommentSystem();
        this.loadAllComments();
        
        // Сохраняем в глобальную область видимости
        window.authSystem = this;
    }

    // Инициализация счетчика посещений
    initializeVisitorCounter() {
        let visitCount = localStorage.getItem('os5_visit_count') || 0;
        visitCount = parseInt(visitCount) + 1;
        localStorage.setItem('os5_visit_count', visitCount);
        
        const visitCountElements = document.querySelectorAll('#visit-count');
        visitCountElements.forEach(element => {
            if (element) element.textContent = visitCount;
        });
    }

    // Хеширование пароля
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // Регистрация нового пользователя
    register(username, password, email) {
        if (this.users[username]) {
            return { success: false, message: 'Пользователь с таким именем уже существует' };
        }

        if (username.length < 3) {
            return { success: false, message: 'Имя пользователя должно содержать минимум 3 символа' };
        }

        if (password.length < 6) {
            return { success: false, message: 'Пароль должен содержать минимум 6 символов' };
        }

        const user = {
            username,
            password: this.hashPassword(password),
            email,
            registrationDate: new Date().toISOString(),
            level: 'user',
            avatar: 'default',
            bio: '',
            profileBackground: 'default'
        };

        this.users[username] = user;
        localStorage.setItem('os5_users', JSON.stringify(this.users));

        return { success: true, message: 'Регистрация успешна!' };
    }

    // Авторизация
    login(username, password) {
        const user = this.users[username];
        if (!user) {
            return { success: false, message: 'Пользователь не найден' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Неверный пароль' };
        }

        this.currentUser = {
            username: user.username,
            email: user.email,
            level: user.level,
            avatar: user.avatar,
            bio: user.bio,
            profileBackground: user.profileBackground,
            loginTime: new Date().toISOString()
        };

        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        return { success: true, message: 'Вход выполнен успешно!' };
    }

    // Обновление профиля
    updateProfile(newUsername, email, bio, avatar, background) {
        const oldUsername = this.currentUser.username;
        
        // Если имя пользователя изменилось, проверяем доступность
        if (newUsername !== oldUsername && this.users[newUsername]) {
            return { success: false, message: 'Пользователь с таким именем уже существует' };
        }

        // Обновляем данные пользователя
        if (newUsername !== oldUsername) {
            // Создаем нового пользователя и удаляем старого
            this.users[newUsername] = {
                ...this.users[oldUsername],
                username: newUsername,
                email: email,
                bio: bio,
                avatar: avatar,
                profileBackground: background
            };
            delete this.users[oldUsername];
            
            // Обновляем ссылки в постах и комментариях
            this.updateUserReferences(oldUsername, newUsername);
        } else {
            // Обновляем существующего пользователя
            this.users[oldUsername] = {
                ...this.users[oldUsername],
                email: email,
                bio: bio,
                avatar: avatar,
                profileBackground: background
            };
        }

        // Сохраняем изменения
        localStorage.setItem('os5_users', JSON.stringify(this.users));
        
        // Обновляем текущего пользователя
        this.currentUser = {
            username: newUsername,
            email: email,
            level: this.users[newUsername].level,
            avatar: avatar,
            bio: bio,
            profileBackground: background,
            loginTime: this.currentUser.loginTime
        };
        
        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        return { success: true, message: 'Профиль обновлен!' };
    }

    // Обновить ссылки на пользователя
    updateUserReferences(oldUsername, newUsername) {
        // Обновляем посты
        this.posts.forEach(post => {
            if (post.author === oldUsername) {
                post.author = newUsername;
            }
        });
        localStorage.setItem('os5_posts', JSON.stringify(this.posts));

        // Обновляем комментарии
        this.comments.forEach(comment => {
            if (comment.user === oldUsername) {
                comment.user = newUsername;
            }
        });
        localStorage.setItem('os5_comments', JSON.stringify(this.comments));
    }

    // Выход
    logout() {
        this.currentUser = null;
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('currentUser');
        this.updateUI();
        window.location.href = 'front.html';
    }

    // Создание модального окна авторизации
    createAuthModal() {
        const existingModal = document.getElementById('authModal');
        if (existingModal) existingModal.remove();

        const modalHTML = `
            <div class="auth-modal" id="authModal">
                <div class="auth-content">
                    <button class="close-auth">&times;</button>
                    
                    <div class="auth-header">
                        <h3>СИСТЕМА ДОСТУПА</h3>
                        <p>Проект "ОМЕГА"</p>
                    </div>

                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">ВХОД</button>
                        <button class="auth-tab" data-tab="register">РЕГИСТРАЦИЯ</button>
                    </div>

                    <div class="auth-form active" id="login-form">
                        <div class="form-group">
                            <label for="login-username">Имя пользователя:</label>
                            <input type="text" id="login-username" class="form-control" placeholder="Введите имя пользователя">
                        </div>
                        
                        <div class="form-group">
                            <label for="login-password">Пароль:</label>
                            <input type="password" id="login-password" class="form-control" placeholder="Введите пароль">
                        </div>

                        <div id="login-message"></div>
                        
                        <button class="auth-btn" id="login-btn">ВОЙТИ В СИСТЕМУ</button>
                    </div>

                    <div class="auth-form" id="register-form">
                        <div class="form-group">
                            <label for="register-username">Имя пользователя:</label>
                            <input type="text" id="register-username" class="form-control" placeholder="Минимум 3 символа">
                        </div>
                        
                        <div class="form-group">
                            <label for="register-email">Email:</label>
                            <input type="email" id="register-email" class="form-control" placeholder="your@email.com">
                        </div>
                        
                        <div class="form-group">
                            <label for="register-password">Пароль:</label>
                            <input type="password" id="register-password" class="form-control" placeholder="Минимум 6 символов">
                            <div class="password-strength">
                                <div class="strength-fill" id="password-strength"></div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="register-confirm">Подтверждение пароля:</label>
                            <input type="password" id="register-confirm" class="form-control" placeholder="Повторите пароль">
                        </div>

                        <div id="register-message"></div>
                        
                        <button class="auth-btn" id="register-btn">СОЗДАТЬ УЧЕТНУЮ ЗАПИСЬ</button>
                    </div>

                    <div class="auth-footer">
                        <p>Доступ к засекреченным материалам</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.bindAuthEvents();
    }

    // Привязка событий для авторизации
    bindAuthEvents() {
        // Переключение вкладок
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                
                tab.classList.add('active');
                document.getElementById(`${tabName}-form`).classList.add('active');
                
                // Очищаем сообщения
                const loginMessage = document.getElementById('login-message');
                const registerMessage = document.getElementById('register-message');
                if (loginMessage) loginMessage.innerHTML = '';
                if (registerMessage) registerMessage.innerHTML = '';
            });
        });

        // Закрытие модального окна
        document.querySelector('.close-auth').addEventListener('click', () => {
            this.hideAuthModal();
        });

        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                this.hideAuthModal();
            }
        });

        // Обработчики кнопок
        document.getElementById('login-btn').addEventListener('click', () => {
            this.handleLogin();
        });

        document.getElementById('register-btn').addEventListener('click', () => {
            this.handleRegister();
        });

        // Enter для отправки форм
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        document.getElementById('register-confirm').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleRegister();
        });

        // Индикатор силы пароля
        document.getElementById('register-password').addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });
    }

    // Обработка входа
    handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const messageEl = document.getElementById('login-message');

        if (!username || !password) {
            this.showMessage(messageEl, 'Заполните все поля', 'error');
            return;
        }

        const result = this.login(username, password);
        this.showMessage(messageEl, result.message, result.success ? 'success' : 'error');

        if (result.success) {
            setTimeout(() => {
                this.hideAuthModal();
                this.updateUI();
                location.reload();
            }, 1000);
        }
    }

    // Обработка регистрации
    handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;
        const messageEl = document.getElementById('register-message');

        if (!username || !email || !password || !confirm) {
            this.showMessage(messageEl, 'Заполните все поля', 'error');
            return;
        }

        if (password !== confirm) {
            this.showMessage(messageEl, 'Пароли не совпадают', 'error');
            return;
        }

        const result = this.register(username, password, email);
        this.showMessage(messageEl, result.message, result.success ? 'success' : 'error');

        if (result.success) {
            setTimeout(() => {
                document.querySelector('.auth-tab[data-tab="login"]').click();
                document.getElementById('login-username').value = username;
                document.getElementById('register-username').value = '';
                document.getElementById('register-email').value = '';
                document.getElementById('register-password').value = '';
                document.getElementById('register-confirm').value = '';
            }, 1500);
        }
    }

    // Показать сообщение
    showMessage(element, message, type) {
        element.innerHTML = `<div class="auth-message auth-${type}">${message}</div>`;
    }

    // Обновить индикатор силы пароля
    updatePasswordStrength(password) {
        const strengthEl = document.getElementById('password-strength');
        let strength = 0;

        if (password.length >= 6) strength += 1;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
        if (password.match(/\d/)) strength += 1;
        if (password.match(/[^a-zA-Z\d]/)) strength += 1;

        strengthEl.className = 'strength-fill';
        if (password.length === 0) {
            strengthEl.style.width = '0%';
        } else if (strength === 1) {
            strengthEl.classList.add('strength-weak');
            strengthEl.style.width = '25%';
        } else if (strength === 2) {
            strengthEl.classList.add('strength-medium');
            strengthEl.style.width = '50%';
        } else if (strength >= 3) {
            strengthEl.classList.add('strength-strong');
            strengthEl.style.width = '100%';
        }
    }

    // Показать модальное окно авторизации
    showAuthModal() {
        document.getElementById('authModal').classList.add('show');
    }

    // Скрыть модальное окно авторизации
    hideAuthModal() {
        document.getElementById('authModal').classList.remove('show');
    }

    // Обновить интерфейс в зависимости от статуса авторизации
    updateUI() {
        this.createUserMenu();
    }

    // Создать меню пользователя
    createUserMenu() {
        // Удаляем старые меню
        const oldMenus = document.querySelectorAll('.user-menu');
        oldMenus.forEach(menu => menu.remove());

        if (this.currentUser) {
            const menuHTML = `
                <div class="user-menu">
                    <button class="user-btn" id="user-menu-btn">
                        👤 ${this.currentUser.username}
                    </button>
                    <div class="user-dropdown" id="user-dropdown">
                        <div class="user-info">
                            ${this.currentUser.username}
                            <span class="user-badge">${this.currentUser.level}</span>
                        </div>
                        <a href="profile.html" class="dropdown-item">Личный кабинет</a>
                        <button class="dropdown-item" id="profile-btn">Редактировать профиль</button>
                        <button class="dropdown-item" id="my-posts-btn">Мои посты</button>
                        <button class="dropdown-item" id="logout-btn">Выйти</button>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('afterbegin', menuHTML);

            // Обработчики меню пользователя
            document.getElementById('user-menu-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('user-dropdown').classList.toggle('show');
            });

            document.getElementById('logout-btn').addEventListener('click', () => {
                this.logout();
            });

            document.getElementById('profile-btn').addEventListener('click', () => {
                this.showProfileModal();
                document.getElementById('user-dropdown').classList.remove('show');
            });

            document.getElementById('my-posts-btn').addEventListener('click', () => {
                this.showMyPostsModal();
                document.getElementById('user-dropdown').classList.remove('show');
            });

            // Закрытие меню при клике вне его
            document.addEventListener('click', () => {
                const dropdown = document.getElementById('user-dropdown');
                if (dropdown) dropdown.classList.remove('show');
            });
        } else {
            const loginBtnHTML = `
                <div class="user-menu">
                    <button class="user-btn" id="login-btn-main">
                        🔐 ВОЙТИ
                    </button>
                </div>
            `;

            document.body.insertAdjacentHTML('afterbegin', loginBtnHTML);
            
            // Добавляем обработчик события
            const loginBtn = document.getElementById('login-btn-main');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    this.showAuthModal();
                });
            }
        }
    }

    // Принудительно показать кнопку входа
    forceShowLoginButton() {
        const existingMenu = document.querySelector('.user-menu');
        if (!existingMenu && !this.currentUser) {
            this.createUserMenu();
        }
    }

    // Показать модальное окно профиля
    showProfileModal() {
        const existingModal = document.getElementById('profileModal');
        if (existingModal) existingModal.remove();

        // Получаем полные данные пользователя с проверкой
        const userData = this.users[this.currentUser.username];
        const registrationDate = userData ? 
            new Date(userData.registrationDate).toLocaleDateString() : 
            new Date().toLocaleDateString();

        const modalHTML = `
            <div class="auth-modal show" id="profileModal">
                <div class="auth-content" style="max-width: 500px;">
                    <button class="close-auth">&times;</button>
                    
                    <div class="auth-header">
                        <h3>РЕДАКТИРОВАНИЕ ПРОФИЛЯ</h3>
                        <p>Изменение личных данных</p>
                    </div>

                    <div class="form-group">
                        <label for="profile-username">Имя пользователя:</label>
                        <input type="text" id="profile-username" class="form-control" value="${this.currentUser.username}">
                    </div>
                    
                    <div class="form-group">
                        <label for="profile-email">Email:</label>
                        <input type="email" id="profile-email" class="form-control" value="${this.currentUser.email}">
                    </div>
                    
                    <div class="form-group">
                        <label for="profile-bio">О себе:</label>
                        <textarea id="profile-bio" class="form-control" rows="3" placeholder="Расскажите о себе...">${this.currentUser.bio || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label>Аватар:</label>
                        <div class="avatar-selection">
                            <div class="avatar-option ${this.currentUser.avatar === 'default' ? 'selected' : ''}" data-avatar="default">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${this.currentUser.username}" alt="Аватар">
                            </div>
                            <div class="avatar-option ${this.currentUser.avatar === 'robot' ? 'selected' : ''}" data-avatar="robot">
                                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${this.currentUser.username}" alt="Робот">
                            </div>
                            <div class="avatar-option ${this.currentUser.avatar === 'pixel' ? 'selected' : ''}" data-avatar="pixel">
                                <img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${this.currentUser.username}" alt="Пиксель">
                            </div>
                            <div class="avatar-option ${this.currentUser.avatar === 'custom' ? 'selected' : ''}" data-avatar="custom">
                                <img src="${this.getUserAvatar(this.currentUser.username) || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}" alt="Загруженный">
                            </div>
                        </div>
                        <div class="avatar-upload">
                            <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
                            <button type="button" class="upload-btn" id="avatar-upload-btn">
                                📁 Загрузить свой аватар
                            </button>
                            <small>Поддерживаются JPG, PNG, GIF (макс. 2MB)</small>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Фон профиля:</label>
                        <div class="background-selection">
                            <div class="bg-option ${this.currentUser.profileBackground === 'default' ? 'selected' : ''}" data-bg="default">
                                <div class="bg-preview default-bg"></div>
                                <span>Стандартный</span>
                            </div>
                            <div class="bg-option ${this.currentUser.profileBackground === 'cyber' ? 'selected' : ''}" data-bg="cyber">
                                <div class="bg-preview cyber-bg"></div>
                                <span>Киберпространство</span>
                            </div>
                            <div class="bg-option ${this.currentUser.profileBackground === 'ocean' ? 'selected' : ''}" data-bg="ocean">
                                <div class="bg-preview ocean-bg"></div>
                                <span>Глубины</span>
                            </div>
                        </div>
                    </div>

                    <div id="profile-message"></div>
                    
                    <button class="auth-btn" id="save-profile-btn">СОХРАНИТЬ ИЗМЕНЕНИЯ</button>

                    <div class="auth-footer">
                        <p>Зарегистрирован: ${registrationDate}</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.bindProfileEvents();
    }

    // Получить URL аватара пользователя
    getUserAvatar(username) {
        const user = this.users[username];
        if (!user) return null;

        if (user.avatar === 'custom') {
            const avatarKey = `os5_avatar_${username}`;
            const avatarData = JSON.parse(localStorage.getItem(avatarKey));
            return avatarData ? avatarData.data : null;
        } else {
            // Генерируем аватар на основе выбранного стиля
            const seed = username || 'default';
            switch(user.avatar) {
                case 'robot':
                    return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                case 'pixel':
                    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`;
                default:
                    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
            }
        }
    }

    // Загрузка пользовательского аватара
    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Проверяем тип файла
        if (!file.type.match('image.*')) {
            alert('Пожалуйста, выберите файл изображения');
            return;
        }

        // Проверяем размер файла (максимум 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Размер файла не должен превышать 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            // Сохраняем изображение в localStorage
            const avatarData = {
                data: e.target.result,
                type: file.type,
                timestamp: Date.now()
            };
            
            // Сохраняем под уникальным ключом для пользователя
            const avatarKey = `os5_avatar_${this.currentUser.username}`;
            localStorage.setItem(avatarKey, JSON.stringify(avatarData));
            
            // Обновляем текущего пользователя
            this.currentUser.avatar = 'custom';
            if (this.users[this.currentUser.username]) {
                this.users[this.currentUser.username].avatar = 'custom';
            }
            
            // Сохраняем изменения
            sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            localStorage.setItem('os5_users', JSON.stringify(this.users));
            
            // Обновляем отображение аватара
            this.updateAvatarDisplay();
            
            alert('Аватар успешно загружен!');
        };
        
        reader.readAsDataURL(file);
    }

    // Обновить отображение аватара
    updateAvatarDisplay() {
        // Обновляем в модальном окне профиля
        const customAvatar = document.querySelector('.avatar-option[data-avatar="custom"]');
        if (customAvatar) {
            const avatarKey = `os5_avatar_${this.currentUser.username}`;
            const avatarData = JSON.parse(localStorage.getItem(avatarKey));
            
            if (avatarData) {
                const img = customAvatar.querySelector('img');
                img.src = avatarData.data;
            }
        }
        
        // Обновляем на странице профиля
        if (window.location.pathname.includes('profile.html')) {
            const profileAvatar = document.getElementById('profileAvatar');
            if (profileAvatar) {
                const avatarKey = `os5_avatar_${this.currentUser.username}`;
                const avatarData = JSON.parse(localStorage.getItem(avatarKey));
                
                if (avatarData) {
                    profileAvatar.src = avatarData.data;
                }
            }
        }
    }

    // Привязать события профиля
    bindProfileEvents() {
        // Закрытие модального окна
        document.querySelector('#profileModal .close-auth').addEventListener('click', () => {
            this.hideProfileModal();
        });

        // Клик вне модального окна
        document.getElementById('profileModal').addEventListener('click', (e) => {
            if (e.target.id === 'profileModal') {
                this.hideProfileModal();
            }
        });

        // Выбор аватара
        document.querySelectorAll('.avatar-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });

        // Выбор фона
        document.querySelectorAll('.bg-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.bg-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });

        // Обработчик загрузки аватара
        document.getElementById('avatar-upload-btn').addEventListener('click', () => {
            document.getElementById('avatar-upload').click();
        });

        document.getElementById('avatar-upload').addEventListener('change', (e) => {
            this.handleAvatarUpload(e);
        });

        // Сохранение профиля
        document.getElementById('save-profile-btn').addEventListener('click', () => {
            this.saveProfile();
        });
    }

    // Сохранить профиль
    saveProfile() {
        const username = document.getElementById('profile-username').value.trim();
        const email = document.getElementById('profile-email').value.trim();
        const bio = document.getElementById('profile-bio').value.trim();
        const selectedAvatar = document.querySelector('.avatar-option.selected').dataset.avatar;
        const selectedBackground = document.querySelector('.bg-option.selected').dataset.bg;
        const messageEl = document.getElementById('profile-message');

        if (!username || !email) {
            this.showMessage(messageEl, 'Имя пользователя и email обязательны для заполнения', 'error');
            return;
        }

        if (username.length < 3) {
            this.showMessage(messageEl, 'Имя пользователя должно содержать минимум 3 символа', 'error');
            return;
        }

        const result = this.updateProfile(username, email, bio, selectedAvatar, selectedBackground);
        this.showMessage(messageEl, result.message, result.success ? 'success' : 'error');

        if (result.success) {
            setTimeout(() => {
                this.hideProfileModal();
                this.updateUI();
                if (window.location.pathname.includes('profile.html') && window.updateProfileDisplay) {
                    window.updateProfileDisplay();
                }
            }, 1000);
        }
    }

    // Скрыть модальное окно профиля
    hideProfileModal() {
        const modal = document.getElementById('profileModal');
        if (modal) modal.remove();
    }

    // Показать мои посты
    showMyPostsModal() {
        const existingModal = document.getElementById('postsModal');
        if (existingModal) existingModal.remove();

        const userPosts = this.posts.filter(post => post.author === this.currentUser.username);
        
        const modalHTML = `
            <div class="auth-modal show" id="postsModal">
                <div class="auth-content" style="max-width: 600px;">
                    <button class="close-auth">&times;</button>
                    
                    <div class="auth-header">
                        <h3>МОИ ПОСТЫ</h3>
                        <p>Управление публикациями</p>
                    </div>

                    <div class="post-creator">
                        <h4>Создать новый пост</h4>
                        <div class="form-group">
                            <textarea id="new-post-content" class="form-control" rows="4" placeholder="Что нового?"></textarea>
                        </div>
                        <button class="auth-btn" id="create-post-btn">ОПУБЛИКОВАТЬ</button>
                    </div>

                    <div class="my-posts-list">
                        <h4>Мои публикации (${userPosts.length})</h4>
                        ${userPosts.length > 0 ? 
                            userPosts.map(post => `
                                <div class="user-post">
                                    <div class="post-content">${post.content}</div>
                                    <div class="post-meta">
                                        <span>${new Date(post.date).toLocaleString()}</span>
                                        <button class="delete-post" data-id="${post.id}">Удалить</button>
                                    </div>
                                </div>
                            `).join('') : 
                            '<p class="no-posts">У вас пока нет публикаций</p>'
                        }
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.bindPostsEvents();
    }

    // Привязать события постов
    bindPostsEvents() {
        // Закрытие модального окна
        document.querySelector('#postsModal .close-auth').addEventListener('click', () => {
            this.hidePostsModal();
        });

        // Клик вне модального окна
        document.getElementById('postsModal').addEventListener('click', (e) => {
            if (e.target.id === 'postsModal') {
                this.hidePostsModal();
            }
        });

        // Создание поста
        document.getElementById('create-post-btn').addEventListener('click', () => {
            const content = document.getElementById('new-post-content').value.trim();
            if (content) {
                this.createPost(content);
                document.getElementById('new-post-content').value = '';
            }
        });

        // Удаление постов
        document.querySelectorAll('.delete-post').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = e.target.dataset.id;
                this.deletePost(postId);
            });
        });
    }

    // Создать пост
    createPost(content) {
        const post = {
            id: Date.now().toString(),
            author: this.currentUser.username,
            content: content,
            date: new Date().toISOString(),
            likes: 0,
            comments: []
        };

        this.posts.unshift(post);
        localStorage.setItem('os5_posts', JSON.stringify(this.posts));
        
        this.hidePostsModal();
        this.showMyPostsModal();
        
        if (window.location.pathname.includes('profile.html') && window.updateProfileDisplay) {
            window.updateProfileDisplay();
        }
    }

    // Удалить пост
    deletePost(postId) {
        this.posts = this.posts.filter(post => post.id !== postId);
        localStorage.setItem('os5_posts', JSON.stringify(this.posts));
        this.hidePostsModal();
        this.showMyPostsModal();
        
        if (window.location.pathname.includes('profile.html') && window.updateProfileDisplay) {
            window.updateProfileDisplay();
        }
    }

    // Скрыть модальное окно постов
    hidePostsModal() {
        const modal = document.getElementById('postsModal');
        if (modal) modal.remove();
    }

    // Инициализация системы комментариев
    initializeCommentSystem() {
        // Глобальная функция для добавления комментариев
        window.addComment = (text, page = 'front') => {
            if (!this.isAuthenticated()) {
                alert('Для комментирования необходимо войти в систему');
                this.showAuthModal();
                return;
            }

            const filteredText = text.trim();
            
            if (filteredText.length === 0) {
                alert('Комментарий не может быть пустым');
                return;
            }
            
            const comment = {
                user: this.currentUser.username,
                text: filteredText,
                date: new Date().toISOString(),
                id: Date.now().toString(),
                page: page
            };
            
            this.comments.push(comment);
            localStorage.setItem('os5_comments', JSON.stringify(this.comments));
            
            this.loadAllComments();
        };

        // Глобальная функция для загрузки комментариев
        window.loadComments = (page = 'front') => {
            const container = document.getElementById('comments-container');
            if (!container) return;

            const pageComments = this.comments.filter(comment => comment.page === page);
            
            container.innerHTML = '';
            pageComments.forEach(comment => {
                const isCurrentUser = this.currentUser && comment.user === this.currentUser.username;
                const userClass = isCurrentUser ? 'comment-user current-user' : 'comment-user';
                const userDisplay = isCurrentUser 
                    ? `<a href="profile.html" class="${userClass}">${comment.user}</a>`
                    : `<span class="${userClass}">${comment.user}</span>`;

                const commentEl = document.createElement('div');
                commentEl.className = 'comment';
                commentEl.innerHTML = `
                    <div class="comment-header">
                        ${userDisplay}
                        <span class="comment-date">${new Date(comment.date).toLocaleString()}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                `;
                container.appendChild(commentEl);
            });
        };
    }

    // Загрузить все комментарии
    loadAllComments() {
        // Для front.html
        if (typeof window.loadComments === 'function') {
            window.loadComments('front');
        }
        
        // Для news.html
        if (typeof window.loadNewsComments === 'function') {
            window.loadNewsComments();
        }
    }

    // Проверить авторизацию
    isAuthenticated() {
        // Проверяем в sessionStorage и localStorage
        if (!this.currentUser) {
            const storedUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
            }
        }
        return this.currentUser !== null;
    }

    // Получить текущего пользователя
    getCurrentUser() {
        if (!this.currentUser) {
            const storedUser = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
            }
        }
        return this.currentUser;
    }
}

// Инициализация системы авторизации
document.addEventListener('DOMContentLoaded', function() {
    // Создаем экземпляр только если его еще нет
    if (!window.authSystem) {
        window.authSystem = new AuthSystem();
    }
    
    // Принудительно обновляем UI после загрузки
    setTimeout(() => {
        if (window.authSystem) {
            window.authSystem.updateUI();
            window.authSystem.forceShowLoginButton();
        }
    }, 200);
    
    // Заменяем заглушки регистрации
    const replaceRegistrationStubs = () => {
        document.querySelectorAll('.registration-stub, .registration-required').forEach(stub => {
            stub.innerHTML = `
                <h3>🔒 ТРЕБУЕТСЯ РЕГИСТРАЦИЯ</h3>
                <p>Для доступа к этой функции необходимо войти в систему</p>
                <button class="action-btn" onclick="authSystem.showAuthModal()" style="margin-top: 15px;">
                    ВОЙТИ / ЗАРЕГИСТРИРОВАТЬСЯ
                </button>
            `;
        });
    };

    setTimeout(replaceRegistrationStubs, 100);
});