# ar-furniture-demo

家具ECの商品ページに「自分の部屋に置いてみる」を付けるデモと、間取り図から3D模型を起こしてカメラで内覧するデモ。すべて静的ファイルで、GitHub Pages で配信しています。

- 家具ARモード: https://pochitoofficial-design.github.io/ar-furniture-demo/
- 物件モード（図面 → 3D模型 → カメラ内覧 → 家具配置）: https://pochitoofficial-design.github.io/ar-furniture-demo/room/

## 構成

```
index.html          家具ARモード（model-viewer。商品ページの試作）
models/*.glb        家具の3Dモデル（Khronos glTF Sample Assets、Wayfair提供、CC BY 4.0）
room/index.html     物件モード（three.js 0.160 + model-viewer 4.3）
room/spec.md        間取りJSONの仕様と、AIに図面を読ませる指示文
room/samples/*.json AI認識結果のサンプル
room/plans/*.jpg    サンプル図面
```

ビルド工程はありません。ライブラリは CDN（jsdelivr / cdnjs）から読み込みます。

## ローカルで動かす

```bash
python3 -m http.server 8765 --bind 0.0.0.0 --directory .
```

http://localhost:8765/ と http://localhost:8765/room/ を開く。AR（カメラ配置）はスマホでしか動かないので、同じ Wi-Fi のスマホから Mac の LAN アドレスで開くか、GitHub Pages の公開版で試す。

## 公開

`main` に push すると GitHub Pages に 1〜2 分で反映されます。

## 物件モードの処理の流れ

1. **図面を読み込む** — 画像を選ぶとブラウザ内で解析（濃い線＝壁、壁からの距離で部屋の芯を取り出し、開口を越えないよう壁際まで育てる）。縮尺は専有面積から。精度は粗く、小部屋や引き戸でつながる部屋は取りこぼす。
   AIで認識した JSON（`room/spec.md`）を読み込むと、部屋名・ドア・窓・設備まで再現される。本番はこちらが本線。
2. **3D模型** — 部屋の矩形から床と壁を生成。ドア・窓の位置は壁に開口として空ける。設備は箱。
3. **カメラで内覧** — three.js のシーンを GLTFExporter で GLB に書き出し、model-viewer に渡して AR（iOS Quick Look / Android Scene Viewer / WebXR）で実寸配置。
4. **家具を置く** — 平面図にドラッグで配置。手持ちの GLB も読み込める。家具込みで再度 AR に出せる。

## 次にやること

- 図面10枚で AI 認識の精度検証（`room/spec.md` の手順）
- 画像 → Claude → JSON を返す小さなサーバー（静的サイトには API キーを置けない）
- ドアの扉・窓ガラスの描画、部屋タイプ別の床材
- 家具カタログの外部化（複数ECの商品データ）

## ライセンス表記

3Dモデルは [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets)（Wayfair 提供、CC BY 4.0）。商品名・価格は架空です。
