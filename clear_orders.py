import requests
import json
from concurrent.futures import ThreadPoolExecutor

url = "https://flashnet.aiswaryasathyan.space/api/orders/"

response = requests.get(url)
if response.status_code == 200:
    orders = response.json()
    print(f"Found {len(orders)} orders to delete.")
    
    def delete_order(order):
        del_url = f"{url}{order['id']}/"
        res = requests.delete(del_url)
        return res.status_code

    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(delete_order, orders))
        
    success_count = sum(1 for r in results if r in (200, 204))
    print(f"Successfully deleted {success_count} orders.")
else:
    print(f"Failed to fetch orders. Status code: {response.status_code}")
