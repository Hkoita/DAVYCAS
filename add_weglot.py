import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

weglot_script = '<script type="text/javascript" src="https://cdn.weglot.com/weglot.min.js"></script>'

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add Weglot CDN just before our i18n.js
    if weglot_script not in content:
        content = content.replace('<script src="js/i18n.js"></script>', 
                                  f'{weglot_script}\n<script src="js/i18n.js"></script>')
                                  
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Weglot script injected into all HTML files.")
