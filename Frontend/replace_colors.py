import os
import re

directory = 'd:/ConvoReach/Frontend/src'

replacements = [
    (r'\b(bg|text|border|ring|stroke|fill)-blue-([0-9]{2,3})\b', r'\1-accent-\2'),
    (r'\b(bg|text|border|ring|stroke|fill)-indigo-([0-9]{2,3})\b', r'\1-accent-\2'),
    (r'\b(bg|text|border|ring|stroke|fill)-brand-([0-9]{2,3})\b', r'\1-accent-\2'),
    (r'\bbrand-([0-9]{2,3})\b', r'accent-\1'), # catch-all for brand
]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.css'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pattern, replacement in replacements:
                new_content = re.sub(pattern, replacement, new_content)
            
            if content != new_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
