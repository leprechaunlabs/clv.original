/**
 * (c) 2019 Cloverfield – Leprechaun Promotions
 * User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 *
 * Module Description
 *
 * Version      Date            Author            Remarks
 * 0.0.1        18 Dec 2019     mbrazil           Initial Testing Release
 *
 */

(function (EXT) {
    var _Fields = {
        clvfieldShippingAccountType: 'custbody_lpl_ship_acct',
        clvfieldShippingAccountNumber: 'custbody_clv_1575410656',
        clvfieldShippingMethod: 'shipmethod',
        clvfieldShippingCoordinator: 'custbody_clv_1576871914',
        clvfieldShippingSendDate: 'shipdate',
        clvfieldShippingReceiveDate: 'custbody_lp_shipping_arrival_date',
        clvfieldShippingCost: 'shippingcost'
    };

    var Observers = {
        shippingAccountType: function (sublist, id) {
            var envTypes = {
                sandbox: {
                    internal: [
                        {
                            types: [
                                'Prepay and Add',
                                'Invoice',
                                ''
                            ]
                        }
                    ],
                    external: [
                        {
                            label: 'Customer',
                            types: [
                                'Customer'
                            ]
                        },
                        {
                            label: 'Recipient',
                            types: [
                                'Recipient'
                            ]
                        }
                    ]
                },
                production: {
                    internal: [
                        {
                            types: [
                                'Prepay and Add',
                                'Invoice',
                                ''
                            ]
                        }
                    ],
                    external: [
                        {
                            label: 'Customer',
                            types: [
                                'Customer Account',
                                'Customer'
                            ]
                        },
                        {
                            label: 'Recipient',
                            types: [
                                'Recipient Account',
                                'Recipient'
                            ]
                        }
                    ]
                }
            };

            var isType = function (_value, _type) {
                var types = envTypes[nlapiGetContext().getEnvironment().toLowerCase()][_type];
                var label = false;

                types.forEach(function (account) {
                    if ('types' in account && account.types.includes(_value)) {
                        if ('label' in account) {
                            label = account.label;
                        } else {
                            label = '';
                        }
                    }
                });

                return label;
            };

            var value = nlapiGetFieldText(id);

            if ((label = isType(value, 'external')) !== false) {
                console.log('Show Shipping Account Number field.');
                console.log(label);
                nlapiSetFieldLabel(_Fields.clvfieldShippingAccountNumber, label + ' Shipping Account Number');
                Fields[_Fields.clvfieldShippingAccountNumber].field(_Fields.clvfieldShippingAccountNumber).setDisplayType('normal');
            } else if ((label = isType(value, 'internal')) !== false) {
                console.log('Hide Shipping Account Number field.');
                nlapiSetFieldLabel(_Fields.clvfieldShippingAccountNumber, (label + ' Shipping Account Number').trim());
                nlapiSetFieldValue(_Fields.clvfieldShippingAccountNumber, null, false);
                Fields[_Fields.clvfieldShippingAccountNumber].field(_Fields.clvfieldShippingAccountNumber).setDisplayType('hidden');
            }
        },
        shippingMethod: function (sublist, id) {
            LPCLV2.log('Check the Shipping Method to determine if we should show the Shipping Coordinator option');
            var shipMethod = nlapiGetFieldText(id).toUpperCase();

            Fields[_Fields.clvfieldShippingAccountType].field(_Fields.clvfieldShippingAccountType).setDisplayType('normal');

            if (shipMethod === 'COURIER' || shipMethod === 'LESS THAN LOAD (LTL)') {
                nlapiSetFieldText(_Fields.clvfieldShippingCoordinator, '');
                Fields[_Fields.clvfieldShippingCoordinator].field(_Fields.clvfieldShippingCoordinator).setDisplayType('normal');
            } else {
                Fields[_Fields.clvfieldShippingCoordinator].field(_Fields.clvfieldShippingCoordinator).setDisplayType('hidden');
                nlapiSetFieldText(_Fields.clvfieldShippingCoordinator, 'Leprechaun', false);
                LPCLV2.log('Current Shipping Coordinator is: ' + nlapiGetFieldText(_Fields.clvfieldShippingCoordinator));

                if (shipMethod === 'CPU') {
                    LPCLV2.log('Auto set and hide Shipping Account Type.');
                    LPCLV2.log('Modify Ship Date label to Pickup Date.');
                    nlapiSetFieldLabel(_Fields.clvfieldShippingReceiveDate, 'Pickup Date');
                    Fields[_Fields.clvfieldShippingAccountType].field(_Fields.clvfieldShippingAccountType).setDisplayType('hidden');
                    Fields[_Fields.clvfieldShippingCost].field(_Fields.clvfieldShippingCost).setDisplayType('hidden');
                }
            }

            if (flags.validateShippingAccountType) {
                flags.validateShippingAccountType = false;
            }

            nlapiSetFieldText(_Fields.clvfieldShippingAccountType, '');
        },
        shippingCoordinator: function (sublist, id) {
            LPCLV2.log('Check if the Shipping Coordinator is Customer and do some UI updates.');
            var coordinator = nlapiGetFieldText(id).toUpperCase();
            LPCLV2.log('The Current Coordinator is: ' + coordinator);
            if (coordinator === 'CUSTOMER') {
                nlapiSetFieldText(_Fields.clvfieldShippingAccountType, 'Customer', false);
            } else if (coordinator === 'LEPRECHAUN') {
                nlapiSetFieldText(_Fields.clvfieldShippingAccountType, 'Prepay and Add');
            }
        },
        shippingAccountNumber: function (sublist, id) {
            var account = nlapiGetFieldValue(id);
            LPCLV2.log(account);
            if (account !== '') {
                LPCLV2.log('Convert Shipping Account Number to all uppercase.');
                nlapiSetFieldValue(id, account.toUpperCase(), false);
            }
        }
    };

    var flags = {
        validateShippingAccountType: false,
        validateShippingAccountNumber: false
    };

    var Validate = {
        shippingAccountNumber: function (sublist, id) {
            var field = document.getElementById(id);
            var account = nlapiGetFieldValue(id);

            if (field.parentNode.style.display.toUpperCase() !== 'NONE' && nlapiGetFieldText(_Fields.clvfieldShippingAccountType).toUpperCase() !== 'PREPAY AND ADD' && account !== '') {
                if (!flags.validateShippingAccountNumber) {
                    flags.validateShippingAccountNumber = true;
                    nlapiSetFieldValue(id, account.toUpperCase(), false);
                } else {
                    var shipMethods = {
                        UPS: Validators.shippingAccountNumberUPS,
                        FEDEX: Validators.shippingAccountNumberFedEx
                    };

                    LPCLV2.log('Preparing to validate Shipping Account Number…');

                    var shipMethod = nlapiGetFieldText(_Fields.clvfieldShippingMethod).toUpperCase();
                    LPCLV2.log('Ship Method equals: ' + shipMethod);

                    var valid = true;

                    for (var method in shipMethods) {
                        if (shipMethods.hasOwnProperty(method) && shipMethod.includes(method) && !shipMethods[method](nlapiGetFieldValue(id))) {
                            console.log(method);
                            valid = false;
                            break;
                        }
                    }

                    flags.validateShippingAccountNumber = false;

                    if (valid === false) {
                        alert('You have entered an invalid Shipping Account Number for the selected Shipping Method. Please check the number and try again.');
                        var eventBlur = field.onblur;
                        field.onblur = function (e) {};

                        setTimeout(function() {
                            field.focus();
                            field.onblur = eventBlur;
                        },50);

                        return false;
                    }
                }
            }

            return true;
        },
        shippingAccountType: function (sublist, id) {
            var shipMethod = nlapiGetFieldText(_Fields.clvfieldShippingMethod).toUpperCase();
            var coordinator = nlapiGetFieldText(_Fields.clvfieldShippingCoordinator).toUpperCase();

            if ((shipMethod === 'COURIER' || shipMethod === 'LESS THAN LOAD (LTL)') && coordinator !== '' && !flags.validateShippingAccountType) {
                flags.validateShippingAccountType = true;
            } else if ((shipMethod === 'COURIER' || shipMethod === 'LESS THAN LOAD (LTL)') && coordinator !== '' && flags.validateShippingAccountType) {
                var coordinators = {
                    customer: {
                        account: 'Customer',
                        accounts: [
                            'Customer'
                        ]
                    },
                    leprechaun: {
                        account: 'Prepay and Add',
                        accounts: [
                            'Prepay and Add'
                        ]
                    }
                };

                LPCLV2.log('The Shipping Account Validator is firing.');
                console.log(coordinator);
                if ((coordinator.toLowerCase() in coordinators) && ('accounts' in coordinators[coordinator.toLowerCase()])) {
                    var accounts = coordinators[coordinator.toLowerCase()].accounts;
                    if (accounts.indexOf(nlapiGetFieldText(_Fields.clvfieldShippingAccountType)) === -1) {
                        alert('Shipping Account Type cannot be ' + (nlapiGetFieldText(id).toUpperCase() || 'EMPTY') + ' when Shipping Method is ' + shipMethod + ' and Shipping Coordinator is ' + coordinator);
                        nlapiSetFieldText(id, coordinators[coordinator.toLowerCase()].account, false);
                        return false;
                    }
                }
            }

            return true;
        }
    };

    // define the behaviors we want to attach to each field as an object
    // can explore a way to convert this into something like a state machine that can
    // invoke a behavior based on the current state of the field. Need to determine how
    // to attach metadata about a field from within NS-UI. Maybe a 'state' property on each
    // element of the final Fields object.
    var _behaviors = {
        clvfieldShippingAccountType: {
            react: Observers.shippingAccountType,
            validate: Validate.shippingAccountType
        },
        clvfieldShippingAccountNumber: {
            validate: Validate.shippingAccountNumber
        },
        clvfieldShippingCoordinator: {
            react: Observers.shippingCoordinator
        },
        clvfieldShippingMethod: {
            react: Observers.shippingMethod
        },
        clvfieldShippingCost: {},
        clvfieldShippingSendDate: {},
        clvfieldShippingReceiveDate: {}
    };

    // Initialize the Fields object by passing in some behaviors to attach
    var Fields = LPCLV2.lib.fn.Fields.init(_behaviors);

    var clvFields = LPCLV2.util.fn.Fields.init2({
        clvfieldShippingAccountType: {
            react: Observers.shippingAccountType,
            validate: Validate.shippingAccountType
        },
        clvfieldShippingAccountNumber: {
            validate: Validate.shippingAccountNumber
        },
        clvfieldShippingCoordinator: {
            react: Observers.shippingCoordinator
        },
        clvfieldShippingMethod: {
            react: Observers.shippingMethod
        },
        clvfieldShippingCost: {},
        clvfieldShippingSendDate: {},
        clvfieldShippingReceiveDate: {}
    });

    var Validators = {
        shippingAccountNumberFedEx: function (account) {
            LPCLV2.log('Validating FedEx Shipping Account Number…');
            var valid = true;

            if (account.length !== 9) {
                valid = false;
            }

            if (!LPCLV2.lib.functions.isNumeric(account)) {
                valid = false;
            }

            return valid;
        },
        shippingAccountNumberUPS: function (account) {
            LPCLV2.log('Validating UPS Shipping Account Number…');
            var valid = true;

            if (account.length !== 6) {
                valid = false;
            }

            if (LPCLV2.lib.functions.isAlphaNumeric(account) === null) {
                valid = false;
            }

            return valid;
        }
    };

    EXT.job.shipping.init = function () {
        LPCLV2.log('Job Shipping Observer Extension loaded.');
        clvFields.clvfieldShippingAccountNumber.hideField();
        clvFields.clvfieldShippingCoordinator.hideField();
        clvFields.clvfieldShippingCoordinator.setValue('Leprechaun', false);
    };

    EXT.job.shipping.uiObserver = function (sublist, field) {
        if ((field in Fields) && ('react' in Fields[field])) {
            Fields[field].react(sublist, field);
        }
    };

    EXT.job.shipping.react = function (list, id) {
        /*
        Need to determine if the Field can be Reacted on
        Rather than define the code in every Feature Module
        to determine if a React method exists on the passed Field,
        this can be contained in a library function
         */
        var alias = clvFields.getAliasByID(id);
        if (clvFields.canReact(alias)) {
            clvFields[alias].react(list, id);
        }
    };

    EXT.job.shipping.validator = function (sublist, field) {
        if ((field in Fields) && ('validate' in Fields[field])) {
            return Fields[field].validate(sublist, field);
        }
        return true;
    };

    EXT.job.shipping.validate = Validators;

    return EXT;
})(LPCLV2);