# 間取りJSON仕様（ROOMFIT 物件モード）

図面画像を AI に読ませ、下の JSON を返させると、デモの「解析済みJSONを読み込む」からそのまま 3D 模型・カメラ内覧・家具配置に使えます。サンプル：`samples/1dk.json`

## 単位と座標
- 単位は cm。原点は建物の左上、x は右、y は下（図面と同じ向き）。
- 部屋は矩形 `x, y, w, d`（幅と奥行）。L 字は矩形を 2 つに分けて書く。
- `totalAreaM2`（専有面積）を制約にして、帖数と矛盾しないよう寸法を補正する。1 帖 = 1.62 ㎡。

## フィールド
| キー | 内容 |
|---|---|
| `version` | 1 |
| `totalAreaM2` | 専有面積（㎡） |
| `ceilingHeight` | 天井高 cm。不明なら 240 |
| `image` / `imageRect` | 任意。床に貼る図面画像と、その画像が占める範囲（cm）。デモ内のファイルのみ |
| `rooms[]` | `id, name, type, x, y, w, d, jo?`。type は `living / bedroom / kitchen / bath / toilet / washroom / entrance / corridor / storage / balcony / other` |
| `doors[]` | `room, wall, offset, width, type`。wall は `top / right / bottom / left`、offset は壁の左端（上端）からの距離 cm。type は `hinged / sliding / open`（open は壁のない開口） |
| `windows[]` | `room, wall, offset, width, sill, height`。sill は床から窓下端までの高さ |
| `fixtures[]` | `type, room, x, y, w, d`。type は `kitchen / bathtub / toilet / sink / closet` |

隣り合う部屋の共有壁にある扉は、どちらか一方の部屋に書けば両側に開口が空きます。

## Claude に渡す指示文（画像認識）

推奨：Messages API、モデル `claude-opus-5`、画像は base64 の `image` ブロック、出力は `output_config.format` の JSON スキーマで固定する。

```
あなたは日本の不動産間取り図を読み取り、3D化のための構造データを作る専門家です。
添付の間取り図から、次の JSON を返してください。説明文は不要です。

前提
- 単位は cm。原点は建物外形の左上。x は右、y は下。
- 専有面積は {{totalAreaM2}} ㎡。図面に書かれた帖数（1帖=1.62㎡）と専有面積が矛盾しないように各部屋の寸法を推定・補正する。
- 部屋は矩形で表し、L字は複数の矩形に分ける。バルコニー・玄関・廊下・収納・水回りも部屋として含める。
- ドアは図面の開口記号（扉の弧、引き戸の線、壁の切れ目）から拾い、どの部屋のどの壁か、壁の左端（上端）から何 cm の位置か、幅何 cm かを書く。壁がなく空間がつながっている所は type を open にする。
- 窓は壁の三重線などから拾い、床からの高さが不明なら sill 90、height 110 とする。
- キッチン・浴槽・便器・洗面台は fixtures に矩形で書く。
- 読み取れないものは推定し、自信がない項目は "confidence": "low" を付ける。

出力する JSON の形
{ "version": 1, "unit": "cm", "totalAreaM2": 数値, "ceilingHeight": 240,
  "rooms": [ { "id": "英数字", "name": "図面の表記", "type": "living|bedroom|kitchen|bath|toilet|washroom|entrance|corridor|storage|balcony|other", "x": 数値, "y": 数値, "w": 数値, "d": 数値, "jo": 数値(任意) } ],
  "doors": [ { "room": "id", "wall": "top|right|bottom|left", "offset": 数値, "width": 数値, "type": "hinged|sliding|open" } ],
  "windows": [ { "room": "id", "wall": "…", "offset": 数値, "width": 数値, "sill": 数値, "height": 数値 } ],
  "fixtures": [ { "type": "kitchen|bathtub|toilet|sink|closet", "room": "id", "x": 数値, "y": 数値, "w": 数値, "d": 数値 } ] }
```

## 精度検証のやり方
1. 図面 10 枚を用意し、それぞれ専有面積を控える。
2. 上の指示文で JSON を出させ、デモに読み込む。
3. 採点：部屋の取りこぼし数、帖数の誤差（図面の表記との差）、ドアの位置が図面と合うか、3D で部屋から部屋へ歩けるか。
4. 帖数誤差 10% 以内、取りこぼし 1 部屋以内を合格ラインにする。
