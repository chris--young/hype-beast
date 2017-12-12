hype-beast
==========

### Win HQ every time

Usage
-----

__Clone into this repo__
```
➜  git clone git@github.com:chris--young/hype-beast.git
➜  cd hype-beast
```

__Install dependencies__
```
➜  npm install
```

__Run the bot__
```
➜  npm start
```

******

Tools
-----

You can use these tools to help improve the bot. Each time the bot is run it will
save the stream data for the game it plays. These scripts extract the questions and
answers to use as testing data for the hypotheses.

__Check accuracy__
```
➜  npm test
```

__Extract questions for broadcast 1337__
```
node tools/extract_messages.js 1337.stream questions > data/questions/1337.json
```

__Extract answers for broadcast 1337__
```
node tools/extract_messages.js 1337.stream questionSummaries > data/summaries/1337.json
```
