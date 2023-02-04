# ポピュレーションワンの週間キル数と勝利数を投稿してくれる Discord の Bot
指定した間隔で Population: ONE の API から player.js のプレイヤーの週間キル数と勝利数を取ってきて Discord のチャンネルにランキング結果を投稿してくれる Bot です。

## プレイヤーの登録
/js/player.js ファイルのオブジェクト module.exports = {} に {名前: 'プレイヤーID', ・・・} という形式で追加してください。
名前は何でもいいです。管理しやすい名前を入力してください。
プレイヤーIDは下記のURLから探してください。（「usernameQuery」にプレイヤー名を入れて検索してください。）
プレイヤーIDでキル数と勝利数を取ってくるのでプレイヤーIDが重要です。
[https://nykloo.com/swagger/index.html](https://nykloo.com/swagger/index.html)

## Discord のアクセストークン
GitHub で管理するのはよくないので環境変数で管理します。
.env.template ファイル名を .env にして「DISCORD_BOT_TOKEN=''」に入力してください。
Heroku の場合は 対象アプリの Settings → Reveal Config Vars で KEY と VALUE に .env の値を入れて環境変数を設定してください。

## Bot の権限付与
「メッセージを送信」だけでOK

## Heroku へのデブロイ
### GitHub にデータを push してある場合
Heroku CLI をインストール
以下のコマンドを入力
- heroku login
- heroku container:login
- heroku create
- git push heroku main

### Heroku の設定
対象アプリの Resources の 「Free Dynos」で 「web npm start」をオフにし、「discordbot node discordbot.js」をオンする。
「web npm start」がオンだとサーバー起動後30分でサーバーがスリープになるが、オフにしておくと discordbot が24時間稼働してくれます。
今回は web は使わないのでオフで大丈夫です。