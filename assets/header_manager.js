const HeaderManager = {
    async init(container, pageId) {
        try {
            // 1. Load Config
            const response = await fetch('./data/layout_config.json');
            if (!response.ok) throw new Error('Failed to load config');
            const config = await response.json();

            // 2. Apply Global Config
            if (config.global) {
                this.applyGlobalConfig(config.global);
            }

            const pageConfig = config.pages[pageId];

            if (!pageConfig) {
                console.error(`Configuration for page "${pageId}" not found.`);
                return;
            }

            // 3. Render Header
            this.render(container, pageConfig);

            // 4. Sync State on Navigation/Tab Switch
            window.addEventListener('pageshow', () => this.syncState());
            window.addEventListener('storage', () => this.syncState());
        } catch (error) {
            console.error('Error initializing header:', error);
        }
    },

    applyGlobalConfig(globalConfig) {
        const root = document.documentElement;
        if (globalConfig.headerHeight) root.style.setProperty('--header-height', globalConfig.headerHeight);
        if (globalConfig.headerPadding) root.style.setProperty('--header-padding', globalConfig.headerPadding);
        if (globalConfig.maxWidth) root.style.setProperty('--header-max-width', globalConfig.maxWidth);
    },

    render(container, config) {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const savedView = localStorage.getItem('viewMode') || 'pc';

        const headerHTML = `
            <div class="custom-header-top">
                <div class="header-left">
                    <div class="hamburger-wrapper">
                        <button class="header-btn hamburger-btn" title="메뉴">☰</button>
                        <div class="nav-dropdown">
                            ${this.renderNavItems(config.left)}
                        </div>
                    </div>
                </div>
                <h1>${config.title}</h1>
                <div class="header-right">
                    <div class="toggle-group">
                        ${this.renderButtons(config.right, savedTheme, savedView)}
                    </div>
                </div>
            </div>
        `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = headerHTML;
        const headerElement = tempDiv.firstElementChild;

        this.attachEvents(headerElement);

        if (container) {
            container.innerHTML = ''; // Clear container before appending
            container.appendChild(headerElement);
        }

        return headerElement;
    },

    renderNavItems(items) {
        if (!items) return '';
        return items.map(item => {
            if (item.type === 'button') {
                return `
                    <div class="nav-item" onclick="${item.action === 'navigate' ? `location.href='${item.target}'` : item.action}">
                        <span class="icon">${item.icon}</span>
                        <span>${item.title}</span>
                    </div>
                `;
            }
            return '';
        }).join('');
    },

    renderButtons(buttons, savedTheme, savedView) {
        if (!buttons) return '';
        return buttons.map(btn => {
            if (btn.type === 'theme-toggle') {
                return `<button class="header-btn theme-toggle" title="테마 변경">${savedTheme === 'dark' ? '🌙' : '☀️'}</button>`;
            } else if (btn.type === 'view-toggle') {
                return `<button class="header-btn mobile-toggle" title="뷰 전환">${savedView === 'mobile' ? '📱' : '🖥️'}</button>`;
            }
            return '';
        }).join('');
    },

    attachEvents(element) {
        const html = document.documentElement;
        const body = document.body;
        const themeBtn = element.querySelector('.theme-toggle');
        const mobileBtn = element.querySelector('.mobile-toggle');
        const hamburgerBtn = element.querySelector('.hamburger-btn');
        const dropdown = element.querySelector('.nav-dropdown');

        if (hamburgerBtn && dropdown) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!element.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });
        }

        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const currentTheme = html.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                html.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                themeBtn.textContent = newTheme === 'dark' ? '🌙' : '☀️';
            });
        }

        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => {
                body.classList.toggle('mobile-mode');
                const isMobile = body.classList.contains('mobile-mode');
                localStorage.setItem('viewMode', isMobile ? 'mobile' : 'pc');
                mobileBtn.textContent = isMobile ? '📱' : '🖥️';
            });
        }
    },

    syncState() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const savedView = localStorage.getItem('viewMode') || 'pc';

        // Update Root/Body
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (savedView === 'mobile') {
            document.body.classList.add('mobile-mode');
        } else {
            document.body.classList.remove('mobile-mode');
        }

        // Update Buttons
        const themeBtn = document.querySelector('.theme-toggle');
        if (themeBtn) {
            themeBtn.textContent = savedTheme === 'dark' ? '🌙' : '☀️';
        }

        const mobileBtn = document.querySelector('.mobile-toggle');
        if (mobileBtn) {
            mobileBtn.textContent = savedView === 'mobile' ? '📱' : '🖥️';
        }
    }
};

window.HeaderManager = HeaderManager;
