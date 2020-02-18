/**
 * Update Job Type and Custom Form fields for Reproduction Jobs in preparation for Automated Invoicing Feature
 * @description Initial Mass Update Job Type and Custom Form for Reproduction Jobs
 * @module clv/jobs/update/type
 * @NApiVersion 2.0
 * @NScriptType MassUpdateScript
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 */

define(['N/record', 'N/https'], function (record, https) {
    function map(params) {
        https.post({
            url: 'https://api.runscope.com/radar/8e473d2f-726a-48bf-b226-f6b898cd9c84/trigger?runscope_environment=44619b5b-cb61-41f1-a9b9-0eb2fd0dfa54'
        });

        var job = record.load({
            id: params.id,
            type: params.type
        });

        https.post({
            url: 'https://api.runscope.com/radar/inbound/36439c6c-5478-4fb7-be92-2655e3bba34b'
        });
    }

    return {
        each: map
    }
});