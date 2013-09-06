(function(angular, $, undefined){

'use strict';

/**
 * Copyright (c) 2013, Bernhard Posselt <nukeawhale@gmail.com> 
 * Copyright (c) 2013, Alessandro Cosentino <cosenal@gmail.com> 
 * Copyright (c) 2013, Ilija Lazarevic <ikac.ikax@gmail.com> 
 * This file is licensed under the Affero General Public License version 3 or later. 
 * See the COPYING file.
 */

// this file is just for defining the main container to easily swap this in
// tests
angular.module('News', []);
// define your routes in here
angular.module('News').config(['$routeProvider', function ($routeProvider) {

    $routeProvider.when('/', {
        templateUrl:'main.html',
        controller:'MainController'
    })
        .when('/login', {
            templateUrl:'login.html',
            controller:'LoginController',
            resolve: ['$http' , '$locale', 'TranslationService', function($http,$locale,TranslationService){
                return $http.get('../languages/'+$locale.id+'.json').success(function(data, status){
                    TranslationService.lang = data;
                });
            }]
        })
        .otherwise({
            redirectTo:'/'
        });

}]);

angular.module('News').config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
}]);

angular.module('News').config(function($provide) {
    $provide.decorator("$exceptionHandler", function($delegate) {
        return function(exception, cause) {
            //$delegate(exception, cause);
            alert(exception.message);
        };
    });
});

angular.module('News').controller('LoginController',
    ['$scope', '$location', '$route' , '$locale', 'LoginService', 'UserService', 'ExceptionsService',
        function ($scope, $location, $route, $locale, LoginService, UserService, ExceptionsService) {

            $scope.data = UserService;

            $scope.testFormFields = function () {
                var hostNameRegExp = new RegExp(/^https?:\/\/.*$/); ///^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
                var userNameRegExp = new RegExp(/^[a-z0-9_-]{3,10}$/); // /^[a-z0-9_-]{3,16}$/
                var passwordRegExp = new RegExp(/^[a-z0-9_-]{3,10}$/); // /^[a-z0-9_-]{6,18}$/

                var userNameParseResult = userNameRegExp.test(UserService.userName);

                $scope.userNameError = '';
                $scope.passwordError = '';
                $scope.hostNameError = '';

                if (!userNameParseResult) {
                    ExceptionsService.makeNewException({message:"user.name.is.not.in.correct.format"},-1);
                }

                var passwordParseResult = passwordRegExp.test(UserService.password);

                if (!passwordParseResult) {
                    ExceptionsService.makeNewException({message:"password.is.not.in.correct.format"},-1);
                }

                var hostNameParseResult = hostNameRegExp.test(UserService.hostName);

                if (!hostNameParseResult) {
                    ExceptionsService.makeNewException({message:"host.name.is.not.in.correct.format"},-1);
                }

                if (hostNameParseResult && userNameParseResult && passwordParseResult) {
                    return true;
                }
                return false;
            };

            $scope.logIn = function () {
                if ($scope.testFormFields()) {
                    LoginService.login()
                        .success(function (data, status) {
                            if (status === 200) {
                                LoginService.present = true;
                                $location.path("/");
                            }
                        })
                        .error(function (data, status) {
                            ExceptionsService.makeNewException(data, status);
                        });
                }
            };

            $scope.isLoggedIn = function () {
                if (LoginService.present) {
                    $location.path("/");
                }
            };

        }]);

angular.module('News').controller('MainController',
    ['$scope', '$location', 'LoginService', 'ItemsService', 'FoldersService', 'FeedsService',
        function ($scope, $location, LoginService, ItemsService, FoldersService, FeedsService) {

            $scope.view = ''; // view is way the results are presented, all and starred is equal
            $scope.action = ''; // action is button pressed to get the populated list
            $scope.folderId = '0';
            $scope.feedId = '0';
            $scope.currentFolderName = '';
            $scope.currentFeedTitle = '';

            $scope.moreArticles = true;
            var articlesGet = 0;

            $scope.getStarred = function (offset) {
                $scope.action = 'Starred';
                $scope.moreArticles = true;
                ItemsService.getStarredItems(offset)
                    .then(function (result) {
                        $scope.view = 'All';
                        $scope.data = result.data;
                        articlesGet = result.data.items.length;
                    });
            };

            $scope.getAll = function (offset) {
                $scope.action = 'All';
                $scope.moreArticles = true;
                ItemsService.getAllItems(offset)
                    .then(function (result) {
                        $scope.view = 'All';
                        $scope.data = result.data;
                        articlesGet = result.data.items.length;
                    });
            };

            $scope.getFolders = function () {
                $scope.action = 'Folders';
                FoldersService.getFolders()
                    .success(function (data, status) {
                        $scope.data = data;
                        $scope.view = 'Folders';
                    })
                    .error(function (data, status) {
                        alert("Status " + status + " [" + data.message + "]");
                    });
            };

            $scope.getFeeds = function () {
                $scope.action = 'Feeds';
                FeedsService.getFeeds()
                    .success(function (data, status) {
                        $scope.data = data;
                        $scope.view = 'Feeds';
                    })
                    .error(function (data, status) {
                        alert("Status " + status + " [" + data.message + "]");
                    });
            };

            $scope.getFolderItems = function (folderId, offset, folderName) {
                $scope.action = 'FolderItems';
                $scope.folderId = folderId;
                $scope.currentFolderName = folderName;
                $scope.moreArticles = true;

                FoldersService.getFolderItems(folderId, offset)
                    .then(function (result) {
                        $scope.view = 'All';
                        $scope.data = result.data;
                        articlesGet = result.data.items.length;
                    });
            };

            $scope.getFeedItems = function (feedId, offset, feedTitle) {
                $scope.action = 'FeedItems';
                $scope.feedId = feedId;
                $scope.currentFeedTitle = feedTitle;
                $scope.moreArticles = true;

                FeedsService.getFeedItems(feedId, offset)
                    .then(function (result) {
                        $scope.view = 'All';
                        $scope.data = result.data;
                        articlesGet = result.data.items.length;
                    });
            };

            $scope.getMoreItems = function (type) {
                var offset = $scope.data.items.slice(-1)[0].id - 1;

                if (offset === 0 || articlesGet < 20) {
                    $scope.moreArticles = false;
                    return false;
                }

                if ($scope.action === 'All') {
                    ItemsService.getAllItems(offset)
                        .then(function (result) {
                            articlesGet = result.data.items.length;
                            for (var i in result.data.items) {
                                $scope.data.items.push(result.data.items[i]);
                            }
                        });
                }
                else if ($scope.action === 'Starred') {
                    ItemsService.getStarredItems(offset)
                        .then(function (result) {
                            articlesGet = result.data.items.length;
                            for (var i in result.data.items) {
                                $scope.data.items.push(result.data.items[i]);
                            }
                        });
                }
                else if (type === 'All' && $scope.action === 'FolderItems') {
                    FoldersService.getFolderItems($scope.folderId, offset).then(function (result) {
                        articlesGet = result.data.items.length;
                        for (var i in result.data.items) {
                            $scope.data.items.push(result.data.items[i]);
                        }
                    });
                }
                else if (type === 'All' && $scope.action === 'FeedItems') {
                    FeedsService.getFeedItems($scope.feedId, offset).then(function (result) {
                        articlesGet = result.data.items.length;
                        for (var i in result.data.items) {
                            $scope.data.items.push(result.data.items[i]);
                        }
                    });
                }

            };

            $scope.logOut = function () {
                LoginService.present = false;
                LoginService.killTimer();
                $location.path('/login');
            };

            if (LoginService.present) {
                //console.log('This');
                $scope.getAll(0);
            }

        }]);



angular.module('News').directive('checkPresence',
    ['$http', '$location', '$timeout', 'LoginService', 'ExceptionsService',
        function ($http, $location, $timeout, LoginService, ExceptionsService) {
            return {
                restrict:"E",
                link:function tick() {
                    if (LoginService.timerRef) {
                        LoginService.killTimer();
                    }
                    if (!LoginService.present) {
                        $location.path('/login');
                    }
                    else {
                        LoginService.login()
                            .success(function (data, status) {
                                if (status === 200) {
                                    $location.path('/');
                                }
                                else {
                                    LoginService.killTimer();
                                    $location.path('/login');
                                    ExceptionsService.makeNewException(data, status);
                                }
                            })
                            .error(function (data, status) {
                                LoginService.killTimer();
                                $location.path('/login');
                                ExceptionsService.makeNewException(data, status);
                            });
                    }
                    LoginService.timerRef = $timeout(tick, LoginService.timeout);
                }
            };
        }]);


angular.module('News').filter('translator', ['TranslationService', function (TranslationService) {
	return function (text) {
        return TranslationService.translateLabel([text]);
	};
}]);

angular.module('News').factory('ExceptionsService',
    ['TranslationService', function (TranslationService) {
        return {
            makeNewException:function (data, status) {
                var messageString = '';
                if (status > 0) {
                    messageString = '['+status+'] ';
                }
                messageString = messageString + TranslationService.translateException([data.message]);

                throw {message: messageString};
            }
        };
    }]);

angular.module('News').factory('FeedsService',
    ['$http', 'UserService', 'ExceptionsService',
        function ($http, UserService, ExceptionsService) {
            return {
                getFeeds:function () {
                    return $http({ method:'GET', url:UserService.hostName +
                        "/index.php/apps/news/api/v1-2/feeds",
                        cached:false, withCredentials:true});
                },

                getFeedItems:function (feedId, offset) {
                    var params = {
                        "batchSize":20, //  the number of items that should be returned, defaults to 20
                        "offset":offset, // only return older (lower than equal that id) items than the one with id 30
                        "type":0, // the type of the query (Feed: 0, Folder: 1, Starred: 2, All: 3)
                        "id":feedId, // the id of the folder or feed, Use 0 for Starred and All
                        "getRead":true // if true it returns all items, false returns only unread items
                    };

                    return $http({ method:'GET', url:UserService.hostName +
                        "/index.php/apps/news/api/v1-2/items",
                        params:params, cached:false, withCredentials:true})
                        .success(function (data, status) {
                            return data;
                        }).error(function (data, status) {
                            ExceptionsService.makeNewException(data,status);
                        });
                }
            };

        }]);

angular.module('News').factory('FoldersService',
    ['$http', 'UserService', 'ExceptionsService',
        function ($http, UserService, ExceptionsService) {
            return {
                getFolders:function () {
                    return $http({ method:'GET', url:UserService.hostName +
                        "/index.php/apps/news/api/v1-2/folders", cached:false,
                        withCredentials:true });
                },

                getFolderItems:function (folderId, offset) {
                    var params = {
                        "batchSize":20, //  the number of items that should be returned, defaults to 20
                        "offset":offset, // only return older (lower than equal that id) items than the one with id 30
                        "type":1, // the type of the query (Feed: 0, Folder: 1, Starred: 2, All: 3)
                        "id":folderId, // the id of the folder or feed, Use 0 for Starred and All
                        "getRead":true // if true it returns all items, false returns only unread items
                    };

                    return $http({ method:'GET', url:UserService.hostName +
                        "/index.php/apps/news/api/v1-2/items", params:params,
                        cached:false, withCredentials:true })
                        .success(function (data, status) {
                            return data;
                        }).error(function (data, status) {
                            ExceptionsService.makeNewException(data,status);
                        });
                }
            };

        }]);

angular.module('News').factory('ItemsService',
    ['$http', 'UserService', 'ExceptionsService',
        function ($http, UserService, ExceptionsService) {
            return {
                getStarredItems:function (offset) {
                    var params = {
                        "batchSize":20, //  the number of items that should be returned, defaults to 20
                        "offset":offset, // only return older (lower than equal that id) items than the one with id 30
                        "type":2, // the type of the query (Feed: 0, Folder: 1, Starred: 2, All: 3)
                        "id":0, // the id of the folder or feed, Use 0 for Starred and All
                        "getRead":true // if true it returns all items, false returns only unread items
                    };

                    return $http({ method:'GET', url:UserService.hostName +
                        "/index.php/apps/news/api/v1-2/items",
                        params:params, cached:false, withCredentials:true})
                        .success(function (data, status) {
                            return data;
                        }).error(function (data, status) {
                            ExceptionsService.makeNewException(data,status);
                        });
                },

                getAllItems:function (offset) {
                    var params = {
                        "batchSize":20, //  the number of items that should be returned, defaults to 20
                        "offset":offset, // only return older (lower than equal that id) items than the one with id 30
                        "type":3, // the type of the query (Feed: 0, Folder: 1, Starred: 2, All: 3)
                        "id":0, // the id of the folder or feed, Use 0 for Starred and All
                        "getRead":true // if true it returns all items, false returns only unread items
                    };
                    return $http({ method:'GET', url:UserService.hostName +
                        "/index.php/apps/news/api/v1-2/items",
                        params:params, cached:false, withCredentials:true})
                        .success(function (data, status) {
                            return data;
                        }).error(function (data, status) {
                            ExceptionsService.makeNewException(data,status);
                        });
                }
            };
        }]);

angular.module('News').factory('Login', ['$http', '$timeout', function ($http, $timeout) {
    return {
        userName:'ikacikac',
        password:'ikacikac',
        present:true,
        timerRef:null,
        timeout:500000,
        hostname:'http://owncloud.homenet',
        //this.userName+":"+this.password+"@"+this.url+"/version"
        killTimer:function () {
            $timeout.cancel(this.timerRef);
        },

        isPresent:function () {
            return this.present;
        },

        login:function () {
            var auth = "Basic " + btoa(this.userName + ":" + this.password);
            $http.defaults.headers.common.Authorization = auth;
            //console.log("http://"+this.userName+":"+this.password+"@"+this.hostname+"/version");
            //return $http({ method: 'GET', url : "http://"+this.userName+":"+this.password+"@"+this.hostname+"/index.php/apps/news/api/v1-2/version", withCredentials : true });
            return $http({ method:'GET', url:this.hostname + "/index.php/apps/news/api/v1-2/version" });
        },

        getFolders:function () {
            return $http({ method:'GET', url:"http://" + this.userName + ":" + this.password + "@" + this.hostname + "/index.php/apps/news/api/v1-2/folders", cached:false, withCredentials:true });
        },

        getFeeds:function () {
            return $http({ method:'GET', url:"http://" + this.userName + ":" + this.password + "@" + this.hostname + "/index.php/apps/news/api/v1-2/feeds", cached:false, withCredentials:true });
        },

        getStarredItems:function (offset) {
            var params = {
                "batchSize":20, //  the number of items that should be returned, defaults to 20
                "offset":offset, // only return older (lower than equal that id) items than the one with id 30
                "type":2, // the type of the query (Feed: 0, Folder: 1, Starred: 2, All: 3)
                "id":0, // the id of the folder or feed, Use 0 for Starred and All
                "getRead":true // if true it returns all items, false returns only unread items
            };

            return $http({ method:'GET', url:"http://" + this.userName + ":" + this.password + "@" + this.hostname + "/index.php/apps/news/api/v1-2/items", params:params, cached:false, withCredentials:true });
        },

        getAllItems:function (offset) {
            var auth = "Basic " + btoa(this.userName + ":" + this.password);
            $http.defaults.headers.common.Authorization = auth;
            var params = {
                "batchSize":20, //  the number of items that should be returned, defaults to 20
                "offset":offset, // only return older (lower than equal that id) items than the one with id 30
                "type":3, // the type of the query (Feed: 0, Folder: 1, Starred: 2, All: 3)
                "id":0, // the id of the folder or feed, Use 0 for Starred and All
                "getRead":true // if true it returns all items, false returns only unread items
            };
            //return $http({ method : 'GET', url : "http://"+this.userName+":"+this.password+"@"+this.hostname+"/items", params : params, cached : false,  withCredentials : true });
            //return $http({ method : 'GET', url : "http://"+this.hostname+"/index.php/apps/news/api/v1-2/items", params : params, cached : false, withCredentials : true});
            return $http({ method:'GET', url:this.hostname + "/index.php/apps/news/api/v1-2/items", params:params, cached:false});
        },

        getFolderItems:function (folderId, offset) {
            var params = {
                "batchSize":20, //  the number of items that should be returned, defaults to 20
                "offset":offset, // only return older (lower than equal that id) items than the one with id 30
                "type":1, // the type of the query (Feed: 0, Folder: 1, Starred: 2, All: 3)
                "id":folderId, // the id of the folder or feed, Use 0 for Starred and All
                "getRead":true // if true it returns all items, false returns only unread items
            };

            return $http({ method:'GET', url:"http://" + this.userName + ":" + this.password + "@" + this.hostname + "/index.php/apps/news/api/v1-2/items", params:params, cached:false, withCredentials:true });
        },

        getFeedItems:function (feedId, offset) {
            var params = {
                "batchSize":20, //  the number of items that should be returned, defaults to 20
                "offset":offset, // only return older (lower than equal that id) items than the one with id 30
                "type":0, // the type of the query (Feed: 0, Folder: 1, Starred: 2, All: 3)
                "id":feedId, // the id of the folder or feed, Use 0 for Starred and All
                "getRead":true // if true it returns all items, false returns only unread items
            };

            return $http({ method:'GET', url:"http://" + this.userName + ":" + this.password + "@" + this.hostname + "/index.php/apps/news/api/v1-2/items", params:params, cached:false, withCredentials:true });
        }


    };

}]);

angular.module('News').factory('LoginService',
    ['$http', '$timeout', 'UserService',
        function ($http, $timeout, UserService) {
            return {
                present:false,
                timerRef:null,
                timeout:5000,

                killTimer:function () {
                    $timeout.cancel(this.timerRef);
                },

                isPresent:function () {
                    return this.present;
                },

                login:function () {
                    var auth = "Basic " + btoa(UserService.userName + ":" +
                        UserService.password);

                    $http.defaults.headers.common.Authorization = auth;

                    return $http({ method:'GET', url:UserService.hostName +
                        "/index.php/apps/news/api/v1-2/version" });


                    //console.log("http://"+this.userName+":"+this.password+"@"+this.hostname+"/version");
                    //return $http({ method: 'GET', url : "http://"+this.userName+":"+this.password+"@"+this.hostname+
                    // "/index.php/apps/news/api/v1-2/version", withCredentials : true });
                }

            };

        }]);

angular.module('News').factory('TranslationService', [ function () {
    return {
        lang:null,
        translateLabel : function(text){
            return this.lang.labels[text];
        },
        translateException : function(text){
            return this.lang.exceptions[text];
        }
    };
}]);

angular.module('News').factory('UserService', ['$http', function ($http) {
    return {
        userName:'ikacikac',
        password:'ikacikac',
        hostName:'http://localhost/owncloud'
    };
}]);

})(window.angular, jQuery);