const api = require('./api');
const bodyParser = require('body-parser');
const express = require('express');
const messagesApi = require('./messages-api');
const morgan = require('morgan');
const path = require('path');
const process = require('process');
const herokuSslRedirect = require('heroku-ssl-redirect');

const root = `${__dirname}/../../dist`;
const build = require(`${root}/build.json`);
const port = process.env.PORT || '4096';


class WebServer {

    constructor(bot) {
        const jsenv = {};
        for (const key of Object.keys(build)) {
            jsenv[key.toUpperCase()] = build[key];
        }
        this.bot = bot;
        this.port = port;
        this.app = express();
        if (process.env.HEROKU_FORCE_SSL) {
            console.log('forcing SSL on heroku');
            this.app.use(herokuSslRedirect());
        }
        this.app.use(morgan('dev')); // logging
        this.app.use(bodyParser.json());
        this.app.use('/api/auth/', (new api.AuthenticationAPIV1({server: this})).router);
        this.app.use('/api/admins/', (new api.AdminsAPIV1({server: this})).router);
        this.app.use('/api/questions/', (new api.QuestionsAPIV1({server: this})).router);
        this.app.use('/api/business-info/', (new api.BusinessInfoAPIV1({server: this})).router);
        this.app.use('/api/messages/', (new messagesApi.MessagesAPIv1({server: this})).router);
        this.app.use('/api/embedSettings/', (new api.EmbedSettingsAPI({server: this})).router);
        this.app.use('/api/tags/', (new api.TagsAPIV1({server: this})).router);
        this.app.use('/static/', express.static(path.join(root, 'static'), {strict: true}));
        
        this.app.get('/env.js', (req, res) => {
            res.setHeader('Content-Type', 'application/javascript');
            res.send(`self.F = self.F || {}; F.env = ${JSON.stringify(jsenv)};\n`);
        });
        this.app.get('/embed.js', (req, res) => res.sendFile('static/html/embed.js', {root}));
        this.app.get('/*', (req, res) => res.sendFile('static/html/index.html', {root}));
        this.app.use((req, res, next) => {
            res.status(404).json({
                error: 'bad_request',
                message: 'not_found'
            });
        });
        this.app.use((error, req, res, next) => {
            res.status(500).json({
                error: 'server',
                message: error
            });
        });
    }

    async start() {
        this.app.listen(this.port, process.env.LISTEN_ADDR);
    }
}

module.exports = WebServer;
