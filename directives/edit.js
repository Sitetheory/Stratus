//     Stratus.Directives.Edit.js 1.0

//     Copyright (c) 2017 by Sitetheory, All Rights Reserved
//
//     All information contained herein is, and remains the
//     property of Sitetheory and its suppliers, if any.
//     The intellectual and technical concepts contained herein
//     are proprietary to Sitetheory and its suppliers and may be
//     covered by U.S. and Foreign Patents, patents in process,
//     and are protected by trade secret or copyright law.
//     Dissemination of this information or reproduction of this
//     material is strictly forbidden unless prior written
//     permission is obtained from Sitetheory.
//
//     For full details and documentation:
//     http://docs.sitetheory.io

// Stratus Edit Directive
// ----------------------

// Define AMD, Require.js, or Contextual Scope
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['stratus', 'underscore', 'angular', 'moment', 'angular-material', 'stratus.services.model', 'stratus.directives.froala', 'stratus.directives.src'], factory);
    } else {
        factory(root.Stratus, root._);
    }
}(this, function (Stratus, _) {
    // This directive intends to handle binding of a dynamic variable to
    Stratus.Directives.Edit = function ($parse, $log, $timeout, model) {
        return {
            restrict: 'AE', // Element is required to transclude inner elements
            require: 'ngModel',
            transclude: {
                view: '?stratusEditView',
                input: '?stratusEditInput'
            },
            scope: {
                elementId: '@',
                ngModel: '=',
                property: '@',
                type: '@', // Editor / DateTime
                stratusEdit: '=', // A value to define if the element can currently be editable
                alwaysEdit: '@', // A bool/string to define if the element will always be in editable mode
                autoSave: '@' // A bool/string to define if the model will auto save on focus out or Enter presses. Defaults to true
            },
            link: function ($scope, $element, $attrs, ngModel) {
                // Initialize
                $scope.uid = this.uid = _.uniqueId('edit_');
                Stratus.Instances[this.uid] = $scope;
                $scope.Stratus = Stratus;
                $scope.elementId = $attrs.elementId || this.uid;
                $scope.edit_input_container = $element[0].getElementsByClassName('stratus_edit_input_container')[0];

                // Settings
                $scope.edit = false;

                // Data Connectivity
                $scope.model = null;
                $scope.value = null;

                if (!ngModel || !$scope.property) {
                    console.warn($scope.uid + ' has no model or property!');
                    return;
                }

                var ctrl = {
                    initialized: false
                };

                // METHODS

                $scope.liveEditStatus = function () {
                    if (ctrl.initialized) {
                        if ($scope.stratusEdit !== undefined) {
                            return $scope.stratusEdit;
                        } else if (Stratus.Environment.data.liveEdit !== undefined) {
                            return Stratus.Environment.data.liveEdit;
                        }
                        console.warn($scope.uid + ' has no variable to track edit toggle! ($scope.stratusEdit)');
                    }
                    return false;
                };

                $scope.setEdit = function (bool) {
                    // Only allow Edit mode if liveedit is enabled.
                    if (bool && ($scope.liveEditStatus() || $scope.alwaysEdit)
                    ) {
                        $scope.edit = bool;
                        $scope.focusOnEditable();
                    } else {
                        $scope.edit = false;
                    }
                };

                $scope.focusOnEditable = function () {
                    $timeout(function () {
                        if ($scope.edit_input_container.getElementsByTagName('input').length > 0) {
                            // Focus on the input field
                            $scope.edit_input_container.getElementsByTagName('input')[0].focus();
                        } else if ($($scope.edit_input_container).find('[contenteditable]').length > 0) {
                            // Focus on any contenteditable (including froala)
                            $($scope.edit_input_container).find('[contenteditable]').focus();
                        } else {
                            // No known edit location, so try to focus on the entire container
                            $scope.edit_input_container.focus();
                        }
                    }, 0);
                };

                $scope.accept = function () {
                    if ($scope.model instanceof model && $scope.property) {
                        $scope.model.set($scope.property, $scope.value);
                        $scope.model.save();
                    }
                };

                $scope.cancel = function () {
                    if ($scope.model instanceof model && $scope.property) {
                        $scope.value = $scope.model.get($scope.property);
                    }
                    $scope.setEdit(false);
                };

                // WATCHERS

                $scope.$watch('ngModel', function (data) {
                    if (data instanceof model && !_.isEqual(data, $scope.model)) {
                        $scope.model = data;
                        var unwatch = $scope.$watch('model.data', function (dataCheck) {
                            if (dataCheck !== undefined) {
                                unwatch(); // Remove this watch as soon as it's run once
                                ctrl.init(); // Initialize only after there is a model to work with
                            }
                        });
                    }
                });

                // Init() will have data rendered from the model rather than the element and allows for editing.
                ctrl.init = function () {
                    if (!ctrl.initialized) {
                        ctrl.initialized = true;
                    }

                    // WATCHERS

                    $scope.$watch('model.data.' + $scope.property, function (data) {
                        $scope.value = data;
                    });

                    // TRIGGERS

                    // Save / Cancel value on key press
                    // FIXME saving with key press with cause two saves (due to focus out). We need a save throttle to prevent errors
                    $($scope.edit_input_container).on('keydown keypress', function (event) {
                        switch (event.which) {
                            case Stratus.Key.Enter:
                                if ($scope.autoSave !== false && $scope.autoSave !== 'false') {
                                    $scope.$apply($scope.accept);
                                }
                                $scope.setEdit(false);
                                break;
                            case Stratus.Key.Escape:
                                $scope.$apply($scope.cancel);
                                break;
                        }
                    });

                    // FIXME save of focus out does not work on the media selector correctly
                    // Update value on change, save value on blur
                    $($scope.edit_input_container).on('focusout', function () {
                        if ($scope.autoSave !== false && $scope.autoSave !== 'false') {
                            $scope.$apply($scope.accept);
                        }
                        $scope.setEdit(false);
                    });
                };

            },
            templateUrl: function (elements, $scope) {
                var template = $scope.type || '';
                return Stratus.BaseUrl + 'sitetheorystratus/stratus/directives/edit' + template + (Stratus.Environment.get('production') ? '.min' : '') + '.html';
            }
        };
    };
}));
