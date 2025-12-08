class ScheduleViewManager {
    constructor() {
        this.data = null;
        this.journeyData = null;
        this.container = null;
        this.state = {
            currentTurnIndex: -1,
            viewMode: localStorage.getItem('schedule_view_mode') || 'view-grid',
            activeAccordionIndices: new Set(JSON.parse(localStorage.getItem('schedule_accordion_state') || '[0]'))
        };
        this.storageKey = 'schedule_progress';
        this.flatTurns = [];
        this.totalArcana = 0;
        this.totalGoal = 0;

        // View Switching Listeners (Delegation)
        document.addEventListener('click', (e) => {
            if (e.target.matches('.view-btn')) {
                const mode = e.target.dataset.view;
                this.switchView(mode);
            }
        });

        // Accordion Delegated Listener
        document.addEventListener('click', (e) => {
            if (this.state.viewMode === 'view-accordion') {
                const title = e.target.closest('.schedule-period-title');
                if (title) {
                    const periodEl = title.closest('.schedule-period');
                    periodEl.classList.toggle('active');
                    this.saveAccordionState();
                }
            }
        });
    }

    // ... (switchView, updateViewButtons remain same)

    async init() {
        // ... (existing init code)
        this.container = document.getElementById('schedule-view-container');
        if (!this.container) return; // ...

        this.container.innerHTML = '<div style="text-align:center; padding:50px; color:#aaa;">일정 불러오는 중...</div>';

        const scheduleBtn = document.getElementById('schedule-btn');
        if (scheduleBtn) {
            scheduleBtn.onclick = () => {
                const isHidden = window.getComputedStyle(this.container).display === 'none';
                this.toggleView(isHidden);
            };
        }

        try {
            await this.loadData();
            this.loadState();
            this.render();
        } catch (e) {
            // ...
        }
    }

    // ... (loadData remains same)

    loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved !== null) {
            this.state.currentTurnIndex = parseInt(saved, 10);
        }
        // Accordion state is loaded in constructor, but can be refreshed here if needed
        const savedAccordion = localStorage.getItem('schedule_accordion_state');
        if (savedAccordion) {
            this.state.activeAccordionIndices = new Set(JSON.parse(savedAccordion));
        }
    }

    saveState() {
        localStorage.setItem(this.storageKey, this.state.currentTurnIndex);
    }

    saveAccordionState() {
        if (!this.container) return;
        const activeIndices = [];
        const periods = this.container.querySelectorAll('.schedule-period');
        periods.forEach((el, idx) => {
            if (el.classList.contains('active')) activeIndices.push(idx);
        });
        this.state.activeAccordionIndices = new Set(activeIndices);
        localStorage.setItem('schedule_accordion_state', JSON.stringify(activeIndices));
    }

    switchView(mode) {
        this.state.viewMode = mode;
        localStorage.setItem('schedule_view_mode', mode);
        this.render(); // Render will update button states too
    }

    updateViewButtons() {
        const btns = document.querySelectorAll('.view-btn');
        btns.forEach(btn => {
            if (btn.dataset.view === this.state.viewMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    async init() {
        this.container = document.getElementById('schedule-view-container');
        if (!this.container) {
            console.error('Schedule container not found');
            return;
        }

        // Initialize display state (Hidden by default, as per user request)
        // We rely on CSS display:none or default state.

        this.container.innerHTML = '<div style="text-align:center; padding:50px; color:#aaa;">일정 불러오는 중...</div>';

        // Wire up Toggle Button
        const scheduleBtn = document.getElementById('schedule-btn');
        if (scheduleBtn) {
            scheduleBtn.onclick = () => {
                const isHidden = window.getComputedStyle(this.container).display === 'none';
                this.toggleView(isHidden);
            };
        }

        try {
            await this.loadData();
            this.loadState();
            this.render();
        } catch (e) {
            console.error('Schedule View Init Error:', e);
            this.container.innerHTML = `<div style="text-align:center; padding:50px; color:#ff6b6b;">오류가 발생했습니다:<br>${e.message}</div>`;
        }
    }

    async loadData() {
        try {
            const [scheduleRes, journeyRes] = await Promise.all([
                fetch('./data/schedule_data.json'),
                fetch('./data/journey_data.json').catch(() => ({ ok: false }))
            ]);

            if (!scheduleRes.ok) {
                throw new Error(`Schedule data fetch failed: ${scheduleRes.status} ${scheduleRes.statusText}`);
            }

            this.data = await scheduleRes.json();

            if (journeyRes.ok) {
                const rawJourney = await journeyRes.json();
                this.journeyData = [];
                Object.values(rawJourney).forEach(arr => {
                    if (Array.isArray(arr)) {
                        this.journeyData.push(...arr);
                    }
                });
            } else {
                console.warn('Journey data not found, modal feature might be limited.');
                this.journeyData = [];
            }

            // Create flat turns list and calculate totals
            this.flatTurns = [];
            this.totalArcana = 0;
            this.totalGoal = 0;

            if (Array.isArray(this.data)) {
                this.data.forEach(period => {
                    period.turns.forEach(turn => {
                        this.flatTurns.push(turn);
                        turn.events.forEach(ev => {
                            if (ev.type.includes('아르카나')) this.totalArcana++;
                            if (ev.type.includes('목표')) this.totalGoal++;
                        });
                    });
                });
            } else {
                throw new Error('Invalid schedule data format (not an array)');
            }

        } catch (e) {
            console.error('Failed to load schedule data', e);
            throw e;
        }
    }

    loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved !== null) {
            this.state.currentTurnIndex = parseInt(saved, 10);
        }
    }

    saveState() {
        localStorage.setItem(this.storageKey, this.state.currentTurnIndex);
    }

    toggleView(show) {
        const countersEl = document.getElementById('scheduler-counters');
        const gridEl = document.getElementById('scheduler-grid');

        if (show) {
            this.container.style.display = 'block';
            if (gridEl) gridEl.style.display = 'none';
            if (countersEl) countersEl.style.display = 'flex';
        } else {
            this.container.style.display = 'none';
            if (gridEl) gridEl.style.display = 'grid'; // Restore grid
            if (countersEl) countersEl.style.display = 'none';
        }
    }

    render() {
        if (!this.data) return;

        // Calculate Remaining
        let completedArcana = 0;
        let completedGoal = 0;

        this.flatTurns.forEach((turn, index) => {
            if (index <= this.state.currentTurnIndex) {
                turn.events.forEach(ev => {
                    if (ev.type.includes('아르카나')) completedArcana++;
                    if (ev.type.includes('목표')) completedGoal++;
                });
            }
        });

        const remArcana = this.totalArcana - completedArcana;
        const remGoal = this.totalGoal - completedGoal;

        const arcanaEl = document.getElementById('cnt-arcana');
        const goalEl = document.getElementById('cnt-goal');
        if (arcanaEl) arcanaEl.innerText = remArcana;
        if (goalEl) goalEl.innerText = remGoal;

        // Snapshot current accordion state (indices of active periods)
        const activeIndices = new Set();
        if (this.state.viewMode === 'view-accordion') {
            const periods = this.container.querySelectorAll('.schedule-period');
            periods.forEach((el, idx) => {
                if (el.classList.contains('active')) activeIndices.add(idx);
            });
        }

        this.container.innerHTML = '';
        this.container.className = this.state.viewMode;

        // Inject View Mode Controls
        const controlsWrapper = document.createElement('div');
        controlsWrapper.style.textAlign = 'center';
        controlsWrapper.style.marginBottom = '20px';

        const controlsEl = document.createElement('div');
        controlsEl.className = 'view-mode-controls';
        // Inline styles removed, relying on CSS for pill appearance
        controlsEl.innerHTML = `
            <button class="view-btn ${this.state.viewMode === 'view-grid' ? 'active' : ''}" data-view="view-grid">기본</button>
            <button class="view-btn ${this.state.viewMode === 'view-modern' ? 'active' : ''}" data-view="view-modern">카드</button>
            <button class="view-btn ${this.state.viewMode === 'view-accordion' ? 'active' : ''}" data-view="view-accordion">접기</button>
        `;
        controlsWrapper.appendChild(controlsEl);
        this.container.appendChild(controlsWrapper);

        // Update button states immediately after injection
        this.updateViewButtons();

        let globalTurnIndex = 0;

        this.data.forEach((period, pIndex) => {
            const periodEl = document.createElement('div');
            periodEl.className = 'schedule-period';

            // Restore accordion state
            if (this.state.viewMode === 'view-accordion') {
                if (this.state.activeAccordionIndices.has(pIndex)) {
                    periodEl.classList.add('active');
                }
            }

            const titleEl = document.createElement('div');
            titleEl.className = 'schedule-period-title';
            titleEl.textContent = period.title;
            periodEl.appendChild(titleEl);

            const periodTurns = document.createElement('div');
            periodTurns.className = 'period-turns';
            periodEl.appendChild(periodTurns);

            period.turns.forEach(turn => {
                const turnIndex = globalTurnIndex++;
                const isCompleted = turnIndex <= this.state.currentTurnIndex;
                const isActive = turnIndex === this.state.currentTurnIndex;

                const turnEl = document.createElement('div');
                turnEl.className = `schedule-turn ${isCompleted ? 'completed' : ''} ${isActive ? 'active-turn' : ''}`;
                turnEl.dataset.index = turnIndex;

                turnEl.addEventListener('click', (e) => {
                    if (e.target.closest('.schedule-event.interactive')) return;
                    this.handleCheck(turnIndex);
                });

                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'turn-checkbox-wrapper';
                checkboxWrapper.innerHTML = `<div class="turn-checkbox"></div>`;
                turnEl.appendChild(checkboxWrapper);

                const contentEl = document.createElement('div');
                contentEl.className = 'turn-content';

                const headerEl = document.createElement('div');
                headerEl.className = 'turn-header';

                let headerHTML = `<div class="turn-name">${turn.turnInfo || ''}</div>`;
                if (turn.dateInfo) {
                    headerHTML += `<div class="turn-date" style="font-size:0.9rem; color:#888; margin-left:10px;">${turn.dateInfo}</div>`;
                }

                headerEl.innerHTML = headerHTML;
                contentEl.appendChild(headerEl);

                const eventsListEl = document.createElement('div');
                eventsListEl.className = 'turn-events-list';

                const events = turn.events || [];
                const mainEvents = [];
                const floraEvents = [];
                const kalideEvents = [];

                events.forEach(ev => {
                    if (ev.branch === 'flora') floraEvents.push(ev);
                    else if (ev.branch === 'kalide') kalideEvents.push(ev);
                    else mainEvents.push(ev);
                });

                this.renderGroupedEvents(eventsListEl, mainEvents);

                const areIdentical = (floraEvents.length > 0 && kalideEvents.length > 0) &&
                    (floraEvents.length === kalideEvents.length) &&
                    floraEvents.every((ev, i) => ev.content === kalideEvents[i].content && ev.type === kalideEvents[i].type);

                if (areIdentical) {
                    this.renderGroupedEvents(eventsListEl, floraEvents);
                } else if (floraEvents.length > 0 || kalideEvents.length > 0) {
                    const splitContainer = document.createElement('div');
                    splitContainer.className = 'split-container';
                    splitContainer.style.cssText = 'display:flex; flex-direction:column; gap:15px; margin-top:10px;';

                    if (floraEvents.length > 0) {
                        const floraCol = document.createElement('div');
                        floraCol.className = 'split-row flora-row';
                        floraCol.style.cssText = 'border:1px solid #4ade80; padding:8px; border-radius:8px; display:flex; flex-wrap:wrap; gap:10px; align-content:flex-start;';
                        floraCol.innerHTML = `<div style="color:#4ade80; font-weight:bold; width:100%;">플로라</div>`;
                        this.renderGroupedEvents(floraCol, floraEvents);
                        splitContainer.appendChild(floraCol);
                    }

                    if (kalideEvents.length > 0) {
                        const kalideCol = document.createElement('div');
                        kalideCol.className = 'split-row kalide-row';
                        kalideCol.style.cssText = 'border:1px solid #f87171; padding:8px; border-radius:8px; display:flex; flex-wrap:wrap; gap:10px; align-content:flex-start;';
                        kalideCol.innerHTML = `<div style="color:#f87171; font-weight:bold; width:100%;">칼라이드</div>`;
                        this.renderGroupedEvents(kalideCol, kalideEvents);
                        splitContainer.appendChild(kalideCol);
                    }
                    eventsListEl.appendChild(splitContainer);
                }

                contentEl.appendChild(eventsListEl);
                turnEl.appendChild(contentEl);
                periodTurns.appendChild(turnEl);
            });
            this.container.appendChild(periodEl);
        });
    }

    renderGroupedEvents(container, events) {
        const randomGroups = {};
        const normalEvents = [];

        events.forEach(ev => {
            if (ev.type.includes('랜덤')) {
                const typeParts = ev.type.split(',').map(t => t.trim());
                const randomTag = typeParts.find(t => t.startsWith('랜덤'));
                if (randomTag) {
                    const groupKey = randomTag;
                    if (!randomGroups[groupKey]) randomGroups[groupKey] = [];
                    randomGroups[groupKey].push(ev);
                } else {
                    normalEvents.push(ev);
                }
            } else {
                normalEvents.push(ev);
            }
        });

        normalEvents.forEach(ev => {
            container.appendChild(this.createEventBadge(ev));
        });

        Object.keys(randomGroups).forEach(groupKey => {
            const groupParams = randomGroups[groupKey];
            const groupEl = document.createElement('div');
            groupEl.className = 'random-group-box';

            const header = document.createElement('div');
            const types = groupKey.split(',');
            types.forEach(t => {
                let typeClass = this.getTypeClass(t.trim());
                header.innerHTML += `<span class="event-type-badge ${typeClass}" style="margin-right:4px">${t.trim()}</span>`;
            });
            groupEl.appendChild(header);

            groupParams.forEach(ev => {
                groupEl.appendChild(this.createEventBadge(ev, true));
            });
            container.appendChild(groupEl);
        });
    }

    getTypeClass(type) {
        if (type.includes('고정')) return 'type-fixed';
        if (type.includes('랜덤')) return 'type-random';
        if (type.includes('확률')) return 'type-prob';
        if (type.includes('토벌')) return 'type-battle';
        if (type.includes('목표')) return 'type-goal';
        if (type.includes('아르카나')) return 'type-arcana';
        if (type.includes('구원자')) return 'type-savior';
        if (type.includes('인자')) return 'type-inherit';
        return '';
    }

    createEventBadge(ev, simplified = false) {
        const badge = document.createElement('div');
        badge.className = 'schedule-event';

        if (ev.type === '기타') {
            badge.style.display = 'none';
            return badge;
        }

        let typeClass = this.getTypeClass(ev.type);

        const journeyItem = this.findJourneyItem(ev.content);
        if (journeyItem) {
            badge.classList.add('interactive');
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openModal(journeyItem, ev.content);
            });
        }

        if (simplified) {
            badge.className += ' simplified';
            let extraBadgesHtml = '';
            if (ev.type) {
                const tags = ev.type.split(',').map(t => t.trim());
                const displayTags = tags.filter(t => !t.startsWith('랜덤') && !t.startsWith('확률'));

                displayTags.forEach(tag => {
                    let typeClass = this.getTypeClass(tag);
                    extraBadgesHtml += `<span class="event-type-badge ${typeClass}" style="font-size:0.7rem; padding:1px 4px; margin-right:4px;">${tag}</span>`;
                });
            }
            badge.innerHTML = `${extraBadgesHtml}<span class="event-content">${ev.content}</span>`;
        } else {
            badge.innerHTML = `
                <span class="event-type-badge ${typeClass}">${ev.type}</span>
                <span class="event-content">${ev.content}</span>
            `;
        }

        if (journeyItem) {
            badge.innerHTML += ` <span style="font-size:0.8em; margin-left:4px;">🔍</span>`;
        }
        return badge;
    }

    findJourneyItem(content) {
        if (!this.journeyData) return null;
        const normalize = (str) => {
            if (!str) return '';
            return str.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
        };
        const target = normalize(content);
        return this.journeyData.find(item => {
            return normalize(item.name) === target || normalize(item.event_name) === target;
        });
    }

    handleCheck(index) {
        if (this.state.currentTurnIndex === index) {
            this.state.currentTurnIndex = index - 1;
        } else {
            this.state.currentTurnIndex = index;
        }
        this.saveState();
        this.render();
    }

    reset() {
        this.state.currentTurnIndex = -1;
        this.saveState();
        this.render();
    }

    openModal(item, title) {
        let modal = document.getElementById('schedule-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'schedule-modal';
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); z-index: 1000;
                display: flex; justify-content: center; align-items: center;
            `;
            modal.innerHTML = `
                <div class="schedule-modal-content">
                    <button id="close-modal" class="schedule-modal-close">&times;</button>
                    <h3 id="modal-title" class="schedule-modal-title"></h3>
                    <div id="modal-content" class="schedule-modal-body"></div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('#close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }

        const titleEl = modal.querySelector('#modal-title');
        const contentEl = modal.querySelector('#modal-content');

        titleEl.textContent = title;

        let contentHtml = '';
        if (item.desc) contentHtml += `<p>${item.desc}</p>`;

        if (item.choices) {
            contentHtml += `<div class="modal-choices">`;
            item.choices.forEach(choice => {
                contentHtml += `
                    <div class="modal-choice-item">
                        <div class="modal-choice-title">${choice.text || choice.name || '?'}</div>
                        ${choice.condition ? `<div class="modal-choice-condition">조건/비용: ${choice.condition}</div>` : ''}
                        ${choice.result ? `<div class="modal-choice-result">${choice.result}</div>` : ''}
                        ${choice.result_positive ? `<div class="modal-choice-success">성공: ${choice.result_positive}</div>` : ''}
                        ${choice.result_negative ? `<div class="modal-choice-failure">실패: ${choice.result_negative}</div>` : ''}
                    </div>
                 `;
            });
            contentHtml += `</div>`;
        } else {
            contentHtml += JSON.stringify(item, null, 2);
        }

        contentEl.innerHTML = contentHtml;
        modal.style.display = 'flex';
    }
}

window.ScheduleViewManager = new ScheduleViewManager();
