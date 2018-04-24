(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([

      // Libraries
      'stratus',
      'underscore',
      'angular',

      // UI Additions
      'angular-material',

      // Services
      'stratus.services.collection',
      'stratus.services.commonMethods'
    ], factory)
  } else {
    factory(root.Stratus, root._)
  }
}(this, function (Stratus, _) {
  Stratus.Components.MenuLink = {
    bindings: {
      menuLink: '=',
      versionData: '='
    },
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
      prefix: '@', // A value to prepend to the front of the value
      suffix: '@', // A value to append to the back of the value
      stratusEditable: '@', // A value to define if the element can currently be editable
      alwaysEdit: '@', // A bool/string to define if the element will always be in editable mode
      autoSave: '@', // A bool/string to define if the model will auto save on focus out or Enter presses. Defaults to true
      froalaOptions: '=' // Expects JSON. Options pushed to froala need to be initialized, so it will be a one time push
    },
    controller: function ($q, $scope, $attrs, $element, $mdPanel, Collection, commonMethods, $timeout, $window) {
      // Initialize
      commonMethods.componentInitializer(this, $scope, $attrs, 'menu_link', true)

      var $ctrl = this
      $ctrl.$onInit = function () {
        // Variables
        $ctrl.showDialog = false
        $ctrl.allowEdit = false
        $ctrl.value = $ctrl.menuLink.name

        // Methods
        $ctrl.setEdit = setEdit
        $ctrl.accept = accept
        $ctrl.handleKeyup = handleKeyup
        $ctrl.show = show
        $ctrl.finishEdit = finishEdit
      }

      function finishEdit () {
        accept()
        setEdit(false)
      }

      function setEdit (bool) {
        if (bool) {
          $ctrl.allowEdit = bool
        } else {
          $ctrl.allowEdit = false
        }
      }

      // Helpers
      function handleKeyup ($event) {
        switch ($event.keyCode) {
          case 13:
            // Press Enter
            accept()
            break
          case 27:
            // Press Esc
            cancel()
            break
        }
      }

      function accept () {
        if ($ctrl.allowEdit) {
          $ctrl.menuLink.name = $ctrl.value
          setEdit(false)
        }
      }

      function cancel () {
        $ctrl.value = $ctrl.menuLink.name
        setEdit(false)
      }

      // FIXME: Need to click on a menu label twice to edit it
      function show ($event) {
        if ($ctrl.allowEdit) {
          var position = $mdPanel.newPanelPosition()
            .relativeTo($element)
            .addPanelPosition($mdPanel.xPosition.OFFSET_END, $mdPanel.yPosition.ALIGN_TOPS)

          $mdPanel.open({
            attachTo: angular.element(document.body),
            templateUrl: Stratus.BaseUrl + 'sitetheorystratus/stratus/components/menuLinkDialog' + (Stratus.Environment.get('production') ? '.min' : '') + '.html',
            panelClass: 'dialogueContainer',
            position: position,
            openFrom: $event,
            clickOutsideToClose: true,
            escapeToClose: false,
            focusOnOpen: false,
            locals: {
              menuLink: $ctrl.menuLink,
              versionData: $ctrl.versionData.meta.links
            },
            controller: function ($scope, mdPanelRef, menuLink, versionData) {
              var dc = this

              dc.$onInit = function () {
                dc.menuLink = menuLink

                if (menuLink.content) {
                  dc.linkTo = menuLink.content.version
                } else if (menuLink.url) {
                  dc.linkTo = menuLink.url
                }
              }

              dc.close = function () {
                if (mdPanelRef) {
                  accept()
                  mdPanelRef.close()
                }
              }

              dc.toggle = function () {
                console.log('toggle')
              }

              dc.destroy = function () {
                // remove child menu link
                for (var i = 0; i < versionData.length; i++) {
                  var elem = versionData[i]
                  if (elem.nestParent && elem.nestParent.id === menuLink.id) {
                    versionData.splice(i--, 1)
                  }
                }

                // remove parent
                versionData.splice(versionData.indexOf(menuLink), 1)
              }

              dc.addChild = function () {
                var childLink = {
                  name: 'Untitled Child',
                  parent: menuLink.parent,
                  nestParent: {
                    id: menuLink.id
                  }
                }
                versionData.push(childLink)
              }

              dc.changePriority = function (priority) {
                dc.menuLink.priority = (dc.menuLink.priority || 0) + priority
              }

              dc.getContentForMenu = function (query, target, urlRoot) {
                var collection = new Collection()
                collection.target = target
                collection.urlRoot = urlRoot
                return collection.filter(query).then(function (response) {
                  return response
                })
              }

              dc.handleSelection = function (query, type) {
                switch (type) {
                  case 'content':
                    dc.menuLink.url = null
                    dc.menuLink.content = query.data
                    break
                  case 'url':
                    dc.menuLink.url = query
                    dc.menuLink.content = null
                    break
                  case 'menulink':
                    if (query.data) {
                      dc.menuLink.nestParent = query.data
                    }
                    break
                }
              }
            },
            controllerAs: 'ctrl'
          })
        }
      }
    },
    templateUrl: Stratus.BaseUrl + 'sitetheorystratus/stratus/components/menuLink' + (Stratus.Environment.get('production') ? '.min' : '') + '.html'
  }
}))