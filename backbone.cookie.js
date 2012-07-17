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
        
        save: function () {
            var pieces = [];
            pieces.push(this.get('name').concat("=", encodeURIComponent(this.get('value'))));
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
});