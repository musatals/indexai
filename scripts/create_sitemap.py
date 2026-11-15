#!/usr/bin/env python3
"""Generate sitemap.xml only when a real production URL is known.
Usage: SITE_URL=https://example.org python3 scripts/create_sitemap.py
"""
from pathlib import Path
import os, json, urllib.parse, html
root=Path(__file__).resolve().parents[1]
site=os.getenv('SITE_URL','').rstrip('/')
u=urllib.parse.urlsplit(site)
if not site or u.scheme!='https' or not u.netloc or u.hostname in {'example.com','example.org','localhost'}:
 raise SystemExit('Set SITE_URL to the real HTTPS production domain first.')
tools=json.loads((root/'data/tools.json').read_text())
categories=json.loads((root/'data/categories.json').read_text())
paths=['/','/repertoire/','/categories/','/besoins/','/qualite/']+[f'/categories/{x["slug"]}/' for x in categories]+[f'/outils/{x["slug"]}/' for x in tools]
xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
xml+=''.join('  <url><loc>'+html.escape(site+path)+'</loc></url>\n' for path in paths)
xml+='</urlset>\n'
(root/'sitemap.xml').write_text(xml,encoding='utf-8')
(root/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+site+'/sitemap.xml\n',encoding='utf-8')
print('Created sitemap',len(paths),'URLs for',site)
