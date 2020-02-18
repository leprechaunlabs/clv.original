/**
 * items.update.productionDepartment.js
 * @description Set Production Department from value of Departments
 * @module clv/items/update/productionDepartment
 * @NApiVersion 2.0
 * @NScriptType MassUpdateScript
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 */

define(['N/record', 'N/https'], function (record, https) {
    function setProductionDepartment (params) {
        var response = https.get({
            url: 'https://api.runscope.com/radar/cad38ca4-1af2-4a1b-8131-dbed57e6fe1e/trigger?runscope_environment=db174fb2-fbfd-4972-9f9d-9c42dd5a75c3'
        });

        log.debug({
            title: 'Blazemeter Response',
            details: response
        });

        var item = record.load({
            id: params.id,
            type: params.type
        });

        https.post({
            url:'https://api.runscope.com/radar/inbound/68ee6308-0f26-410d-88d3-3966f7c344f1',
            body: item
        });
    }

    return {
        each: setProductionDepartment
    }
});