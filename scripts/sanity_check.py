#!/usr/bin/env python3
import json,collections,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
load=lambda x:json.loads((root/f'data/{x}.json').read_text(encoding='utf8'))
tools,cats,fams,quality=[load(x) for x in ('tools','categories','families','quality-report')]
assert len(tools)==808,len(tools)
assert len(cats)==50,len(cats)
assert len(set(t['id'] for t in tools))==len(tools)
assert len(set(t['slug'] for t in tools))==len(tools)
assert sum(c['count'] for c in cats)==len(tools)
assert all((root/f'outils/{t["slug"]}/index.html').exists() for t in tools)
assert all((root/f'categories/{c["slug"]}/index.html').exists() for c in cats)
assert all(c['name'] in {x['name'] for x in cats} for t in tools for c in [{'name':n} for n in t['secondaryCategories']])
assert quality['total']==len(tools)
assert quality['toolsWithUrl']==805
assert len(quality['missingUrls'])==3
assert len(quality['candidateSharedUrls'])==12
assert len(fams)==6
for route in ('/','/repertoire/','/categories/','/besoins/','/comparateur/','/favoris/','/qualite/'):
 assert (root/(route.strip('/') or '.')/'index.html').exists(),route
print('PASS — 808 tools, 50 categories, deep links, 805 URLs, 12 shared URL groups, 3 missing URLs')
