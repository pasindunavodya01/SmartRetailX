import zipfile, xml.etree.ElementTree as ET, sys

docx_path = r'd:\2026_Projects\SmartRetailX\docs\SmartRetailX_Report (1).docx'
txt_path = r'd:\2026_Projects\SmartRetailX\docs\SmartRetailX_Report.txt'

try:
    with zipfile.ZipFile(docx_path) as z:
        tree = ET.fromstring(z.read('word/document.xml'))
        
    paragraphs = []
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    for p in tree.findall('.//w:p', ns):
        text = ''.join(t.text or '' for t in p.findall('.//w:t', ns))
        paragraphs.append(text)
        
    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(paragraphs))
    print("Done")
except Exception as e:
    print(f"Error: {e}")
