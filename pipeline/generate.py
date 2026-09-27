#!/usr/bin/env python3
"""商品写真から Meshy の Image to 3D API で GLB / USDZ を生成する。

使い方:
  export MESHY_API_KEY=...
  python3 pipeline/generate.py photo.jpg --sku SOFA-001 --out models/

出力: models/SOFA-001.glb, models/SOFA-001.usdz と、標準出力にカタログ用JSON。
生成後は tools/prepare.html で実寸に合わせてから配信する。
注意: この script は API ドキュメント (docs.meshy.ai) に沿って書いたが、実 API での動作確認はまだ行っていない。
"""
import argparse, base64, json, mimetypes, os, sys, time, urllib.request, urllib.error

API = "https://api.meshy.ai/openapi/v1/image-to-3d"

def req(url, key, data=None):
    body = json.dumps(data).encode() if data is not None else None
    r = urllib.request.Request(url, data=body, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(r, timeout=60) as res:
            return json.load(res)
    except urllib.error.HTTPError as e:
        sys.exit(f"API エラー {e.code}: {e.read().decode(errors='replace')}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image", help="商品写真 (jpg/png) か公開URL")
    ap.add_argument("--sku", required=True)
    ap.add_argument("--name", default="")
    ap.add_argument("--out", default="models")
    ap.add_argument("--model", default="latest", help="ai_model: meshy-6-lite / meshy-6 / meshy-7.1 / latest")
    ap.add_argument("--polycount", type=int, default=60000)
    ap.add_argument("--no-texture", action="store_true")
    a = ap.parse_args()
    key = os.environ.get("MESHY_API_KEY") or sys.exit("MESHY_API_KEY を環境変数に設定してください")

    if a.image.startswith("http"):
        image_url = a.image
    else:
        mime = mimetypes.guess_type(a.image)[0] or "image/jpeg"
        with open(a.image, "rb") as f:
            image_url = f"data:{mime};base64," + base64.b64encode(f.read()).decode()

    task = req(API, key, {"image_url": image_url, "ai_model": a.model, "should_texture": not a.no_texture, "topology": "triangle", "target_polycount": a.polycount})
    tid = task["result"]
    print(f"タスク作成: {tid}", file=sys.stderr)
    while True:
        t = req(f"{API}/{tid}", key)
        st = t.get("status")
        print(f"  {st} {t.get('progress', '')}%", file=sys.stderr)
        if st == "SUCCEEDED":
            break
        if st in ("FAILED", "CANCELED"):
            sys.exit(f"生成失敗: {t.get('task_error')}")
        time.sleep(10)

    os.makedirs(a.out, exist_ok=True)
    urls = t.get("model_urls", {})
    saved = {}
    for fmt in ("glb", "usdz"):
        if urls.get(fmt):
            path = os.path.join(a.out, f"{a.sku}.{fmt}")
            urllib.request.urlretrieve(urls[fmt], path)
            saved[fmt] = path
            print(f"保存: {path}", file=sys.stderr)
    entry = {a.sku: {"name": a.name, "glb": saved.get("glb", ""), "usdz": saved.get("usdz"), "size": {"w": 0, "d": 0, "h": 0}, "variants": {}}}
    print(json.dumps(entry, ensure_ascii=False, indent=2))
    print("寸法 (size) は tools/prepare.html で実寸に合わせてから記入してください。", file=sys.stderr)

if __name__ == "__main__":
    main()
