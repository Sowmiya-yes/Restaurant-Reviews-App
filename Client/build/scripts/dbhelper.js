"use strict";function _classCallCheck(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")}function _defineProperties(e,n){for(var t=0;t<n.length;t++){var r=n[t];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}function _createClass(e,n,t){return n&&_defineProperties(e.prototype,n),t&&_defineProperties(e,t),e}var DBHelper=function(){function i(){_classCallCheck(this,i)}return _createClass(i,null,[{key:"openDb",value:function(){return navigator.serviceWorker?idb.open("rest-db",1,function(e){switch(e.oldVersion){case 0:e.createObjectStore("rest-review",{keyPath:"id"})}}):Promise.resolve()}},{key:"fetchRestaurants",value:function(n){fetch(i.DATABASE_URL).then(function(e){return e.json()}).then(function(t){i.openDb().then(function(e){if(e){var n=e.transaction("rest-review","readwrite").objectStore("rest-review");return t.forEach(function(e){n.put(e)}),t}}),n(null,t)}).catch(function(){i.openDb().then(function(e){if(e)return e.transaction("rest-review","readwrite").objectStore("rest-review").getAll()}).then(function(e){n(null,e)}).catch(function(e){var n="Request failed due to ".concat(e);console.log(n,null)})})}},{key:"fetchRestaurantById",value:function(r,u){i.fetchRestaurants(function(e,n){if(e)u(e,null);else{var t=n.find(function(e){return e.id==r});t?u(null,t):u("Restaurant does not exist",null)}})}},{key:"fetchRestaurantByCuisine",value:function(r,u){i.fetchRestaurants(function(e,n){if(e)u(e,null);else{var t=n.filter(function(e){return e.cuisine_type==r});u(null,t)}})}},{key:"fetchRestaurantByNeighborhood",value:function(r,u){i.fetchRestaurants(function(e,n){if(e)u(e,null);else{var t=n.filter(function(e){return e.neighborhood==r});u(null,t)}})}},{key:"fetchRestaurantByCuisineAndNeighborhood",value:function(r,u,a){i.fetchRestaurants(function(e,n){if(e)a(e,null);else{var t=n;"all"!=r&&(t=t.filter(function(e){return e.cuisine_type==r})),"all"!=u&&(t=t.filter(function(e){return e.neighborhood==u})),a(null,t)}})}},{key:"fetchNeighborhoods",value:function(u){i.fetchRestaurants(function(e,t){if(e)u(e,null);else{var r=t.map(function(e,n){return t[n].neighborhood}),n=r.filter(function(e,n){return r.indexOf(e)==n});u(null,n)}})}},{key:"fetchCuisines",value:function(u){i.fetchRestaurants(function(e,t){if(e)u(e,null);else{var r=t.map(function(e,n){return t[n].cuisine_type}),n=r.filter(function(e,n){return r.indexOf(e)==n});u(null,n)}})}},{key:"urlForRestaurant",value:function(e){return"./restaurant.html?id=".concat(e.id)}},{key:"imageUrlForRestaurant",value:function(e){return"/img/".concat(e.photograph,".jpg")}},{key:"mapMarkerForRestaurant",value:function(e,n){var t=new L.marker([e.latlng.lat,e.latlng.lng],{title:e.name,alt:e.name,url:i.urlForRestaurant(e)});return t.addTo(newMap),t}},{key:"DATABASE_URL",get:function(){return"http://localhost:".concat(1337,"/restaurants")}}]),i}();