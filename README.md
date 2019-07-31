Forsta Live Chat Bot
========
This repository is built from a Forsta end-to-end-encrypted messaging bot template.
The Forsta messaging-bot allows for for autonomous receipt, processing, storage, and/or 
transmission of messaging data in conjunction with the Forsta web messenger and iPhone/Android apps.
Please fork it or one of our several projects based off of it!

Quick Start
--------
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/ForstaLabs/live-chat-bot)


Install Requirements
--------
 * [Node.js 8](https://nodejs.org/en/download/)
 * [Docker](https://docs.docker.com/v17.12/install/)
 * [Ruby](https://www.ruby-lang.org/en/documentation/installation/)
 * [Sass](https://sass-lang.com/install)
   

Running Locally
--------
```
git clone https://github.com/ForstaLabs/live-chat-bot.git
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
