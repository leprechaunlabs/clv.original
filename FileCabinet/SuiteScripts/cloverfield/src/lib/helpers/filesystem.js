/**
 * filesystem.js
 * @description Cloverfield Filesystem Utilities
 * @module CLV/helpers/filesystem
 * @NApiVersion 2.x
 * @NAmdConfig /SuiteScripts/cloverfield/config.json
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 */

define(['CLV/services/runscope', 'N/record', 'N/search'],
    /**
     * @param runscope
     * @param {record} record
     * @param {search} search
     * @return {{getJobFolder: getJobFolder}}
     */
    function (runscope, record, search) {
        var trigger = 'https://api.runscope.com/radar/b7c869d4-45bc-4f9c-b92d-0bb4d9e7380b/trigger';
        var inspect = 'https://api.runscope.com/radar/inbound/3204304f-4c40-4e03-a6ad-11f0e60a0dfb';
        var data = {
            fields: {},
            records: {},
            config: {},
            errors: {}
        };

        function _getJobDocumentsFolder () {
            var folder = null;

            try {
                folder = search.create({
                    type: 'folder',
                    filters: [
                        search.createFilter({
                            name: 'name',
                            operator: search.Operator.IS,
                            values: 'Job Documents'
                        }),
                        search.createFilter({
                            name: 'istoplevel',
                            operator: search.Operator.IS,
                            values: 'T'
                        })
                    ],
                    columns: [
                        search.createColumn({
                            name: 'internalid'
                        })
                    ]
                }).run().getRange({start: 0, end: 1})[0].getValue({name: 'internalid'});

                data.config.jobDocumentsFolder = folder;
            } catch (e) {
                /** @todo implement error handling */
                data.errors.jobDocumentsFolder = e;
            }

            return folder;
        }

        function _getJobFolder (document) {
            var folder = null;

            try {
                var refNumber = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: parseInt(document.getValue({fieldId: 'custrecord_lp_job_document_job'})[0]),
                    columns: ['tranid']
                })['tranid'];

                data.fields.refNumber = refNumber;

                var root = _getJobDocumentsFolder();

                try {
                    folder = search.create({
                        type: 'folder',
                        filters: [
                            search.createFilter({
                                name: 'name',
                                operator: search.Operator.IS,
                                values: refNumber
                            }),
                            search.createFilter({
                                name: 'parent',
                                operator: search.Operator.IS,
                                values: root
                            })
                        ],
                        columns: [
                            search.createColumn({
                                name: 'internalid'
                            })
                        ]
                    }).run().getRange({start: 0, end: 1});

                    data.config.jobFolder = folder;

                    if (typeof folder[0] !== 'undefined') {
                        // return Folder ID
                        folder = folder[0].id;
                        data.records.jobFolder_exists = folder;
                    } else {
                        folder = createJobFolder({refNumber: refNumber, root: root});
                        data.records.jobFolder_new = folder;
                    }

                } catch (e) {
                    /** @todo implement error handling */
                    data.errors.jobFolder = e;
                }
            } catch (e) {
                /** @todo implement error handling */
                data.errors.refNum = e;
            }

            return folder;
        }

        function createJobFolder (config) {
            /** @todo implement sanity checks for config object */
            var folder = record.create({type: 'folder'});
            folder.setValue({fieldId: 'name', value: config.refNumber});
            folder.setValue({fieldId: 'parent', value: config.root});

            return folder.save();
        }

        function getJobFolder (document) {
            var rs = runscope.init({
                trigger: trigger,
                inspect: inspect
            });

            rs.trigger();

            var folder = _getJobFolder(document);
            rs.inspect(data);
        }

        return {
            getJobFolder: getJobFolder
        }
    }
);