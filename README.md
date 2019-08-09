Forsta Live Chat Bot
========
This repository is built from Forsta's [end-to-end-encrypted messaging bot template](https://github.com/ForstaLabs/messaging-bot).
The Forsta messaging-bot provides for for autonomous receipt, processing, storage, and
transmission of messaging data in conjunction with the Forsta web messenger and iPhone/Android apps.
Please fork it or one of our several projects based off of it!

The live chat bot provides an easy way to configure a question set whose terminal questions send a connection request
to a specified user or group of users. Once a terminal question is reached, the user can request a connection to a
live chat operator. The request will be in the form of a librelay message with a "Connect" button and a complete history
of the chat so far. Once the live chat operator clicks "Connect" they will be added to the existing thread so they can talk 
to the user.

The bot also records all incoming/outgoing messages for debugging purposes.

Quick Start
--------
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/ForstaLabs/forsta-live-chat-bot)


Install Requirements
--------
 * [Node.js 8](https://nodejs.org/en/download/)
 * [Docker](https://docs.docker.com/v17.12/install/)
 * [Ruby](https://www.ruby-lang.org/en/documentation/installation/)
 * [Sass](https://sass-lang.com/install)
   

Running Locally
--------
```
git clone https://github.com/ForstaLabs/forsta-live-chat-bot.git
cd live-chat-bot
export RELAY_STORAGE_BACKING=postgres
export USER=postgres
make docker-db-run
make run
```

Usage
--------
Once running, the default port and listening address are `0.0.0.0:4096`.  If
you are running locally you can access the web interface by opening
*http://localhost:4096*.

You can change the listening address by setting `LISTEN_ADDR` to a valid host
address for your server, E.g. something like `localhost` or `127.0.0.1` to only
accept local connections.

The default listening port can be changed by setting `PORT` to any valid
numeric port, e.g. `8000`.

Storage is managed through Forsta
[librelay](https://github.com/ForstaLabs/librelay-node) which currently
supports local filesystem and Redis.  For more information about setting
up custom storage see: https://github.com/ForstaLabs/librelay-node#storage.


License
--------
Licensed under the GPLv3: http://www.gnu.org/licenses/gpl-3.0.html

* Copyright 2015-2016 Open Whisper Systems
* Copyright 2017-2018 Forsta Inc.
