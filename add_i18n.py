import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

# Dictionary mapping text to data-i18n key for exact matches
i18n_map = {
    'Accueil': 'nav_home',
    'À Propos': 'nav_about',
    'Piliers': 'nav_pillars',
    'Interventions': 'nav_interventions',
    'Études & Formations': 'nav_studies',
    'Laboratoire': 'nav_lab',
    'Œuvres Sociales': 'nav_social',
    'Surveillance Épidémiologique': 'nav_epi',
    'Système d’Information': 'nav_sys',
    'Projets': 'nav_projects',
    'Nos produits': 'nav_products',
    'Blog': 'nav_blog',
    'Contact': 'nav_contact',
    'Faire un don': 'nav_donate',
    
    'Découvrir': 'btn_discover',
    'Contacter DAVYCAS': 'btn_contact',
    'Voir nos projets': 'btn_projects',
    'Découvrir STELab': 'btn_stelab',
    'Découvrir SITEB': 'btn_siteb',
    'Voir nos interventions': 'btn_interventions',
    'Voir nos produits': 'btn_products',
    
    'STELab': 'btn_stelab', # Used in Nos produits dropdown, same text as product name
    'SITEB': 'btn_siteb',
}

# Add dropdown mapping separately as it conflicts with button texts
dropdown_map = {
    'STELab': 'nav_products_stelab',
    'SITEB': 'nav_products_siteb'
}

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add data-i18n to nav links (direct text match within <a> or <li>)
    # Using regex to find <a> tags and insert data-i18n
    # Need to be careful not to double add
    
    def replace_a_tag(match):
        full_match = match.group(0)
        attrs = match.group(1)
        inner_html = match.group(2)
        
        # If already has data-i18n, skip
        if 'data-i18n' in attrs:
            return full_match
            
        # Clean text to match
        text_only = re.sub(r'<[^>]+>', '', inner_html).strip()
        
        if text_only in i18n_map:
            key = i18n_map[text_only]
            # Special case for STELab and SITEB in dropdown
            if 'dropdown-link' in attrs and text_only in dropdown_map:
                 # Actually, user said "Sous-menu Nos produits : STELab -> STELab"
                 # It's better not to translate proper nouns unless they want it to stay the same.
                 # User said "Ne pas traduire les noms propres : STELab, SITEB". So no data-i18n needed?
                 # Wait, user explicitly gave: "Sous-menu Nos produits : STELab → STELab, SITEB → SITEB"
                 # And "Ne pas traduire les noms propres". So we can skip adding data-i18n to STELab and SITEB, 
                 # or add it with identical translation. Let's just skip them.
                 if text_only in ['STELab', 'SITEB']:
                     return full_match
                     
            return f'<a{attrs} data-i18n="{key}">{inner_html}</a>'
            
        return full_match

    content = re.sub(r'<a([^>]*)>(.*?)</a>', replace_a_tag, content, flags=re.DOTALL)
    
    # 2. Inject lang-switcher in nav-cta
    # Target:
    # <div class="nav-cta">
    #     <a href="#" class="btn-don" data-i18n="nav_donate">Faire un don</a>
    # </div>
    if 'lang-switcher' not in content:
        # Also need to add style="display:flex; align-items:center;" to nav-cta
        content = re.sub(
            r'<div class="nav-cta">\s*(<a[^>]+Faire un don[^>]*>)\s*</div>',
            r'<div class="nav-cta" style="display:flex; align-items:center;">\n                <div class="lang-switcher">\n                    <button class="lang-toggle-btn" aria-label="Changer de langue">FR / EN</button>\n                </div>\n                \1\n            </div>',
            content
        )
        
    # 3. Add the script before </body>
    if '<script src="js/i18n.js"></script>' not in content:
        content = content.replace('</body>', '<script src="js/i18n.js"></script>\n</body>')
        
    # 4. Save
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Updated all HTML files.")
