# Discordのセットアップ

## Developer Portal

1. [Discord Developer Portal](https://discord.com/developers/applications) でNew Applicationを作成します。
2. BotページでBotを設定し、トークンを取得して手元の `.env` の `DISCORD_TOKEN` に保存します。トークンをGitHubやスクリーンショットに載せないでください。
3. Privileged Gateway IntentsはすべてOFFのままにします。本実装は `Guilds` Intentのみ使用し、Message Content / Server Members / Presenceは不要です。
4. OAuth2のURL Generatorで `bot` スコープを選択し、招待URLから対象サーバーへ追加します。アプリコマンドは使用しないため `applications.commands` は不要です。招待を行うアカウントにはサーバー管理権限が必要です。
5. Bot権限に View Channels / Send Messages / Read Message History を選びます。Administrator、Manage Channels、Manage Messages、Mention Everyoneは不要です。サーバー設定だけでなく、カテゴリ・チャンネルの権限上書きも確認してください。

| 対象 | 必要権限 |
| --- | --- |
| 掲載したいカテゴリ・チャンネル | Botと @everyone に View Channel |
| マップ投稿先 | Botに View Channel / Send Messages / Read Message History |

投稿先は対象Guild内の**通常のテキストチャンネル**を指定してください。Forum、スレッド、DM、Announcementへの投稿はMVPでは扱いません。投稿先も公開チャンネルであればマップに含まれます。

## IDと初回投稿

1. Discordのユーザー設定 → 詳細設定 → 開発者モードをONにします。
2. 対象サーバーを右クリックしてIDをコピーし、`GUILD_ID` に設定します。
3. 投稿先チャンネルを右クリックしてIDをコピーし、`MAP_CHANNEL_ID` に設定します。
4. Node.js 24.xでリポジトリを開き `npm ci` を実行します。
5. `.env.example` を `.env` にコピーし上記の値を設定します。`MAP_MESSAGE_ID` は空欄にします。
6. `npm run setup` を実行すると、同じBotが準備用メッセージを投稿し、メッセージIDを出力して終了します。
7. 出力された `MAP_MESSAGE_ID` を `.env` に保存して `npm run dev` を実行します。

本番では4つすべてが必須です。通常起動ではメッセージを新規作成しません。Discord上の「メッセージIDをコピー」でもIDを確認できます。Botトークンをローテーションした場合も、同じBotアカウントなら既存投稿を引き続き利用できます。

## 動作確認

テスト用サーバーで以下を確認してください。

1. 起動後に `Bot ready` と `Channel map synchronized` が出てマップが表示される。
2. カテゴリ・Text・Voice・Forum・Announcementを作成し、種類と並び順が一致する（Forum/Announcementはサーバー機能によって利用できない場合があります）。
3. 短時間に作成・削除・改名・並べ替え・カテゴリ移動を行うと、最後の操作から約3秒後に同じメッセージが更新される。
4. Botを停止中に構成変更し、再起動すると現在状態に同期される。
5. Botに見えるが @everyone には非公開のチャンネル・カテゴリ名が掲載されない。
6. マップメッセージを削除すると新規投稿されずエラーになる。復旧時はBotを停止し、`MAP_MESSAGE_ID` を空にしてセットアップし直す。

## トラブルシューティング

- 起動失敗: 4つの環境変数、Botトークン、IDの取り違えを確認します。ログは秘密情報を避けるため詳細なリクエストを出しません。
- Discord code 50001 / 50013: サーバーへの参加状態と投稿先の権限上書きを確認します。
- Discord code 10008: メッセージ削除・ID間違いを確認します。
- 更新失敗が継続: 投稿者が同じBotか、本文が2,000文字以内か、接続可能かを確認します。30秒ごとに再試行します。
- 同じ内容では `Channel map synchronized` が増えません。変更がない場合の正常動作です。
- 限定ロール向けチャンネルが表示されない: 公開案内向けの仕様です。掲載のために非公開チャンネルの権限を不用意に公開しないでください。

## 参照資料

- [discord.js Gateway Intents](https://discordjs.guide/legacy/popular-topics/intents)
- [Discord Gateway](https://discord.com/developers/docs/events/gateway)
- [Discord Message API・文字数制限](https://discord.com/developers/docs/resources/message)
