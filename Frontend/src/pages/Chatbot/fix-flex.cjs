const fs = require('fs');
let c = fs.readFileSync('widget-script.ts', 'utf8');

// FIX 1: messages.style.display = 'block' -> 'flex'
// This is what breaks the WhatsApp-style alignment
// When the container is display:block, align-self on children has no effect
c = c.replace(
  "messages.style.display = 'block';\\n                form.style.display = 'flex';\\n\\n                if (!messages.children.length) {\\n                    addMessage(welcomeText, 'bot');\\n                }\\n                setTimeout(function () { input.focus(); }, 50);\n            }\n        }",
  "messages.style.display = 'flex';\\n                form.style.display = 'flex';\\n\\n                if (!messages.children.length) {\\n                    addMessage(welcomeText, 'bot');\\n                }\\n                setTimeout(function () { input.focus(); }, 50);\n            }\n        }"
);

// Try simpler replace for all occurrences of display 'block' on messages
c = c.replace(/messages\.style\.display = 'block'/g, "messages.style.display = 'flex'");

// FIX 2: Update default apiUrl to http://127.0.0.1:2785
// The apiUrl is configured from window.WaflowConfig, no hardcoded default to change in source
// But we need to update the Chatbot.tsx embed snippet default

// FIX 3: Add margin to messages so they don't look cramped
// User messages: margin-left auto (push to right)
// Bot messages: margin-right auto (push to left)

// Verify fix
console.log('display flex fix applied:', c.includes("messages.style.display = 'flex'"));
console.log('Old display block occurrences:', (c.match(/messages\.style\.display = 'block'/g) || []).length);

fs.writeFileSync('widget-script.ts', c);
console.log('Done!');
