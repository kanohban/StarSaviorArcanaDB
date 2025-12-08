class ScheduleViewManager {
    constructor() {
        this.data = null;
        this.journeyData = null;
        this.container = null;
        this.state = {
            currentTurnIndex: -1 // -1 means nothing checked
        };
        this.storageKey = 'schedule_progress';
        this.flatTurns = []; // Flattened list of turns for easier index management

        // Counters
        this.totalArcana = 0;
        this.totalGoal = 0;
    }

    async init() {
        this.container = document.getElementById('schedule-view-container');
        if (!this.container) {
            console.error('Schedule container not found');
            return;
        }

        // Show loading state
        this.container.innerHTML = '<div style="text-align:center; padding:50px; color:#aaa;">일정 불러오는 중...</div>';

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
                // Flatten the object values (arrays) into one single array
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

                        // Count Events
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
        if (show) {
            this.container.style.display = 'block';
            document.getElementById('scheduler-grid').style.display = 'none';
            if (countersEl) countersEl.style.display = 'flex';
        } else {
            this.container.style.display = 'none';
            document.getElementById('scheduler-grid').style.display = 'grid'; // or inherited
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

        // Continue rendering...

        this.container.innerHTML = '';

        let globalTurnIndex = 0;

        this.data.forEach(period => {
            const periodEl = document.createElement('div');
            periodEl.className = 'schedule-period';

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
                const isActive = turnIndex === this.state.currentTurnIndex; // The one actually clicked

                const turnEl = document.createElement('div');
                turnEl.className = `schedule-turn ${isCompleted ? 'completed' : ''} ${isActive ? 'active-turn' : ''}`;
                turnEl.dataset.index = turnIndex;

                // Click handler for the whole row (except interactive events might capture click)
                turnEl.addEventListener('click', (e) => {
                    // Prevent triggering if clicked on an event badge
                    if (e.target.closest('.schedule-event.interactive')) return;
                    this.handleCheck(turnIndex);
                });

                // Checkbox
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'turn-checkbox-wrapper';
                checkboxWrapper.innerHTML = `<div class="turn-checkbox"></div>`;
                turnEl.appendChild(checkboxWrapper);

                // Content
                const contentEl = document.createElement('div');
                contentEl.className = 'turn-content';

                // Header (Turn name)
                const headerEl = document.createElement('div');
                headerEl.className = 'turn-header';

                let headerHTML = `<div class="turn-name">${turn.turnInfo || ''}</div>`;
                if (turn.dateInfo) {
                    headerHTML += `<div class="turn-date" style="font-size:0.9rem; color:#888; margin-left:10px;">${turn.dateInfo}</div>`;
                }

                headerEl.innerHTML = headerHTML;
                contentEl.appendChild(headerEl);

                // Events
                const eventsListEl = document.createElement('div');
                eventsListEl.className = 'turn-events-list';

                // Group Events
                const events = turn.events || [];
                const mainEvents = [];
                const floraEvents = [];
                const kalideEvents = [];

                events.forEach(ev => {
                    if (ev.branch === 'flora') floraEvents.push(ev);
                    else if (ev.branch === 'kalide') kalideEvents.push(ev);
                    else mainEvents.push(ev);
                });

                // Render Main
                this.renderGroupedEvents(eventsListEl, mainEvents);

                // Compare Flora and Kalide events to see if they are identical
                const areIdentical = (floraEvents.length > 0 && kalideEvents.length > 0) &&
                    (floraEvents.length === kalideEvents.length) &&
                    floraEvents.every((ev, i) => ev.content === kalideEvents[i].content && ev.type === kalideEvents[i].type);

                if (areIdentical) {
                    this.renderGroupedEvents(eventsListEl, floraEvents);
                } else if (floraEvents.length > 0 || kalideEvents.length > 0) {
                    const splitContainer = document.createElement('div');
                    splitContainer.className = 'split-container';
                    splitContainer.style.display = 'flex';
                    splitContainer.style.flexDirection = 'column';
                    splitContainer.style.gap = '15px';
                    splitContainer.style.marginTop = '10px';

                    // Flora Row
                    if (floraEvents.length > 0) {
                        const floraCol = document.createElement('div');
                        floraCol.className = 'split-row flora-row';

                        floraCol.style.border = '1px solid #4ade80';
                        floraCol.style.padding = '8px';
                        floraCol.style.borderRadius = '8px';
                        // Enable gap between internal items (badges/groups)
                        floraCol.style.display = 'flex';
                        floraCol.style.flexWrap = 'wrap';
                        floraCol.style.gap = '10px';
                        floraCol.style.alignContent = 'flex-start';

                        floraCol.innerHTML = `<div style="color:#4ade80; font-weight:bold; width:100%;">플로라</div>`;
                        this.renderGroupedEvents(floraCol, floraEvents);
                        splitContainer.appendChild(floraCol);
                    }

                    // Kalide Row
                    if (kalideEvents.length > 0) {
                        const kalideCol = document.createElement('div');
                        kalideCol.className = 'split-row kalide-row';

                        kalideCol.style.border = '1px solid #f87171';
                        kalideCol.style.padding = '8px';
                        kalideCol.style.borderRadius = '8px';
                        // Enable gap between internal items
                        kalideCol.style.display = 'flex';
                        kalideCol.style.flexWrap = 'wrap';
                        kalideCol.style.gap = '10px';
                        kalideCol.style.alignContent = 'flex-start';

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
                // Extract "랜덤" or "랜덤X" as the primary grouping key
                const typeParts = ev.type.split(',').map(t => t.trim());
                const randomTag = typeParts.find(t => t.startsWith('랜덤'));
                if (randomTag) {
                    const groupKey = randomTag;
                    if (!randomGroups[groupKey]) randomGroups[groupKey] = [];
                    randomGroups[groupKey].push(ev);
                } else {
                    // Fallback if '랜덤' in name but not found in parts? Should not happen if includes is true
                    normalEvents.push(ev);
                }
            } else {
                normalEvents.push(ev);
            }
        });

        // Render Normal
        normalEvents.forEach(ev => {
            container.appendChild(this.createEventBadge(ev));
        });

        // Render Groups
        Object.keys(randomGroups).forEach(groupKey => {
            const groupParams = randomGroups[groupKey];
            const groupEl = document.createElement('div');
            groupEl.className = 'random-group-box';

            // Header (supports multiple badges: "확률,랜덤")
            const header = document.createElement('div');
            const types = groupKey.split(',');
            types.forEach(t => {
                let typeClass = this.getTypeClass(t.trim());
                header.innerHTML += `<span class="event-type-badge ${typeClass}" style="margin-right:4px">${t.trim()}</span>`;
            });
            groupEl.appendChild(header);

            // Items
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

        // Check if interactive (in journey data)
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

            // Allow displaying extra badges (non-random) inside the group item
            let extraBadgesHtml = '';
            if (ev.type) {
                const tags = ev.type.split(',').map(t => t.trim());
                // Filter out '랜덤' tags as they are likely the group header
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
            // Replace en-dash, em-dash with hyphen, and normalize spaces
            return str.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
        };

        const target = normalize(content);

        return this.journeyData.find(item => {
            return normalize(item.name) === target || normalize(item.event_name) === target;
        });
    }

    handleCheck(index) {
        // Toggle logic:
        // If clicking the current latest, uncheck it (go back one step)
        // If clicking a previous one, set that as new latest
        // If clicking next one, set that as new latest

        if (this.state.currentTurnIndex === index) {
            // Uncheck this one
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
        // Use existing modal logic from SchedulerManager if possible, or create simple one
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

        // Format journey item content
        // Assuming item has choices or description
        let contentHtml = '';
        if (item.desc) contentHtml += `<p>${item.desc}</p>`;

        if (item.choices) {
            // Reuse generic choice rendering if possible, or simple list
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
            contentHtml += JSON.stringify(item, null, 2); // Fallback
        }

        contentEl.innerHTML = contentHtml;
        modal.style.display = 'flex';
    }
}

window.ScheduleViewManager = new ScheduleViewManager();
