/**
 * messaging.automation.js
 * @description Automated Messaging Testing
 * @module clv/automation/messaging
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 */

define(['N/record', 'N/https'], function (record, https) {
    var ts = Date.now();

    function inspect(context) {
        var inspect = {};
        inspect.context = context;
        inspect.message = {};

        var message = record.create({
            type: record.Type.MESSAGE
        });

        message.setValue({fieldId: 'entity', value: '320'});
        message.setValue({fieldId: 'recipient', value: '320'});
        message.setValue({fieldId: 'recipientemail', value: 'miquel@brazilliance.co'});
        message.setValue({fieldId: 'author', value: '544'});
        message.setValue({fieldId: 'subject', value: 'Test Email ' + ts});
        message.setValue({fieldId: 'incoming', value: 'F'});
        message.setValue({fieldId: 'message', value: 'This is a test email with ID ' + ts + ' to verify that emails are not transmitted for newly generated Message records.'});

        inspect.message.created = message;

        message.save();

        inspect.message.saved = message;

        log.debug({
            title: 'Message Generation Inspection',
            details: JSON.stringify(inspect)
        });

        context.response.setHeader({
            name: 'Content-Type',
            value: 'application/json; charset=utf-8'
        });

        context.response.write({
            output: JSON.stringify(inspect)
        });
    }

    return {
        onRequest: inspect
    }
});