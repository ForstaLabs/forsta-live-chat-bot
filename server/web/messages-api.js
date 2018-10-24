
'use strict';

const APIHandler = require('./api').APIHandler;

class MessagesAPIv1 extends APIHandler {

    constructor(options) {
        super(options);
        this.router.get('/history/v1', this.asyncRoute(this.onGetMessages, true));
        this.router.get('/attachment/:id/v1', this.asyncRoute(this.onGetAttachment, true));
    }

    async fetchAttachments(record) {
        const attachmentIds = record.attachmentIds;

        let results = attachmentIds.map(async id => {
            return {
                id,
                attachment: await this.server.bot.pgStore.getAttachment(id)
            };
        });
        const retval = await Promise.all(results);

        return retval;
    }

    async onGetMessages(req, res, next) {
        const rows = await this.server.bot.pgStore.getMessages(req.query);
        res.status(200).json({messages: rows});
    }

    async onGetAttachment(req, res, next) {
        const { id } = req.params;
        const attachment = await this.server.bot.pgStore.getAttachment(id);

        res.attachment(attachment.name);
        res.type(attachment.type);
        res.status(200).send(attachment.data);
        res.end();
    }

}


module.exports = {
    MessagesAPIv1
};
