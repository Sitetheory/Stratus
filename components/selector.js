// Selector Component
// ------------------

/* global define */

// Define AMD, Require.js, or Contextual Scope
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([

      // Libraries
      'stratus',
      'underscore',
      'angular',

      // Modules
      'angular-material',

      // Components
      'stratus.components.pagination',
      'stratus.components.search',

      // Services
      'stratus.services.registry',
      'stratus.services.model',
      'stratus.services.commonMethods'
    ], factory)
  } else {
    factory(root.Stratus, root._, root.angular)
  }
}(this, function (Stratus, _, angular) {
  // This component intends to allow editing of various selections depending on
  // context.
  Stratus.Components.Selector = {
    transclude: {
      image: '?stratusSelectorImage',
      label: '?stratusSelectorLabel',
      option: '?stratusSelectorOption',
      selected: '?stratusSelectorSelected'
    },
    bindings: {
      elementId: '@',
      ngModel: '=',
      type: '@',
      property: '@',
      multiple: '@',
      api: '@',
      limit: '@',
      options: '<'
    },
    controller: function ($scope, $attrs, $log, Registry, Model, commonMethods) {
      // Initialize
      commonMethods.componentInitializer(this, $scope, $attrs, 'selector')

      // Hydrate Settings
      $scope.api = _.isJSON($attrs.api) ? JSON.parse($attrs.api) : false

      // Asset Collection
      if ($attrs.type) {
        $scope.registry = new Registry()
        var request = {
          target: $attrs.type,
          decouple: true,
          api: {
            options: this.options ? this.options : {},
            limit: _.isJSON($attrs.limit) ? JSON.parse($attrs.limit) : 40
          }
        }
        if ($scope.api && angular.isObject($scope.api)) {
          request.api = _.extendDeep(request.api, $scope.api)
        }
        $scope.registry.fetch(request, $scope)
      }

      // Store Asset Property for Verification
      $scope.property = $attrs.property || null

      // Store Toggle Options for Custom Actions
      $scope.toggleOptions = {
        multiple: _.isJSON($attrs.multiple)
          ? JSON.parse($attrs.multiple)
          : true
      }

      // Data Connectivity
      $scope.model = null
      $scope.$watch('$ctrl.ngModel', function (data) {
        if (data instanceof Model && data !== $scope.model) {
          $scope.model = data
        }
      })
    },
    templateUrl: Stratus.BaseUrl +
     Stratus.BundlePath + 'components/selector' +
      (Stratus.Environment.get('production') ? '.min' : '') + '.html'
  }
}))
