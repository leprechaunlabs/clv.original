/**
 * messages.update.inspect.js
 * @description Inspect Messages Form
 * @module clv/messages/inspect
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 */

define(['N/record', 'N/https', 'N/ui/serverWidget', 'N/runtime', 'N/search'], function (record, https, control, env, search) {
    var runscope = {
        trigger: function () {
            https.post({
                url: 'https://api.runscope.com/radar/0d492dad-a590-4b21-b022-cf7589e4df61/trigger?runscope_environment=f9625c27-4508-44bd-8dd7-93b300dec226'
            });
        },
        submit: function (data) {
            https.post({
                url: 'https://api.runscope.com/radar/inbound/820ba53c-12ae-440b-8209-a04adae5ec44',
                body: JSON.stringify(data),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                }
            });
        }
    };

    function init (context) {
        var inspect = {};
        inspect.fields = [];
        var user = env.getCurrentUser();
        runscope.trigger();

        inspect.context = context;

        var form = context.form;
        var message = context.newRecord;

        var fieldSender = form.addField({
            id: 'custpage_clv_202001301520',
            label: 'Sender',
            type: control.FieldType.SELECT,
            container: 'messages'
        });

        fieldSender.addSelectOption({
            value: user.id,
            text: user.name
        });

        var fieldActor = form.addField({
            id: 'custpage_clv_202001310931',
            label: 'Actor',
            type: control.FieldType.TEXT
        });

        fieldActor.defaultValue = user.id.toString();

        fieldActor.updateDisplayType({
           displayType: control.FieldDisplayType.HIDDEN
        });

        var fieldSubmit = form.addSubmitButton({
            label: 'Send'
        });

        inspect.daemons = [];
        search.load({
            id: 'customsearch_clv_202001301455'
        }).run().each(function (daemon) {
            inspect.daemons.push(daemon);

            fieldSender.addSelectOption({
                value: daemon.id,
                text: daemon.getValue('entityid')
            });

            return true;
        });

        form.insertField({
            field: fieldSender,
            nextfield: 'templatecategory'
        });

        runscope.submit(inspect);
    }

    function inspectSubmission (context) {
        var inspect = {};
        runscope.trigger();

        inspect.context = context;

        runscope.submit(inspect);
    }

    function send (context) {
        var inspect = {};
        runscope.trigger();

        var message = context.newRecord;
        var sender = message.getValue('custpage_clv_202001301520');
        //message.setValue('author', null);

        inspect.context = context;

        runscope.submit(inspect);
    }

    function inspectAfterSubmit (context) {
        var inspect = {};
        runscope.trigger();

        inspect.context = context;

        runscope.submit(inspect);
    }

    return {
        beforeLoad: init,
        beforeSubmit: send,
        afterSubmit: inspectSubmission
    }
});