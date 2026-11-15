#!/usr/bin/env python3
"""Offline browser smoke test via Playwright (developer dependency).
Uses in-memory resources because some sandbox browsers block local HTTP navigation.
Runs with: python3 scripts/browser_smoke_test.py
"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
CSS=(ROOT/'assets/style.css').read_text()
CSS='\n'.join(line for line in CSS.splitlines() if not line.startswith('@import'))
CODE=(ROOT/'assets/app.js').read_text().replace('location.pathname','(window.__testPath||location.pathname)').replace('location.search','(window.__testSearch??location.search)')
DATA={n:json.loads((ROOT/f'data/{n}.json').read_text()) for n in ('tools','categories','families','quality-report')}

async def prepare(browser, width, height, path='/', lang='fr'):
 page=await browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 await page.set_content('<!doctype html><html lang="fr"><head><base href="https://atlas.test/"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+CSS+'</style></head><body><div id="app"></div></body></html>')
 await page.evaluate('''(p) => {window.__testPath=p;window.__testSearch='';window.history.pushState=(_,__,u)=>{let x=new URL(u,'https://atlas.test');window.__testPath=x.pathname;window.__testSearch=x.search};window.history.replaceState=window.history.pushState;window.fetch=async url=>({ok:true,json:async()=>window.__testData[url.split('/').pop().replace('.json','')]});}''',path)
 await page.evaluate('(d)=>{window.__testData=d}',DATA)
 await page.evaluate(CODE)
 await page.locator('.main-content h1').first.wait_for(timeout=15000)
 return page,errors

async def main():
 async with async_playwright() as pw:
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page,errors=await prepare(b,1440,900)
  assert (await page.locator('.stat-card strong').all_text_contents())==['808','50','805','0']
  await page.screenshot(path=str(ROOT.parent/'atlas-ia-home-preview.png'))
  await page.locator('a.nav-link[data-nav="/repertoire/"]').click()
  assert '808' in (await page.locator('.results-toolbar').inner_text())
  await page.locator('#directorySearch').fill('cursor')
  assert 'Cursor' in (await page.locator('.tools-grid').inner_text())
  n=await page.locator('.tool-card').count()
  print('Search cursor:',n,'result(s)')
  await page.screenshot(path=str(ROOT.parent/'atlas-ia-directory-preview.png'))
  await page.locator('button[data-action="compare"]').first.click()
  await page.locator('a.nav-link[data-nav="/comparateur/"]').click()
  assert await page.locator('.compare-tool-head').count()==1
  print('Comparator: 1 selected record')
  await page.locator('a.nav-link[data-nav="/repertoire/"]').click()
  await page.locator('#directorySearch').fill('chatgpt')
  await page.locator('button[data-action="favorite"]').first.click()
  await page.locator('a.nav-link[data-nav="/favoris/"]').click()
  assert await page.locator('.tool-card').count()>=1
  print('Favorites: saved record visible')
  await page.locator('button[data-action="theme"]').click()
  assert await page.locator('html').get_attribute('data-theme')=='light'
  await page.locator('button[data-action="lang"]').click()
  assert await page.locator('html').get_attribute('lang')=='en'
  print('Theme and language toggles: passed')
  assert not errors, f'Browser errors: {errors}'
  mobile,merrors=await prepare(b,390,844)
  await mobile.screenshot(path=str(ROOT.parent/'atlas-ia-mobile-preview.png'))
  widths=await mobile.evaluate('({body:document.documentElement.scrollWidth,window:innerWidth})')
  assert widths['body']<=widths['window']+1,widths
  print('Mobile viewport:',widths)
  assert not merrors, merrors
  direct,derrors=await prepare(b,1280,820,'/outils/chatgpt/')
  assert await direct.locator('.detail-head h1').inner_text()=='ChatGPT'
  assert await direct.locator('.verification-card').count()==1
  print('Direct tool page: ChatGPT')
  assert not derrors,derrors
  await b.close()
  print('PASS — browser smoke tests')
if __name__=='__main__': asyncio.run(main())
