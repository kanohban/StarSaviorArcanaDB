(function () {
    // Modal Manager: Updates event choice names (A/B) and handles nested group structure (Fixed/Success/Failure)
    // "Nuclear Option": Hides React's choice boxes and renders everything manually in a custom container.
    // FIX: Vertically Center Choice Headers.

    let cardsData = null;
    let potentialsData = null; // Store potentials locally
    let dataVersion = 0;

    // Helper to highlight negative numbers
    function highlightNegativeNumbers(text) {
        if (!text) return '';
        // Matches negative numbers like -10, -5.5, -10%
        return text.toString().replace(/(-\d+(?:\.\d+)?%?)/g, '<span style="color: #ef5350;">$1</span>');
    }

    // Poll cards data every 1 second
    function fetchCardsData() {
        fetch('./data/cards.json?v=' + Date.now())
            .then(response => response.json())
            .then(data => {
                const newDataStr = JSON.stringify(data);
                const oldDataStr = cardsData ? JSON.stringify(cardsData) : '';

                if (newDataStr !== oldDataStr) {
                    cardsData = data;
                    dataVersion++;
                    console.log('ModalManager: Data updated to version ' + dataVersion);
                }
            })
            .catch(err => console.error('ModalManager: Failed to load cards data', err));
    }

    // Fetch Potentials Data
    function fetchPotentialsData() {
        fetch('./data/potentials.json')
            .then(response => response.json())
            .then(data => {
                potentialsData = data;
                console.log('ModalManager: Potentials loaded');
            })
            .catch(err => console.error('ModalManager: Failed to load potentials data', err));
    }

    // Initial fetch
    fetchCardsData();
    fetchPotentialsData();
    setInterval(fetchCardsData, 1000);

    // Check for modal every 200ms
    setInterval(() => {
        const modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            updateModalLabels(modalContent);
            injectLevelToggle(modalContent); // Inject Custom Toggle
            updateSupportStats(modalContent);

            // Add immediate click listener to level toggle button (Legacy fallback)
            const levelBtn = modalContent.querySelector('.theme-toggle');
            if (levelBtn && !levelBtn.dataset.supportListenerAttached && levelBtn.style.display !== 'none') {
                levelBtn.dataset.supportListenerAttached = 'true';
                levelBtn.addEventListener('click', () => {
                    // Small delay to allow window.currentLevel to update
                    setTimeout(() => {
                        updateSupportStats(modalContent);
                    }, 50);
                });
            }
        }
    }, 200);

    // --- INJECT CUSTOM LEVEL TOGGLE ---
    function injectLevelToggle(modalContent) {
        const oldBtn = modalContent.querySelector('.theme-toggle');

        // Hide old button if it exists (it acts as state source)
        if (oldBtn) oldBtn.style.display = 'none';

        // Check if already injected
        if (modalContent.querySelector('.custom-level-toggle')) return;

        // Create new toggle container
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'level-toggle custom-level-toggle';

        // Position it below the close button
        toggleContainer.style.position = 'absolute';
        toggleContainer.style.top = '65px';
        toggleContainer.style.right = '20px';
        toggleContainer.style.zIndex = '20';

        // Create Buttons
        const btn35 = document.createElement('button');
        btn35.className = 'level-btn';
        btn35.textContent = 'Lv.35';
        btn35.dataset.level = '35';

        const btn50 = document.createElement('button');
        btn50.className = 'level-btn';
        btn50.textContent = 'Lv.50';
        btn50.dataset.level = '50';

        // Determine Initial State
        let currentLevel = '35'; // Default
        if (typeof window.currentLevel !== 'undefined') {
            currentLevel = window.currentLevel;
        } else if (oldBtn && oldBtn.textContent.includes('50')) {
            currentLevel = '50';
        } else if (oldBtn && oldBtn.textContent.includes('35')) {
            currentLevel = '35';
        }

        if (currentLevel === '35') btn35.classList.add('active');
        else btn50.classList.add('active');

        // Click Handlers
        const handleLevelChange = (newLevel) => {
            if (newLevel === '35') {
                btn35.classList.add('active');
                btn50.classList.remove('active');

                // Sync Old Button if needed
                if (oldBtn && oldBtn.textContent.includes('50')) oldBtn.click();
            } else {
                btn35.classList.remove('active');
                btn50.classList.add('active');

                // Sync Old Button if needed
                if (oldBtn && oldBtn.textContent.includes('35')) oldBtn.click();
            }

            window.currentLevel = newLevel;
            updateSupportStats(modalContent);
        };

        btn35.onclick = (e) => {
            e.stopPropagation();
            handleLevelChange('35');
        };

        btn50.onclick = (e) => {
            e.stopPropagation();
            handleLevelChange('50');
        };

        toggleContainer.appendChild(btn35);
        toggleContainer.appendChild(btn50);

        // Append to modal content directly
        modalContent.appendChild(toggleContainer);
    }

    // --- SUPPORT STATS INJECTION ---
    // --- SUPPORT STATS INJECTION ---
    function updateSupportStats(modalContent) {
        if (!cardsData) return;

        const titleEl = modalContent.querySelector('.modal-header h2');
        if (!titleEl) return;

        const cardName = titleEl.textContent.trim();
        const card = cardsData.find(c => c.이름 === cardName);

        if (!card || !card.지원) {
            const existing = modalContent.querySelector('.custom-support-box');
            if (existing) existing.remove();
            return;
        }

        // 1. Determine Level (35 vs 50)
        let currentLevel = '50';
        if (typeof window.currentLevel !== 'undefined') {
            currentLevel = window.currentLevel;
        } else {
            const levelBtn = modalContent.querySelector('.theme-toggle');
            if (levelBtn && levelBtn.textContent.includes('35')) {
                currentLevel = '35';
            }
        }
        const isLevel50 = currentLevel === '50';

        // Filter valid items for the current level
        const validItems = card.지원.filter(item => {
            const val = isLevel50 ? item.수치50 : item.수치35;
            return item.타입 && val && val.trim() !== '';
        });

        if (validItems.length === 0) {
            const existing = modalContent.querySelector('.custom-support-box');
            if (existing) existing.remove();
            return;
        }

        // 2. Render Support Section
        const allHeaders = Array.from(modalContent.querySelectorAll('h4'));
        let targetHeader = null;

        ['감응', '훈련'].forEach(key => {
            if (!targetHeader) {
                targetHeader = allHeaders.find(h => h.textContent.includes(key));
            }
        });

        if (!targetHeader) {
            targetHeader = Array.from(modalContent.querySelectorAll('h3')).find(h => h.textContent.includes('추가 효과'));
        }

        if (!targetHeader) return;

        let targetGrid = null;

        if (targetHeader.tagName === 'H4') {
            const box = targetHeader.closest('.bonus-box');
            if (box) targetGrid = box.parentElement;
        } else if (targetHeader.tagName === 'H3') {
            const group = targetHeader.closest('.info-group');
            if (group) targetGrid = group.querySelector('.bonus-grid');
        }

        if (!targetGrid) return;

        let supportBox = targetGrid.querySelector('.custom-support-box');

        if (!supportBox) {
            supportBox = document.createElement('div');
            supportBox.className = 'bonus-box custom-support-box';
            targetGrid.appendChild(supportBox);
        }

        const currentMode = supportBox.dataset.mode;
        const newMode = isLevel50 ? '50' : '35';

        if (currentMode === newMode && supportBox.dataset.cardName === cardName) return;

        supportBox.dataset.mode = newMode;
        supportBox.dataset.cardName = cardName;
        supportBox.innerHTML = '';

        const header = document.createElement('h4');
        header.textContent = '지원 의뢰';
        supportBox.appendChild(header);

        const list = document.createElement('ul');

        validItems.forEach(item => {
            const li = document.createElement('li');
            li.appendChild(document.createTextNode(item.타입 + ' '));

            const valueSpan = document.createElement('span');
            valueSpan.className = 'bonus-value';
            const val = isLevel50 ? item.수치50 : item.수치35;
            valueSpan.innerHTML = highlightNegativeNumbers(val);

            li.appendChild(valueSpan);
            list.appendChild(li);
        });

        supportBox.appendChild(list);
    }

    // --- SELF-CONTAINED POPUP FUNCTION ---
    const showPotentialPopup = (n, d, target) => {
        const id = "pot-popup-manager";
        let el = document.getElementById(id);
        if (el) el.remove();

        const isMobile = !!document.querySelector(".mobile-mode");
        const modal = document.querySelector(".modal-content");
        let mw = "250px";
        if (isMobile && modal) {
            mw = (modal.offsetWidth * 0.4) + "px";
        } else if (isMobile) {
            mw = "50vw";
        }

        el = document.createElement("div");
        el.id = id;
        el.style.cssText = `position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:10px;background:var(--card-bg, #2a2a2a);padding:10px;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,0.3);z-index:2000;width:max-content;max-width:${mw};border:1px solid var(--primary-color, #90caf9);color:var(--text-color, #e0e0e0);text-align:left;font-size:0.9rem;white-space:normal;cursor:auto;`;

        const arrow = document.createElement("div");
        arrow.style.cssText = "position:absolute;top:-6px;left:50%;transform:translateX(-50%) rotate(45deg);width:10px;height:10px;background:var(--card-bg, #2a2a2a);border-left:1px solid var(--primary-color, #90caf9);border-top:1px solid var(--primary-color, #90caf9);";
        el.appendChild(arrow);

        const content = document.createElement("div");
        content.innerHTML = `<p style="margin:0;line-height:1.4;">${d}</p>`;
        el.appendChild(content);

        if (getComputedStyle(target).position === 'static') {
            target.style.position = 'relative';
        }
        target.appendChild(el);

        if (modal) {
            const tr = el.getBoundingClientRect();
            const mr = modal.getBoundingClientRect();
            let off = 0;
            if (tr.left < mr.left + 10) {
                off = (mr.left + 10) - tr.left;
            } else if (tr.right > mr.right - 10) {
                off = (mr.right - 10) - tr.right;
            }
            if (off !== 0) {
                el.style.transform = `translateX(calc(-50% + ${off}px))`;
                arrow.style.transform = `translateX(calc(-50% - ${off}px)) rotate(45deg)`;
            }
        }

        const close = (e) => {
            if (e.target !== target && !target.contains(e.target)) {
                el.remove();
                document.removeEventListener("click", close);
            }
        };
        setTimeout(() => document.addEventListener("click", close), 0);
    };
    // -------------------------------------

    function updateModalLabels(modalContent) {
        if (!cardsData) return;

        const titleEl = modalContent.querySelector('.modal-header h2');
        if (!titleEl) return;

        const cardName = titleEl.textContent.trim();
        const card = cardsData.find(c => c.이름 === cardName);

        if (!card || !card.이벤트) return;

        // 1. Update Text Names (Nuclear Search) & Identify Headers
        const walker = document.createTreeWalker(
            modalContent,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const txt = node.nodeValue.trim();
            if (txt === 'A' || txt === 'B') {
                const parent = node.parentElement;
                const stageCard = parent.closest('.journey-stage-card');
                if (stageCard) {
                    const allStageCards = Array.from(modalContent.querySelectorAll('.journey-stage-card'));
                    const index = allStageCards.indexOf(stageCard);
                    const stageKey = ['1단계', '2단계', '3단계'][index];

                    if (stageKey && card.이벤트[stageKey] && card.이벤트[stageKey].이름_선택지) {
                        const choiceNames = card.이벤트[stageKey].이름_선택지;
                        const target = txt === 'A' ? choiceNames.선택지A : choiceNames.선택지B;
                        if (target && node.nodeValue !== target) {
                            node.nodeValue = target;
                        }
                    }
                }
            }
        }

        // 2. Handle Nested Group Structure (Nuclear Rendering)
        const stageCards = modalContent.querySelectorAll('.journey-stage-card');
        stageCards.forEach((stageCard, index) => {
            const stageKey = ['1단계', '2단계', '3단계'][index];
            if (!stageKey || !card.이벤트[stageKey]) return;

            const stageData = card.이벤트[stageKey];

            // --- DYNAMIC LAYOUT CHECK (Is B empty?) ---
            let isBEmpty = true;
            const choiceDataB = stageData['선택지B'];
            if (Array.isArray(choiceDataB)) {
                for (const group of choiceDataB) {
                    if (group.획득 && group.획득.length > 0) {
                        isBEmpty = false;
                        break;
                    }
                }
            } else if (choiceDataB) {
                isBEmpty = false;
            }

            // Apply Grid Layout to Wrapper
            const anyChoiceBox = stageCard.querySelector('.choice-box');
            if (anyChoiceBox) {
                const choicesWrapper = anyChoiceBox.closest('.choices-wrapper') || anyChoiceBox.parentElement;
                if (choicesWrapper && choicesWrapper.classList.contains('choices-wrapper')) {
                    if (isBEmpty) {
                        choicesWrapper.style.gridTemplateColumns = '1fr';
                    } else {
                        choicesWrapper.style.gridTemplateColumns = '1fr 1fr';
                    }
                }
            }

            // --- HEADER LAYOUT HANDLING ---
            let headers = Array.from(stageCard.querySelectorAll('.choice-label'));
            if (headers.length < 2) {
                const choiceNames = card.이벤트[stageKey].이름_선택지;
                const nameA = choiceNames.선택지A || 'A';
                const nameB = choiceNames.선택지B || 'B';

                const allDivs = Array.from(stageCard.querySelectorAll('div, span, h3, h4'));
                const headerA = allDivs.find(el => el.textContent.trim() === nameA && !el.closest('.choice-box'));
                const headerB = allDivs.find(el => el.textContent.trim() === nameB && !el.closest('.choice-box'));

                if (headerA && headerB) {
                    headers = [headerA, headerB];
                }
            }

            if (headers.length >= 2) {
                const headerContainer = headers[0].parentElement;

                // Apply Centering Styles to Headers
                headers.forEach(header => {
                    header.style.display = 'flex';
                    header.style.alignItems = 'center';
                    header.style.justifyContent = 'center';
                    header.style.height = '100%';
                    header.style.textAlign = 'center';
                });

                if (isBEmpty) {
                    headerContainer.style.gridTemplateColumns = '1fr';
                    headers[1].style.display = 'none';
                    headers[0].style.display = 'none';
                } else {
                    headerContainer.style.gridTemplateColumns = '1fr 1fr';
                    headers[1].style.display = 'flex'; // Restore flex display
                    headers[0].style.width = '';
                }
            }
            // ------------------------------------------

            ['A', 'B'].forEach(choiceType => {
                if (choiceType === 'B' && isBEmpty) {
                    const reactBoxesB = Array.from(stageCard.querySelectorAll(`.choice-box.choice-b`));
                    reactBoxesB.forEach(box => box.style.setProperty('display', 'none', 'important'));

                    const customContainerB = stageCard.querySelector(`.custom-choice-container-b`);
                    if (customContainerB) customContainerB.style.display = 'none';

                    return;
                }

                const choiceKey = `선택지${choiceType}`;
                const choiceData = stageData[choiceKey];

                if (Array.isArray(choiceData) && choiceData.length > 0 && choiceData[0].여부) {
                    const reactBoxes = Array.from(stageCard.querySelectorAll(`.choice-box.choice-${choiceType.toLowerCase()}:not(.generated-box)`));

                    if (reactBoxes.length > 0) {
                        reactBoxes.forEach(box => {
                            box.style.setProperty('display', 'none', 'important');
                        });

                        const anchorBox = reactBoxes[0];
                        const parentGrid = anchorBox.parentElement;

                        let customContainer = parentGrid.querySelector(`.custom-choice-container-${choiceType.toLowerCase()}`);

                        if (!customContainer) {
                            customContainer = document.createElement('div');
                            customContainer.className = `custom-choice-container-${choiceType.toLowerCase()} choice-column-wrapper`;
                            customContainer.style.display = 'flex';
                            customContainer.style.flexDirection = 'column';
                            customContainer.style.gap = '0.5rem';
                            customContainer.style.width = '100%';
                            customContainer.style.height = '100%';

                            parentGrid.insertBefore(customContainer, anchorBox);
                        }

                        customContainer.style.display = 'flex';

                        const currentVersion = customContainer.dataset.dataVersion;
                        if (parseInt(currentVersion) !== dataVersion) {
                            customContainer.dataset.dataVersion = dataVersion;
                            customContainer.innerHTML = '';

                            choiceData.forEach((group, groupIndex) => {
                                if (group.획득 && group.획득.length > 0) {
                                    const box = document.createElement('div');
                                    box.className = `choice-box choice-${choiceType.toLowerCase()} generated-box`;

                                    box.style.display = 'flex';
                                    box.style.flexDirection = 'column';
                                    box.style.width = '100%';
                                    box.style.boxSizing = 'border-box';

                                    if (group.여부 === '성공') {
                                        box.style.backgroundColor = 'rgba(0, 100, 255, 0.15)';
                                        box.style.border = '1px solid rgba(0, 100, 255, 0.3)';
                                    } else if (group.여부 === '실패') {
                                        box.style.backgroundColor = 'rgba(255, 0, 0, 0.15)';
                                        box.style.border = '1px solid rgba(255, 0, 0, 0.3)';
                                    }

                                    const contentWrapper = document.createElement('div');
                                    contentWrapper.style.display = 'flex';
                                    contentWrapper.style.flexDirection = 'column';
                                    contentWrapper.style.gap = '0.8rem';
                                    contentWrapper.style.width = '100%';

                                    if (group.여부 === '성공' || group.여부 === '실패') {
                                        const badge = document.createElement('div');
                                        badge.textContent = group.여부;
                                        badge.style.fontSize = '0.8rem';
                                        badge.style.fontWeight = 'bold';
                                        badge.style.marginBottom = '0.25rem';
                                        badge.style.color = group.여부 === '성공' ? '#90caf9' : '#ef5350';
                                        contentWrapper.appendChild(badge);
                                    }

                                    group.획득.forEach(item => {
                                        if (!item.타입 && !item.수치) return;

                                        const row = document.createElement('div');
                                        row.className = 'choice-content-single';
                                        row.style.display = 'flex';
                                        row.style.setProperty('justify-content', 'flex-start', 'important');
                                        row.style.gap = '0.5rem';
                                        row.style.textAlign = 'left';
                                        row.style.width = '100%';
                                        row.style.minHeight = '24px';

                                        const typeSpan = document.createElement('span');
                                        typeSpan.className = 'choice-type';
                                        typeSpan.textContent = item.타입;

                                        const valueSpan = document.createElement('span');
                                        valueSpan.className = 'choice-value';
                                        valueSpan.innerHTML = highlightNegativeNumbers(item.수치);

                                        // --- POTENTIAL POPUP LOGIC ---
                                        if (potentialsData && potentialsData[item.수치]) {
                                            valueSpan.style.cursor = 'pointer';
                                            valueSpan.style.textDecoration = 'underline';
                                            valueSpan.style.textDecorationStyle = 'dotted';
                                            valueSpan.style.color = 'var(--primary-color, #90caf9)';

                                            valueSpan.onclick = (e) => {
                                                e.stopPropagation();
                                                showPotentialPopup(item.수치, potentialsData[item.수치], e.currentTarget);
                                            };
                                        }
                                        // -----------------------------

                                        if (item.타입 && item.타입.includes('여정 디버프')) {
                                            valueSpan.style.color = '#ef5350';
                                            valueSpan.style.setProperty('color', '#ef5350', 'important');
                                        }

                                        row.appendChild(typeSpan);
                                        row.appendChild(valueSpan);
                                        contentWrapper.appendChild(row);
                                    });

                                    box.appendChild(contentWrapper);
                                    customContainer.appendChild(box);
                                }
                            });
                        }
                    }
                }
            });
        });
    }
})();
