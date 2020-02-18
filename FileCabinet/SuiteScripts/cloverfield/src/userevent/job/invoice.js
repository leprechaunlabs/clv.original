/**
 * Generate Invoice for Jobs that have just been Fulfilled
 * @description Automated Job Invoicing after Item Fulfillment event
 * @module CLV/userevent/job/invoice
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NAmdConfig /SuiteScripts/cloverfield/config.json
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 */

/**
 * @typedef {Object} Context
 * @property {string} type
 * @property {Record} newRecord
 * @property {Record} oldRecord
 */

define(['N/record', 'N/https', 'N/runtime', 'N/search', 'N/email', 'N/render', 'CLV/services/runscope', 'CLV/helpers/email'],
    /**
     * @param {record} record
     * @param {https} https
     * @param {runtime} env
     * @param {search} search
     * @param {email} email
     * @param {render} render
     * @param {module:CLV/services/runscope} clvServiceRunscope
     * @param {module:CLV/helpers/email} clvEmail
     */
    function (record, https, env, search, email, render, clvServiceRunscope, clvEmail) {
        var data = {
            fields: {},
            records: {},
            config: {}
        };

        var runscope = {
            trigger: function () {
                https.post({
                    url: 'https://api.runscope.com/radar/83064709-3d04-4199-b665-c2f79aa798d1/trigger?runscope_environment=6c85bf74-27ab-4e4b-89a2-a76b7ffe7b31'
                });
            },
            submit: function (data) {
                https.post({
                    url: 'https://api.runscope.com/radar/inbound/c4b44064-93ea-4e4b-a64a-2fa268c65eb4',
                    body: JSON.stringify(data),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                });
            }
        };

        //rs = clvServiceRunscope.init({});

        //data.config.runscope = rs.trigger();

        /**
         * Generate and send Invoice
         * @param {Record} itemFulfillment
         * @return {boolean}
         * @private
         */
        function _generateInvoice (itemFulfillment) {
            // TODO: implement config validation

            var invoice = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: itemFulfillment.getValue({fieldId: 'createdfrom'}),
                toType: record.Type.INVOICE,
                isDynamic: true
            });

            invoice.setValue({fieldId: 'message', value: null});

            var invoiceID = invoice.save();
            invoice = record.load({
                type: record.Type.INVOICE,
                id: invoiceID
            });
            data.records.invoice = invoice;

            /** @todo research options for cleaning up files that have already been sent */
            var invoicePDF = render.transaction({
                entityId: parseInt(invoice.id),
                printMode: render.PrintMode.PDF,
                formId: parseInt(invoice.getValue({fieldId: 'customform'}))
            });

            var fileNameElements = invoicePDF.name.split('.');
            invoicePDF.name = fileNameElements[0] + '_' + new Date().getTime() + '.' + fileNameElements[1];

            data.records.invoicePDF = invoicePDF;

            data.fields.recipients = _getRecipients(invoice);

            /** @todo modify the body if the email is sending back to the lpflow address */
            email.send({
                author: _getSender(),
                recipients: _getRecipients(invoice),
                replyTo: 'billing@leprechaunpromotions.com',
                subject: 'Leprechaun Promotions LLC: Invoice #' + invoice.getValue({fieldId: 'tranid'}),
                body: 'Please open the attached file to view your Invoice. To view the attachment, you first need the free Adobe Acrobat Reader. If you don\'t have it yet, visit Adobe\'s Web site <a href="http://www.adobe.com/products/acrobat/readstep.html">http://www.adobe.com/products/acrobat/readstep.html</a> to download it.',
                attachments: [invoicePDF],
                relatedRecords: {
                    transactionId: parseInt(invoice.id),
                    entityId: parseInt(invoice.getValue({fieldId: 'entity'}))
                }
            });

            log.debug({
                title: 'Action',
                details: 'Generating Invoice'
            });

            return true;
        }

        function _getSender () {
           var sender = null;

           if (env.envType === env.EnvType.SANDBOX) {
               sender = 544
           } else if (env.envType === env.EnvType.PRODUCTION) {
               sender = 9539
           } else {
               sender = env.getCurrentUser().id;
           }

            return sender;
        }

        /**
         *
         * @param {Record} invoice
         * @return {*}
         * @private
         */
        function _getRecipients (invoice) {
            var recipient = null;

            var entityEmail = search.lookupFields({
                type: invoice.type,
                id: invoice.id,
                columns: ['customer.email', 'customer.altemail']
            });

            var jobEmail = invoice.getValue({fieldId: 'custbody_lp_email_approval'});
            var defaultEmail = 'lpflow@leprechaunpromotions.com';

            data.fields.recipients = {
                entity: entityEmail,
                job: jobEmail,
                default: defaultEmail
            };

            if (entityEmail['customer.email']) {
                recipient = parseInt(invoice.getValue({fieldId: 'entity'}));
            } else if (entityEmail['customer.altemail']) {
                recipient = entityEmail['customer.altemail'];
            } else if (jobEmail) {
                recipient = jobEmail;
            } else {
                recipient = defaultEmail;
            }

            return recipient;
        }

        /**
         * Verify if Item Fulfillment record was created from a Sales Order
         * @param {Record} itemFulfillment {@link module:N/record~Record}
         * @return {(boolean|string)} false if not created from Sales Order or ID of the Sales Order it's created from
         */
        function _isFromSalesOrder (itemFulfillment) {
            var id = false;
            var source = itemFulfillment.getValue({fieldId: 'createdfrom'});

            if (source) {
                var type = search.lookupFields({
                    type: search.Type.TRANSACTION,
                    id: source,
                    columns: ['recordtype']
                })['recordtype'];


                if (type === record.Type.SALES_ORDER) {
                    log.debug({
                        title: 'Event Note',
                        details: 'Item Fulfillment was processed from a Sales Order with ID #' + source
                    });

                    id = source;
                }
            }

            return id;
        }

        /**
         * Check if Item Fulfillment is in the Shipping stage
         * @param {Context} context
         * @return {boolean}
         * @private
         */
        function _isInShippingStage (context) {
            var state = {
                shipping: false
            };

            if (env.isFeatureInEffect({feature: 'PICKPACKSHIP'})) {
                state.currentStage = context.newRecord.getValue({fieldId: 'shipstatus'});
                state.previousStage = context.newRecord.getValue({fieldId: 'originalshipstatus'});
                state.shippingStage = context.newRecord.getValue({fieldId: 'defaultshipstage'});

                log.debug({
                    title: 'Fulfillment Method',
                    details: 'System is using the Pick, Pack & Ship fulfillment process.'
                });

                data.fields.state = state;

                if ((state.currentStage !== state.previousStage) && (state.currentStage === state.shippingStage)) {
                    state.shipping = true;
                }

            } else if (context.type === context.UserEventType.CREATE) {
                log.debug({
                    title: 'Fulfillment Method',
                    details: 'System is using the Standard Item Fulfillment process.'
                });

                state.shipping = true;
            }

            return state.shipping;
        }

        /**
         * Check if Job can be automatically invoiced
         * Criteria:    Job must have NET Terms (sourced from associated Customer/Entity
         *              Job Type must be Standard
         * Implements the Joined Field method for accessing the Sales Order fields. This contrasts from the method
         * used in the _isFromSalesOrder() function which loads the associated fields from the Sales Order record by
         * targeting the Sales Order via the createdFrom field on the Item Fulfillment record.
         * @param {Record} itemFulfillment
         * @private
         */
        function _isInvoiceable (itemFulfillment) {
            var status = false;
            var source = itemFulfillment.getValue({fieldId: 'createdfrom'});

            if (source) {
                var job = search.lookupFields({
                    type: itemFulfillment.type,
                    id: itemFulfillment.id,
                    columns: [
                        'appliedtotransaction.custbody_clv_202001080832',
                        'appliedtotransaction.terms',
                        'appliedtotransaction.otherrefnum'
                    ]
                });

                log.debug({
                    title: 'Applied to Transaction Inspection',
                    details: job
                });

                data.records.job = {
                    columns: job
                };

                if (_isJobTypeStandard(job['appliedtotransaction.custbody_clv_202001080832'], job['appliedtotransaction.otherrefnum']) && _isJobTermsNet(job['appliedtotransaction.terms'])) {
                    status = true;
                }
            }

            return status;
        }

        /**
         * Check if associated Job is Type:Standard
         * This method will temporarily check to ensure the Job is not a Reproduction Job by inspecting the Order Number
         * @param {Object} type
         * @param {string} type.text
         * @param {string} type.value
         * @param {string} orderNumber
         * @return {boolean}
         * @private
         * @todo refactor parameters for destructuring
         */
        function _isJobTypeStandard (type, orderNumber) {
            var status = false;

            log.debug({
                title: 'Job Type Inspection',
                details: type
            });

            log.debug({
                title: 'Order Number Inspection',
                details: orderNumber
            });

            if (!orderNumber.toUpperCase().includes('REDO')) {
                /** @todo remove assumption that type has returned an array */
                if (typeof type[0] !== 'undefined' && type[0].hasOwnProperty('text') && type[0].text && (type[0].text.toUpperCase() === 'STANDARD')) {
                    status = true;

                    log.debug({
                        title: 'Job Type Test',
                        details: 'Job Type IS Standard.'
                    });
                } else {
                    log.debug({
                        title: 'Job Type Test',
                        details: 'Job Type IS NOT Standard.'
                    });
                }
            } else {
                log.debug({
                    title: 'Temporary Reproduction Job Check',
                    details: 'Job\'s Order Number contains the REDO keyword. It is not eligible for automated invoicing.'
                });
            }

            return status;
        }

        /**
         * Check if associated Job is Terms:NET
         * @param {Object} terms
         * @param {string} terms.text
         * @param {string} terms.value
         * @return {boolean}
         * @private
         */
        function _isJobTermsNet (terms) {
            var status = false;

            log.debug({
                title: 'Job Terms Inspection',
                details: terms
            });

            if (terms[0].hasOwnProperty('text') && terms[0].text && terms[0].text.toUpperCase().includes('NET')) {
                status = true;

                log.debug({
                    title: 'Job Terms Test',
                    details: 'Job Terms ARE NET.'
                });
            } else {
                log.debug({
                    title: 'Job Terms Test',
                    details: 'Job Terms ARE NOT NET.'
                });
            }

            return status;
        }

        /**
         *
         * @param {Context} context
         */
        function invoice (context) {
            var itemFulfillment = context.newRecord;
            runscope.trigger();

            data.context = context;
            data.config.pickpackship = env.isFeatureInEffect({feature: 'PICKPACKSHIP'});

            if (_isInShippingStage(context)) {
                var source = _isFromSalesOrder(itemFulfillment);
                data.fields.source = source;

                if (source && _isInvoiceable(itemFulfillment)) {
                    log.debug({
                        title: 'Validation Event',
                        details: 'Record has passed all validation to proceed with Automated Invoicing.'
                    });

                    var status = _generateInvoice(itemFulfillment);
                } else {
                    log.debug({
                        title: 'Validation Event',
                        details: 'Record has failed one or more validations. Automated Invoicing will not proceed.'
                    });
                }

            } else {
                log.debug({
                    title: 'Shipping State',
                    details: 'This Job has not been Shipped yet. No Invoice will be generated.'
                })
            }

            runscope.submit(data);
        }

        if (!String.prototype.includes) {
            Object.defineProperty(String.prototype, 'includes', {
                value: function(search, start) {
                    if (typeof start !== 'number') {
                        start = 0
                    }

                    if (start + search.length > this.length) {
                        return false
                    } else {
                        return this.indexOf(search, start) !== -1
                    }
                }
            })
        }

        return {
            afterSubmit: invoice
        }
    }
);