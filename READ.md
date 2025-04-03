migration 実行

package.json の "type": "module" コメントアウト

npm run migrate-create:dev

作成された migration file を追加したい field 足したり（引いたり）で編集する

mongoose file の import を require に変更
const mongoose = require('mongoose');

npm run migrate-up:dev もしくは npm run migrate-down:dev を実行

って感じ。commonjs なのがだるいね。。。
