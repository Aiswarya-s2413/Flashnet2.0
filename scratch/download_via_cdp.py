import json
import websocket
import requests
import urllib.request
import os

# 1. Get browser websocket debugger url
req = urllib.request.urlopen('http://localhost:9222/json')
tabs = json.loads(req.read().decode('utf-8'))
ws_url = None
for t in tabs:
    if 'drive.google.com' in t.get('url', ''):
        ws_url = t.get('webSocketDebuggerUrl')
        break

if not ws_url:
    for t in tabs:
        if t.get('type') == 'page' and t.get('webSocketDebuggerUrl'):
            ws_url = t.get('webSocketDebuggerUrl')
            break

ws = websocket.create_connection(ws_url, suppress_origin=True)

# Request all cookies
ws.send(json.dumps({
    "id": 1,
    "method": "Network.getAllCookies"
}))

res = json.loads(ws.recv())
cookies_list = res.get('result', {}).get('cookies', [])
print(f"Retrieved {len(cookies_list)} cookies from Chrome.")

# Convert to requests session cookie jar
session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
})

for c in cookies_list:
    session.cookies.set(c['name'], c['value'], domain=c['domain'], path=c['path'])

ws.close()

# File ID for the large VBRP file from user metadata: 1Ztg89xHUiZHN35wM9sAxJd4gx9_yi_dn
file_id = "1Ztg89xHUiZHN35wM9sAxJd4gx9_yi_dn"
download_url = f"https://drive.google.com/uc?export=download&id={file_id}&confirm=t"

print("Sending request to Google Drive...")
resp = session.get(download_url, stream=True)
print("Status code:", resp.status_code)
print("Headers:", resp.headers)

import re
import urllib.parse
from bs4 import BeautifulSoup

# Check if form exists
soup = BeautifulSoup(resp.text, "html.parser")
form = soup.find("form", id="download-form")

if form:
    action = form.get("action")
    params = {}
    for inp in form.find_all("input"):
        name = inp.get("name")
        val = inp.get("value")
        if name:
            params[name] = val
    
    print("Form action:", action)
    print("Form params:", params)
    
    resp = session.get(action, params=params, stream=True)
    print("Download response status:", resp.status_code)
    print("Download content-type:", resp.headers.get("Content-Type"))
    print("Download content-length:", resp.headers.get("Content-Length"))

output_path = "/Users/aiswarya/Downloads/VBRP_Extract_INX1_INX2_Complete.xlsx"
total_bytes = 0
with open(output_path, "wb") as f:
    for chunk in resp.iter_content(chunk_size=2*1024*1024):
        if chunk:
            f.write(chunk)
            total_bytes += len(chunk)
            print(f"Downloaded {total_bytes / (1024*1024):.2f} MB...", end="\r", flush=True)

print(f"\nFinished! Total size: {total_bytes / (1024*1024):.2f} MB saved to {output_path}")
