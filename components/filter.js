// Filter Component
// ----------------

/* global define */

// Define AMD, Require.js, or Contextual Scope
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([
      'stratus',
      'underscore',
      'angular',
      'angular-material'
    ],
    factory)
  } else {
    factory(root.Stratus, root._, root.angular)
  }
}(this, function (Stratus, _, angular) {
  // This component handles filtering for a collection
  Stratus.Components.Filter = {
    bindings: {
      ngModel: '=',
      target: '@'
    },
    controller: function ($scope, $attrs) {
      Stratus.Instances[_.uniqueId('filter')] = $scope
      $scope.collection = ($scope.$parent && $scope.$parent.collection)
        ? $scope.$parent.collection
        : null
      $scope.query = ''
    },
    templateUrl: Stratus.BaseUrl +
     Stratus.BundlePath + 'components/filter' +
      (Stratus.Environment.get('production') ? '.min' : '') + '.html'
  }
}))
