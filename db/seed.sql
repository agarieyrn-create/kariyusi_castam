-- 初期カラーパレットマスターデータ
insert into palettes (name, color_key, base_color, accent_color, sub_color, dark_color) values
  ('海風ブルー', 'sea-breeze-blue', '#e7f7f7', '#1c7f93', '#f2b64b', '#173d45'),
  ('月桃ホワイト', 'shell-ginger-white', '#fbf7ea', '#587f58', '#d8a044', '#2f4737'),
  ('琉球レッド', 'ryukyu-red', '#fff0eb', '#c94f49', '#1c7f93', '#432628'),
  ('夜海ブラック', 'night-sea-black', '#172326', '#5db6bd', '#d8a044', '#f7efd9'),
  ('若葉グリーン', 'young-leaf-green', '#eef7e9', '#5f8f61', '#d76f54', '#244633')
on conflict (color_key) do update set
  base_color = excluded.base_color,
  accent_color = excluded.accent_color,
  sub_color = excluded.sub_color,
  dark_color = excluded.dark_color;

-- 初期柄テンプレートデータ
insert into patterns (name, category, motif_tags, style_tags, scenes, okinawa_score, formal_score, bold_score, manufacturable, rights_status, asset_path) values
  ('紅型風ウェーブ', 'traditional', '{"紅型風", "波模様"}', '{"華やか"}', '{"イベント・式典", "観光・物販"}', 5, 4, 3, true, 'owned', 'かりゆしウェア_045_青紅型風.png'),
  ('淡色ハイビスカス', 'casual', '{"ハイビスカス"}', '{"リゾート"}', '{"ホテル・店舗制服", "観光・物販"}', 4, 3, 4, true, 'owned', 'かりゆしウェア_014_淡色ハイビスカス.png'),
  ('シーサー小紋', 'traditional', '{"シーサー"}', '{"伝統的"}', '{"イベント・式典", "チームウェア"}', 5, 2, 5, true, 'owned', 'かりゆしウェア_036_赤シーサー柄.png'),
  ('ヤシ葉ボタニカル', 'natural', '{"ヤシ葉"}', '{"植物"}', '{"ホテル・店舗制服", "仕事"}', 3, 4, 3, true, 'owned', 'かりゆしウェア_012_緑ボタニカル.png'),
  ('青波ミンサー', 'traditional', '{"波模様"}', '{"上品"}', '{"ホテル・店舗制服", "仕事"}', 4, 5, 2, true, 'owned', 'かりゆしウェア_030_青波柄.png')
on conflict do nothing;

-- シャツ型データ
insert into garments (name, formality, model_asset_path) values
  ('開襟', 3, '3Dモデル/男性.jpg'),
  ('ボタンダウン', 5, '3Dモデル/男性.jpg'),
  ('スタンドカラー', 4, '3Dモデル/女性.jpg')
on conflict do nothing;

-- ロゴ配置テンプレートデータ
insert into logo_layouts (layout_key, name, position_data) values
  ('leftChest', '左胸', '{"x": 168, "y": 145, "scale": 1.0}'),
  ('sleeve', '袖', '{"x": 222, "y": 140, "scale": 0.8}'),
  ('back', '背面', '{"x": 140, "y": 136, "scale": 1.2}'),
  ('none', 'なし', '{}')
on conflict (layout_key) do update set
  position_data = excluded.position_data;
