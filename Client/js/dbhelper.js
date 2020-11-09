
/**
*Online event handler
*/
window.addEventListener('online', () => {
      DBHelper.openDb().then(db => {
        db.transaction('offline-reviews', 'readonly')
          .objectStore('offline-reviews')
          .count()
          .then(count => {
            if (count > 0) DBHelper.sendOfflineReviewsToServer();
          })
      })
});

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL..
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get DATABASE_URL_REVIEWS(){
    const port = 1337;
    return `http://localhost:${port}/reviews`;
  }

  /**
   * open IDB
   */
  static openDb() {
    if(!navigator.serviceWorker){
      return Promise.resolve();
    }
    return idb.open('rest-db', 1, (upgradeDb) => {
          upgradeDb.createObjectStore('rest-review', {
            keyPath: 'id'
          });
          upgradeDb.createObjectStore('reviews');
          upgradeDb.createObjectStore('offline-reviews', {
            keyPath:'id',
            autoIncrement: true
          });     
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
      fetch(DBHelper.DATABASE_URL)
      .then( response => response.json())
      .then(function(restaurants){
          DBHelper.openDb().then((db) => {
            if(!db) return;
            let trans = db.transaction('rest-review', 'readwrite');
            let store = trans.objectStore('rest-review');
            restaurants.forEach((restaurant) => {
              store.put(restaurant);
            }); 
            return restaurants;
          });
          callback(null, restaurants); 
      })
      .catch(() => {
          DBHelper.openDb().then((db) => {
            if(!db) return;
            let trans = db.transaction('rest-review', 'readwrite');
            let store = trans.objectStore('rest-review');
            return store.getAll();
            }).then((restaurants) =>{
              callback(null, restaurants);
            }).catch((e) => {
              let error =`Request failed due to ${e}`;
              console.log(error, null);
            })
      });
  }

  /**
  *
  */
  static fetchReviewsById(resId) {
    const url = `http://localhost:1337/reviews/?restaurant_id=${resId}`;
    const dbPromise = DBHelper.openDb();
      return fetch(url)
        .then(response => response.json())
        .then(reviews => {
          DBHelper.updateReviewsInDb(dbPromise, resId, reviews);
          return reviews;
        }).catch(() => {
          return DBHelper.getReviewsFromDb(dbPromise, restaurantId)
            .then(reviews => {
                return reviews;
            });
        });
  } 

  
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }
  
  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
  *updating the favorite click to the server
  */
  static updateFavorite(id, state) {
   DBHelper.openDb().then((db) => {
            if(!db) return;
            let trans = db.transaction('rest-review', 'readwrite');
            let store = trans.objectStore('rest-review');
            return store.get(id);
            }).then((restaurants) =>{
            if (!restaurants) {
              return;
            }
            restaurants.is_favorite = state;
            DBHelper.openDb().then((db) => {
              if(!db) return;
              let trans = db.transaction('rest-review', 'readwrite');
              let store = trans.objectStore('rest-review');
              store.put(restaurants);
            }).then(() => {
             // console.log('Favorite updated in the IDB');
          })
      })
      fetch(DBHelper.DATABASE_URL+`/${id}/?is_favorite=${state}`, {
        method: 'put'
        }).then((status) => {
         // console.log("sending favorite to server is successful");
        }).catch((error) => {
          //console.log("sending favorite to server is unsuccessful");
      })
  }

  static getReviewsFromDb(dbPromise, resId) {
    return dbPromise.then((db) => {
      if (!db) return;
      let tx = db.transaction('reviews');
      let reviewsStore = tx.objectStore('reviews');
      return reviewsStore.get(resId);
    });
  }

  
  static updateReviewsInDb(dbPromise, resId, reviews) {
    return dbPromise.then((db) => {
      if (!db) return;
      let tx = db.transaction('reviews', 'readwrite');
      let reviewsStore = tx.objectStore('reviews');
      reviewsStore.put(reviews, resId);
      tx.complete;
    });
  }

  static addReviewTo(name, rate, comment, resId){
      var data = {};
      data.restaurant_id  = resId;
      data.name = name;
      data.rating = rate;
      data.comments = comment;
      data.createdAt = new Date().toISOString();
      data.updatedAt = new Date().toISOString();
      const ul = document.getElementById('reviews-list');
      ul.appendChild(createReviewHTML(data));
      const dbPromise = DBHelper.openDb();
      DBHelper.getReviewsFromDb(dbPromise, resId)
        .then(reviews => {
         if (!reviews) return;
            reviews.push(data);
            DBHelper.updateReviewsInDb(dbPromise, resId, reviews);
      });
      if(navigator.onLine){
          fetch(DBHelper.DATABASE_URL_REVIEWS, {
            method: 'post',
            body: JSON.stringify(data)
          }).then((status) => {
          //  console.log("sending reviews to server is successful");
          }).catch((error) => {
          //  console.log("sending reviews to server is unsuccessful");
          })
      } else{
          DBHelper.addToOfflineReviewDb(data);
      }
  }  
    
  /**
  *
  */
  static sendOfflineReviewsToServer(){
      DBHelper.openDb().then(db => {
        db.transaction('offline-reviews', 'readonly')
          .objectStore('offline-reviews')
          .getAll().then(response => {
            fetch(DBHelper.DATABASE_URL_REVIEWS,  {
              method: 'post',
              body: JSON.stringify(response)
              }).then(() => {
                db.transaction('offline-reviews', 'readwrite')
                  .objectStore('offline-reviews')
                  .openCursor()
                  .then(cursor => {
                    cursor.delete();
               })
              }).catch((error) => {
              //  console.log("sending offline reviews to server is unsuccessful");
              })
          })
      })
  }

  static addToOfflineReviewDb(data){
      DBHelper.openDb().then((db) => {
              if(!db) return;
              let trans = db.transaction('offline-reviews', 'readwrite');
              let store = trans.objectStore('offline-reviews');
              store.put(data);
            }).then(() => {
           //   console.log('Offline reviews updated in the IDB');
          })
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
}

  