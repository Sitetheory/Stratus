/* global define */

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
      'stratus.services.commonMethods',
      'stratus.services.media'
    ], factory)
  } else {
    factory(root.Stratus, root._, root.jQuery, root.angular)
  }
}(this, function (Stratus, _, jQuery, angular) {
  Stratus.Components.MediaDragDrop = {
    controller: function ($scope, $mdDialog, $attrs, commonMethods, media) {
      // Initialize
      commonMethods.componentInitializer(this, $scope, $attrs,
        'media_drag_drop', true)

      // Code
      // var $ctrl = this
      $scope.isShowDialog = angular.element(document.body).hasClass('md-dialog-is-showing')
      $scope.files = []

      // document.addEventListener('dragenter', media.dragenter, false);
      // document.addEventListener('dragleave', media.dragleave, false);
      // document.addEventListener('drop', drop, false);

      jQuery(window).focus(function () {
        jQuery('.drag-drop').removeClass('show-overlay')
      }).blur(function () {
        jQuery('.drag-drop').addClass('show-overlay')
      })

      function drop (event) {
        if (!angular.element(document.body).hasClass('md-dialog-is-showing')) {
          $scope.files = $scope.files.concat(
            Array.from(event.dataTransfer.files))
          $mdDialog.show({
            controller: DialogController,
            locals: {
              files: event.dataTransfer.files
            },
            templateUrl: Stratus.BaseUrl +
           Stratus.BundlePath + 'components/mediaDragDropDialog' +
            (Stratus.Environment.get('production') ? '.min' : '') + '.html',
            parent: angular.element(document.body),
            clickOutsideToClose: false
          })
        }
      }
      $scope.drop = drop

      function DialogController ($scope, files) {
        // Do upload stuffs
        $scope.files = files

        $scope.done = function () {
          $mdDialog.hide()
          media.dragleave()
        }

        $scope.cancel = function () {
          $mdDialog.cancel()
          media.dragleave()
        }

        $scope.addFiles = function (newFiles) {
          if (newFiles.length > 0) {
            $scope.files = Array.from($scope.files).concat(newFiles)
          }
        }

        $scope.removeFiles = function (file) {
          $scope.files = _.without($scope.files, file)
        }

        $scope.$watch('files', function (oldFiles, newFiles) {
          console.log(oldFiles)
          console.log(newFiles)
        })
      }

      function saveMedia (file) {
        if (!Stratus.Environment.get('production')) {
          console.log(['savemedia'], file)
        }

        file.errorMsg = null
        file.uploadStatus = false
        file.errorUpload = false
        file.upload = media.uploadToS3(file)

        file.upload.then(
          function (response) {
            file.result = response.data

            // set status of upload to success
            file.uploadStatus = true
            file.errorUpload = false
            $scope.infoId = null
            $scope.imageSrc = file.result.url
          },
          function (rejection) {
            // if file is aborted handle error messages
            if (rejection.config.data.file.upload.aborted === true) {
              file.uploadStatus = false

              // show cross icon if upload failed
              file.errorUpload = true
              file.errorMsg = 'Aborted'

              // if file not uploaded due to server error
              // else if (rejection.status > 0)
            } else {
              // hide progress bar
              file.uploadStatus = false

              // show cross icon if upload failed
              file.errorUpload = true

              // $scope.errorMsg = rejection.status + ': ' + rejection.data;
              file.errorMsg = 'Server Error! Please try again'
            }
          }
        )

        file.upload.progress(function (evt) {
          file.progress = Math.min(100,
            parseInt(100.0 * evt.loaded / evt.total))
        })

        return file.upload
      }
      $scope.saveMedia = saveMedia
    },
    templateUrl: Stratus.BaseUrl +
   Stratus.BundlePath + 'components/mediaDragDrop' +
    (Stratus.Environment.get('production') ? '.min' : '') + '.html'
  }
}))
