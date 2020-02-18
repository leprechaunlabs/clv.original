/**
 * upload.js
 * @description Upload Job Document to NetSuite
 * @module CLV/userevent/document/upload
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NAmdConfig /SuiteScripts/cloverfield/config.json
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 */

define(['CLV/services/runscope'],
    function (runscope) {
        function inspect (context) {
            var rs = runscope.init({
                trigger: 'https://api.runscope.com/radar/b7c869d4-45bc-4f9c-b92d-0bb4d9e7380b/trigger',
                inspect: 'https://api.runscope.com/radar/inbound/3204304f-4c40-4e03-a6ad-11f0e60a0dfb'
            });

            rs.trigger();
            rs.inspect(context);
        }

        return {
            beforeLoad: inspect
        }
    }
);