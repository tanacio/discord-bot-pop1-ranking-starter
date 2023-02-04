'use strict';
const axios = require('axios');
const cron = require('node-cron');

// discord.js を読み込み Client を新規に作成
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Discord Bot のアクセストークンとチャンネルIDの環境変数
require('dotenv').config();
const token = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.DISCORD_CHANNEL_ID;

let rankingResult = []; // 週間ランキングの配列
/**
 * Population one の APIを叩く
 * @param {URL} playerInfoUrl 
 * @returns APIから取り出した週間キル数と勝利数のオブジェクト
 */
function callApi(playerInfoUrl) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      axios.get(playerInfoUrl).then(res => {
        // プレイヤー名
        const playerName = res.data.accountInfo.titleInfo.displayName;

        // Weekly キル数
        const weeklyKillsObj = res.data.playerStatistics.filter(target => {
          if (target.statisticName.indexOf('WeeklyKillsTotal') !== -1) {
            return target;
          }
        });
        // 上記オブジェクトから Weekly キル数を取り出す
        let weeklyKills = undefined;
        if (weeklyKillsObj.length) {
          weeklyKills = weeklyKillsObj[0].value;
        }
        else {
          weeklyKills = 0;
        }

        // Weekly 勝利数
        const weeklyWinsObj = res.data.playerStatistics.filter(target => {
          if (target.statisticName.indexOf('WeeklyWinsTotal') !== -1) {
            return target;
          }
        });
        // 上記オブジェクトから Weekly 勝利数を取り出す
        let weeklyWins = undefined;
        if (weeklyWinsObj.length) {
          weeklyWins = weeklyWinsObj[0].value;
        }
        else {
          weeklyWins = 0;
        }
        // 最終週間ランキングの配列にプレイヤー stats のオブジェクトを入れる
        rankingResult.push({ Player_Name: playerName, Weekly_Kills: weeklyKills, Weekly_Wins: weeklyWins });
        resolve();
      }).catch(error => {
        // アカウント削除などで API が 404エラーなどになる場合はプレイヤ名unkwown、数値を0として処理を続行する。
        rankingResult.push({ Player_Name: 'unknown', Weekly_Kills: 0, Weekly_Wins: 0 });
        console.log(error.response);
        resolve();
      });
    }, 2000);
  });
}

// プレイヤーリストの読み込み
const playerObject = require('./js/player.js');
// プレイヤーIDだけの配列にする
const playerIdArray = Object.values(playerObject);

// Discord に何位まで投稿するか
let playerDisplay = 20;
if (playerDisplay > playerIdArray.length) {
  // player.js の人数の方が少なければそちらの数字を優先する
  playerDisplay = playerIdArray.length;
}

/**
 * Discord に送る Kill Ranking メッセージを作成
 * @returns Discord に送る kill Ranking メッセージの文字列
 */
function createKillMsg(sorting) {
  const weeklyKillResult = rankingResult.sort(function (a, b) {
    // ウィークリー Kill 数の降順ソート
    return (a.Weekly_Kills > b.Weekly_Kills) ? -1 : 1;
  });

  // Discord のチャンネルに送信する Kill Ranking メッセージ
  let discordMsgKills = '';

  // 最終ランキングと途中経過の結果発表メッセージ 条件分岐
  if (sorting === 'finalRanking') {
    discordMsgKills = `今週のキルリーダーは **${weeklyKillResult[0].Weekly_Kills} キル**で **${weeklyKillResult[0].Player_Name}** さんです:reminder_ribbon:\nおめでとうございます:confetti_ball:\n\n`;
  }
  else if (sorting === 'progressRanking') {
    discordMsgKills = `現在 **${weeklyKillResult[0].Player_Name}** さんが **${weeklyKillResult[0].Weekly_Kills} キル**で 2 位の ${weeklyKillResult[1].Player_Name} さんに ${weeklyKillResult[0].Weekly_Kills - weeklyKillResult[1].Weekly_Kills} キル差をつけて首位 :gun:\n\n`;
  }

  for (let i = 0; i < weeklyKillResult.length; i++) {
    /** @type {string} プレイヤー名 / キル数 */
    const weeklyKillsValue = `${weeklyKillResult[i].Player_Name} / ${weeklyKillResult[i].Weekly_Kills}`;
    if (i === 0) {
      // 1位
      discordMsgKills += `:first_place:  **${weeklyKillsValue}** キル\n`;
    } else if (i === 1) {
      // 2位
      discordMsgKills += `:second_place:  **${weeklyKillsValue}** キル\n`;
    } else if (i === 2) {
      // 3位
      discordMsgKills += `:third_place:  **${weeklyKillsValue}** キル\n`;
    }
    else {
      // 4位以下
      discordMsgKills += `${i + 1}th  ${weeklyKillsValue}\n`;
    }
  }
  return discordMsgKills;
}

/**
 * Discord に送る Win Ranking メッセージを作成
 * @returns Discord に送る Win Ranking メッセージの文字列
 */
function createWinMsg(sorting) {
  const weeklyWinResult = rankingResult.sort(function (a, b) {
    // ウィークリー Win 数の降順ソート
    return (a.Weekly_Wins > b.Weekly_Wins) ? -1 : 1;
  });

  // Discord のチャンネルに送信する Win Ranking メッセージ
  let discordMsgWins = '';

  // 最終ランキングと途中経過の結果発表メッセージ 条件分岐
  if (sorting === 'finalRanking') {
    discordMsgWins = `今週の最多勝は **${weeklyWinResult[0].Weekly_Wins} 勝**で **${weeklyWinResult[0].Player_Name}** さんです:reminder_ribbon:\nおめでとうございます:confetti_ball:\n\n`;
  }
  else if (sorting === 'progressRanking') {
    discordMsgWins = `現在 **${weeklyWinResult[0].Player_Name}** さんが **${weeklyWinResult[0].Weekly_Wins} 勝**で 2 位の ${weeklyWinResult[1].Player_Name} さんに ${weeklyWinResult[0].Weekly_Wins - weeklyWinResult[1].Weekly_Wins} 勝差をつけて首位 :clap:\n\n`;
  }

  for (let i = 0; i < weeklyWinResult.length; i++) {
    /** @type {string} プレイヤー名 / 勝利数 */
    const weeklyWinsValue = `${weeklyWinResult[i].Player_Name} / ${weeklyWinResult[i].Weekly_Wins}`;
    if (i === 0) {
      // 1位
      discordMsgWins += `:first_place:  **${weeklyWinsValue}** 勝\n`;
    } else if (i === 1) {
      // 2位
      discordMsgWins += `:second_place:  **${weeklyWinsValue}** 勝\n`;
    } else if (i === 2) {
      // 3位
      discordMsgWins += `:third_place:  **${weeklyWinsValue}** 勝\n`;
    }
    else {
      // 4位以下
      discordMsgWins += `${i + 1}th  ${weeklyWinsValue}\n`;
    }
  }
  return discordMsgWins;
}

// 週間ランキングを作成する関数
let discordMsg = 'ごめんなさい。失敗しました。';
async function createRanking(sorting) {
  for (let i = 0; i < playerIdArray.length; i++) {
    const playerInfoUrl = `https://nykloo.com/api/PlayerStats/Stats/${playerIdArray[i]}`;
    await callApi(playerInfoUrl);
  }
  // kill Ranking メッセージ
  const weeklyKillMsg = createKillMsg(sorting);
  // Win Ranking メッセージ
  const weeklyWinMsg = createWinMsg(sorting);
  // Kill and Win Ranking のメッセージを結合
  discordMsg = weeklyKillMsg + '\n' + weeklyWinMsg;
};

// Discord のチャンネルに投稿
client.on('ready', () => {
  // 指定時に最終結果を投稿
  // ↓の例、毎週日曜日0時に投稿 cron.schedule('秒 分 時間 日 月 曜日')曜日は0と7が日曜日
  // herokuの場合タイムゾーンがUTC（協定世界時）なのでマイナス9時間した時間を書く
  cron.schedule('0 0 15 * * 7', async () => {
    await createRanking('finalRanking');
    const channel = client.channels.cache.get(channelId); // channelId は .env に入力、又は直接記入してもOK
    rankingResult = []; // 週間ランキングの配列初期化
    // Discord のチャンネルにメッセージを送信
    channel.send(discordMsg);
  });

  // 指定時に途中経過を投稿
  // ↓の例、毎日22時30分に投稿 cron.schedule('秒 分 時間 日 月 曜日')曜日は0と7が日曜日
  // herokuの場合タイムゾーンがUTC（協定世界時）なのでマイナス9時間した時間を書く
  cron.schedule('0 30 13 * * *', async () => {
    await createRanking('progressRanking');
    const channel = client.channels.cache.get(channelId); // channelId は .env に入力、又は直接記入してもOK
    rankingResult = []; // 週間ランキングの配列初期化
    // sleep 早朝に通知を飛ばさないため(例: 5時間後)
    // await sleep(5);
    // Discord のチャンネルにメッセージを送信
    channel.send(discordMsg);
  });
});

// sleep 関数
function sleep(hour) {
  return new Promise(resolve => setTimeout(resolve, hour * 3600000));
}

// アクセストークンで Discord にログイン
client.login(token); // token は .env に入力（GitHubで管理したくないため）