const FooterManager = {
    init(container) {
        if (!container) {
            console.error('FooterManager: Container not found');
            return;
        }

        const footerHTML = `
            <div class="app-footer-content">
                <p>이 페이지는 게임 '스타 세이비어'의 비영리 팬 프로젝트입니다.</p>
                <p>프로젝트에 사용된 모든 자산, 데이터, 이미지 및 텍스트의 소유권은 STUDIOBSIDE 에 있습니다.</p>
                <p>© STUDIOBSIDE Co. Ltd All Rights Reserved.</p>
                <div class="hits-counter" style="margin-top: 10px;">
                    <a href="https://myhits.vercel.app">
                        <img src="https://myhits.vercel.app/api/hit/https%3A%2F%2Fkanohban.github.io%2FStarSaviorArcanaDB%2F?color=blue&label=hits&size=small"
                            alt="hits">
                    </a>
                </div>
            </div>
        `;

        container.innerHTML = footerHTML;
        container.classList.add('app-footer');
    }
};

window.FooterManager = FooterManager;
