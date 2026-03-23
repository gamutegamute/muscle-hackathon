# Git に上げる前の簡単メモ

このプロジェクトは、バックエンドのコードや `tests` フォルダは Git に入れて大丈夫です。
逆に、秘密情報や自動生成ファイルは Git に入れない方が安全です。

## Git に入れてよいもの

- `backend/app/...` のコード
- `backend/tests/...` のテストコード
- `README.md` や共有メモ

## Git に入れない方がよいもの

- `backend/serviceAccountKey.json`
- `.env`
- `venv` や `.venv`
- `__pycache__`
- ビルド結果やキャッシュ

## `tests` フォルダは必要？

必須ではないですが、入れてよいです。
むしろ「このコードがどう動くかを確認するためのファイル」なので、チーム開発では Git 管理することが多いです。

今回の `backend/tests` も、消すべきゴミファイルではなく確認用コードです。

## 今の状態について

`.gitignore` にはすでに以下のようなものが入っています。

- `backend/serviceAccountKey.json`
- `.env`
- `venv`, `.venv`
- `__pycache__`

なので、秘密鍵や仮想環境をうっかり Git に入れにくい状態にはなっています。

## AI にそのまま貼れる確認文

```text
このリポジトリを Git に上げる前提で確認したいです。
以下の考え方で問題ないか見てください。

- backend/app 配下のコードは Git に入れる
- backend/tests はテストコードなので Git に入れてよい
- backend/serviceAccountKey.json は秘密情報なので Git に入れない
- .env, venv, .venv, __pycache__ も Git に入れない

必要なら、初心者でも分かるように「今 commit してよいファイル」と「commit しない方がよいファイル」を整理してください。
```
