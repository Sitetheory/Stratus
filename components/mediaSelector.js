//     Stratus.Components.mediaSelector.js 1.0

//     Copyright (c) 2016 by Sitetheory, All Rights Reserved
//
//     All information contained herein is, and remains the
//     property of Sitetheory and its suppliers, if any.
//     The intellectual and technical concepts contained herein
//     are proprietary to Sitetheory and its suppliers and may be
//     covered by U.S. and Foreign Patents, patents in process,
//     and are protected by trade secret or copyright law.
//     Dissemination of $scope information or reproduction of $scope
//     material is strictly forbidden unless prior written
//     permission is obtained from Sitetheory.
//
//     For full details and documentation:
//     http://docs.sitetheory.io

// Stratus Media Selector Component
// ----------------------
// Define AMD, Require.js, or Contextual Scope
console.log('drag again');
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([

            // Libraries
            'stratus',
            'underscore',
            'angular',

            // UI Additions
            'angular-material',

            // Modules
            'angular-file-upload',

            // Components
            'stratus.components.search',
            'stratus.components.pagination',
            //'stratus.components.library',

            // Directives
            'stratus.directives.singleClick',
            'stratus.directives.src',

            // Services
            'stratus.services.registry'
        ], factory);
    } else {
        factory(root.Stratus, root._);
    }
}(this, function (Stratus, _) {

    // We need to ensure the ng-file-upload and ng-cookies are registered
    Stratus.Modules.ngFileUpload = true;

    // This component intends to handle binding of an
    // item array into a particular attribute.
    Stratus.Components.MediaSelector = {
        bindings: {
            ngModel: '=',
            target: '@',
            limit: '@'
        },
        controller: function ($scope, $http, $attrs, $parse, $element, Upload, $compile, registry, $mdPanel, $q, $mdDialog) {
            Stratus.Instances[_.uniqueId('media_selector')] = $scope;

            // load component css
            Stratus.Internals.CssLoader(Stratus.BaseUrl + 'sitetheorystratus/stratus/components/mediaSelector' + (Stratus.Environment.get('production') ? '.min' : '') + '.css');

            // fetch media collection and hydrate to $scope.collection
            $scope.registry = new registry();
            $scope.registry.fetch({
                target: $attrs.target || 'Media',
                id: null,
                manifest: false,
                decouple: true,
                api: {
                    limit: _.isJSON($attrs.limit) ? JSON.parse($attrs.limit) : 30
                }
            }, $scope);

            // set media library to false
            $scope.showLibrary = false;
            $scope.showDragDropLibrary = false;
            $scope.draggedFiles = [];
            $scope.files = [];
            $scope.draggedDivChanged = false;
            $scope.dropDisabled = false;

            // Data Connectivity
            $scope.$watch('$ctrl.ngModel', function (data) {
                if (!_.isUndefined(data) && !_.isEqual($scope.draggedFiles, data)) {
                    $scope.draggedFiles = data || [];
                }
            });
            $scope.$watch('draggedFiles', function (data) {
                if (_.isUndefined($scope.$ctrl.ngModel) || !_.isEqual($scope.draggedFiles, $scope.$ctrl.ngModel)) {
                    $scope.$ctrl.ngModel = $scope.draggedFiles;
                }
            }, true);

            // done button when uploading is finished
            $scope.uploadComp = false;

            $scope.movedFileId = '';

            // $scope.selectedListDiv =  false;
            $scope.errorUpload = false;

            // UI Settings
            $scope.libraryVisible = false;
            $scope.dragLibraryVisible = false;

            $scope.zoomView = function (event) {

                
                //$scope.imageWidth = null;
                $scope.mediaDetail = event;

                $scope.mediaDescription = [{
                    name: "iVestibulum pulvinar tristique risus vel molestie. Sed ut elit consequat, luctus turpis nec, hendrerit dolor. Sed interdum erat at enim molestie eleifend.",
                    editing: false
                }];

                console.log($scope.mediaDescription);
                //$scope.imageWidth = ("http://"+$scope.mediaDetail.file+"."+$scope.mediaDetail.extension)
                //alert($scope.imageWidth);
                var position = $mdPanel.newPanelPosition()
                    .absolute()
                    .center();
                var config = {
                    attachTo: angular.element(document.body),
                    scope: $scope,
                    disableParentScroll: this.disableParentScroll,
                    controller: ZoomController,
                    templateUrl: 'mediaDetail.html',
                    hasBackdrop: true,
                    panelClass: 'media-dialog',
                    position: position,
                    trapFocus: true,
                    zIndex: 150,
                    clickOutsideToClose: false,
                    escapeToClose: true,
                    focusOnOpen: true
                };

                $mdPanel.open(config);
            };
            $scope.draggedFileId = '';


            $scope.editItem = function (item) {
                    item.editing = true;
                }

                $scope.doneEditing = function (item) {
                    item.editing = false;
                    //dong some background ajax calling for persistence...
                };

            // track drag event on selected list
            $scope.dragSelected = function ($isDragging, $class, $event) {

                // console.log(fileId);
                if ($event.type === 'dragover') {
                    if ($event.explicitOriginalTarget.id !== '') {
                        $scope.draggedFileId = $event.explicitOriginalTarget.id;
                    }
                }
                if ($event.type === 'dragleave') {

                    $scope.removeFromSelected(parseInt($scope.draggedFileId));
                }
            };

            $scope.beforeChange = function (file, $event) {
                if ($event.dataTransfer.dropEffect === 'move') {
                    $http({
                       method: 'GET',
                       url: '/Api/Media/' + $scope.movedFileId
                   }).then(function (response) {
                       $scope.draggedFiles.push(response.data.payload);
                       for (var i = 0; i < $scope.collection.models.length; i++) {
                           if ($scope.collection.models[i].data.id === $scope.movedFileId) {
                               // add class selected
                               $scope.collection.models[i].data.selectedClass = true;
                           }
                       }
                       $scope.movedFileId = '';

                   }, function (rejection) {
                       console.log(rejection.data);
                   });
                }else {
                    // FIXME: There is a random comparison below
                    $scope.imageMoved = false;
                    $scope.uploadFiles();
                    $scope.movedFileId = '';
                }
            };
            $scope.imageMoved = false;
            $scope.dragFromLib = function ($isDragging, $class, $event, fileId) {
                console.log('isDragging', $isDragging);
                console.log('event', $event);
                console.log('fileId', fileId);
                if ($event.type === 'dragleave') {
                    $scope.movedFileId = fileId;
                    $scope.imageMoved = true;
                }
            };
            $scope.dragClass = false;

            // function called when is uploaded or drag/dropped
            $scope.uploadFiles = function (files) {
                // hide if media library is opened on click
                $scope.showLibrary = false;
                $scope.uploadComp = false;

                $scope.draggedDivChanged = true;

                // done button when uploading is finished
                // $scope.uploadComp = false;
                var position = $mdPanel.newPanelPosition()
                    .absolute()
                    .center();
                var config = {
                    attachTo: angular.element(document.body),
                    scope: $scope,
                    controller: DialogController,
                    controllerAs: 'ctrl',
                    id: 'uploadPanel',
                    disableParentScroll: this.disableParentScroll,
                    templateUrl: 'uploadedFiles.html',
                    hasBackdrop: true,
                    panelClass: 'media-dialog',
                    position: position,
                    trapFocus: true,
                    zIndex: 150,
                    clickOutsideToClose: false,
                    escapeToClose: false,
                    focusOnOpen: true
                };
                $mdPanel.open(config);

                // check if media library already opened, then load media library
                if ($scope.dragLibraryVisible) {
                    $scope.dragLibraryVisible = true;

                    // $scope.uploadMedia();
                }
            };

            // remove media file from selected list
            $scope.removeFromSelected = function (fileId) {

                //mdPanelRef.close();
                var confirm = $mdDialog.confirm()
                    .title('DELETE MEDIA')
                    .htmlContent('Are you sure you want to  delete this from your library? <br>You may get broken images if any content still uses this image.')

                    //  .ariaLabel('Lucky day')
                    // .targetEvent(ev)
                    .ok('Yes')
                    .cancel('No');

                $mdDialog.show(confirm).then(function () {
                    for (var i = $scope.draggedFiles.length - 1; i >= 0; i--) {
                        // used double precision because id uis passed as string in event
                        if ($scope.draggedFiles[i].id === fileId) {

                            $scope.draggedFiles.splice(i, 1);
                        }
                    }
                    for (var j = 0; j < $scope.collection.models.length; j++) {
                        // used double precision because id uis passed as string in event
                        if ($scope.collection.models[j].data.id === fileId) {
                            $scope.collection.models[j].data.selectedClass = false;
                        }
                    }
                });



                
            };

            // upload directly to media library
            $scope.uploadToLibrary = function (files) {
                // update scope of files for watch
                $scope.uploadComp = false;
                $scope.imageMoved = false;

                // set this variable to false,when media is dragged to media library
                $scope.draggedDivChanged = false;

                var position = $mdPanel.newPanelPosition()
                    .absolute()
                    .center();
                var config = {
                    attachTo: angular.element(document.body),
                    scope: $scope,
                    controller: DialogController,
                    controllerAs: 'ctrl',
                    disableParentScroll: this.disableParentScroll,
                    templateUrl: 'uploadedFiles.html',
                    hasBackdrop: true,
                    panelClass: 'media-dialog',
                    position: position,
                    trapFocus: true,
                    zIndex: 150,
                    clickOutsideToClose: false,
                    escapeToClose: false,
                    focusOnOpen: true
                };
                $mdPanel.open(config);
                $scope.files = files;

                // updateFilesModel(files);

            };

            // open library div when clicked on upper browse div
            $scope.openLibrary = function () {
                // show library media
                if (!$scope.libraryVisible) {
                    // twiddle
                    $scope.libraryVisible = true;
                    $scope.dragLibraryVisible = false;

                    // switch to registry controls
                    $scope.uploadMedia();
                } else if ($scope.libraryVisible) {
                    // twiddle
                    $scope.libraryVisible = false;
                }
            };

            // open media library when clicked on plus icon
            $scope.mediaLibrary = function () {
                if (!$scope.dragLibraryVisible) {
                    // twiddle
                    $scope.libraryVisible = false;
                    $scope.dragLibraryVisible = true;

                    // load media library
                    $scope.uploadMedia();
                } else if ($scope.dragLibraryVisible) {
                    // twiddle
                    $scope.libraryVisible = false;
                    $scope.dragLibraryVisible = false;
                }
            };

            // common function to load media library from collection
            $scope.uploadMedia = function () {
                // switch to registry controls
                $scope.collection.fetch().then(function (response) {
                    for (var i = 0; i < $scope.collection.models.length; i++) {
                        if ($scope.draggedFiles && $scope.draggedFiles.length > 0) {
                            for (var j = 0; j < $scope.draggedFiles.length; j++) {
                                if ($scope.draggedFiles[j].id === $scope.collection.models[i].data.id) {
                                    $scope.collection.models[i].data.selectedClass = true;
                                }
                            }
                        } else {
                            $scope.collection.models[i].data.selectedClass = false;
                        }
                    }
                });
            };

            // check if ng-model value changes
            $scope.$watch('files', function (files) {

                if (files !== null) {
                    $scope.dragClass = false;

                    // make files array for not multiple to be able to be used in ng-repeat in the ui
                    if (!angular.isArray(files)) {
                        $timeout(function () {
                            $scope.files = files = [files];
                        });
                        return;
                    }
                    var promises = [];
                    for (var i = 0; i < files.length; i++) {
                        $scope.errorMsg = null;
                        (function (f) {
                            // setTimeout(function(){ promises.push($scope.saveMedia(f)); }, 3000);
                            if ($scope.imageMoved === false) {
                                promises.push($scope.saveMedia(f));
                            }

                        })(files[i]);

                    }

                    // show done button when all promises are completed
                    if (promises.length > 0) {
                        $q.all(promises).then(function (data) {
                            $scope.uploadComp = true;
                            $scope.uploadMedia();
                            if ($scope.draggedDivChanged === true) {
                                angular.forEach(data, function (dragged) {
                                    $scope.draggedFiles.push(dragged.data);

                                });

                            }
                        }).catch(function (error) {
                            $scope.uploadComp = true;
                        });
                    }
                }
            });

            // close mdPanel when all images are uploaded
            function DialogController(mdPanelRef) {
                $scope.closeDialog = function () {
                    mdPanelRef.close();
                };
            }

            function updateFilesModel(files)
            {
                if (files !== null) {
                    // make files array for not multiple to be able to be used in ng-repeat in the ui
                    if (!angular.isArray(files)) {
                        $timeout(function () {
                            $scope.files = files = [files];
                        });
                        return;
                    }
                    var promises = [];
                    for (var i = 0; i < files.length; i++) {
                        $scope.errorMsg = null;
                        (function (f) {
                            promises.push($scope.saveMedia(f));
                        })(files[i]);
                    }

                    // show done button when all promises are completed
                    if (promises.length > 0) {
                        $q.all(promises).then(function (data) {
                            $scope.uploadComp = true;
                            $scope.uploadMedia();
                            if ($scope.draggedDivChanged === true) {
                                angular.forEach(data, function (dragged) {
                                    $scope.draggedFiles.push(dragged.data);
                                });

                            }
                        }).catch(function (error) {
                            $scope.uploadComp = true;
                        });

                    }
                }
            }

            // common function to save media to server
            $scope.saveMedia = function (file) {
                file.errorMsg = null;
                file.uploadStatus = false;
                file.errorUpload = false;
                file.upload = Upload.upload({
                        url: 'https://app.sitetheory.io:3000/?session=' + _.cookie('SITETHEORY'),
                        data: {
                            file: file
                        }
                    });
                file.upload.then(function (response) {
                    file.result = response.data;

                    // set status of upload to success
                    file.uploadStatus = true;
                    file.errorUpload = false;
                }, function (response) {
                    // if file is aborted handle error messages
                    if (response.config.data.file.upload.aborted === true) {
                        file.uploadStatus = false;

                        // show cross icon if upload failed
                        file.errorUpload = true;
                        file.errorMsg = 'Aborted';
                    }

                    // if file not uploaded due to server error
                    // else if (response.status > 0)
                    else {
                        // hide progress bar
                        file.uploadStatus = false;

                        // show cross icon if upload failed
                        file.errorUpload = true;

                        // $scope.errorMsg = response.status + ': ' + response.data;
                        file.errorMsg = 'Server Error!Please try again';
                    }
                });
                file.upload.progress(function (evt) {
                    // setTimeout(function(){ file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total)); }, 5000);
                    file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                });
                /* file.upload.xhr(function (xhr) {
                 xhr.upload.addEventListener('abort', function(){console.log('abort complete')}, false);
                 });*/
                return file.upload;

            };

            

            // controller for zoom panel
            function ZoomController(mdPanelRef) {
            
                // delete media from library
                $scope.deleteMediaFromLibrary = function (fileId) {
                    mdPanelRef.close();
                    var confirm = $mdDialog.confirm()
                        .title('DELETE MEDIA')
                        .htmlContent('Are you sure you want to permanently delete this from your library? <br>You may get broken images if any content still uses this image.')

                        //  .ariaLabel('Lucky day')
                        // .targetEvent(ev)
                        .ok('Yes')
                        .cancel('No');

                    $mdDialog.show(confirm).then(function () {
                        $http({
                            method: 'DELETE',
                            url: '/Api/Media/' + fileId
                        }).then(function (response) {
                            // check if deleted media is dragged above,then remove from selected list
                            if ($scope.draggedFiles.length > 0) {
                                for (var k = 0; k < $scope.draggedFiles.length; k++) {
                                    if ($scope.draggedFiles[k].id === fileId) {
                                        $scope.draggedFiles.splice(k, 1);
                                    }
                                }
                            }

                            // fetch media library list
                            $scope.uploadMedia();
                        }, function (rejection) {
                            console.log(rejection.data);
                        });

                    }, function () {
                        console.log('No');
                    });
                };

                $scope.closeZoom = function () {

                    mdPanelRef.close();
                };
            }

            // Manage classes on select/unselect media
            $scope.addDeleteMedia = function (selectedStatus, fileId, $event) {
                //alert("Calllee");
                // if selected status is true,remove from draggedFiles and add minus icon
                if (selectedStatus === true) {
                    for (var k = 0; k < $scope.draggedFiles.length; k++) {
                        if ($scope.draggedFiles[k].id === fileId) {
                            $scope.draggedFiles.splice(k, 1);
                            for (var j = 0; j < $scope.collection.models.length; j++) {
                                if ($scope.collection.models[j].data.id === fileId) {
                                    $scope.collection.models[j].data.selectedClass = false;
                                    angular.element($event.currentTarget).removeClass('minus_icon');
                                    angular.element($event.currentTarget).addClass('add_icon');
                                }
                            }
                        }
                    }
                } else if (selectedStatus === false || selectedStatus === undefined) { // show plus icon,move to draggedFiles and add selectedClass
                    $http({
                        method: 'GET',
                        url: '/Api/Media/' + fileId
                    }).then(function (response) {
                        $scope.draggedFiles.push(response.data.payload);
                        for (var j = 0; j < $scope.collection.models.length; j++) {
                            if ($scope.collection.models[j].data.id === fileId) {
                                $scope.collection.models[j].data.selectedClass = true;
                                angular.element($event.currentTarget).removeClass('add_icon');
                                angular.element($event.currentTarget).addClass('minus_icon');
                            }
                        }
                    });
                }

            };
        },
        templateUrl: Stratus.BaseUrl + 'sitetheorystratus/stratus/components/mediaSelector' + (Stratus.Environment.get('production') ? '.min' : '') + '.html'
    };

}));
