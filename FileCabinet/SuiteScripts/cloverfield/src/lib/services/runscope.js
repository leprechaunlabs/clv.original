/**
 * runscope.js
 * @description Service class for connecting to Runscope
 * @NApiVersion 2.0
 * @author Miquel Brazil <miquel@leprechaunpromotions.com>
 * @module CLV/services/runscope
 */

define(['N/https'],
    /**
     *
     * @param {https} client
     * @return {{init: init}}
     */
    function (client) {
        function Runscope(config) {
            this.debug = true;
            this.urls = {
                inspect: config.inspect,
                trigger: 'trigger' in config ? config.trigger : null
            };
        }

        Runscope.prototype.trigger = function () {
            if (this.urls.trigger) {
                return client.post({
                    url: this.urls.trigger
                });
            } else {
                return null;
            }
        };

        Runscope.prototype.inspect = function (data) {
            return client.post({
                url: this.urls.inspect,
                body: JSON.stringify(data),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json; charset=utf-8'
                }
            });
        };

        function init (config) {
            if ('inspect' in config) {
                return new Runscope(config);
            } else {
                return null;
            }
        }

        return {
            init: init
        }
    }
);