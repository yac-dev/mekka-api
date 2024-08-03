// 動画とthumbnailを作るプログラム
const inputFilePath = path.join(__dirname, 'buffer', originalFileName);
const outputFilePath = path.join(__dirname, 'buffer', newFileName);
const command = `ffmpeg -i ${inputFilePath} -vcodec h264 -b:v:v 1500k -acodec mp3 ${outputFilePath}`;
return new Promise((resolve, reject) => {
  exec(command, (err, stdout, stderr) => {
    if (err) console.log('Error ', err);
    else {
      // ここでoriginalの動画を消して、optimizeされた動画をaws uploadのlogicに渡す感じだ。
      resolve(outputFilePath);
    }
  });
});
