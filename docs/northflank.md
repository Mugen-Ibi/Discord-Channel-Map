# Northflankデプロイ手順

Discord Gatewayへ接続し続ける常駐サービスです。HTTPサーバー、公開ポート、DB、Volume、Redisは不要です。料金・無料枠・利用可能なリソースは変更されるため、導入時に [公式料金表](https://northflank.com/pricing) と管理画面で確認してください。本手順は無料での常時稼働を保証しません。

## 事前準備

- [Discordセットアップ](setup.md) を済ませ、4つの環境変数とBot自身が投稿したメッセージを用意します。
- 変更をGitHubのデプロイ対象ブランチに反映します。
- NorthflankにGitHubを接続し、このリポジトリへのアクセスを許可します。

## サービス作成

1. Northflankでプロジェクトを作成します。
2. Gitからビルド・デプロイする **Combined service** を作成します。スケジュールJobではなく常駐Serviceを使います。
3. リポジトリとブランチを選択します。レビュー中のブランチを試す場合は明示的にそのブランチを指定します。
4. ビルド方式をDockerfile、パスを `/Dockerfile`、ビルドコンテキストをリポジトリルートに設定します。
5. Runtime Variables（または実行時のSecret group）へ以下を登録します。**Build Argumentsへトークンを渡さないでください。**

   ```text
   DISCORD_TOKEN=<Bot token>
   GUILD_ID=<server ID>
   MAP_CHANNEL_ID=<text channel ID>
   MAP_MESSAGE_ID=<message ID>
   ```

6. インスタンス数を1にし、継続稼働するリソース設定を選びます。スケールゼロ・スリープ設定を使わないでください。
7. 公開ポートとHTTPヘルスチェックは設定しません。プロセス終了時の再起動設定を確認します。Gateway障害の検知はログとDiscord上の状態も併用してください。
8. ビルド・デプロイします。コンテナは非rootの `node` ユーザーで起動します。起動コマンドはDockerfileの `node dist/index.js` を使用し、追加の上書きは不要です。
9. ログの `Bot ready`、初回同期とDiscordの実際のマップを確認します。確認できたらローカルのBotを停止し、本番だけが更新するようにします。

Dockerfile内では `npm ci` → `npm run build` → 本番依存のみ残す、の順で処理します。コンテナを使わずNode環境で動かす場合は `npm ci`、`npm run build`、`npm start` の順に実行します。ビルド時はTypeScriptなどの開発依存も必要です。

## 更新と復旧

- 選択したGitブランチの変更に対する自動ビルド・デプロイを有効にします。CIの成功を確認してから本番へ反映してください。
- 再起動後は現在の構成を取得するため、停止中のイベント履歴や永続ディスクは不要です。
- ローリングデプロイ中は旧・新プロセスが一時的に重複し得ます。厳密に1プロセスにしたい場合は旧サービスを停止してから新バージョンを起動します。起動時同期で停止中の変更を反映できます。
- トークン変更はRuntime Variablesを更新して再デプロイします。ID・トークンはログに貼らないでください。
- コードの問題は直前の正常なビルドへロールバックします。メッセージIDは維持してください。
- 更新エラーが続く場合は [トラブルシューティング](setup.md#トラブルシューティング) を参照します。本文上限超過はリソース増量では解決しません。

## 公式資料

- [サービスの継続実行](https://northflank.com/docs/v1/application/run/run-an-image-continuously)
- [ポート設定](https://northflank.com/docs/v1/application/network/configure-ports)
