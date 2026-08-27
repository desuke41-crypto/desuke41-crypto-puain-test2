# はてなブログ自動更新

`posts/` に置いた Markdown 記事を、GitHub Actions が毎時確認し、予約日時を過ぎたらはてなブログへ公開します。公開済みの記事は `.hatena-published.json` に記録されるため、同じ記事を重複投稿しません。

## 初期設定

GitHub リポジトリの **Settings → Secrets and variables → Actions** で、次の Repository secrets を登録します。

| Secret | 内容 |
| --- | --- |
| `HATENA_ID` | はてなID |
| `HATENA_API_KEY` | はてなのアカウント設定画面で確認できるAPIキー |
| `HATENA_BLOG_DOMAIN` | ブログのドメイン（例: `example.hatenablog.com`） |

APIキーは記事ファイルやソースコードへ直接書かないでください。

## 記事を予約する

1. `posts/example.md` を別名でコピーします（ファイル名は公開後に変更しません）。
2. `title`、`categories`、本文、`publish_at` を編集します。日時には `+09:00` のようにタイムゾーンを含めます。
3. 内容を確認して `draft: false` に変更し、GitHubへpushします。
4. 毎時17分の自動実行、または Actions 画面の **Run workflow** で公開されます。

公開せず対象だけを確認する場合は、ローカルで次を実行します。

```bash
python scripts/publish_hatena.py --dry-run
```

公開済みの記事を書き直しても自動更新はしません。誤った再投稿を防ぐため、更新や削除ははてなブログの管理画面から行ってください。
