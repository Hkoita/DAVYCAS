import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 2. Inject lang-switcher in nav-cta
    # Target:
    # <div class="nav-cta">
    #     <a href="#" class="btn-don" data-i18n="nav_donate">Faire un don</a>
    # </div>
    if 'lang-switcher' not in content:
        content = re.sub(
            r'<div class="nav-cta">\s*(<a[^>]+>Faire un don</a>)\s*</div>',
            r'<div class="nav-cta" style="display:flex; align-items:center;">\n                <div class="lang-switcher">\n                    <button class="lang-toggle-btn" aria-label="Changer de langue">FR / EN</button>\n                </div>\n                \1\n            </div>',
            content
        )
        
    # Save
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Updated all HTML files part 2.")
