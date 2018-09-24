(function() {
    "use strict";

    kintone.events.on('mobile.app.record.index.show', function(event) {
    // レコード一覧画面の空白スペースを取得
        var headerSpace = kintone.mobile.app.getHeaderSpaceElement();

    // 時刻表示のコンテナをつくる
        var hourContainer = document.createElement('div');

    // 時刻表示のタイトル・時計を作る
        var appTitle = document.createElement('h1');
        appTitle.textContent = 'タイムカード';
        var clock = document.createElement('p');
        clock.id = 'clock';

    // 空白スペースに時刻表示を設置
        headerSpace.appendChild(hourContainer);
        hourContainer.appendChild(appTitle);
        hourContainer.appendChild(clock);

    // ボタンコンテナをつくる
        var buttonContainer = document.createElement('div');

    // ボタンを作る関数
        var createButton = function(id, textContent) {
            var button = document.createElement('button');
            button.id = id;
            button.textContent = textContent;
            button.style.display = 'flex';
            button.style.margin = '0px 20px 20px 20px';
            button.style.padding = '15px 15px';
            button.style.color = '#ffffff';
            button.style.border = '0 none';
            button.style.borderRadius = '4px';
            button.style.fontSize = '55px';
            button.style.fontWeight = 'bold';
            return button;
        };

        // ボタンを作る関数を実行
        var clockInButton = createButton('clockInButton', '出勤');
        var clockOutButton = createButton('clockOutButton', '退勤');

        // 空白スペースにボタンコンテナ・ボタンを設置
        headerSpace.appendChild(buttonContainer);
        buttonContainer.appendChild(clockInButton);
        buttonContainer.appendChild(clockOutButton);

    // ボタンコンテナ・各ボタンにCSSを適用
        buttonContainer.style.display = 'flex';
        buttonContainer.style.margin = '40px auto';
        buttonContainer.style.flexWrap = 'wrap';
        buttonContainer.style.justifyContent = 'center';

        clockInButton.style.backgroundColor = '#3dd28d';
        clockOutButton.style.backgroundColor = '#353866';

    // 時刻表示にCSSを適用
        hourContainer.style.textAlign = 'center';

        appTitle.style.fontFamily = 'sans-serif';
        appTitle.style.fontSize = '25px';
        appTitle.style.color = '#666';

        clock.style.fontFamily = 'monaco';
        clock.style.fontSize = '25px';

    // リアルタイムで時刻を表示
        var showDate = function() {
            var nowTime = moment().format('HH:mm:ss');
            document.getElementById('clock').textContent = nowTime;
        };
        setInterval(showDate, 1000);
    // GETリクエストで使用するパラメータ
        var paramG = {
            'app': event.appId,
            'query': '作成日時 = TODAY() and 作成者 in (LOGINUSER())',
            'totalCount': true
        };
    // HTTPリクエストがこけたときの処理
        var errorMessage = function(error) {
            alert('エラーが発生しました。管理者に下記のエラー内容を伝えてください' + '\nエラーコード:' + error.code + '\nエラーメッセージ:' + error.message);
        };

    // 出勤ボタンが押されたときの処理
        var clickClockInButton = function() {
        // レコード情報を取得
            kintone.api(kintone.api.url('/k/v1/records', true), 'GET', paramG, function(getResp) {
                // 作成日時が当日のものがない場合、確認後レコードを新規で登録、 alertを出す
                if (parseInt(getResp.totalCount, 10) === 0 && confirm('出勤時間を登録しますか')) {
                    var paramP = {
                        'app': event.appId,
                        'record': {
                            '休憩時間': {
                                value: '60'
                            }
                        }
                    };
                    kintone.api(kintone.api.url('/k/v1/record', true), 'POST', paramP, function(postResp) {
                        alert('出勤時間を登録しました');
                        return;
                    }, function(err) {
                        errorMessage(err);
                    });
                } else if (parseInt(getResp.totalCount, 10) !== 0) {
                    // 作成日時が当日のものがすでにある場合、alertを出す
                    alert('すでに登録済みです');
                    return;
                }
            }, function(err) {
                errorMessage(err);
            });
        };
        clockInButton.addEventListener('click', clickClockInButton);

    // 退勤ボタンが押されたときの処理
        var clickClockOutButton = function() {
        // レコード情報を取得
            kintone.api(kintone.api.url('/k/v1/records', true), 'GET', paramG, function(getResp2) {
                // 作成日時が当日のレコードがあった場合、確認後、退勤時間を現在時刻に更新し、alertを出す
                if (parseInt(getResp2.totalCount, 10) === 1 &&
                getResp2.records[0]['出勤時間'].value === getResp2.records[0]['退勤時間'].value &&
                confirm('退勤時間を登録しますか')) {
                    var paramP = {
                        'app': event.appId,
                        'id': String(getResp2.records[0].$id.value),
                        'record': {
                            '退勤時間': {
                                value: moment().format('HH:mm')
                            }
                        }
                    };
                    kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', paramP, function(putResp) {
                        alert('退勤時間を登録しました');
                        return;
                    }, function(err) {
                        errorMessage(err);
                    });
                } else if (parseInt(getResp2.totalCount, 10) === 0) {
                    // 作成日時が当日のものがなかった場合、alertを出す
                    alert('出勤時間が登録されていません');
                    return;
                } else if (getResp2.records[0]['出勤時間'].value !== getResp2.records[0]['退勤時間'].value) {
                    alert('すでに登録済みです');
                }
            }, function(err) {
                errorMessage(err);
            });
        };
        clockOutButton.addEventListener('click', clickClockOutButton);
    });
})();
