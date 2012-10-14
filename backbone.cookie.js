/**
Copyright 2012 Stephen Liberty<stephen@liberty-irm.com> and other contributors

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

define(['backbone', 'underscore'], function (Backbone, _) {
    var CookieModel = Backbone.Model.extend({
        idAttribute: 'name',
        
        defaults: {
            days: 0
        },
        
        destroy: function () {
            this.set({
                value: "",
                days: -1
            }).save();
        },
        
        validate: function (attrs) {
            if(!attrs.name) {
                return "Cookie needs name";
            }
        },
        
        get: function (name) {
            if(name == 'value') {
                var value = this.attributes[name];
                if(value[0] == '"') {
                    value = value.slice(1, value.length - 1);
                }
                return decodeURIComponent(value);
            } else {
                return this.attributes[name];
            }
        },
        
        save: function () {
            var pieces = [];
            var value = this.get('value');
            if(value.match(/[^\w\d]/)) {
                value = '"'.concat(encodeURIComponent(value), '"');
            }
            pieces.push(this.get('name').concat("=", value));
            if (this.get('days')) {
                var date = new Date();
                date.setTime(date.getTime()+(this.get('days')*24*60*60*1000));
                pieces.push("expires".concat('=',date.toGMTString()));
            }
            if (this.get('path')) {
                pieces.push("path".concat('=', this.get('path')));
            }
            if (this.get('domain')) {
                pieces.push("domain".concat('=', this.get('domain')));
            }
            if (this.get('secure')) {
                pieces.push("secure");
            }
            document.cookie = pieces.join('; ');
        }
    });
    
    return new (Backbone.Collection.extend({
        model: CookieModel,
        initialize: function () {
            this._readCookies();
            this.on('add', function (model) {
                model.save();
            });
        },
        
        remove: function (models) {
            Backbone.Collection.prototype.remove.apply(this, arguments);
            models = _.isArray(models) ? models.slice() : [models];
            var i, l;
            for (i = 0, l = models.length; i < l; i++) {
                models[i].destroy();
            }
        },
        
        _readCookies: function () {
            var cookies = document.cookie.split('; ');
            var cookieObjects = {};
            for (var i = 0, l = cookies.length; i < l; i++) {
                if(cookies[i].match(/^\n+$/)) {
                    continue;
                }
                var cookie = cookies[i].split(/^([^=]+)=(.*$)/);
                cookie = [
                    cookie[1],
                    cookie[2]
                ];
                if(!cookie[1]) {
                    continue;
                }
                cookieObjects[cookie[0]] = {name: cookie[0], value: decodeURIComponent(cookie[1])};
            }
            this.each(function (existingModel) {
                if(!cookieObjects[existingModel].id) {
                    existingModel.destroy();
                }
            })
            _.each(cookieObjects, function (potentialModel) {
                if(this.get(potentialModel.name)) {
                    this.get(potentialModel.name).set(potentialModel);
                } else {
                    this.add(potentialModel);
                }
            }, this);
        },
        
        fetch: function () {
            this._readCookies();
        }
    }));
})
