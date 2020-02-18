/**
 * states.js
 * @description Data map for defining various system/events states
 * @NApiVersion 2.0
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 * @module CLV/data/states
 * @todo build a variable builder that writes a json file this can get options from depending on the environment
 * @todo add lodash library for low-level utility functions
 */

define(['N/runtime'],
    /**
     *
     * @param {runtime} env
     * @return {{getImaging: (states.Imaging|(function(): {error})), get: (function(*=))}}
     */
    function (env) {
        function States (options) {
            /** validate that options is an Object and contains a STATES property which is an Array and it isn't empty) */
            if (
                typeof options === 'object'
                && !Array.isArray(options)
                && (options.hasOwnProperty('STATES') && Array.isArray(options.STATES) && options.STATES.length)
                && (options.hasOwnProperty('RUNTIMES') && typeof options.RUNTIMES === 'object' && !Array.isArray(options.RUNTIMES))
            ){
                this.RUNTIMES = {};

                log.debug({
                    title: 'Inspect States',
                    details: options.STATES
                });

                log.debug({
                    title: 'Inspect Runtime State Values',
                    details: options.RUNTIMES
                });

                /**
                 * loops through the options.RUNTIMES Object and collects all the declared Runtimes
                 * @private
                 * */
                function _getRuntimes () {
                    var runtimes = [];
                    for (var runtime in options.RUNTIMES) {
                        if (options.RUNTIMES.hasOwnProperty(runtime)) {
                            log.debug({
                                title: 'Runtime',
                                details: runtime
                            });
                            runtimes.push(runtime);
                        }
                    }
                    log.debug({
                        title: 'Runtimes Array',
                        details: runtimes
                    });

                    return runtimes;
                }

                var runtimes = _getRuntimes();

                log.debug({
                    title: 'Inspect Runtimes',
                    details: runtimes
                });

                /** Verify that the COMMON Runtime is present and has the same number of Values as State Options or that
                 * all the Values for each Runtime is equal to the total number of State Options
                 */
                log.debug({
                    title: 'Index of COMMON Runtime',
                    details: runtimes.indexOf('COMMON')
                });

                if (
                    (runtimes.indexOf('COMMON') !== -1 && options.RUNTIMES.COMMON.length === options.STATES.length)
                    || (runtimes.every(function (runtime) { return options.RUNTIMES[runtime].length === options.STATES.length; }))
                ){
                    /**
                     * If the Runtimes array contains the COMMON Runtime, then the Values for the State are
                     * Common between all Runtimes — only need to construct one set of Values. Otherwise, loop each Runtime
                     * and set State Values per Runtime.
                     */
                    if (runtimes.indexOf('COMMON') !== -1) {
                        this.RUNTIMES.COMMON = {};
                        for (var s = 0; s < options.STATES.length; s++) {
                            this.RUNTIMES.COMMON[options.STATES[s].toString().toUpperCase()] = options.RUNTIMES.COMMON[s];
                        }
                    } else {
                        for (var i in runtimes) {
                            log.debug({
                                title: "Non Common Runtime",
                                details: i
                            });
                            if (options.RUNTIMES.hasOwnProperty(runtimes[i])) {
                                this.RUNTIMES[runtimes[i]] = {};
                                for (var s = 0; s < options.STATES.length; s++) {
                                    this.RUNTIMES[runtimes[i]][options.STATES[s].toString().toUpperCase()] = options.RUNTIMES[runtimes[i]][s];
                                }
                            }
                        }
                    }
                } else {
                    /** @todo implement error handling */
                    return {error: 'Total Runtime State Values and States do not match.'};
                }
            } else {
                /** @todo implement error handling */
                return {error: 'Invalid options Object'};
            }

            return this;
        }

        States.prototype.getState = function (state) {
            var value = null;

            if (this.hasOwnProperty('RUNTIMES')) {
                var runtimes = Object.getOwnPropertyNames(this.RUNTIMES);

                log.debug({
                    title: 'Requested State',
                    details: state
                });

                log.debug({
                    title: 'Reference Inspection',
                    details: this
                });

                function isRuntimeDefined (runtime) {
                    return runtimes.indexOf(runtime) !== -1;
                }

                /** @todo abstract State lookup into separate function */
                if (isRuntimeDefined('COMMON')) {
                    if (this.RUNTIMES.COMMON.hasOwnProperty(state)) {
                        value = this.RUNTIMES.COMMON[state];
                    }
                } else if (isRuntimeDefined(env.envType)) {
                    if (this.RUNTIMES[env.envType].hasOwnProperty(state)) {
                        value = this.RUNTIMES[env.envType][state];
                    }
                } else {
                    /**
                     * @todo implement error handling
                     * Runtime not found
                     */
                    value = {error:'Runtime is not defined.'};
                }

                if (value === null) {
                    /**
                     * @todo implement error handling
                     * Runtime not found
                     */
                    value = {error:'State is not defined.'};
                }
            } else {
                /**
                 * @todo implement error handling
                 * Runtime Object does not exist
                 */
                value = {error:'Runtime Object does not exist.'};
            }

            return value;
        };

        /**
         * @todo implement title casing for passed State Type before appending to function callable check
         * @param type
         */
        function initStates (type) {
            var s = {};

            if (type && typeof states['initStates' + type] === 'function') {
                s = states['initStates' + type]();
            } else {
                /** @todo implement error handling */
            }

            return s;
        }

        var states = {
            Imaging: function () {
                /**
                 * The List ID that defines these States in NetSuite
                 * Intended to be used in the future to auto-generate the value lists
                 * @private
                 * */
                var list = 'customlist_lp_artwork_setup_status';

                var options = {
                    STATES: [
                        'COMPLETED',
                        'PROCESSING',
                        'REVISING',
                        'ISSUE',
                        'TRANSFERRED',
                        'PENDING_TRANSFER'
                    ],
                    RUNTIMES: {
                        COMMON: [1,2,3,4,5,6],
                        TESTING: [10,11,12,13,14,15],
                        SANDBOX: [101,102,103,104,105,106]
                    }
                };

                return new States(options);
            },
            Approval: function () {
                var list = 'customlist_lp_approval_request_status';

                var options = {
                    STATES: [
                        'APPROVED',
                        'REVISION_REQUESTED',
                        'PENDING_REQUEST',
                        'PENDING_RESPONSE'
                    ],
                    RUNTIMES: {
                        COMMON: [1,2,3,4]
                    }
                };

                return new States(options);
            },
            Payment: function () {
                var list = 'customlist_lp_payment_status';

                var options = {
                    STATES: [
                        'NET',
                        'FILE',
                        'RECEIVED',
                        'PENDING_REQUEST',
                        'PENDING_RESPONSE'
                    ],
                    RUNTIMES: {
                        COMMON: [1,2,3,4,5]
                    }
                };

                return new States(options);
            }
        };

    return {
        get: initStates,
        getImaging: states.Imaging,
        getApproval: states.Approval,
        getPayment: states.Payment
    }
});