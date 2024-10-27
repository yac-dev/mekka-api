# stagingとproductionで同じ dockerfileを使う。。
# いや、というか普通に全部同じDockerFile使えばよくない？w全部同じ環境にできるのがDockerの最大の強みでしょw
# frontとかだと、nginx絡むからdevだけ分けてもいんだろうけど、少なくともserver側は全部同じでいい気がするねもう。

FROM node:20.11.1

RUN apt-get update && apt-get install ffmpeg -y

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3500

CMD [ "npm", "run", "server:production" ]
