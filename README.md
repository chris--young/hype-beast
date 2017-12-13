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

__Set auth token__ (You can get this using Charles or Burp)
```
➜  export HQ_AUTH_TOKEN=<your token>
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
answers to use as testing data for the hypotheses. You _should_ check this data into
the repo.

__Extract questions and answers for broadcast 1337__
```
➜  node tools/extract_messages 1337
```

__Check accuracy against broadcast 1337__
```
➜  node tools/check_accuracy 1337
```

__Check accuracy against all saved game data__
```
➜  node tools/check_accuracy
```
