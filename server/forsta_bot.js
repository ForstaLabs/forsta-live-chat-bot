'use strict';

const BotAtlasClient = require('./atlas_client');
const cache = require('./cache');
const relay = require('librelay');
const PGStore = require("./pgstore");
const uuid4 = require('uuid/v4');
const words = require("./authwords");
const moment = require("moment");

const AUTH_FAIL_THRESHOLD = 10;

class ForstaBot {

    async start() {
        this.ourId = await relay.storage.getState('addr');
        if (!this.ourId) {
            console.warn("bot is not yet registered");
            return;
        }
        this.pgStore = new PGStore('live_chat');
        await this.pgStore.initialize();
        this.atlas = await BotAtlasClient.factory();
        this.getUsers = cache.ttl(60, this.atlas.getUsers.bind(this.atlas));
        this.botUser = (await this.getUsers([this.ourId]))[0];
        this.resolveTags = cache.ttl(60, this.atlas.resolveTags.bind(this.atlas));
        this.msgReceiver = await relay.MessageReceiver.factory();
        this.msgReceiver.addEventListener('keychange', this.onKeyChange.bind(this));
        this.msgReceiver.addEventListener('message', ev => this.onMessage(ev), null);
        this.msgReceiver.addEventListener('error', this.onError.bind(this));
        this.msgSender = await relay.MessageSender.factory();
        await this.msgReceiver.connect();

        this.threadStatus = {};
        this.outgoingThreadId = uuid4();
    }

    async stop() {
        if (this.msgReceiver) {
            console.warn("Stopping message receiver");
            this.msgReceiver.close();
            this.msgReceiver = null;
        }
        await this.pgStore.shutdown();
    }

    async restart() {
        this.stop();
        await this.start();
    }

    async onKeyChange(ev) {
        console.warn("Auto-accepting new identity key for:", ev.addr);
        await ev.accept();
    }

    onError(e) {
        console.error('Message Error', e, e.stack);
    }

    fqTag(user) { 
        return `@${user.tag.slug}:${user.org.slug}`; 
    }

    fqName(user) {
        const fqInfo = [user.first_name, user.middle_name, user.last_name]; 
        return fqInfo.map(s => (s || '').trim()).filter(s => !!s).join(' '); 
    }

    fqLabel(user) { 
        return `${this.fqTag(user)} (${this.fqName(user)})`; 
    }

    async onMessage(ev) {
        const received = new Date(ev.data.timestamp);
        const envelope = JSON.parse(ev.data.message.body);
        const attachmentData = ev.data.message.attachments || [];
        const msg = envelope.find(x => x.version === 1);
        if (!msg) {
            console.error('Dropping unsupported message:', envelope);
            return;
        }
        if(msg.data.control === 'readMark') {
            return;
        }

        const businessInfo = await relay.storage.get('live-chat-bot', 'business-info');
        const questions = await relay.storage.get('live-chat-bot', 'questions');        
        const dist = await this.resolveTags(msg.distribution.expression);
        const action = msg.data.action;
        const threadId = msg.threadId;
        const users = await this.getUsers(dist.userids);

        if(!action && !this.threadStatus[threadId]) {            
            this.threadStatus[threadId] = {
                questions,
                currentQuestion: questions[0],
                waitingForTakeover: null,
                waitingForResponse: null,
                listening: false,
                responses: [],
                sentOOOMessage: false,
                ended: false
            };
        }
        
        await this.saveToMessageHistory(received, envelope, msg, attachmentData);

        if(this.threadStatus[threadId] && this.threadStatus[threadId].listening) {
            return;
        }

        if (this.threadStatus[msg.threadId] && this.threadStatus[msg.threadId].ended ) {
            this.sendMessage(dist, msg.threadId, "The session has ended");
            return;
        } 

        if(this.outOfOffice(businessInfo)){
            if(this.threadStatus[threadId] && !this.threadStatus[threadId].sentOOOMessage) {
                await this.sendMessage(dist, threadId, businessInfo.outOfOfficeMessage);
                this.threadStatus[threadId].sentOOOMessage = true;
            }

            if(businessInfo.action === 'Forward to Tag') {
                const oooDist = await this.resolveTags(businessInfo.promptTag);
                await this.handleDistTakeover(msg, oooDist);
            }
        }
        
        if(this.threadStatus[action] && this.threadStatus[action].waitingForTakeover){
            await this.handleDistTakeover(msg, dist);
            return;
        } else if(this.threadStatus[threadId].waitingForResponse){
            const validResponse = await this.handleResponse(msg, dist, users, businessInfo);
            if(!validResponse) return;
        }

        if(this.threadStatus[threadId].currentQuestion.type === 'Free Response') {
            const prompt = this.threadStatus[threadId].currentQuestion.prompt;
            this.threadStatus[threadId].waitingForResponse = true;
            await this.sendMessage(dist, threadId, prompt);
        } else {
            const prompt = this.threadStatus[threadId].currentQuestion.prompt;
            const actions = this.threadStatus[threadId].currentQuestion.responses.map( 
                (response, index) => { 
                    return { title: response.text, color: response.color, action: index };
                }
            );
            this.threadStatus[threadId].waitingForResponse = true;            
            await this.sendActionMessage(dist, threadId, prompt, actions);
        }
    }

    async handleDistTakeover(msg, forwardingDist){
        const threadId = msg.data.action;
        const chatUserTagId = this.threadStatus[threadId].waitingForTakeover.userTagId;
        const distMemberUser = await this.atlas.fetch(`/v1/user/${msg.sender.userId}/`);
        const chatBotUser = await this.atlas.fetch(`/v1/user/${this.ourId}/`);
        const newDist = await this.resolveTags(`(<${chatUserTagId}>+<${distMemberUser.tag.id}>+<${chatBotUser.tag.id}>)`);
        
        forwardingDist.userids = forwardingDist.userids.filter(id => id != distMemberUser.id);

        await this.sendMessage(
            newDist, 
            msg.data.action, 
            `You are now connected with ${this.fqName(distMemberUser)}`,
        );        
        await this.sendResponse(
            forwardingDist, 
            this.outgoingThreadId, 
            this.threadStatus[threadId].waitingForTakeover.msgId, 
            `Taken by ${this.fqName(distMemberUser)}`
        );

        this.threadStatus[threadId].waitingForTakeover = false;        
        this.threadStatus[threadId].listening = true;
    }

    async handleResponse(msg, dist, users, businessInfo){
        const response = this.parseResponse(msg, this.threadStatus[msg.threadId]);
        const noActionError = `ERROR: response action not configured !`;
        const noForwardError = `ERROR: Forwarding distribution does not exist.`;
        
        if(!response.action){
            await this.sendMessage(dist, msg.threadId, noActionError);
            this.questions = undefined;
            return;
        }

        this.threadStatus[msg.threadId].waitingForResponse = false;

        if (response.action === "Forward to Tag") {
            const ephemeralUser = users.filter(u => u.id === msg.sender.userId)[0];
            const ephemeralUsername = ephemeralUser.first_name + " " + ephemeralUser.last_name;
            const forwardMessage = this.getForwardMessage(msg, ephemeralUsername);
            const botTagId = users.filter(u => u.id === this.ourId)[0].tag.id;
            const forwardingDist = await this.resolveTags(`(<${response.actionOption}>+<${botTagId}>)`);
            if (!forwardingDist) {
                await this.sendMessage(dist, msg.threadId, noForwardError);
                return;
            }

            await this.sendMessage(dist, msg.threadId, response.forwardingText);

            let forwardingToDistMsg = await this.sendActionMessage(
                forwardingDist, 
                this.outgoingThreadId, 
                forwardMessage,
                [{title:'Connect', action: msg.threadId, color:'blue'}],
                'Live Chat Queue'
            );

            this.threadStatus[msg.threadId].waitingForTakeover = {
                userTagId: users.filter(u => u.id !== this.ourId)[0].tag.id,
                msgId: JSON.parse(forwardingToDistMsg.message.dataMessage.body)[0].messageId
            };
            return;
        }

        else if(response.action === "Forward to Question") {
            let questionNumber = Number(response.actionOption.split(' ')[1]);
            this.threadStatus[msg.threadId].currentQuestion = this.threadStatus[msg.threadId].questions[questionNumber-1];
            if(this.threadStatus[msg.threadId].currentQuestion.type == "End Question") {
                this.sendMessage(dist, msg.threadId, this.threadStatus[msg.threadId].currentQuestion.prompt);
                this.threadStatus[msg.threadId].ended = true;
                return;
            }
        }

        return true;
    }

    getForwardMessage(msg, ephemeralUsername) {
        const responses = this.threadStatus[msg.threadId].responses;
        //forward message
        let fm = `<h5>A live chat user is trying to connect.</h5><br>`;
        fm += `<strong>Name:</strong> ${ephemeralUsername}<br><br>`;
        responses.forEach(response => {
            fm += 
                `<label>Chatbot:</label> `
                + `${response.prompt}<br>`
                + `<label>Response:</label> `
                + `${response.response}<br><br>`;
        });
        fm += `<hr width="100%" />`;
        fm += `Click the "Connect" button to chat with this user.`;
        return fm;
    }

    parseResponse(msg){
        const prompt = this.threadStatus[msg.threadId].currentQuestion.prompt;
        if(this.threadStatus[msg.threadId].currentQuestion.type === 'Free Response'){
            console.log(msg);
            const responseText = msg.data.body[0].value;
            this.threadStatus[msg.threadId].responses.push({ 
                prompt: prompt, response: responseText 
            });
            return this.threadStatus[msg.threadId].currentQuestion.responses[0];
        }    

        const responseNumber = Number(msg.data.action);   
        if(responseNumber > this.threadStatus[msg.threadId].currentQuestion.responses.length - 1 || responseNumber < 0){
            return undefined;
        }

        const responseText = this.threadStatus[msg.threadId].currentQuestion.responses[responseNumber].text;
        this.threadStatus[msg.threadId].responses.push({ 
            prompt: prompt, response: responseText 
        });
        return this.threadStatus[msg.threadId].currentQuestion.responses[responseNumber];
    }

    async saveToMessageHistory(received, envelope, message, attachmentData) {
        const senderId = message.sender.userId;
        const sender = (await this.getUsers([senderId]))[0];
        const senderLabel = this.fqLabel(sender);
        const distribution = await this.resolveTags(message.distribution.expression);
        const recipients = await this.getUsers(distribution.userids);
        const recipientIds = recipients.map(user => user.id);
        const recipientLabels = recipients.map(user => this.fqLabel(user));

        const messageId = message.messageId;
        const threadId = message.threadId;

        const threadTitle = message.threadTitle;
        const tmpBody = message.data && message.data.body;
        const tmpText = tmpBody && tmpBody.find(x => x.type === 'text/plain');
        const messageText = (tmpText && tmpText.value) || '';

        const attachmentMeta = (message.data && message.data.attachments) || [];
        if (attachmentData.length != attachmentMeta.length) {
            console.error('Received mismatched attachments with message:', envelope);
            return;
        }
        let attachmentIds = attachmentData.map(x => uuid4());

        await this.pgStore.addMessage({
            payload: JSON.stringify(envelope),
            received,
            distribution: JSON.stringify(distribution),
            messageId,
            threadId,
            senderId,
            senderLabel,
            recipientIds,
            recipientLabels,
            attachmentIds,
            tsMain: messageText,
            tsTitle: threadTitle
        });

        for (let i = 0; i < attachmentIds.length; i++) {
            await this.pgStore.addAttachment({
                id: attachmentIds[i],
                data: attachmentData[i].data,
                type: attachmentMeta[i].type,
                name: attachmentMeta[i].name,
                messageId: messageId
            });
        }
    }

    outOfOffice(businessInfo){
        if(!businessInfo) return false;

        const hoursNow = moment().hours();
        const minsNow = moment().minutes();
        const openHours = Number(businessInfo.open.split(':')[0]);
        const openMins = Number(businessInfo.open.split(':')[1]);
        const closeMins = Number(businessInfo.close.split(':')[1]);
        let closeHours = Number(businessInfo.close.split(':')[0]);

        if(openHours > closeHours) closeHours += 24;
        if( (hoursNow < openHours) || (hoursNow === openHours && minsNow < openMins) ){
            return true;
        }
        if( (hoursNow > closeHours) || (hoursNow === closeHours && minsNow > closeMins) ){
            return true;
        }
        return false;
    }

    async sendMessage(dist, threadId, text){
        return this.msgSender.send({
            distribution: dist,
            threadId: threadId,
            html: `${ text }`,
            text: text
        });
    }

    async sendResponse(dist, threadId, msgId, text){
        return this.msgSender.send({
            distribution: dist,
            threadId: threadId,
            messageRef: msgId,
            html: `${ text }`,
            text: text,
        });
    }

    async sendActionMessage(dist, threadId, text, actions, threadTitle){
        const title = threadTitle || '';
        return this.msgSender.send({
            distribution: dist,
            threadId: threadId,
            html: `${ text }`,
            text: text,
            actions, 
            threadTitle: title
        });
    }
    
    forgetStaleNotificationThreads() {
        let tooOld = new Date();
        tooOld.setDate(tooOld.getDate() - 7);

        Object.keys(this.notificationThread).forEach(n => {
            if (this.notificationThread[n].flaggedEntry.received < tooOld) {
                delete this.notificationThread[n];
            }
        });
        console.log('stale notification threads removed. currently tracking:', Object.assign({}, this.notificationThread));
    }

    async incrementAuthFailCount() {
        let fails = await relay.storage.get('authentication', 'fails', {count: 0, since: new Date()});
        fails.count++;

        if (fails.count >= AUTH_FAIL_THRESHOLD) {
            await this.broadcastNotice({
                note: `SECURITY ALERT!\n\n${fails.count} failed login attempts (last successful login was ${moment(fails.since).fromNow()})`
            });
        }

        await relay.storage.set('authentication', 'fails', fails);
    }

    async resetAuthFailCount() {
        await relay.storage.set('authentication', 'fails', {count: 0, since: new Date()});
    }

    async getSoloAuthThreadId() {
        let id = await relay.storage.get('authentication', 'soloThreadId');
        if (!id) {
            id = uuid4();
            relay.storage.set('authentication', 'soloThreadId', id);
        }

        return id;
    }

    async getGroupAuthThreadId() {
        let id = await relay.storage.get('authentication', 'groupThreadId');
        if (!id) {
            id = uuid4();
            relay.storage.set('authentication', 'groupThreadId', id);
        }

        return id;
    }

    genAuthCode(expirationMinutes) {
        const code = `${words.adjective()} ${words.noun()}`;
        const expires = new Date();
        expires.setMinutes(expires.getMinutes() + expirationMinutes);
        return { code, expires };
    }

    removeExpiredAuthCodes(pending) {
        const now = new Date();

        Object.keys(pending).forEach(uid => {
            pending[uid].expires = new Date(pending[uid].expires);
            if (pending[uid].expires < now) {
                delete pending[uid];
            }
        });

        return pending;
    }

    async sendAuthCode(tag) {
        tag = (tag && tag[0] === '@') ? tag : '@' + tag;
        const resolved = await this.resolveTags(tag);
        if (resolved.userids.length === 1 && resolved.warnings.length === 0) {
            const uid = resolved.userids[0];
            const adminIds = await relay.storage.get('authentication', 'adminIds');
            if (!adminIds.includes(uid)) {
                throw { statusCode: 403, info: { tag: ['not an authorized user'] } }; 
            }

            const auth = this.genAuthCode(1);
            console.log(auth, resolved);
            this.msgSender.send({
                distribution: resolved,
                threadTitle: 'Message Bot Login',
                threadId: await this.getGroupAuthThreadId(),
                text: `codewords: ${auth.code}\n(valid for one minute)`
            });
            const pending = await relay.storage.get('authentication', 'pending', {});
            pending[uid] = auth;
            await relay.storage.set('authentication', 'pending', pending);
            
            return resolved.userids[0];
        } else {
            throw { statusCode: 400, info: { tag: ['not a recognized tag, please try again'] } }; 
        }
    }

    async validateAuthCode(userId, code) {
        console.log(userId, code);
        let pending = await relay.storage.get('authentication', 'pending', {});
        pending = this.removeExpiredAuthCodes(pending);
        const auth = pending[userId];
        if (!auth) {
            throw { statusCode: 403, info: { code: ['no authentication pending, please start over'] } }; 
        }
        if (auth.code != code) {
            this.incrementAuthFailCount();
            await relay.util.sleep(.5); // throttle guessers
            throw { statusCode: 403, info: { code: ['incorrect codewords, please try again'] } }; 
        }

        delete pending[userId];
        relay.storage.set('authentication', 'pending', pending);

        await this.broadcastNotice({note: 'LOGIN', actorUserId: userId, listAll: false});
        await this.resetAuthFailCount();
        return true;
    }

    async getAdministrators() {
        const adminIds = await relay.storage.get('authentication', 'adminIds', []);
        const adminUsers = await this.getUsers(adminIds);
        const admins = adminUsers.map(u => {
            return {
                id: u.id,
                label: this.fqLabel(u)
            };
        });
        return admins;
    }

    async broadcastNotice({note, actorUserId, listAll=true}) {
        const adminIds = await relay.storage.get('authentication', 'adminIds', []);
        let added = false;
        if (actorUserId && !adminIds.includes(actorUserId)) {
            adminIds.push(actorUserId);
            added = true;
        }
        const adminUsers = await this.getUsers(adminIds);
        const actor = adminUsers.find(u => u.id === actorUserId);
        const actorLabel = actor ? this.fqLabel(actor) : '<unknown>';
        const expression = adminUsers.map(u => this.fqTag(u)).join(' + ');
        const distribution = await this.resolveTags(expression);

        const adminList = adminUsers.filter(u => !(added && u.id === actorUserId)).map(u => this.fqLabel(u)).join('\n');

        let fullMessage = note;
        fullMessage += actorUserId ? `\n\nPerformed by ${actorLabel}` : '';
        fullMessage += listAll ? `\n\nCurrent authorized users:\n${adminList}` : '';
        fullMessage = fullMessage.replace(/<<([^>]*)>>/g, (_, id) => {
            const user = adminUsers.find(x => x.id === id);
            return this.fqLabel(user);
        });

        this.msgSender.send({
            distribution,
            threadTitle: 'Live Chat Alerts',
            threadId: await this.getSoloAuthThreadId(),
            text: fullMessage
        });
    }

    async addAdministrator({addTag, actorUserId}) {
        const tag = (addTag && addTag[0] === '@') ? addTag : '@' + addTag;
        const resolved = await this.resolveTags(tag);
        if (resolved.userids.length === 1 && resolved.warnings.length === 0) {
            const uid = resolved.userids[0];
            const adminIds = await relay.storage.get('authentication', 'adminIds');
            if (!adminIds.includes(uid)) {
                adminIds.push(uid);
                await relay.storage.set('authentication', 'adminIds', adminIds);
            }
            await this.broadcastNotice({note: `ADDED <<${uid}>> to authorized users`, actorUserId});
            return this.getAdministrators();
        }
        throw { statusCode: 400, info: { tag: ['not a recognized tag, please try again'] } }; 
    }

    async removeAdministrator({removeId, actorUserId}) {
        const adminIds = await relay.storage.get('authentication', 'adminIds', []);
        const idx = adminIds.indexOf(removeId);

        if (idx < 0) {
            throw { statusCode: 400, info: { id: ['administrator id not found'] } };
        }
        adminIds.splice(idx, 1);
        await this.broadcastNotice({note: `REMOVING <<${removeId}>> from authorized users`, actorUserId});
        await relay.storage.set('authentication', 'adminIds', adminIds);

        return this.getAdministrators();
    }
}

module.exports = ForstaBot;