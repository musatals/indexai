#!/usr/bin/env python3
"""Idempotent importer and static page builder for the source inventory.
Use: python3 scripts/build_catalog.py [--source sources/atlas_outils_ia_2026.csv]
No external Python dependencies.
"""
import argparse, csv, json, re, html, unicodedata, collections, urllib.parse
from pathlib import Path
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parents[1]
NAMES=(
('Assistants généralistes','General AI assistants'),('Recherche web et réponses','AI web search'),('Recherche académique et science','Academic research'),
('Rédaction et correction','Writing and editing'),('Traduction et localisation','Translation and localization'),('Images génératives','Image generation'),
('Retouche et restauration d’images','Image editing and restoration'),('Vidéo générative','Video generation'),('Montage vidéo et clips','Video editing and clips'),
('Avatars, présentateurs et doublage','AI avatars and dubbing'),('Voix et synthèse vocale','Text-to-speech and voice'),('Transcription et réunions','Transcription and meetings'),
('Musique et composition','Music and composition'),('Audio, podcasts et traitement','Audio and podcasts'),('Design graphique et branding','Graphic design and branding'),
('Présentations et infographies','Presentations and infographics'),('Programmation assistée','Coding assistants'),('Création de sites et applications','App and website building'),
('Agents autonomes et orchestration','AI agents and orchestration'),('Automatisation et intégrations','Automation and integrations'),('Organisation et productivité','Productivity and organization'),
('Email et communication','Email and communication'),('Marketing et publicité','Marketing and advertising'),('SEO et visibilité IA','SEO and AI visibility'),
('Ventes, prospection et CRM','Sales and CRM'),('Support client et chatbots','Customer support and chatbots'),('Agents vocaux et téléphonie','Voice agents and telephony'),
('Éducation et tutorat','Education and tutoring'),('Données, BI et analytique','Analytics and business intelligence'),('Extraction documentaire et OCR','Document extraction and OCR'),
('3D, spatial et XR','3D and spatial computing'),('Architecture, immobilier et intérieur','Architecture and real estate'),('Jeux vidéo et personnages','Gaming and digital characters'),
('Santé et médecine','Healthcare and medicine'),('Droit et conformité','Legal and compliance'),('Finance, comptabilité et assurance','Finance, accounting and insurance'),
('RH, recrutement et carrières','Human resources and careers'),('Cybersécurité et détection','Cybersecurity and detection'),('Détection IA et authenticité','AI content detection and authenticity'),
('E-commerce et retail','E-commerce and retail'),('LLM, modèles et fournisseurs','LLMs, models and providers'),('IA locale, inference et déploiement','Local AI and deployment'),
('RAG, bases vectorielles et recherche','RAG and vector databases'),('MLOps, suivi et évaluation','MLOps and evaluation'),('Données, annotation et entraînement','Data labeling and training'),
('Vision, robotique et edge AI','Computer vision and robotics'),('Agriculture, climat et géospatial','Agri-tech and geospatial'),('Voyages, loisirs et vie quotidienne','Travel and lifestyle'),
('Prompts, tests et red teaming','Prompt testing and red teaming'),('Annuaires et plateformes de découverte','AI tool directories'),
)
FAMILIES=[
('discover','Découvrir & apprendre','Discover & learn','✦',list(range(0,5))+[27]),
('creative','Création & médias','Creative & media','◈',list(range(5,16))),
('builders','Développer & automatiser','Build & automate','⌘',[16,17,18,19,26,40,41,42,43,44,48]),
('business','Travailler & entreprendre','Work & business','▣',[20,21,22,23,24,25,28,29,35,36,39]),
('specialized','Sciences & secteurs','Science & industries','⬡',[30,31,32,33,34,37,38,45,46,47]),
('directory','Explorer l’écosystème','Explore the ecosystem','◎',[49]),
]
META={
 'discover':('Explorez les assistants, la recherche, la rédaction et la formation.','Explore assistants, research, writing, and learning.'),
 'creative':('Image, vidéo, musique, voix et création visuelle.','Images, video, music, voice, and visual creation.'),
 'builders':('Code, agents, modèles et automatisation des workflows.','Code, agents, models, and workflow automation.'),
 'business':('Productivité et fonctions métiers pour les organisations.','Productivity and business functions for organizations.'),
 'specialized':('Solutions pour les sciences, les industries et les métiers spécialisés.','Solutions for science, industries, and specialized fields.'),
 'directory':('Annuaires et plateformes de découverte de solutions IA.','Directories and discovery platforms for AI tools.')
}

def slug(s):
 s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode('ascii').lower().replace('&','et')
 return re.sub(r'-+','-',re.sub(r'[^a-z0-9]+','-',s)).strip('-') or 'outil'

def canonical(raw):
 if not raw:return ''
 try:
  u=urllib.parse.urlsplit(raw.strip())
  if u.scheme not in ('https','http') or not u.netloc or '\\' in raw:return ''
  return u.geturl()
 except ValueError:return ''

def read_csv(path):
 with open(path,encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))

def html_page(page_title, description, path, initial, data=None):
 title=html.escape(page_title+' · Atlas IA',quote=True)
 description=html.escape(description,quote=True)
 safe_initial=initial
 script_json=''
 if data:
  script_json='<script type="application/ld+json">'+json.dumps(data,ensure_ascii=False).replace('<','\\u003c')+'</script>'
 return f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b1121"><meta name="description" content="{description}"><meta property="og:type" content="website"><meta property="og:title" content="{title}"><meta property="og:description" content="{description}"><title>{title}</title><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="stylesheet" href="/assets/style.css">{script_json}</head><body><div id="app">{safe_initial}</div><script defer src="/assets/app.js"></script></body></html>'''

def main():
 p=argparse.ArgumentParser();p.add_argument('--source',default='sources/atlas_outils_ia_2026.csv'); args=p.parse_args()
 source=ROOT/args.source
 rows=read_csv(source)
 cnames=[x[0] for x in NAMES]; counts=collections.Counter(r['Catégorie principale'].strip() for r in rows)
 assert set(counts)==set(cnames),f'Unrecognized categories: {set(counts)-set(cnames)}'
 assignment={cnames[i]:code for code,_,_,_,indices in FAMILIES for i in indices}
 assert len(assignment)==50, 'Family mapping incomplete'
 category_slugs={name:slug(name) for name in cnames}
 categories=[{'id':i+1,'name':name,'en':en,'slug':category_slugs[name], 'count':counts[name], 'family':assignment[name], 'descriptionFr':'Catégorie du catalogue initial : '+name+'.', 'descriptionEn':'Category of the source inventory: '+en+'.'} for i,(name,en) in enumerate(NAMES)]
 families=[{'id':code,'fr':fr,'en':en,'symbol':symbol, 'descriptionFr':META[code][0], 'descriptionEn':META[code][1], 'count':sum(counts[cnames[i]] for i in indices),'categories':len(indices)} for code,fr,en,symbol,indices in FAMILIES]
 tools=[]; used=set(); errors=[]
 for row in rows:
  name=row['Outil / ressource'].strip(); id=row['ID'].strip(); cat=row['Catégorie principale'].strip()
  # Parse against *complete* category labels: some names themselves contain commas.
  tail=(row.get('Autres catégories') or '').strip()
  second=[]
  while tail:
   candidates=[n for n in cnames if tail==n or tail.startswith(n+', ')]
   if not candidates:
    errors.append({'id':id,'issue':'Secondary category not in taxonomy','input':tail})
    second.append(tail);break
   label=max(candidates,key=len)
   second.append(label)
   tail=tail[len(label):].lstrip(', ').strip()
  base=slug(name)
  uni=base if base not in used else f'{base}-{id.lower()}'
  used.add(uni)
  raw=row['Site officiel (à confirmer)']; url=canonical(raw)
  if raw and not url:errors.append({'id':id,'issue':'Invalid URL','input':raw})
  tools.append({'id':id,'name':name,'slug':uni,'category':cat,'categorySlug':category_slugs[cat],'secondaryCategories':second, 'url':url,'kind':row['Nature'].strip(),'verification':'unverified', 'source':row['Source d’orientation'].strip(), 'inventoriedAt':row['Date d’inventaire'].strip()})
 url_counts=collections.Counter(urllib.parse.urlsplit(t['url']).netloc.lower()+urllib.parse.urlsplit(t['url']).path.rstrip('/').lower() for t in tools if t['url'])
 for t in tools:
  if t['url']:
   u=urllib.parse.urlsplit(t['url']); k=u.netloc.lower()+u.path.rstrip('/').lower()
   t['sharedUrlCount']=url_counts[k]
  else:t['sharedUrlCount']=0
 for directory in ('data','outils','categories'):(ROOT/directory).mkdir(exist_ok=True)
 (ROOT/'data/tools.json').write_text(json.dumps(tools,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 (ROOT/'data/categories.json').write_text(json.dumps(categories,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 (ROOT/'data/families.json').write_text(json.dumps(families,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 layout='<div style="font-family:system-ui;padding:2rem;background:#0b1121;color:#e8f1ff;min-height:70vh"><a style="color:#67e8f9" href="/">ATLAS·IA — Accueil</a>'
 for t in tools:
  intro=f'''{layout}<h1>{html.escape(t['name'])}</h1><p>{html.escape(t['category'])} · {html.escape(t['kind'])}</p><p>Informations non vérifiées individuellement.</p><p><a style="color:#67e8f9" href="/categories/{html.escape(t['categorySlug'])}/">Explorer la catégorie</a></p>'''
  if t['url']:intro+=f'<p><a style="color:#67e8f9" href="{html.escape(t["url"],quote=True)}" rel="nofollow noopener noreferrer">Site déclaré (non vérifié)</a></p>'
  intro+='</div>'
  dest=ROOT/'outils'/t['slug'];dest.mkdir(exist_ok=True)
  page=html_page(t['name'],f"{t['name']} : {t['category']}. Fiche du catalogue Atlas IA, informations à vérifier.",f"/outils/{t['slug']}/",intro,{'@context':'https://schema.org','@type':'WebPage','name':t['name'],'description':t['category'],'isPartOf':{'@type':'WebSite','name':'Atlas IA'}})
  (dest/'index.html').write_text(page,encoding='utf-8')
 for c in categories:
  links=''.join(f'<li><a style="color:#67e8f9" href="/outils/{html.escape(t["slug"])}/">{html.escape(t["name"])}</a></li>' for t in tools if t['category']==c['name'])
  intro=f'{layout}<h1>{html.escape(c["name"])}</h1><p>{c["count"]} références dans le catalogue initial.</p><ul>{links}</ul></div>'
  dest=ROOT/'categories'/c['slug'];dest.mkdir(exist_ok=True)
  (dest/'index.html').write_text(html_page(c['name'],f"{c['count']} outils classés dans {c['name']} sur Atlas IA.",f"/categories/{c['slug']}/",intro),encoding='utf-8')
 # Additional static entrypoints make deep links load on generic static web servers.
 for route_id, label in [('repertoire','Répertoire complet'),('besoins','Parcours par besoins'),('comparateur','Comparateur'),('favoris','Favoris'),('qualite','Sources et qualité')]:
  directory=ROOT/route_id;directory.mkdir(exist_ok=True)
  fallback=f'{layout}<h1>{html.escape(label)}</h1><p>Cette section nécessite JavaScript pour les interactions. <a style="color:#67e8f9" href="/categories/">Catégories accessibles sans JavaScript</a>.</p></div>'
  (directory/'index.html').write_text(html_page(label,f'{label} · Atlas IA',f'/{route_id}/',fallback),encoding='utf-8')
 catindex=ROOT/'categories'/'index.html'
 catindex.write_text(html_page('Catégories','50 catégories d’outils et de ressources IA.','/categories/',f'{layout}<h1>Catégories</h1><ul>'+''.join(f'<li><a style="color:#67e8f9" href="/categories/{c["slug"]}/">{html.escape(c["name"])}</a></li>' for c in categories)+'</ul></div>'),encoding='utf-8')
 # Static accessible fallback for discovery when JS is disabled
 catlinks=''.join(f'<li><a style="color:#67e8f9" href="/categories/{c["slug"]}/">{html.escape(c["name"])} ({c["count"]})</a></li>' for c in categories)
 initial=f'{layout}<h1>Atlas IA — Le répertoire des outils d’intelligence artificielle</h1><p>{len(tools)} références, {len(categories)} catégories. Les informations n’ont pas été vérifiées individuellement.</p><h2>Explorer les catégories</h2><ul>{catlinks}</ul></div>'
 (ROOT/'index.html').write_text(html_page('Explorer les outils IA','Répertoire de 808 outils et ressources d’intelligence artificielle dans 50 catégories. Recherche, comparaison et exploration.', '/',initial),encoding='utf-8')
 dup_urls=[{'url':url,'count':count,'tools':[t['name'] for t in tools if t['url'] and (urllib.parse.urlsplit(t['url']).netloc.lower()+urllib.parse.urlsplit(t['url']).path.rstrip('/').lower())==url]} for url,count in url_counts.items() if count>1]
 report={'generatedAt':datetime.now(timezone.utc).isoformat(),'source':args.source,'total':len(tools),'categories':len(categories),'toolsWithUrl':sum(bool(t['url']) for t in tools),'missingUrls':[{'id':t['id'],'name':t['name']} for t in tools if not t['url']],'candidateSharedUrls':dup_urls,'invalidUrls':errors,'individuallyVerified':0,'descriptionsPresent':0,'nameDuplicates':[{ 'name':x,'count':v} for x,v in collections.Counter(t['name'].casefold() for t in tools).items() if v>1]}
 (ROOT/'data/quality-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
 assert len(tools)==len(set(t['id'] for t in tools))==len(set(t['slug'] for t in tools))==808
 assert sum(c['count'] for c in categories)==len(tools)
 print('Built',len(tools),'tools;',len(categories),'categories;',len(dup_urls),'shared URL candidates;',len(report['missingUrls']),'missing URLs')

if __name__=='__main__':main()
