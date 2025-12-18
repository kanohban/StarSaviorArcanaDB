const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'assets', 'index-DrY0adZU.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Read file length:', content.length);

// Inject "Journey" button into header
// Target: `g.jsx("h1", { children: "스타 세이비어 아르카나 DB" })`
// We can add a button next to it or in the header-controls.
// The header-controls has theme/mobile toggles.
// Let's add it to `header-controls` for consistency.

// Search for `className: "header-controls", children: [`
// It currently contains theme toggle and mobile toggle.
// `children: [g.jsx("button", { className: "theme-toggle", ... }), g.jsx("button", { className: "mobile-toggle", ... })]`

const headerControlsStart = 'className: "header-controls", children: [';
const idx = content.indexOf(headerControlsStart);

if (idx !== -1) {
    // We want to prepend or append. Let's prepend to be on the left of toggles?
    // Or append?
    // Let's prepend so it's [Journey] [Theme] [Mobile]

    // Button code:
    // `g.jsx("button", { className: "journey-link", onClick: () => window.location.href="journey.html", style: { marginRight: "10px", padding: "4px 8px", fontSize: "0.8rem", cursor: "pointer" }, children: "📖 족보" }),`

    const injection = 'g.jsx("button", { className: "journey-link", onClick: () => window.location.href="journey.html", style: { marginRight: "10px", padding: "4px 8px", fontSize: "0.8rem", cursor: "pointer", background: "var(--card-bg)", border: "1px solid var(--border-color)", color: "var(--text-color)", borderRadius: "4px" }, children: "📖 족보" }),';

    const insertPos = idx + headerControlsStart.length;
    content = content.slice(0, insertPos) + injection + content.slice(insertPos);
    console.log('Injected Journey link into header-controls.');
} else {
    console.log('header-controls not found.');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done.');
