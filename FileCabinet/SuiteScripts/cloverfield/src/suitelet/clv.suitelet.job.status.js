/**
 * job.ext.getStatus.js
 * @description Get External Job Status
 * @module clv/job/getStatus
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 */

define(['N/https'], function (https) {

    function inspect(context) {
        context.response.setHeader({
            name: 'Content-Type',
            value: 'application/json; charset=utf-8'
        });
        context.response.write(JSON.stringify({
            context: context,
            jobNumber: context.request.parameters.clvRefNum
        }));
    }

    return {
        onRequest: inspect
    }
});