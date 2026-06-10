import os

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

weglot_script = '<script type="text/javascript" src="https://cdn.weglot.com/weglot.min.js"></script>\n'

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove Weglot CDN
    if weglot_script in content:
        content = content.replace(weglot_script, '')
    elif '<script type="text/javascript" src="https://cdn.weglot.com/weglot.min.js"></script>' in content:
        content = content.replace('<script type="text/javascript" src="https://cdn.weglot.com/weglot.min.js"></script>', '')
                                  
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Weglot script removed from all HTML files.")
