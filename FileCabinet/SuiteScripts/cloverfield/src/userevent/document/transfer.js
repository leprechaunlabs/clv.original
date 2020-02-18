/**
 * transfer.js
 * @description Transfer Job Document to LP Flow
 * @module CLV/userevent/document/transfer
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NAmdConfig /SuiteScripts/cloverfield/config.json
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 */

define(['CLV/services/runscope', 'CLV/helpers/filesystem'],
    function (runscope, fs) {
        function inspect (context) {
            var data = {
                fields: {},
                records: {},
                config: {}
            };
            var rs = runscope.init({
                trigger: 'https://api.runscope.com/radar/b7c869d4-45bc-4f9c-b92d-0bb4d9e7380b/trigger',
                inspect: 'https://api.runscope.com/radar/inbound/3204304f-4c40-4e03-a6ad-11f0e60a0dfb'
            });

            rs.trigger();

            data.config.context = context;
            fs.getJobFolder(context.newRecord);
            rs.inspect(data);
        }

        return {
            beforeSubmit: inspect
        }
    }
);