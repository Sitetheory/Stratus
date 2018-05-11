// Permissions Component
// ----------------------

/* global define */

// Define AMD, Require.js, or Contextual Scope
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([

      // Libraries
      'stratus',
      'underscore',
      'jquery',
      'angular',

      // Modules
      'angular-material',
      'stratus.services.commonMethods'
    ], factory)
  } else {
    factory(root.Stratus, root._, root.jQuery, root.angular)
  }
}(this, function (Stratus, _, jQuery, angular) {
  // Permissions
  Stratus.Components.Permissions = {
    bindings: {
      permissionId: '<',
      ngModel: '=',
      identityUser: '='
    },
    controller: function ($scope, $timeout, $attrs, $http, commonMethods) {
      var $ctrl = this

      Stratus.Internals.CssLoader(Stratus.BaseUrl +
       Stratus.BundlePath + 'components/permissions' +
        (Stratus.Environment.get('production') ? '.min' : '') + '.css')

      // mock up list permissions
      $scope.permissionSelected = []
      $scope.complete = false

      // new permission
      $scope.newPermission = {timeEdit: new Date().getTime()}

      // specific the identityUser who is grated permissions
      $scope.allowSelectUser = !$ctrl.identityUser

      $scope.permissions = [
        {value: 1, name: 'View'},
        {value: 2, name: 'Create'},
        {value: 4, name: 'Edit'},
        {value: 8, name: 'Delete'},
        {value: 16, name: 'Publish'},
        {value: 32, name: 'Design'},
        {value: 64, name: 'Dev'},
        {value: 128, name: 'Master'}
      ]

      // mock up list roles
      $scope.userRoleSelected = null
      $scope.updateUserRole = null

      // mock up list contents
      $scope.contentSelected = null
      $scope.updateContent = null

      $scope.$watch('$ctrl.permissionId', function (permissionId) {
        if (typeof permissionId !== 'undefined') {
          $scope.getPermission(permissionId)
        }
      })

      $scope.$watch('$ctrl.ngModel', function () {
        if ($ctrl.identityUser && $ctrl.ngModel) {
          $scope.newPermission.identityUser = {
            id: $ctrl.ngModel.id,
            bestName: $ctrl.ngModel.bestName
          }
          $scope.userRoleSelected = $scope.newPermission.identityUser
          if (!$ctrl.ngModel.permissions) {
            $ctrl.ngModel.permissions = []
          }
        }
      })

      $scope.$watchGroup(['contentSelected', 'permissionSelected'],
        function () {
          if ($ctrl.identityUser && $scope.userRoleSelected && $ctrl.ngModel &&
            $ctrl.ngModel.permissions) {
            if (_.last($ctrl.ngModel.permissions) &&
              !_.last($ctrl.ngModel.permissions).hasOwnProperty('id')) {
              $ctrl.ngModel.permissions.splice($ctrl.ngModel.permissions.length -
                1, 1)
            }
            if ($scope.contentSelected &&
              $scope.permissionSelected.length > 0) {
              $ctrl.ngModel.permissions.push($scope.newPermission)
            }
          }
        })

      $scope.getPermission = function (permissionId) {
        return commonMethods.sendRequest(null, 'GET', '/Api/Permission/' +
          permissionId).then(
          function (response) {
            // success
            if (response) {
              var data = response.data.payload

              // Set permission selected
              var permissions = data.summary
              angular.forEach(permissions, function (permission, index) {
                index = $scope.permissions.findIndex(function (x) {
                  return x.name === permission
                })

                if (index > -1) {
                  $scope.permissionSelected.push(
                    $scope.permissions[index].value)
                }
              })

              $ctrl.ngModel.data.permissions = $scope.permissionSelected

              // Set identity name
              $scope.userRoleSelected = data.identityRole
                ? data.identityRole
                : data.identityUser
              $scope.updateUserRole = data.identityRole
                ? data.identityRole
                : data.identityUser

              // Set asset name
              $scope.updateContent = {
                name: data.assetContent,
                assetType: data.asset,
                id: data.assetId
              }
            }
          },
          function (response) {
            // something went wrong
            console.log('response error', response)
          })
      }

      /**
       * Retrieve data from server
       */
      $scope.identityQuery = function (query) {
        return commonMethods.sendRequest(null,
          'GET', '/Api/User?options[type]=collection&p=1&q=' + query).then(
          function (response) {
            if (response.hasOwnProperty('data') &&
              response.data.hasOwnProperty('payload')) {
              var value = response.data.payload
              var results = []

              // Prepare data
              if (value.User) {
                value.User.name += ' - ' + value.User.id
                results = results.concat(value.User)
              }
              if (value.Role) {
                value.Role.bestName += ' - ' + value.Role.id
                results = results.concat(value.Role)
              }
              if (!(value.User) && !(value.Role)) {
                if (value.name) {
                  value.name += ' - ' + value.id
                } else if (value.bestName) {
                  value.bestName += ' - ' + value.id
                }
                results = results.concat(value)
              }

              console.log('results', results)
              return results
            }
          },
          function (error) {
            console.error(error)
          })
      }

      $scope.contentQuery = function (query) {
        return commonMethods.sendRequest(null,
          'GET', '/Api/Content?options[type]=collection&p=1&q=' + query).then(
          function (response) {
            if (response.hasOwnProperty('data') &&
              response.data.hasOwnProperty('payload')) {
              var value = response.data.payload
              var results = []

              if (value.Bundle) {
                angular.forEach(value.Bundle, function (bundle, index) {
                  value.Bundle[index].type = 'Bundle'
                  value.Bundle[index].assetType = 'SitetheoryContentBundle:Bundle'
                })

                results = results.concat(value.Bundle)
              }
              if (value.Content) {
                angular.forEach(value.Content, function (content, index) {
                  value.Content[index].type = 'Content'
                  if (content.hasOwnProperty('contentType') &&
                    content.contentType.hasOwnProperty('bundle') &&
                    content.contentType.bundle.hasOwnProperty('name')) {
                    value.Content[index].assetType = 'Sitetheory' +
                      content.contentType.bundle.name + 'Bundle:' +
                      content.contentType.entity
                  }
                })
                results = results.concat(value.Content)
              }
              if (value.ContentType) {
                angular.forEach(value.ContentType,
                  function (contentType, index) {
                    value.ContentType[index].type = 'ContentType'
                    value.ContentType[index].assetType = 'SitetheoryContentBundle:ContentType'
                  })
                results = results.concat(value.ContentType)
              }

              if (!value.Bundle && !value.Content && !value.ContentType) {
                results = results.concat(value)
              }
              console.log('results', results)
              return results
            }
          },
          function (error) {
            console.error(error)
          })
      }

      $scope.selectedUserRoleChange = function (item) {
        $scope.userRoleSelected = item
        if (!$ctrl.identityUser) {
          if ($scope.userRoleSelected && $scope.userRoleSelected.name) {
            $ctrl.ngModel.data.identityRole = item
            $ctrl.ngModel.data.identityUser = null
          } else {
            $ctrl.ngModel.data.identityRole = null
            $ctrl.ngModel.data.identityUser = item
          }
        }
      }

      $scope.selectedContentChange = function (content) {
        $scope.contentSelected = content
        if ($ctrl.identityUser) {
          persistContentData($scope.newPermission, content)
        } else {
          persistContentData($ctrl.ngModel.data, content)
        }
      }

      /**
       * persist the content data into model.
       */
      function persistContentData (data, contentSelected) {
        if ($scope.contentSelected.type === 'Content') {
          data.assetId = $scope.contentSelected.version.meta.id
        } else {
          data.assetId = $scope.contentSelected.id
        }

        data.asset = $scope.contentSelected.assetType
      }

      /**
       * If user selected the master Action, the other action selected will be
       * ignored. If user selected all of actions except the master action, the
       * action Selected will be converted to only contain master.
       */
      $scope.processSelectAction = function () {
        var masterIndex = $scope.permissionSelected.indexOf(128)
        if ((masterIndex !== -1) ||
          ($scope.permissionSelected.length === $scope.permissions.length - 1)) {
          $scope.permissionSelected = [
            $scope.permissions[$scope.permissions.length - 1].value]
        }

        persistActionData(
          $ctrl.identityUser ? $scope.newPermission : $ctrl.ngModel.data)
      }

      /**
       * persist the action data into model.
       */
      function persistActionData (data) {
        if ($scope.permissionSelected.length > 0) {
          angular.forEach($scope.permissionSelected, function (permission) {
            data.permissions |= permission
          })
        }
      }

      $scope.selectedIdentify = function (item) {
        if (item.name) {
          return item.name + ' - ' + item.id
        } else {
          return item.bestName + ' - ' + item.id
        }
      }

      $scope.selectedContent = function (item) {
        if (item.version) {
          return item.version + ' - ' + item.verision.meta.id
        } else if (item.name) {
          return item.name + ' - ' + item.id
        }
      }
    },
    templateUrl: Stratus.BaseUrl +
   Stratus.BundlePath + 'components/permissions' +
    (Stratus.Environment.get('production') ? '.min' : '') + '.html'
  }
}))
