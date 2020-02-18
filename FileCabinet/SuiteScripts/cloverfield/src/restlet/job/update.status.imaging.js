/**
 * update.status.imaging.js
 * @description Update Imaging Status from LP Flow Proof upload event
 * @module CLV/restlet/job/update/status/imaging
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NAmdConfig /SuiteScripts/cloverfield/config.json
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 */

define(['N/record', 'N/search', 'N/https', 'CLV/data/states'],
    /**
     * @param {record} record
     * @param {search} search
     * @param {https} https
     * @param {module:CLV/data/states} clvStates
     * */
    function (record, search, https, clvStates) {
        var inspect = {
            records: {}
        };

        var runscope = {
            trigger: function () {
                https.post({
                    url: 'https://api.runscope.com/radar/249a8d1d-bc7f-4f34-84fd-5de9ebf48534/trigger?runscope_environment=4e2488a2-79b2-4fd9-a18f-eeb4a271f361'
                });
            },
            submit: function (data) {
                https.post({
                    url: 'https://api.runscope.com/radar/inbound/a6ccbb56-9ee4-4ae0-b211-6fcb0e4363d5',
                    body: JSON.stringify(data),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                });
            }
        };

        function isApprovable (job) {
            return search.lookupFields({
                type: job.type,
                id: job.id,
                columns: ['customer.custentity_lp_approval_requirement']
            })['customer.custentity_lp_approval_requirement'] === true;
        }

        function updateStatus (lpJob) {
            runscope.trigger();

            var job = null;
            var states = {
                imaging: clvStates.getImaging(),
                approval: clvStates.getApproval(),
                payment: clvStates.getPayment()
            };


            log.debug({
                title: 'Inspect LP Flow Data',
                details: lpJob
            });

            log.debug({
                title: 'Inspect States Instance',
                details: states.imaging
            });

            log.debug({
                title: 'Specific State Test',
                details: states.imaging.getState('COMPLETED')
            });

            /** verifies the lpJob is an Object */
            if (typeof lpJob == 'object' && !Array.isArray(lpJob) && lpJob.hasOwnProperty('id')) {
                try {
                    job = record.load({
                        type: record.Type.SALES_ORDER,
                        id: lpJob.id
                    });
                } catch (e) {
                    /** @todo implement Exception */
                    log.debug({
                        title: 'Locate Job Status',
                        details: 'Job not found.'
                    });
                }
            }

            if (job) {
                job.setValue({
                    fieldId: 'custbody_lp_status_artwork_setup',
                    value: states.imaging.getState('COMPLETED')
                });

                log.debug({
                    title: 'Approvable Status',
                    details: isApprovable(job)
                });

                job.setValue({
                    fieldId: 'custbody_lp_status_approval_request',
                    value: isApprovable(job) ? states.approval.getState('PENDING_RESPONSE') : states.approval.getState('APPROVED')
                });

                if (parseInt(job.getValue({fieldId: 'custbody_lp_status_payment'})) === states.payment.getState('PENDING_REQUEST')) {
                    job.setValue({
                        fieldId: 'custbody_lp_status_payment',
                        value: states.payment.getState('PENDING_RESPONSE')
                    });
                }

                if (lpJob.hasOwnProperty('urls')) {
                    if (lpJob.urls.hasOwnProperty('approval')) {
                        job.setValue({
                            fieldId: 'custbody_lp_approval_request',
                            value: lpJob.urls.approval
                        });
                    } else {
                        /**
                         * @todo implement error handling
                         * Job Review URL not defined
                         */
                    }

                    if (lpJob.urls.hasOwnProperty('proof')) {
                        /* @todo implement creation of new Job Document record */

                        var proof = record.create({
                            type: 'customrecord_lp_job_documents'
                        });

                        proof.setValue({
                            fieldId: 'custrecord_lp_job_document_job',
                            value: [job.id]
                        });

                        proof.setValue({
                            fieldId: 'custrecord_lp_job_document_type',
                            value: 3 /* @todo implement a Types system (similar to the States system) for retrieving these values */
                        });

                        proof.setValue({
                            fieldId: 'custrecord_lp_job_document_resource_lpf',
                            value: lpJob.urls.proof
                        });

                        inspect.records.proof = proof;
                        proof.save();

                    } else {
                        /**
                         * @todo implement error handling
                         * Job Document:Proof URL not defined
                         */
                    }
                } else {
                    /**
                     * @todo implement error handling
                     * No URLs defined
                     */
                }

                inspect.records.job = job;
                runscope.submit(inspect);
                job.save();
            }
        }

    return {
        post: updateStatus
    }
});