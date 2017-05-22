(function(angular, $, oc_requesttoken, undefined){
	'use strict';



var app = angular.module('Calendar', ['ui.bootstrap']);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };


app.config(['$provide', '$httpProvider', function ($provide, $httpProvider) {
	'use strict';

	$httpProvider.defaults.headers.common.requesttoken = oc_requesttoken;

	ICAL.design.defaultSet.param['x-oc-group-id'] = {
		allowXName: true
	};

	angular.forEach($.fullCalendar.locales, function (obj, locale) {
		$.fullCalendar.locale(locale, {
			timeFormat: obj.mediumTimeFormat
		});

		var propsToCheck = ['extraSmallTimeFormat', 'hourFormat', 'mediumTimeFormat', 'noMeridiemTimeFormat', 'smallTimeFormat'];

		angular.forEach(propsToCheck, function (propToCheck) {
			if (obj[propToCheck]) {
				var overwrite = {};
				overwrite[propToCheck] = obj[propToCheck].replace('HH', 'H');

				$.fullCalendar.locale(locale, overwrite);
			}
		});
	});

	var isFirstRun = angular.element('#fullcalendar').attr('data-firstRun') === 'yes';
	$provide.constant('isFirstRun', isFirstRun);

	var isPublic = angular.element('#fullcalendar').attr('data-isPublic') === '1';
	$provide.constant('isPublic', isPublic);

	var isEmbedded = angular.element('#fullcalendar').attr('data-isEmbedded') === '1';
	$provide.constant('isEmbedded', isEmbedded);

	var isSharingAPI = _typeof(OC.Share) === 'object';
	$provide.constant('isSharingAPI', isSharingAPI);

	var skipPopover = angular.element('#fullcalendar').attr('data-skipPopover') === 'yes';
	var showWeekNr = angular.element('#fullcalendar').attr('data-weekNumbers') === 'yes';
	$provide.constant('settings', { skipPopover: skipPopover, showWeekNr: showWeekNr });

	var initialView = angular.element('#fullcalendar').attr('data-initialView');
	var emailAddress = angular.element('#fullcalendar').attr('data-emailAddress');
	var fallbackColor = angular.element('#fullcalendar').attr('data-defaultColor');
	var needsWebCalWorkaround = angular.element('#fullcalendar').attr('data-webCalWorkaround') === 'yes';
	var version = angular.element('#fullcalendar').attr('data-appVersion');
	var publicSharingToken = angular.element('#fullcalendar').attr('data-publicSharingToken');
	var shareeCanEditShares = angular.element('#fullcalendar').attr('data-shareeCanEditShares') === 'yes';
	var shareeCanEditCalendarProperties = angular.element('#fullcalendar').attr('data-shareeCanEditCalendarProperties') === 'yes';
	$provide.constant('constants', {
		initialView: initialView,
		emailAddress: emailAddress,
		fallbackColor: fallbackColor,
		needsWebCalWorkaround: needsWebCalWorkaround,
		version: version,
		publicSharingToken: publicSharingToken,
		shareeCanEditShares: shareeCanEditShares,
		shareeCanEditCalendarProperties: shareeCanEditCalendarProperties,
		SHARE_TYPE_USER: 0,
		SHARE_TYPE_GROUP: 1
	});
}]);
'use strict';


app.run(['$document', '$rootScope', '$window', 'isPublic', function ($document, $rootScope, $window, isPublic) {
  'use strict';

  var origin = $window.location.origin;
  $rootScope.root = origin + OC.linkTo('calendar', 'index.php') + '/';
  $rootScope.baseUrl = $rootScope.root + 'v1/';

  try {
    if (!isPublic) {
      var webcalHandler = $rootScope.root + '#subscribe_to_webcal?url=%s';
      navigator.registerProtocolHandler('webcal', webcalHandler, 'Nextcloud calendar');
    }
  } catch (e) {
    console.log(e);
  }

  $document.click(function (event) {
    $rootScope.$broadcast('documentClicked', event);
  });
}]);
'use strict';


app.controller('AttendeeController', ["$scope", "AutoCompletionService", function ($scope, AutoCompletionService) {
	'use strict';

	$scope.newAttendeeGroup = -1;

	$scope.cutstats = [{ displayname: t('calendar', 'Individual'), val: 'INDIVIDUAL' }, { displayname: t('calendar', 'Group'), val: 'GROUP' }, { displayname: t('calendar', 'Resource'), val: 'RESOURCE' }, { displayname: t('calendar', 'Room'), val: 'ROOM' }, { displayname: t('calendar', 'Unknown'), val: 'UNKNOWN' }];

	$scope.partstats = [{ displayname: t('calendar', 'Required'), val: 'REQ-PARTICIPANT' }, { displayname: t('calendar', 'Optional'), val: 'OPT-PARTICIPANT' }, { displayname: t('calendar', 'Does not attend'), val: 'NON-PARTICIPANT' }];

	$scope.$parent.registerPostHook(function () {
		$scope.properties.attendee = $scope.properties.attendee || [];
		if ($scope.properties.attendee.length > 0 && $scope.properties.organizer === null) {
			$scope.properties.organizer = {
				value: 'MAILTO:' + $scope.$parent.emailAddress,
				parameters: {
					cn: OC.getCurrentUser().displayName
				}
			};
		}
	});

	$scope.add = function (email) {
		if (email !== '') {
			$scope.properties.attendee = $scope.properties.attendee || [];
			$scope.properties.attendee.push({
				value: 'MAILTO:' + email,
				group: $scope.newAttendeeGroup--,
				parameters: {
					'role': 'REQ-PARTICIPANT',
					'rsvp': 'TRUE',
					'partstat': 'NEEDS-ACTION',
					'cutype': 'INDIVIDUAL'
				}
			});
		}
		$scope.attendeeoptions = false;
		$scope.nameofattendee = '';
	};

	$scope.remove = function (attendee) {
		$scope.properties.attendee = $scope.properties.attendee.filter(function (elem) {
			return elem.group !== attendee.group;
		});
	};

	$scope.search = function (value) {
		return AutoCompletionService.searchAttendee(value).then(function (attendees) {
			var arr = [];

			attendees.forEach(function (attendee) {
				var emailCount = attendee.email.length;
				attendee.email.forEach(function (email) {
					var displayname = void 0;
					if (emailCount === 1) {
						displayname = attendee.name;
					} else {
						displayname = t('calendar', '{name} ({email})', {
							name: attendee.name,
							email: email
						});
					}

					arr.push({
						displayname: displayname,
						email: email,
						name: attendee.name
					});
				});
			});

			return arr;
		});
	};

	$scope.selectFromTypeahead = function (item) {
		$scope.properties.attendee = $scope.properties.attendee || [];
		$scope.properties.attendee.push({
			value: 'MAILTO:' + item.email,
			parameters: {
				cn: item.name,
				role: 'REQ-PARTICIPANT',
				rsvp: 'TRUE',
				partstat: 'NEEDS-ACTION',
				cutype: 'INDIVIDUAL'
			}
		});
		$scope.nameofattendee = '';
	};
}]);
'use strict';



app.controller('CalController', ['$scope', 'Calendar', 'CalendarService', 'VEventService', 'SettingsService', 'TimezoneService', 'VEvent', 'is', 'fc', 'EventsEditorDialogService', 'PopoverPositioningUtility', '$window', 'isPublic', 'constants', function ($scope, Calendar, CalendarService, VEventService, SettingsService, TimezoneService, VEvent, is, fc, EventsEditorDialogService, PopoverPositioningUtility, $window, isPublic, constants) {
	'use strict';

	is.loading = true;

	$scope.calendars = [];
	$scope.eventSource = {};
	$scope.defaulttimezone = TimezoneService.current();
	$scope.eventModal = null;
	var switcher = [];

	function showCalendar(url) {
		if (switcher.indexOf(url) === -1 && $scope.eventSource[url].isRendering === false) {
			switcher.push(url);
			fc.elm.fullCalendar('removeEventSource', $scope.eventSource[url]);
			fc.elm.fullCalendar('addEventSource', $scope.eventSource[url]);
		}
	}

	function hideCalendar(url) {
		fc.elm.fullCalendar('removeEventSource', $scope.eventSource[url]);
		if (switcher.indexOf(url) !== -1) {
			switcher.splice(switcher.indexOf(url), 1);
		}
	}

	function createAndRenderEvent(calendar, data, start, end, tz) {
		VEventService.create(calendar, data).then(function (vevent) {
			if (calendar.enabled) {
				fc.elm.fullCalendar('refetchEventSources', calendar.fcEventSource);
			}
		});
	}

	function deleteAndRemoveEvent(vevent, fcEvent) {
		VEventService.delete(vevent).then(function () {
			fc.elm.fullCalendar('removeEvents', fcEvent.id);
		});
	}

	$scope.$watchCollection('calendars', function (newCalendars, oldCalendars) {
		newCalendars.filter(function (calendar) {
			return oldCalendars.indexOf(calendar) === -1;
		}).forEach(function (calendar) {
			$scope.eventSource[calendar.url] = calendar.fcEventSource;
			if (calendar.enabled) {
				showCalendar(calendar.url);
			}

			calendar.register(Calendar.hookEnabledChanged, function (enabled) {
				if (enabled) {
					showCalendar(calendar.url);
				} else {
					hideCalendar(calendar.url);
				}
			});

			calendar.register(Calendar.hookColorChanged, function () {
				if (calendar.enabled) {
					hideCalendar(calendar.url);
					showCalendar(calendar.url);
				}
			});
		});

		oldCalendars.filter(function (calendar) {
			return newCalendars.indexOf(calendar) === -1;
		}).forEach(function (calendar) {
			var url = calendar.url;
			hideCalendar(calendar.url);

			delete $scope.eventSource[url];
		});
	});

	TimezoneService.get($scope.defaulttimezone).then(function (timezone) {
		if (timezone) {
			ICAL.TimezoneService.register($scope.defaulttimezone, timezone.jCal);
		}
	}).catch(function () {
		OC.Notification.showTemporary(t('calendar', 'You are in an unknown timezone ({tz}), falling back to UTC', {
			tz: $scope.defaulttimezone
		}));

		$scope.defaulttimezone = 'UTC';
		$scope.fcConfig.timezone = 'UTC';
		fc.elm.fullCalendar('option', 'timezone', 'UTC');
	});

	if (!isPublic) {
		$scope.calendarsPromise = CalendarService.getAll().then(function (calendars) {
			$scope.calendars = calendars;
			is.loading = false;
			$scope.$apply();
		});
	} else {
		$scope.calendarsPromise = CalendarService.getPublicCalendar(constants.publicSharingToken).then(function (calendar) {
			$scope.calendars = [calendar];
			is.loading = false;
			$scope.$apply();
		}).catch(function (reason) {
			angular.element('#header-right').css('display', 'none');
			angular.element('#emptycontent-container').css('display', 'block');
		});
	}

	$scope.fcConfig = {
		timezone: $scope.defaulttimezone,
		select: function select(start, end, jsEvent, view) {
			var writableCalendars = $scope.calendars.filter(function (elem) {
				return elem.isWritable();
			});

			if (writableCalendars.length === 0) {
				if (!isPublic) {
					OC.Notification.showTemporary(t('calendar', 'Please create a calendar first.'));
				}
				return;
			}

			start.add(start.toDate().getTimezoneOffset(), 'minutes');
			end.add(end.toDate().getTimezoneOffset(), 'minutes');

			var vevent = VEvent.fromStartEnd(start, end, $scope.defaulttimezone);
			vevent.calendar = writableCalendars[0];

			var timestamp = Date.now();
			var fcEventClass = 'new-event-dummy-' + timestamp;

			vevent.getFcEvent(view.start, view.end, $scope.defaulttimezone).then(function (fcEvents) {
				var fcEvent = fcEvents[0];

				fcEvent.title = t('calendar', 'New event');
				fcEvent.className.push(fcEventClass);
				fcEvent.editable = false;
				fc.elm.fullCalendar('renderEvent', fcEvent);

				EventsEditorDialogService.open($scope, fcEvent, function () {
					var elements = angular.element('.' + fcEventClass);
					var isHidden = angular.element(elements[0]).parents('.fc-limited').length !== 0;
					if (isHidden) {
						return PopoverPositioningUtility.calculate(jsEvent.clientX, jsEvent.clientY, jsEvent.clientX, jsEvent.clientY, view);
					} else {
						return PopoverPositioningUtility.calculateByTarget(elements[0], view);
					}
				}, function () {
					return null;
				}, function () {
					fc.elm.fullCalendar('removeEvents', function (fcEventToCheck) {
						if (Array.isArray(fcEventToCheck.className)) {
							return fcEventToCheck.className.indexOf(fcEventClass) !== -1;
						} else {
							return false;
						}
					});
				}).then(function (result) {
					createAndRenderEvent(result.calendar, result.vevent.data, view.start, view.end, $scope.defaulttimezone);
				}).catch(function (reason) {
					return null;
				});
			});
		},
		eventClick: function eventClick(fcEvent, jsEvent, view) {
			var vevent = fcEvent.vevent;
			var oldCalendar = vevent.calendar;
			var fcEvt = fcEvent;

			EventsEditorDialogService.open($scope, fcEvent, function () {
				return PopoverPositioningUtility.calculateByTarget(jsEvent.currentTarget, view);
			}, function () {
				fcEvt.editable = false;
				fc.elm.fullCalendar('updateEvent', fcEvt);
			}, function () {
				fcEvt.editable = fcEvent.calendar.writable;
				fc.elm.fullCalendar('updateEvent', fcEvt);
			}).then(function (result) {
				if (result.calendar === oldCalendar) {
					VEventService.update(vevent).then(function () {
						fc.elm.fullCalendar('removeEvents', fcEvent.id);

						if (result.calendar.enabled) {
							fc.elm.fullCalendar('refetchEventSources', result.calendar.fcEventSource);
						}
					});
				} else {
					deleteAndRemoveEvent(vevent, fcEvent);
					createAndRenderEvent(result.calendar, result.vevent.data, view.start, view.end, $scope.defaulttimezone);
				}
			}).catch(function (reason) {
				if (reason === 'delete') {
					deleteAndRemoveEvent(vevent, fcEvent);
				}
			});
		},
		eventResize: function eventResize(fcEvent, delta, revertFunc) {
			fcEvent.resize(delta);
			VEventService.update(fcEvent.vevent).catch(function () {
				revertFunc();
			});
		},
		eventDrop: function eventDrop(fcEvent, delta, revertFunc) {
			var isAllDay = !fcEvent.start.hasTime();

			var defaultAllDayEventDuration = fc.elm.fullCalendar('option', 'defaultAllDayEventDuration');
			var defaultAllDayEventMomentDuration = moment.duration(defaultAllDayEventDuration);

			var defaultTimedEventDuration = fc.elm.fullCalendar('option', 'defaultTimedEventDuration');
			var defaultTimedEventMomentDuration = moment.duration(defaultTimedEventDuration);

			var timezone = $scope.defaulttimezone;

			fcEvent.drop(delta, isAllDay, timezone, defaultTimedEventMomentDuration, defaultAllDayEventMomentDuration);
			VEventService.update(fcEvent.vevent).catch(function () {
				revertFunc();
			});
		},
		viewRender: function viewRender(view, element) {
			angular.element('#firstrow').find('.datepicker_current').html(view.title).text();
			angular.element('#datecontrol_date').datepicker('setDate', element.fullCalendar('getDate'));
			var newView = view.name;
			if (newView !== $scope.defaultView && !isPublic) {
				SettingsService.setView(newView);
				$scope.defaultView = newView;
			}
			if (newView === 'agendaDay') {
				angular.element('td.fc-state-highlight').css('background-color', '#ffffff');
			} else {
				angular.element('.fc-bg td.fc-state-highlight').css('background-color', '#ffa');
			}
			if (newView === 'agendaWeek') {
				element.fullCalendar('option', 'aspectRatio', 0.1);
			} else {
				element.fullCalendar('option', 'aspectRatio', 1.35);
			}
		},
		eventRender: function eventRender(event, element) {
			var status = event.getSimpleEvent().status;
			if (status !== null) {
				if (status.value === 'TENTATIVE') {
					element.css({ 'opacity': 0.5 });
				} else if (status.value === 'CANCELLED') {
					element.css({
						'text-decoration': 'line-through',
						'opacity': 0.5
					});
				}
			}
		}
	};
}]);
'use strict';



app.controller('CalendarListController', ['$scope', '$rootScope', '$window', 'HashService', 'CalendarService', 'WebCalService', 'is', 'CalendarListItem', 'Calendar', 'MailerService', 'ColorUtility', 'isSharingAPI', 'constants', function ($scope, $rootScope, $window, HashService, CalendarService, WebCalService, is, CalendarListItem, Calendar, MailerService, ColorUtility, isSharingAPI, constants) {
	'use strict';

	$scope.calendarListItems = [];
	$scope.is = is;
	$scope.newCalendarInputVal = '';
	$scope.newCalendarColorVal = '';

	$scope.subscription = {};
	$scope.subscription.newSubscriptionUrl = '';
	$scope.subscription.newSubscriptionLocked = false;
	$scope.publicdav = 'CalDAV';
	$scope.publicdavdesc = t('calendar', 'CalDAV address for clients');

	$scope.isSharingAPI = isSharingAPI;

	$scope.$watchCollection('calendars', function (newCalendars, oldCalendars) {
		newCalendars = newCalendars || [];
		oldCalendars = oldCalendars || [];

		newCalendars.filter(function (calendar) {
			return oldCalendars.indexOf(calendar) === -1;
		}).forEach(function (calendar) {
			var item = CalendarListItem(calendar);
			if (item) {
				$scope.calendarListItems.push(item);
				$scope.publicdavurl = $scope.$parent.calendars[0].caldav;
				calendar.register(Calendar.hookFinishedRendering, function () {
					if (!$scope.$$phase) {
						$scope.$apply();
					}
				});
			}
		});

		oldCalendars.filter(function (calendar) {
			return newCalendars.indexOf(calendar) === -1;
		}).forEach(function (calendar) {
			$scope.calendarListItems = $scope.calendarListItems.filter(function (itemToCheck) {
				return itemToCheck.calendar !== calendar;
			});
		});
	});

	$scope.create = function (name, color) {
		CalendarService.create(name, color).then(function (calendar) {
			$scope.calendars.push(calendar);
			$rootScope.$broadcast('createdCalendar', calendar);
			$rootScope.$broadcast('reloadCalendarList');
		});

		$scope.newCalendarInputVal = '';
		$scope.newCalendarColorVal = '';
		angular.element('#new-calendar-button').click();
	};

	$scope.createSubscription = function (url) {
		$scope.subscription.newSubscriptionLocked = true;
		WebCalService.get(url).then(function (splittedICal) {
			var color = splittedICal.color || ColorUtility.randomColor();
			var name = splittedICal.name || url;

			if (name.length > 100) {
				name = name.substr(0, 100);
			}

			CalendarService.createWebCal(name, color, url).then(function (calendar) {
				angular.element('#new-subscription-button').click();
				$scope.calendars.push(calendar);
				$scope.subscription.newSubscriptionUrl = '';
				$scope.$digest();
				$scope.$parent.$digest();
				$scope.subscription.newSubscriptionLocked = false;
			}).catch(function () {
				OC.Notification.showTemporary(t('calendar', 'Error saving WebCal-calendar'));
				$scope.subscription.newSubscriptionLocked = false;
			});
		}).catch(function (reason) {
			if (reason.error) {
				OC.Notification.showTemporary(reason.message);
				$scope.subscription.newSubscriptionLocked = false;
			} else if (reason.redirect) {
				$scope.createSubscription(reason.new_url);
			}
		});
	};

	$scope.download = function (item) {
		$window.open(item.calendar.downloadUrl);
	};

	$scope.integration = function (item) {
		return '<iframe width="400" height="215" src="' + item.publicEmbedURL + '"></iframe>';
	};

	$scope.$watch('publicdav', function (newvalue) {
		if ($scope.$parent.calendars[0]) {
			if (newvalue === 'CalDAV') {
				$scope.publicdavurl = $scope.$parent.calendars[0].caldav;
				$scope.publicdavdesc = t('calendar', 'CalDAV address for clients');
			} else {
				var url = $scope.$parent.calendars[0].url;
				if (url.slice(url.length - 1) === '/') {
					url = url.slice(0, url.length - 1);
				}
				url += '?export';
				$scope.publicdavurl = $window.location.origin + url;
				$scope.publicdavdesc = t('calendar', 'WebDAV address for subscriptions');
			}
		}
	});

	$scope.sendMail = function (item) {
		item.toggleSendingMail();
		MailerService.sendMail(item.email, item.publicSharingURL, item.calendar.displayname).then(function (response) {
			if (response.status === 200) {
				item.email = '';
				OC.Notification.showTemporary(t('calendar', 'EMail has been sent.'));
			} else {
				OC.Notification.showTemporary(t('calendar', 'There was an issue while sending your EMail.'));
			}
		});
	};

	$scope.goPublic = function (item) {
		$window.open(item.publicSharingURL);
	};

	$scope.toggleSharesEditor = function (calendar) {
		calendar.toggleSharesEditor();
	};

	$scope.togglePublish = function (item) {
		if (item.calendar.published) {
			item.calendar.publish().then(function (response) {
				if (response) {
					CalendarService.get(item.calendar.url).then(function (calendar) {
						item.calendar.publicToken = calendar.publicToken;
						item.calendar.published = true;
					});
				}
				$scope.$apply();
			});
		} else {
			item.calendar.unpublish().then(function (response) {
				if (response) {
					item.calendar.published = false;
				}
				$scope.$apply();
			});
		}
	};

	$scope.prepareUpdate = function (calendar) {
		calendar.prepareUpdate();
	};

	$scope.onSelectSharee = function (item, model, label, calendar) {
		calendar.selectedSharee = '';
		calendar.share(item.type, item.identifier, false, false).then(function () {
			$scope.$apply();
		});
	};

	$scope.updateExistingUserShare = function (calendar, userId, writable) {
		calendar.share(constants.SHARE_TYPE_USER, userId, writable, true).then(function () {
			$scope.$apply();
		});
	};

	$scope.updateExistingGroupShare = function (calendar, groupId, writable) {
		calendar.share(constants.SHARE_TYPE_GROUP, groupId, writable, true).then(function () {
			$scope.$apply();
		});
	};

	$scope.unshareFromUser = function (calendar, userId) {
		calendar.unshare(constants.SHARE_TYPE_USER, userId).then(function () {
			$scope.$apply();
		});
	};

	$scope.unshareFromGroup = function (calendar, groupId) {
		calendar.unshare(constants.SHARE_TYPE_GROUP, groupId).then(function () {
			$scope.$apply();
		});
	};

	$scope.findSharee = function (val, calendar) {
		return $.get(OC.linkToOCS('apps/files_sharing/api/v1') + 'sharees', {
			format: 'json',
			search: val.trim(),
			perPage: 200,
			itemType: 'principals'
		}).then(function (result) {
			var users = result.ocs.data.exact.users.concat(result.ocs.data.users);
			var groups = result.ocs.data.exact.groups.concat(result.ocs.data.groups);

			var userShares = calendar.shares.users;
			var groupShares = calendar.shares.groups;
			var userSharesLength = userShares.length;
			var groupSharesLength = groupShares.length;
			var i, j;

			var usersLength = users.length;
			for (i = 0; i < usersLength; i++) {
				if (users[i].value.shareWith === OC.currentUser) {
					users.splice(i, 1);
					break;
				}
			}

			for (i = 0; i < userSharesLength; i++) {
				var share = userShares[i];
				usersLength = users.length;
				for (j = 0; j < usersLength; j++) {
					if (users[j].value.shareWith === share.id) {
						users.splice(j, 1);
						break;
					}
				}
			}

			users = users.map(function (item) {
				return {
					display: item.label,
					type: constants.SHARE_TYPE_USER,
					identifier: item.value.shareWith
				};
			});

			groups = groups.map(function (item) {
				return {
					display: item.label + ' (' + t('calendar', 'group') + ')',
					type: constants.SHARE_TYPE_GROUP,
					identifier: item.value.shareWith
				};
			});

			return groups.concat(users);
		});
	};

	$scope.performUpdate = function (item) {
		item.saveEditor();
		item.calendar.update().then(function () {
			$rootScope.$broadcast('updatedCalendar', item.calendar);
			$rootScope.$broadcast('reloadCalendarList');
		});
	};

	$scope.performUpdateShares = function (calendar) {
		calendar.update().then(function () {
			calendar.dropPreviousState();
			calendar.list.edit = false;
			$rootScope.$broadcast('updatedCalendar', calendar);
			$rootScope.$broadcast('reloadCalendarList');
		});
	};

	$scope.triggerEnable = function (item) {
		item.calendar.toggleEnabled();

		item.calendar.update().then(function () {
			$rootScope.$broadcast('updatedCalendarsVisibility', item.calendar);
			$rootScope.$broadcast('reloadCalendarList');
		});
	};

	$scope.remove = function (item) {
		item.calendar.delete().then(function () {
			$scope.$parent.calendars = $scope.$parent.calendars.filter(function (elem) {
				return elem !== item.calendar;
			});
			if (!$scope.$$phase) {
				$scope.$apply();
			}
		});
	};

	$rootScope.$on('reloadCalendarList', function () {
		if (!$scope.$$phase) {
			$scope.$apply();
		}
	});

	HashService.runIfApplicable('subscribe_to_webcal', function (map) {
		if (map.has('url')) {
			(function () {
				var url = map.get('url');

				$scope.subscription.newSubscriptionUrl = url;
				$scope.subscription.newSubscriptionLocked = true;
				angular.element('#new-subscription-button').click();

				$scope.calendarsPromise.then(function () {
					$scope.createSubscription(url);
				});
			})();
		}
	});
}]);
'use strict';


app.controller('DatePickerController', ['$scope', 'fc', 'uibDatepickerConfig', 'constants', function ($scope, fc, uibDatepickerConfig, constants) {
	'use strict';

	$scope.datepickerOptions = {
		formatDay: 'd'
	};

	function getStepSizeFromView() {
		switch ($scope.selectedView) {
			case 'agendaDay':
				return 'day';

			case 'agendaWeek':
				return 'week';

			case 'month':
				return 'month';
		}
	}

	$scope.dt = new Date();
	$scope.visibility = false;

	$scope.selectedView = constants.initialView;

	angular.extend(uibDatepickerConfig, {
		showWeeks: false,
		startingDay: parseInt(moment().startOf('week').format('d'))
	});

	$scope.today = function () {
		$scope.dt = new Date();
	};

	$scope.prev = function () {
		$scope.dt = moment($scope.dt).subtract(1, getStepSizeFromView()).toDate();
	};

	$scope.next = function () {
		$scope.dt = moment($scope.dt).add(1, getStepSizeFromView()).toDate();
	};

	$scope.toggle = function () {
		$scope.visibility = !$scope.visibility;
	};

	$scope.$watch('dt', function (newValue) {
		if (fc) {
			fc.elm.fullCalendar('gotoDate', newValue);
		}
	});

	$scope.$watch('selectedView', function (newValue) {
		if (fc) {
			fc.elm.fullCalendar('changeView', newValue);
		}
	});
}]);
'use strict';



app.controller('EditorController', ['$scope', 'TimezoneService', 'AutoCompletionService', '$timeout', '$window', '$uibModalInstance', 'vevent', 'simpleEvent', 'calendar', 'isNew', 'emailAddress', function ($scope, TimezoneService, AutoCompletionService, $timeout, $window, $uibModalInstance, vevent, simpleEvent, calendar, isNew, emailAddress) {
	'use strict';

	$scope.properties = simpleEvent;
	$scope.is_new = isNew;
	$scope.calendar = calendar;
	$scope.oldCalendar = isNew ? calendar : vevent.calendar;
	$scope.readOnly = !vevent.calendar.isWritable();
	$scope.accessibleViaCalDAV = vevent.calendar.eventsAccessibleViaCalDAV();
	$scope.selected = 0;
	$scope.timezones = [];
	$scope.emailAddress = emailAddress;
	$scope.edittimezone = $scope.properties.dtstart.parameters.zone !== 'floating' && $scope.properties.dtstart.parameters.zone !== $scope.defaulttimezone || $scope.properties.dtend.parameters.zone !== 'floating' && $scope.properties.dtend.parameters.zone !== $scope.defaulttimezone;

	$scope.preEditingHooks = [];
	$scope.postEditingHooks = [];

	$scope.tabs = [{ title: t('calendar', 'Details'), value: 0 }, { title: t('calendar', 'Attendees'), value: 1 }, { title: t('calendar', 'Reminders'), value: 2 }, { title: t('calendar', 'Repeating'), value: 3 }];

	$scope.classSelect = [{ displayname: t('calendar', 'When shared show full event'), type: 'PUBLIC' }, { displayname: t('calendar', 'When shared show only busy'), type: 'CONFIDENTIAL' }, { displayname: t('calendar', 'When shared hide this event'), type: 'PRIVATE' }];

	$scope.statusSelect = [{ displayname: t('calendar', 'Confirmed'), type: 'CONFIRMED' }, { displayname: t('calendar', 'Tentative'), type: 'TENTATIVE' }, { displayname: t('calendar', 'Cancelled'), type: 'CANCELLED' }];

	$scope.registerPreHook = function (callback) {
		$scope.preEditingHooks.push(callback);
	};

	$uibModalInstance.rendered.then(function () {
		if ($scope.properties.allDay) {
			$scope.properties.dtend.value = moment($scope.properties.dtend.value.subtract(1, 'days'));
		}

		autosize($('.advanced--textarea'));
		autosize($('.events--textarea'));

		$timeout(function () {
			autosize.update($('.advanced--textarea'));
			autosize.update($('.events--textarea'));
		}, 50);

		angular.forEach($scope.preEditingHooks, function (callback) {
			callback();
		});

		$scope.tabopener(0);
	});

	$scope.registerPostHook = function (callback) {
		$scope.postEditingHooks.push(callback);
	};

	$scope.proceed = function () {
		$scope.prepareClose();
		$uibModalInstance.close({
			action: 'proceed',
			calendar: $scope.calendar,
			simple: $scope.properties,
			vevent: vevent
		});
	};

	$scope.save = function () {
		if (!$scope.validate()) {
			return;
		}

		$scope.prepareClose();
		$scope.properties.patch();
		$uibModalInstance.close({
			action: 'save',
			calendar: $scope.calendar,
			simple: $scope.properties,
			vevent: vevent
		});
	};

	$scope.validate = function () {
		var error = false;
		if ($scope.properties.summary === null || $scope.properties.summary.value.trim() === '') {
			OC.Notification.showTemporary(t('calendar', 'Please add a title!'));
			error = true;
		}
		if ($scope.calendar === null || typeof $scope.calendar === 'undefined') {
			OC.Notification.showTemporary(t('calendar', 'Please select a calendar!'));
			error = true;
		}
		if (!$scope.properties.checkDtStartBeforeDtEnd()) {
			OC.Notification.showTemporary(t('calendar', 'The event ends before it starts!'));
			error = true;
		}

		return !error;
	};

	$scope.prepareClose = function () {
		if ($scope.properties.allDay) {
			$scope.properties.dtend.value.add(1, 'days');
		}

		angular.forEach($scope.postEditingHooks, function (callback) {
			callback();
		});
	};

	$scope.cancel = function () {
		$uibModalInstance.dismiss('cancel');
	};

	$scope.delete = function () {
		$uibModalInstance.dismiss('delete');
	};

	$scope.export = function () {
		$window.open($scope.oldCalendar.url + vevent.uri);
	};

	$scope.tabopener = function (val) {
		$scope.selected = val;
		if (val === 0) {
			$scope.eventsdetailsview = true;
			$scope.eventsattendeeview = false;
			$scope.eventsalarmview = false;
			$scope.eventsrepeatview = false;
		} else if (val === 1) {
			$scope.eventsdetailsview = false;
			$scope.eventsattendeeview = true;
			$scope.eventsalarmview = false;
			$scope.eventsrepeatview = false;
		} else if (val === 2) {
			$scope.eventsdetailsview = false;
			$scope.eventsattendeeview = false;
			$scope.eventsalarmview = true;
			$scope.eventsrepeatview = false;
		} else if (val === 3) {
			$scope.eventsdetailsview = false;
			$scope.eventsattendeeview = false;
			$scope.eventsalarmview = false;
			$scope.eventsrepeatview = true;
		}
	};

	$scope.selectedCalendarChanged = function () {
		if ($scope.calendar.enabled === false) {
			$scope.calendar.enabled = true;
			$scope.calendar.update();
		}
	};

	$scope.showCalendarSelection = function () {
		var writableCalendars = $scope.calendars.filter(function (c) {
			return c.isWritable();
		});

		return writableCalendars.length > 1;
	};

	$scope.$watch('properties.dtstart.value', function (nv, ov) {
		var diff = nv.diff(ov, 'seconds');
		if (diff !== 0) {
			$scope.properties.dtend.value = moment($scope.properties.dtend.value.add(diff, 'seconds'));
		}
	});

	$scope.toggledAllDay = function () {
		if ($scope.properties.allDay) {
			return;
		}

		if ($scope.properties.dtstart.value.isSame($scope.properties.dtend.value)) {
			$scope.properties.dtend.value = moment($scope.properties.dtend.value.add(1, 'hours'));
		}

		if ($scope.properties.dtstart.parameters.zone === 'floating' && $scope.properties.dtend.parameters.zone === 'floating') {
			$scope.properties.dtstart.parameters.zone = $scope.defaulttimezone;
			$scope.properties.dtend.parameters.zone = $scope.defaulttimezone;
		}
	};
	$scope.$watch('properties.allDay', $scope.toggledAllDay);

	TimezoneService.listAll().then(function (list) {
		if ($scope.properties.dtstart.parameters.zone !== 'floating' && list.indexOf($scope.properties.dtstart.parameters.zone) === -1) {
			list.push($scope.properties.dtstart.parameters.zone);
		}
		if ($scope.properties.dtend.parameters.zone !== 'floating' && list.indexOf($scope.properties.dtend.parameters.zone) === -1) {
			list.push($scope.properties.dtend.parameters.zone);
		}

		angular.forEach(list, function (timezone) {
			if (timezone === 'GMT' || timezone === 'Z') {
				return;
			}

			if (timezone.split('/').length === 1) {
				$scope.timezones.push({
					displayname: timezone,
					group: t('calendar', 'Global'),
					value: timezone
				});
			} else {
				$scope.timezones.push({
					displayname: timezone.split('/').slice(1).join('/'),
					group: timezone.split('/', 1),
					value: timezone
				});
			}
		});

		$scope.timezones.push({
			displayname: t('calendar', 'None'),
			group: t('calendar', 'Global'),
			value: 'floating'
		});
	});

	$scope.loadTimezone = function (tzId) {
		TimezoneService.get(tzId).then(function (timezone) {
			ICAL.TimezoneService.register(tzId, timezone.jCal);
		});
	};

	$scope.searchLocation = function (value) {
		return AutoCompletionService.searchLocation(value);
	};

	$scope.selectLocationFromTypeahead = function (item) {
		$scope.properties.location.value = item.label;
	};

	$scope.setClassToDefault = function () {
		if ($scope.properties.class === null) {
			$scope.properties.class = {
				type: 'string',
				value: 'PUBLIC'
			};
		}
	};

	$scope.setStatusToDefault = function () {
		if ($scope.properties.status === null) {
			$scope.properties.status = {
				type: 'string',
				value: 'CONFIRMED'
			};
		}
	};
}]);
'use strict';



app.controller('ImportController', ['$scope', '$filter', 'CalendarService', 'VEventService', '$uibModalInstance', 'files', 'ImportFileWrapper', 'ColorUtility', function ($scope, $filter, CalendarService, VEventService, $uibModalInstance, files, ImportFileWrapper, ColorUtility) {
	'use strict';

	$scope.nameSize = 25;

	$scope.rawFiles = files;
	$scope.files = [];

	$scope.showCloseButton = false;
	$scope.writableCalendars = $scope.calendars.filter(function (elem) {
		return elem.isWritable();
	});

	$scope.import = function (fileWrapper) {
		fileWrapper.state = ImportFileWrapper.stateScheduled;

		var importCalendar = function importCalendar(calendar) {
			var objects = fileWrapper.splittedICal.objects;

			angular.forEach(objects, function (object) {
				VEventService.create(calendar, object, false).then(function (response) {
					fileWrapper.state = ImportFileWrapper.stateImporting;
					fileWrapper.progress++;

					if (!response) {
						fileWrapper.errors++;
					}
				}).catch(function (reason) {
					fileWrapper.state = ImportFileWrapper.stateImporting;
					fileWrapper.progress++;
					fileWrapper.errors++;
				});
			});
		};

		if (fileWrapper.selectedCalendar === 'new') {
			var name = fileWrapper.splittedICal.name || fileWrapper.file.name;
			var color = fileWrapper.splittedICal.color || ColorUtility.randomColor();

			var components = [];
			if (fileWrapper.splittedICal.vevents.length > 0) {
				components.push('vevent');
				components.push('vtodo');
			}
			if (fileWrapper.splittedICal.vjournals.length > 0) {
				components.push('vjournal');
			}
			if (fileWrapper.splittedICal.vtodos.length > 0 && components.indexOf('vtodo') === -1) {
				components.push('vtodo');
			}

			CalendarService.create(name, color, components).then(function (calendar) {
				if (calendar.components.vevent) {
					$scope.calendars.push(calendar);
					$scope.writableCalendars.push(calendar);
				}
				importCalendar(calendar);
				fileWrapper.selectedCalendar = calendar.url;
			});
		} else {
			var calendar = $scope.calendars.filter(function (element) {
				return element.url === fileWrapper.selectedCalendar;
			})[0];
			importCalendar(calendar);
		}
	};

	$scope.preselectCalendar = function (fileWrapper) {
		var possibleCalendars = $filter('importCalendarFilter')($scope.writableCalendars, fileWrapper);
		if (possibleCalendars.length === 0) {
			fileWrapper.selectedCalendar = 'new';
		} else {
			fileWrapper.selectedCalendar = possibleCalendars[0].url;
		}
	};

	$scope.changeCalendar = function (fileWrapper) {
		if (fileWrapper.selectedCalendar === 'new') {
			fileWrapper.incompatibleObjectsWarning = false;
		} else {
			var possibleCalendars = $filter('importCalendarFilter')($scope.writableCalendars, fileWrapper);
			fileWrapper.incompatibleObjectsWarning = possibleCalendars.indexOf(fileWrapper.selectedCalendar) === -1;
		}
	};

	angular.forEach($scope.rawFiles, function (rawFile) {
		var fileWrapper = ImportFileWrapper(rawFile);
		fileWrapper.read(function () {
			$scope.preselectCalendar(fileWrapper);
			$scope.$apply();
		});

		fileWrapper.register(ImportFileWrapper.hookProgressChanged, function () {
			$scope.$apply();
		});

		fileWrapper.register(ImportFileWrapper.hookDone, function () {
			$scope.$apply();
			$scope.closeIfNecessary();

			var calendar = $scope.calendars.find(function (element) {
				return element.url === fileWrapper.selectedCalendar;
			});
			if (calendar && calendar.enabled) {
				calendar.enabled = false;
				calendar.enabled = true;
			}
		});

		fileWrapper.register(ImportFileWrapper.hookErrorsChanged, function () {
			$scope.$apply();
		});

		$scope.files.push(fileWrapper);
	});

	$scope.closeIfNecessary = function () {
		var unfinishedFiles = $scope.files.filter(function (fileWrapper) {
			return !fileWrapper.wasCanceled() && !fileWrapper.isDone() && !fileWrapper.isEmpty();
		});
		var filesEncounteredErrors = $scope.files.filter(function (fileWrapper) {
			return fileWrapper.isDone() && fileWrapper.hasErrors();
		});
		var emptyFiles = $scope.files.filter(function (fileWrapper) {
			return fileWrapper.isEmpty();
		});

		if (unfinishedFiles.length === 0 && filesEncounteredErrors.length === 0 && emptyFiles.length === 0) {
			$uibModalInstance.close();
		} else if (unfinishedFiles.length === 0 && (filesEncounteredErrors.length !== 0 || emptyFiles.length !== 0)) {
			$scope.showCloseButton = true;
			$scope.$apply();
		}
	};

	$scope.close = function () {
		$uibModalInstance.close();
	};

	$scope.cancelFile = function (fileWrapper) {
		fileWrapper.state = ImportFileWrapper.stateCanceled;
		$scope.closeIfNecessary();
	};
}]);
'use strict';


app.controller('RecurrenceController', ["$scope", function ($scope) {
	'use strict';

	$scope.rruleNotSupported = false;

	$scope.repeat_options_simple = [{ val: 'NONE', displayname: t('calendar', 'None') }, { val: 'DAILY', displayname: t('calendar', 'Every day') }, { val: 'WEEKLY', displayname: t('calendar', 'Every week') }, { val: 'MONTHLY', displayname: t('calendar', 'Every month') }, { val: 'YEARLY', displayname: t('calendar', 'Every year') } 
	];

	$scope.selected_repeat_end = 'NEVER';
	$scope.repeat_end = [{ val: 'NEVER', displayname: t('calendar', 'never') }, { val: 'COUNT', displayname: t('calendar', 'after') } 
	];

	$scope.$parent.registerPreHook(function () {
		if ($scope.properties.rrule.freq !== 'NONE') {
			var unsupportedFREQs = ['SECONDLY', 'MINUTELY', 'HOURLY'];
			if (unsupportedFREQs.indexOf($scope.properties.rrule.freq) !== -1) {
				$scope.rruleNotSupported = true;
			}

			if (typeof $scope.properties.rrule.parameters !== 'undefined') {
				var partIds = Object.getOwnPropertyNames($scope.properties.rrule.parameters);
				if (partIds.length > 0) {
					$scope.rruleNotSupported = true;
				}
			}

			if ($scope.properties.rrule.count !== null) {
				$scope.selected_repeat_end = 'COUNT';
			} else if ($scope.properties.rrule.until !== null) {
				$scope.rruleNotSupported = true;
			}


			if ($scope.properties.rrule.interval === null) {
				$scope.properties.rrule.interval = 1;
			}
		}
	});

	$scope.$parent.registerPostHook(function () {
		$scope.properties.rrule.dontTouch = $scope.rruleNotSupported;

		if ($scope.selected_repeat_end === 'NEVER') {
			$scope.properties.rrule.count = null;
			$scope.properties.rrule.until = null;
		}
	});

	$scope.resetRRule = function () {
		$scope.selected_repeat_end = 'NEVER';
		$scope.properties.rrule.freq = 'NONE';
		$scope.properties.rrule.count = null;
		$scope.properties.rrule.interval = 1;
		$scope.rruleNotSupported = false;
		$scope.properties.rrule.parameters = {};
	};
}]);
'use strict';



app.controller('SettingsController', ['$scope', '$uibModal', '$timeout', 'SettingsService', 'fc', 'isFirstRun', 'settings', function ($scope, $uibModal, $timeout, SettingsService, fc, isFirstRun, settings) {
	'use strict';

	$scope.settingsCalDavLink = OC.linkToRemote('dav') + '/';
	$scope.settingsCalDavPrincipalLink = OC.linkToRemote('dav') + '/principals/users/' + escapeHTML(encodeURIComponent(oc_current_user)) + '/';
	$scope.skipPopover = settings.skipPopover ? 'yes' : 'no';
	$scope.settingsShowWeekNr = settings.showWeekNr ? 'yes' : 'no';

	$timeout(function () {
		if (isFirstRun) {
			angular.element('.settings-button').click();
			angular.element('#import-button-overlay').tooltip({
				animation: true,
				placement: 'bottom',
				title: t('calendar', 'How about getting started by importing some calendars?')
			});
			$timeout(function () {
				angular.element('#import-button-overlay').tooltip('toggle');
			}, 500);
			$timeout(function () {
				angular.element('#import-button-overlay').tooltip('toggle');
			}, 10500);
			SettingsService.passedFirstRun();
		}
	}, 1500);

	angular.element('#import').on('change', function () {
		var filesArray = [];
		for (var i = 0; i < this.files.length; i++) {
			filesArray.push(this.files[i]);
		}

		if (filesArray.length > 0) {
			$uibModal.open({
				templateUrl: 'import.html',
				controller: 'ImportController',
				windowClass: 'import',
				backdropClass: 'import-backdrop',
				keyboard: false,
				appendTo: angular.element('#importpopover-container'),
				resolve: {
					files: function files() {
						return filesArray;
					}
				},
				scope: $scope
			});
		}

		angular.element('#import').val(null);
	});

	$scope.updateSkipPopover = function () {
		var newValue = $scope.skipPopover;
		settings.skipPopover = newValue === 'yes';
		SettingsService.setSkipPopover(newValue);
	};

	$scope.updateShowWeekNr = function () {
		var newValue = $scope.settingsShowWeekNr;
		settings.showWeekNr = newValue === 'yes';
		SettingsService.setShowWeekNr(newValue);
		if (fc.elm) {
			fc.elm.fullCalendar('option', 'weekNumbers', newValue === 'yes');
		}
	};
}]);
'use strict';


app.controller('SubscriptionController', ['$scope', function ($scope) {}]);
'use strict';


app.controller('VAlarmController', ["$scope", function ($scope) {
	'use strict';

	$scope.newReminderId = -1;

	$scope.alarmFactors = [60, 
	60, 
	24, 
	7 
	];

	$scope.reminderSelect = [{ displayname: t('calendar', 'At time of event'), trigger: 0 }, { displayname: t('calendar', '5 minutes before'), trigger: -1 * 5 * 60 }, { displayname: t('calendar', '10 minutes before'), trigger: -1 * 10 * 60 }, { displayname: t('calendar', '15 minutes before'), trigger: -1 * 15 * 60 }, { displayname: t('calendar', '30 minutes before'), trigger: -1 * 30 * 60 }, { displayname: t('calendar', '1 hour before'), trigger: -1 * 60 * 60 }, { displayname: t('calendar', '2 hours before'), trigger: -1 * 2 * 60 * 60 }, { displayname: t('calendar', 'Custom'), trigger: 'custom' }];

	$scope.reminderSelectTriggers = $scope.reminderSelect.map(function (elem) {
		return elem.trigger;
	}).filter(function (elem) {
		return typeof elem === 'number';
	});

	$scope.reminderTypeSelect = [{ displayname: t('calendar', 'Audio'), type: 'AUDIO' }, { displayname: t('calendar', 'E Mail'), type: 'EMAIL' }, { displayname: t('calendar', 'Pop up'), type: 'DISPLAY' }];

	$scope.timeUnitReminderSelect = [{ displayname: t('calendar', 'sec'), factor: 1 }, { displayname: t('calendar', 'min'), factor: 60 }, { displayname: t('calendar', 'hours'), factor: 60 * 60 }, { displayname: t('calendar', 'days'), factor: 60 * 60 * 24 }, { displayname: t('calendar', 'week'), factor: 60 * 60 * 24 * 7 }];

	$scope.timePositionReminderSelect = [{ displayname: t('calendar', 'before'), factor: -1 }, { displayname: t('calendar', 'after'), factor: 1 }];

	$scope.startEndReminderSelect = [{ displayname: t('calendar', 'start'), type: 'start' }, { displayname: t('calendar', 'end'), type: 'end' }];

	$scope.$parent.registerPreHook(function () {
		angular.forEach($scope.properties.alarm, function (alarm) {
			$scope._addEditorProps(alarm);
		});
	});

	$scope.$parent.registerPostHook(function () {
		angular.forEach($scope.properties.alarm, function (alarm) {
			if (alarm.editor.triggerType === 'absolute') {
				alarm.trigger.value = alarm.editor.absMoment;
			}
		});
	});

	$scope._addEditorProps = function (alarm) {
		angular.extend(alarm, {
			editor: {
				triggerValue: 0,
				triggerBeforeAfter: -1,
				triggerTimeUnit: 1,
				absMoment: moment(),
				editing: false
			}
		});

		alarm.editor.reminderSelectValue = $scope.reminderSelectTriggers.indexOf(alarm.trigger.value) !== -1 ? alarm.editor.reminderSelectValue = alarm.trigger.value : alarm.editor.reminderSelectValue = 'custom';

		alarm.editor.triggerType = alarm.trigger.type === 'duration' ? 'relative' : 'absolute';

		if (alarm.editor.triggerType === 'relative') {
			$scope._prepareRelativeVAlarm(alarm);
		} else {
			$scope._prepareAbsoluteVAlarm(alarm);
		}

		$scope._prepareRepeat(alarm);
	};

	$scope._prepareRelativeVAlarm = function (alarm) {
		var unitAndValue = $scope._getUnitAndValue(Math.abs(alarm.trigger.value));

		angular.extend(alarm.editor, {
			triggerBeforeAfter: alarm.trigger.value < 0 ? -1 : 1,
			triggerTimeUnit: unitAndValue[0],
			triggerValue: unitAndValue[1]
		});
	};

	$scope._prepareAbsoluteVAlarm = function (alarm) {
		alarm.editor.absMoment = alarm.trigger.value;
	};

	$scope._prepareRepeat = function (alarm) {
		var unitAndValue = $scope._getUnitAndValue(alarm.duration && alarm.duration.value ? alarm.duration.value : 0);

		angular.extend(alarm.editor, {
			repeat: !(!alarm.repeat.value || alarm.repeat.value === 0),
			repeatNTimes: alarm.editor.repeat ? alarm.repeat.value : 0,
			repeatTimeUnit: unitAndValue[0],
			repeatNValue: unitAndValue[1]
		});
	};

	$scope._getUnitAndValue = function (value) {
		var unit = 1;

		var alarmFactors = [60, 60, 24, 7];

		for (var i = 0; i < alarmFactors.length && value !== 0; i++) {
			var mod = value % alarmFactors[i];
			if (mod !== 0) {
				break;
			}

			unit *= alarmFactors[i];
			value /= alarmFactors[i];
		}

		return [unit, value];
	};

	$scope.add = function () {
		var setTriggers = [];
		angular.forEach($scope.properties.alarm, function (alarm) {
			if (alarm.trigger && alarm.trigger.type === 'duration') {
				setTriggers.push(alarm.trigger.value);
			}
		});

		var triggersToSuggest = [];
		angular.forEach($scope.reminderSelect, function (option) {
			if (typeof option.trigger !== 'number' || option.trigger > -1 * 15 * 60) {
				return;
			}

			triggersToSuggest.push(option.trigger);
		});

		var triggerToSet = null;
		for (var i = 0; i < triggersToSuggest.length; i++) {
			if (setTriggers.indexOf(triggersToSuggest[i]) === -1) {
				triggerToSet = triggersToSuggest[i];
				break;
			}
		}
		if (triggerToSet === null) {
			triggerToSet = triggersToSuggest[triggersToSuggest.length - 1];
		}

		var alarm = {
			id: $scope.newReminderId--,
			action: {
				type: 'text',
				value: 'AUDIO'
			},
			trigger: {
				type: 'duration',
				value: triggerToSet,
				related: 'start'
			},
			repeat: {},
			duration: {}
		};

		$scope._addEditorProps(alarm);
		$scope.properties.alarm.push(alarm);
	};

	$scope.remove = function (alarm) {
		$scope.properties.alarm = $scope.properties.alarm.filter(function (elem) {
			return elem !== alarm;
		});
	};

	$scope.triggerEdit = function (alarm) {
		if (alarm.editor.editing === true) {
			alarm.editor.editing = false;
		} else {
			if ($scope.isEditingReminderSupported(alarm)) {
				alarm.editor.editing = true;
			} else {
				OC.Notification.showTemporary(t('calendar', 'Editing reminders of unknown type not supported.'));
			}
		}
	};

	$scope.isEditingReminderSupported = function (alarm) {
		return ['AUDIO', 'DISPLAY', 'EMAIL'].indexOf(alarm.action.value) !== -1;
	};

	$scope.updateReminderSelectValue = function (alarm) {
		var factor = alarm.editor.reminderSelectValue;
		if (factor !== 'custom') {
			alarm.duration = {};
			alarm.repeat = {};
			alarm.trigger.related = 'start';
			alarm.trigger.type = 'duration';
			alarm.trigger.value = parseInt(factor);

			$scope._addEditorProps(alarm);
		}
	};

	$scope.updateReminderRelative = function (alarm) {
		alarm.trigger.value = parseInt(alarm.editor.triggerBeforeAfter) * parseInt(alarm.editor.triggerTimeUnit) * parseInt(alarm.editor.triggerValue);

		alarm.trigger.type = 'duration';
	};

	$scope.updateReminderAbsolute = function (alarm) {
		if (!moment.isMoment(alarm.trigger.value)) {
			alarm.trigger.value = moment();
		}

		alarm.trigger.type = 'date-time';
	};

	$scope.updateReminderRepeat = function (alarm) {
		alarm.repeat.type = 'string';
		alarm.repeat.value = alarm.editor.repeatNTimes;
		alarm.duration.type = 'duration';
		alarm.duration.value = parseInt(alarm.editor.repeatNValue) * parseInt(alarm.editor.repeatTimeUnit);
	};
}]);
'use strict';


app.directive('avatar', function () {
  'use strict';

  return {
    restrict: 'A',
    scope: {},
    link: function link(scope, elm, attrs) {
      var size = attrs.size ? parseInt(attrs.size, 10) : 32;
      $(elm).avatar(attrs.user, size);
    }
  };
});
'use strict';

app.directive('colorpicker', ["ColorUtility", function (ColorUtility) {
  'use strict';

  return {
    scope: {
      selected: '=',
      customizedColors: '=colors'
    },
    restrict: 'AE',
    templateUrl: OC.filePath('calendar', 'templates', 'colorpicker.html'),
    link: function link(scope, element, attr) {
      scope.colors = scope.customizedColors || ColorUtility.colors;
      scope.selected = scope.selected || scope.colors[0];
      scope.random = "#000000";

      var inputElement = document.createElement('input');
      inputElement.setAttribute('type', 'color');
      scope.supportsColorPicker = inputElement.type === 'color';

      scope.randomizeColour = function () {
        scope.random = ColorUtility.randomColor();
        scope.pick(scope.random);
      };

      scope.pick = function (color) {
        scope.selected = color;
      };
    }
  };
}]);
'use strict';


app.directive('confirmation', function () {
	'use strict';

	return {
		priority: -1,
		restrict: 'A',
		templateUrl: 'confirmation.html',
		scope: {
			confirmationFunction: "&confirmation",
			confirmationMessage: "&confirmationMessage"

		},
		controller: 'ConfirmationController'
	};
});

app.controller('ConfirmationController', ['$scope', '$rootScope', '$element', '$attrs', '$compile', '$document', '$window', '$timeout', function ($scope, $rootScope, $element, $attrs, $compile, $document, $window, $timeout) {
	'use strict';

	var ConfirmationController = function () {
		function ConfirmationController(_$scope, $rootScope, $element, $attrs, $compile, $document, $window, $timeout) {
			this._$scope = _$scope;
			this._$scope.countdown = 3;

			$element.bind('click', function (e) {
				_$scope.countdown = 3;
				$element.removeClass('active');
				var message = _$scope.confirmationMessage() ? _$scope.confirmationMessage() : "Are you sure?";
				if ($element.hasClass('confirmed')) {
					return;
				}
				e.stopPropagation();
				_$scope.activate();
				$element.children('.confirmation-confirm').tooltip({ title: message, container: 'body', placement: 'right' });
				$element.addClass("confirmed");
			});

			$element.children('.confirmation-confirm').bind('click', function (e) {
				if ($element.hasClass('confirmed active')) {
					_$scope.confirmationFunction();
					return;
				} else {
					e.stopPropagation();
				}
			});

			this._$scope.documentClick = function () {
				$element.removeClass("confirmed");
			};

			this._$scope.activate = function () {
				if (_$scope.countdown) {
					$element.find('.countdown').html(_$scope.countdown + ' s');
					$timeout(function () {
						_$scope.activate();
					}, 1000);
					_$scope.countdown--;
				} else {
					$element.addClass('active');
				}
			};

			$document.bind('click', _$scope.documentClick);
			$document.bind('touchend', _$scope.documentClick);

			$scope.$on('$destroy', function () {
				$document.unbind('click', _$scope.documentClick);
				$document.unbind('touchend', _$scope.documentClick);
			});
		}
		return ConfirmationController;
	}();
	return new ConfirmationController($scope, $rootScope, $element, $attrs, $compile, $document, $window, $timeout);
}]);
'use strict';

app.directive('ocdatetimepicker', ["$compile", "$timeout", function ($compile, $timeout) {
	'use strict';

	return {
		restrict: 'E',
		require: 'ngModel',
		scope: {
			disabletime: '=disabletime',
			date_tabindex: '=datetabindex',
			time_tabindex: '=timetabindex',
			readonly: '=readonly'
		},
		link: function link(scope, element, attrs, ngModelCtrl) {
			var templateHTML = '<input type="text" ng-model="date" class="events--date" tabindex="{{ date_tabindex }}"/>';
			templateHTML += '<span class="events--time--wrapper" ng-click="disableAllDayIfNecessary()"><input type="text" ng-model="time" class="events--time" ng-disabled="disabletime" tabindex="{{ time_tabindex }}"/></span>';
			var template = angular.element(templateHTML);

			scope.date = null;
			scope.time = null;
			scope.disableAllDayIfNecessary = function () {
				if (scope.disabletime && !scope.readonly) {
					$timeout(function () {
						scope.$apply(function () {
							scope.disabletime = false;
						});
						element.find('.events--time').timepicker('show');
					});
				}
			};

			$compile(template)(scope);
			element.append(template);

			function updateFromUserInput() {
				var date = element.find('.events--date').datepicker('getDate'),
				    hours = 0,
				    minutes = 0;

				if (!scope.disabletime) {
					hours = element.find('.events--time').timepicker('getHour');
					minutes = element.find('.events--time').timepicker('getMinute');
				}

				var m = moment(date);
				m.hours(hours);
				m.minutes(minutes);
				m.seconds(0);

				element.find('.events--time').timepicker('hide');
				ngModelCtrl.$setViewValue(m);
			}

			var localeData = moment.localeData();
			function initDatePicker() {
				element.find('.events--date').datepicker({
					dateFormat: localeData.longDateFormat('L').toLowerCase().replace('yy', 'y').replace('yyy', 'yy'),
					monthNames: moment.months(),
					monthNamesShort: moment.monthsShort(),
					dayNames: moment.weekdays(),
					dayNamesMin: moment.weekdaysMin(),
					dayNamesShort: moment.weekdaysShort(),
					firstDay: +localeData.firstDayOfWeek(),
					minDate: null,
					showOtherMonths: true,
					selectOtherMonths: true,
					onClose: updateFromUserInput
				});
			}
			function initTimepicker() {
				element.find('.events--time').timepicker({
					showPeriodLabels: localeData.longDateFormat('LT').toLowerCase().indexOf('a') !== -1,
					showLeadingZero: true,
					showPeriod: localeData.longDateFormat('LT').toLowerCase().indexOf('a') !== -1,
					duration: 0,
					onClose: updateFromUserInput
				});
			}

			initDatePicker();
			initTimepicker();

			scope.$watch(function () {
				return ngModelCtrl.$modelValue;
			}, function (value) {
				if (moment.isMoment(value)) {
					element.find('.events--date').datepicker('setDate', value.toDate());
					element.find('.events--time').timepicker('setTime', value.toDate());
				}
			});
			element.on('$destroy', function () {
				element.find('.events--date').datepicker('destroy');
				element.find('.events--time').timepicker('destroy');
			});
		}
	};
}]);
'use strict';


app.constant('fc', {}).directive('fc', ["fc", "$window", function (fc, $window) {
	'use strict';

	return {
		restrict: 'A',
		scope: {},
		link: function link(scope, elm, attrs) {
			var localeData = moment.localeData();
			var englishFallback = moment.localeData('en');

			var monthNames = [];
			var monthNamesShort = [];
			for (var i = 0; i < 12; i++) {
				var monthName = localeData.months(moment([0, i]), '');
				var shortMonthName = localeData.monthsShort(moment([0, i]), '');

				if (monthName) {
					monthNames.push(monthName);
				} else {
					monthNames.push(englishFallback.months(moment([0, i]), ''));
				}

				if (shortMonthName) {
					monthNamesShort.push(shortMonthName);
				} else {
					monthNamesShort.push(englishFallback.monthsShort(moment([0, i]), ''));
				}
			}

			var dayNames = [];
			var dayNamesShort = [];
			var momentWeekHelper = moment().startOf('week');
			momentWeekHelper.subtract(momentWeekHelper.format('d'));
			for (var _i = 0; _i < 7; _i++) {
				var dayName = localeData.weekdays(momentWeekHelper);
				var shortDayName = localeData.weekdaysShort(momentWeekHelper);

				if (dayName) {
					dayNames.push(dayName);
				} else {
					dayNames.push(englishFallback.weekdays(momentWeekHelper));
				}

				if (shortDayName) {
					dayNamesShort.push(shortDayName);
				} else {
					dayNamesShort.push(englishFallback.weekdaysShort(momentWeekHelper));
				}

				momentWeekHelper.add(1, 'days');
			}

			var firstDay = +moment().startOf('week').format('d');

			var headerSize = angular.element('#header').height();
			var windowElement = angular.element($window);
			windowElement.bind('resize', _.debounce(function () {
				var newHeight = windowElement.height() - headerSize;
				fc.elm.fullCalendar('option', 'height', newHeight);
			}, 150));

			var isPublic = attrs.ispublic === '1';

			var baseConfig = {
				dayNames: dayNames,
				dayNamesShort: dayNamesShort,
				defaultView: attrs.initialView,
				editable: !isPublic,
				firstDay: firstDay,
				forceEventDuration: true,
				header: false,
				height: windowElement.height() - headerSize,
				locale: moment.locale(),
				monthNames: monthNames,
				monthNamesShort: monthNamesShort,
				nowIndicator: true,
				weekNumbers: attrs.weeknumbers === 'yes',
				weekNumbersWithinDays: true,
				selectable: !isPublic
			};
			var controllerConfig = scope.$parent.fcConfig;
			var config = angular.extend({}, baseConfig, controllerConfig);

			fc.elm = $(elm).fullCalendar(config);
		}
	};
}]);
'use strict';



app.directive('loading', [function () {
  'use strict';

  return {
    restrict: 'E',
    replace: true,
    template: "<div id='loading' class='icon-loading'></div>",
    link: function link($scope, element, attr) {
      $scope.$watch('loading', function (val) {
        if (val) {
          $(element).show();
        } else {
          $(element).hide();
        }
      });
    }
  };
}]);
'use strict';



app.directive('openDialog', function () {
  'use strict';

  return {
    restrict: 'A',
    link: function link(scope, elem, attr, ctrl) {
      var dialogId = '#' + attr.openDialog;
      elem.bind('click', function (e) {
        $(dialogId).dialog('open');
      });
    }
  };
});
'use strict';


app.directive('onToggleShow', function () {
  'use strict';

  return {
    restrict: 'A',
    scope: {
      'onToggleShow': '@'
    },
    link: function link(scope, elem) {
      elem.click(function () {
        var target = $(scope.onToggleShow);
        target.toggle();
      });

      scope.$on('documentClicked', function (s, event) {
        var target = $(scope.onToggleShow);

        if (event.target !== elem[0]) {
          target.hide();
        }
      });
    }
  };
});
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();


app.service('CalendarFactory', ["$window", "DavClient", "Calendar", "WebCal", "constants", function ($window, DavClient, Calendar, WebCal, constants) {
	'use strict';

	var context = {};

	var SHARE_USER_PREFIX = 'principal:principals/users/';
	var SHARE_GROUP_PREFIX = 'principal:principals/groups/';

	context.acl = function (props, userPrincipal) {
		var acl = props['{' + DavClient.NS_DAV + '}acl'] || [];
		var canWrite = false;

		acl.forEach(function (rule) {
			var href = rule.getElementsByTagNameNS(DavClient.NS_DAV, 'href');
			if (href.length === 0) {
				return;
			}

			if (href[0].textContent !== userPrincipal) {
				return;
			}

			var writeNode = rule.getElementsByTagNameNS(DavClient.NS_DAV, 'write');
			if (writeNode.length > 0) {
				canWrite = true;
			}
		});

		return canWrite;
	};

	context.color = function (props) {
		var colorProp = props['{' + DavClient.NS_APPLE + '}calendar-color'];
		var fallbackColor = constants.fallbackColor;

		if (angular.isString(colorProp) && colorProp.length > 0) {
			if (colorProp.length === 9) {
				return colorProp.substr(0, 7);
			}
			return colorProp;
		} else {
			return fallbackColor;
		}
	};

	context.components = function (props) {
		var components = props['{' + DavClient.NS_IETF + '}supported-calendar-component-set'] || [];
		var simpleComponents = {
			vevent: false,
			vjournal: false,
			vtodo: false
		};

		components.forEach(function (component) {
			var name = component.attributes.getNamedItem('name').textContent.toLowerCase();

			if (simpleComponents.hasOwnProperty(name)) {
				simpleComponents[name] = true;
			}
		});

		return simpleComponents;
	};

	context.displayname = function (props) {
		return props['{' + DavClient.NS_DAV + '}displayname'];
	};

	context.enabled = function (props, owner, currentUser) {
		if (!angular.isDefined(props['{' + DavClient.NS_OWNCLOUD + '}calendar-enabled'])) {
			if (owner) {
				return owner === currentUser;
			} else {
				return false;
			}
		} else {
			return props['{' + DavClient.NS_OWNCLOUD + '}calendar-enabled'] === '1';
		}
	};

	context.order = function (props) {
		var prop = props['{' + DavClient.NS_APPLE + '}calendar-order'];
		return prop ? parseInt(prop) : undefined;
	};

	context.owner = function (props) {
		var ownerProperty = props['{' + DavClient.NS_DAV + '}owner'];
		if (Array.isArray(ownerProperty) && ownerProperty.length !== 0) {
			var owner = ownerProperty[0].textContent.slice(0, -1);
			var index = owner.indexOf('/remote.php/dav/principals/users/');
			if (index !== -1) {
				return owner.substr(index + 33);
			}
		}

		return null;
	};

	context.sharesAndOwnerDisplayname = function (props, owner) {
		var shareProp = props['{' + DavClient.NS_OWNCLOUD + '}invite'];
		var shares = {
			users: [],
			groups: []
		};
		var ownerDisplayname = null;

		var ownerDisplaynameProp = props['{' + DavClient.NS_NEXTCLOUD + '}owner-displayname'];
		if (ownerDisplaynameProp) {
			ownerDisplayname = ownerDisplaynameProp;
		}

		if (!Array.isArray(shareProp)) {
			return [shares, null];
		}

		shareProp.forEach(function (share) {
			var href = share.getElementsByTagNameNS(DavClient.NS_DAV, 'href');
			if (href.length === 0) {
				return;
			}
			href = href[0].textContent;

			var displayName = share.getElementsByTagNameNS(DavClient.NS_OWNCLOUD, 'common-name');
			if (displayName.length === 0) {
				if (href.startsWith(SHARE_USER_PREFIX)) {
					displayName = href.substr(SHARE_USER_PREFIX.length);
				} else {
					displayName = href.substr(SHARE_GROUP_PREFIX.length);
				}
			} else {
				displayName = displayName[0].textContent;
			}

			var access = share.getElementsByTagNameNS(DavClient.NS_OWNCLOUD, 'access');
			if (access.length === 0) {
				return;
			}
			access = access[0];

			var writable = access.getElementsByTagNameNS(DavClient.NS_OWNCLOUD, 'read-write');
			writable = writable.length !== 0;

			if (href.startsWith(SHARE_USER_PREFIX)) {
				if (href.substr(SHARE_USER_PREFIX.length) === owner) {
					if (!ownerDisplayname) {
						ownerDisplayname = displayName;
					}
				} else {
					shares.users.push({
						id: href.substr(SHARE_USER_PREFIX.length),
						displayname: displayName,
						writable: writable
					});
				}
			} else if (href.startsWith(SHARE_GROUP_PREFIX)) {
				shares.groups.push({
					id: href.substr(SHARE_GROUP_PREFIX.length),
					displayname: displayName,
					writable: writable
				});
			}
		});

		return [shares, ownerDisplayname];
	};

	context.shareableAndPublishable = function (props, writable, publicMode) {
		var shareable = false;
		var publishable = false;

		if (publicMode || !writable) {
			return [shareable, publishable];
		}

		var sharingModesProp = props['{' + DavClient.NS_CALENDARSERVER + '}allowed-sharing-modes'];
		if (!Array.isArray(sharingModesProp) || sharingModesProp.length === 0) {
			return [writable, publishable];
		}

		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = sharingModesProp[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var shareMode = _step.value;

				shareable = shareable || shareMode.localName === 'can-be-shared';
				publishable = publishable || shareMode.localName === 'can-be-published';
			}
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		return [shareable, publishable];
	};

	context.publishedAndPublicToken = function (props) {
		var published = false;
		var publicToken = null;

		if (angular.isDefined(props['{' + DavClient.NS_CALENDARSERVER + '}publish-url'])) {
			published = true;
			var publishURL = props['{' + DavClient.NS_CALENDARSERVER + '}publish-url'][0].textContent;
			if (publishURL.substr(-1) === '/') {
				publishURL = publishURL.substr(0, publishURL.length - 1);
			}

			var lastIndexOfSlash = publishURL.lastIndexOf('/');
			publicToken = publishURL.substr(lastIndexOfSlash + 1);
		}

		return [published, publicToken];
	};

	context.webcal = function (props) {
		var sourceProp = props['{' + DavClient.NS_CALENDARSERVER + '}source'];

		if (Array.isArray(sourceProp)) {
			var source = sourceProp.find(function (source) {
				return DavClient.getNodesFullName(source) === '{' + DavClient.NS_DAV + '}href';
			});

			return source ? source.textContent : null;
		} else {
			return null;
		}
	};

	context.calendarSkeleton = function (props, userPrincipal, publicMode) {
		var simple = {};
		var currentUser = context.getUserFromUserPrincipal(userPrincipal);

		simple.color = context.color(props);
		simple.displayname = context.displayname(props);
		simple.components = context.components(props);
		simple.order = context.order(props);

		simple.writable = context.acl(props, userPrincipal);
		simple.owner = context.owner(props);
		simple.enabled = context.enabled(props, simple.owner, currentUser);

		var _context$sharesAndOwn = context.sharesAndOwnerDisplayname(props, simple.owner),
		    _context$sharesAndOwn2 = _slicedToArray(_context$sharesAndOwn, 2),
		    shares = _context$sharesAndOwn2[0],
		    ownerDisplayname = _context$sharesAndOwn2[1];

		simple.shares = shares;
		simple.ownerDisplayname = ownerDisplayname;

		var _context$shareableAnd = context.shareableAndPublishable(props, simple.writable, publicMode),
		    _context$shareableAnd2 = _slicedToArray(_context$shareableAnd, 2),
		    shareable = _context$shareableAnd2[0],
		    publishable = _context$shareableAnd2[1];

		simple.shareable = shareable;
		simple.publishable = publishable;

		if (simple.owner !== currentUser && !constants.shareeCanEditShares) {
			simple.shareable = false;
			simple.publishable = false;
		}

		var _context$publishedAnd = context.publishedAndPublicToken(props),
		    _context$publishedAnd2 = _slicedToArray(_context$publishedAnd, 2),
		    published = _context$publishedAnd2[0],
		    publicToken = _context$publishedAnd2[1];

		simple.published = published;
		simple.publicToken = publicToken;

		if (publicMode) {
			simple.enabled = true;
			simple.writable = false;
			simple.color = constants.fallbackColor;
		}

		if (publicMode) {
			simple.writableProperties = false;
		} else if (simple.owner === currentUser) {
			simple.writableProperties = simple.writable;
		} else {
			simple.writableProperties = constants.shareeCanEditCalendarProperties || false;
		}

		return simple;
	};

	context.getUserFromUserPrincipal = function (userPrincipal) {
		if (userPrincipal.endsWith('/')) {
			userPrincipal = userPrincipal.slice(0, -1);
		}

		var slashIndex = userPrincipal.lastIndexOf('/');
		return userPrincipal.substr(slashIndex + 1);
	};

	this.calendar = function (CalendarService, body, userPrincipal) {
		var publicMode = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

		var href = body.href;
		var props = body.propStat[0].properties;

		var simple = context.calendarSkeleton(props, userPrincipal, publicMode);
		return Calendar(CalendarService, href, simple);
	};

	this.webcal = function (CalendarService, body, userPrincipal) {
		var publicMode = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

		var href = body.href;
		var props = body.propStat[0].properties;
		var currentUser = context.getUserFromUserPrincipal(userPrincipal);

		var simple = context.calendarSkeleton(props, userPrincipal, publicMode);
		simple.href = context.webcal(props);

		simple.writable = false;
		simple.writableProperties = currentUser === simple.owner;

		simple.publishable = false;
		simple.shareable = false;

		return WebCal(CalendarService, href, simple);
	};
}]);
'use strict';


app.service('ICalFactory', ["constants", function (constants) {
	'use strict';

	var self = this;

	this.new = function () {
		var root = new ICAL.Component(['vcalendar', [], []]);

		root.updatePropertyWithValue('prodid', '-//Nextcloud calendar v' + constants.version);
		root.updatePropertyWithValue('version', '2.0');
		root.updatePropertyWithValue('calscale', 'GREGORIAN');

		return root;
	};

	this.newEvent = function (uid) {
		var comp = self.new();

		var event = new ICAL.Component('vevent');
		comp.addSubcomponent(event);

		event.updatePropertyWithValue('created', ICAL.Time.now());
		event.updatePropertyWithValue('dtstamp', ICAL.Time.now());
		event.updatePropertyWithValue('last-modified', ICAL.Time.now());
		event.updatePropertyWithValue('uid', uid);

		event.updatePropertyWithValue('dtstart', ICAL.Time.now());

		return comp;
	};
}]);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

app.factory('ImportFileWrapper', ["Hook", "ICalSplitterUtility", function (Hook, ICalSplitterUtility) {
	'use strict';

	function ImportFileWrapper(file) {
		var context = {
			file: file,
			splittedICal: null,
			selectedCalendar: null,
			state: 0,
			errors: 0,
			progress: 0,
			progressToReach: -1
		};
		var iface = {
			_isAImportFileWrapperObject: true
		};

		context.checkIsDone = function () {
			if (context.progress === context.progressToReach) {
				context.state = ImportFileWrapper.stateDone;
				iface.emit(ImportFileWrapper.hookDone);
			}
		};

		Object.defineProperties(iface, {
			file: {
				get: function get() {
					return context.file;
				}
			},
			splittedICal: {
				get: function get() {
					return context.splittedICal;
				}
			},
			selectedCalendar: {
				get: function get() {
					return context.selectedCalendar;
				},
				set: function set(selectedCalendar) {
					context.selectedCalendar = selectedCalendar;
				}
			},
			state: {
				get: function get() {
					return context.state;
				},
				set: function set(state) {
					if (typeof state === 'number') {
						context.state = state;
					}
				}
			},
			errors: {
				get: function get() {
					return context.errors;
				},
				set: function set(errors) {
					if (typeof errors === 'number') {
						var oldErrors = context.errors;
						context.errors = errors;
						iface.emit(ImportFileWrapper.hookErrorsChanged, errors, oldErrors);
					}
				}
			},
			progress: {
				get: function get() {
					return context.progress;
				},
				set: function set(progress) {
					if (typeof progress === 'number') {
						var oldProgress = context.progress;
						context.progress = progress;
						iface.emit(ImportFileWrapper.hookProgressChanged, progress, oldProgress);

						context.checkIsDone();
					}
				}
			},
			progressToReach: {
				get: function get() {
					return context.progressToReach;
				}
			}
		});

		iface.wasCanceled = function () {
			return context.state === ImportFileWrapper.stateCanceled;
		};

		iface.isAnalyzing = function () {
			return context.state === ImportFileWrapper.stateAnalyzing;
		};

		iface.isAnalyzed = function () {
			return context.state === ImportFileWrapper.stateAnalyzed;
		};

		iface.isScheduled = function () {
			return context.state === ImportFileWrapper.stateScheduled;
		};

		iface.isImporting = function () {
			return context.state === ImportFileWrapper.stateImporting;
		};

		iface.isDone = function () {
			return context.state === ImportFileWrapper.stateDone;
		};

		iface.hasErrors = function () {
			return context.errors > 0;
		};

		iface.isEmpty = function () {
			return context.progressToReach === 0;
		};

		iface.read = function (afterReadCallback) {
			var reader = new FileReader();

			reader.onload = function (event) {
				context.splittedICal = ICalSplitterUtility.split(event.target.result);
				context.progressToReach = context.splittedICal.vevents.length + context.splittedICal.vjournals.length + context.splittedICal.vtodos.length;

				if (context.progressToReach === 0) {
					iface.state = ImportFileWrapper.stateEmpty;
					iface.emit(ImportFileWrapper.hookDone);
				} else {
					iface.state = ImportFileWrapper.stateAnalyzed;
					afterReadCallback();
				}
			};

			reader.readAsText(file);
		};

		Object.assign(iface, Hook(context));

		return iface;
	}

	ImportFileWrapper.isImportWrapper = function (obj) {
		return obj instanceof ImportFileWrapper || (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null && obj._isAImportFileWrapperObject !== null;
	};

	ImportFileWrapper.stateEmpty = -2;
	ImportFileWrapper.stateCanceled = -1;
	ImportFileWrapper.stateAnalyzing = 0;
	ImportFileWrapper.stateAnalyzed = 1;
	ImportFileWrapper.stateScheduled = 2;
	ImportFileWrapper.stateImporting = 3;
	ImportFileWrapper.stateDone = 4;

	ImportFileWrapper.hookProgressChanged = 1;
	ImportFileWrapper.hookDone = 2;
	ImportFileWrapper.hookErrorsChanged = 3;

	return ImportFileWrapper;
}]);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };


app.factory('CalendarListItem', ["$rootScope", "$window", "Calendar", "WebCal", "isSharingAPI", function ($rootScope, $window, Calendar, WebCal, isSharingAPI) {
	'use strict';

	function CalendarListItem(calendar) {
		var context = {
			calendar: calendar,
			isEditingShares: false,
			isEditingProperties: false,
			isDisplayingCalDAVUrl: false,
			isDisplayingWebCalUrl: false,
			isSendingMail: false
		};
		var iface = {
			_isACalendarListItemObject: true
		};

		if (!Calendar.isCalendar(calendar)) {
			return null;
		}

		Object.defineProperties(iface, {
			calendar: {
				get: function get() {
					return context.calendar;
				}
			},
			publicSharingURL: {
				get: function get() {
					return $rootScope.root + 'p/' + context.calendar.publicToken;
				}
			},
			publicEmbedURL: {
				get: function get() {
					return $rootScope.root + 'embed/' + context.calendar.publicToken;
				}
			}
		});

		iface.displayCalDAVUrl = function () {
			return context.isDisplayingCalDAVUrl;
		};

		iface.showCalDAVUrl = function () {
			context.isDisplayingCalDAVUrl = true;
		};

		iface.displayWebCalUrl = function () {
			return context.isDisplayingWebCalUrl;
		};

		iface.hideCalDAVUrl = function () {
			context.isDisplayingCalDAVUrl = false;
		};

		iface.showWebCalUrl = function () {
			context.isDisplayingWebCalUrl = true;
		};

		iface.hideWebCalUrl = function () {
			context.isDisplayingWebCalUrl = false;
		};

		iface.showSharingIcon = function () {
			var isCalendarShareable = context.calendar.isShareable();
			var isCalendarShared = context.calendar.isShared();
			var isCalendarPublishable = context.calendar.isPublishable();

			if (isCalendarPublishable) {
				return true;
			}

			if (!isSharingAPI && isCalendarShared && isCalendarShareable) {
				return true;
			}

			return isSharingAPI && isCalendarShareable;
		};

		iface.isEditingShares = function () {
			return context.isEditingShares;
		};

		iface.isSendingMail = function () {
			return context.isSendingMail;
		};

		iface.toggleEditingShares = function () {
			context.isEditingShares = !context.isEditingShares;
		};

		iface.toggleSendingMail = function () {
			context.isSendingMail = !context.isSendingMail;
		};

		iface.isEditing = function () {
			return context.isEditingProperties;
		};

		iface.displayActions = function () {
			return !iface.isEditing();
		};

		iface.displayColorIndicator = function () {
			return !iface.isEditing() && !context.calendar.isRendering();
		};

		iface.displaySpinner = function () {
			return !iface.isEditing() && context.calendar.isRendering();
		};

		iface.openEditor = function () {
			iface.color = context.calendar.color;
			iface.displayname = context.calendar.displayname;

			context.isEditingProperties = true;
		};

		iface.cancelEditor = function () {
			iface.color = '';
			iface.displayname = '';

			context.isEditingProperties = false;
		};

		iface.saveEditor = function () {
			context.calendar.color = iface.color;
			context.calendar.displayname = iface.displayname;

			iface.color = '';
			iface.displayname = '';

			context.isEditingProperties = false;
		};

		iface.isWebCal = function () {
			return WebCal.isWebCal(context.calendar);
		};

		iface.getOwnerName = function () {
			return context.calendar.ownerDisplayname || context.calendar.owner;
		};

		iface.getPublicDisplayname = function () {
			var searchFor = '(' + context.calendar.owner + ')';
			var lastIndexOf = context.calendar.displayname.lastIndexOf(searchFor);

			return context.calendar.displayname.substr(0, lastIndexOf - 1);
		};

		iface.color = '';
		iface.displayname = '';

		iface.order = 0;

		iface.selectedSharee = '';

		return iface;
	}

	CalendarListItem.isCalendarListItem = function (obj) {
		return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null && obj._isACalendarListItemObject === true;
	};

	return CalendarListItem;
}]);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();


app.factory('Calendar', ["$window", "Hook", "VEventService", "TimezoneService", "ColorUtility", "StringUtility", function ($window, Hook, VEventService, TimezoneService, ColorUtility, StringUtility) {
	'use strict';


	function Calendar(CalendarService, url, props) {
		url = url || '';
		props = props || {};

		var context = {
			calendarService: CalendarService,
			fcEventSource: {},
			components: props.components,
			mutableProperties: {
				color: props.color,
				displayname: props.displayname,
				enabled: props.enabled,
				order: props.order,
				published: props.published
			},
			updatedProperties: [],
			tmpId: StringUtility.uid(),
			url: url,
			owner: props.owner,
			ownerDisplayname: props.ownerDisplayname,
			shares: props.shares,
			publicToken: props.publicToken,
			publishable: props.publishable,
			warnings: [],
			shareable: props.shareable,
			writable: props.writable,
			writableProperties: props.writableProperties
		};
		var iface = {
			_isACalendarObject: true
		};

		context.fcEventSource.events = function (start, end, timezone, callback) {
			var fcAPI = this;
			context.fcEventSource.isRendering = true;
			iface.emit(Calendar.hookFinishedRendering);

			start = moment(start.stripZone().format());
			end = moment(end.stripZone().format());

			var TimezoneServicePromise = TimezoneService.get(timezone);
			var VEventServicePromise = VEventService.getAll(iface, start, end);
			Promise.all([TimezoneServicePromise, VEventServicePromise]).then(function (results) {
				var _results = _slicedToArray(results, 2),
				    tz = _results[0],
				    events = _results[1];

				var promises = [];
				var vevents = [];

				events.forEach(function (event) {
					var promise = event.getFcEvent(start, end, tz).then(function (vevent) {
						vevents = vevents.concat(vevent);
					}).catch(function (reason) {
						iface.addWarning(reason);
						console.log(event, reason);
					});

					promises.push(promise);
				});

				return Promise.all(promises).then(function () {
					callback(vevents);
					fcAPI.reportEventChange();
					context.fcEventSource.isRendering = false;

					iface.emit(Calendar.hookFinishedRendering);
				});
			}).catch(function (reason) {
				if (reason === 'Unknown timezone' && timezone !== 'UTC') {
					var eventsFn = iface.fcEventSource.events.bind(fcAPI);
					eventsFn(start, end, 'UTC', callback);
				}

				iface.addWarning(reason);
				context.fcEventSource.isRendering = false;
				iface.emit(Calendar.hookFinishedRendering);

				console.log(context.url, reason);
			});
		};
		context.fcEventSource.editable = context.writable;
		context.fcEventSource.calendar = iface;
		context.fcEventSource.isRendering = false;

		context.setUpdated = function (property) {
			if (context.updatedProperties.indexOf(property) === -1) {
				context.updatedProperties.push(property);
			}
		};

		Object.defineProperties(iface, {
			color: {
				get: function get() {
					return context.mutableProperties.color;
				},
				set: function set(color) {
					var oldColor = context.mutableProperties.color;
					if (color === oldColor) {
						return;
					}
					context.mutableProperties.color = color;
					context.setUpdated('color');
					iface.emit(Calendar.hookColorChanged, color, oldColor);
				}
			},
			textColor: {
				get: function get() {
					var colors = ColorUtility.extractRGBFromHexString(context.mutableProperties.color);
					return ColorUtility.generateTextColorFromRGB(colors.r, colors.g, colors.b);
				}
			},
			displayname: {
				get: function get() {
					return context.mutableProperties.displayname;
				},
				set: function set(displayname) {
					var oldDisplayname = context.mutableProperties.displayname;
					if (displayname === oldDisplayname) {
						return;
					}
					context.mutableProperties.displayname = displayname;
					context.setUpdated('displayname');
					iface.emit(Calendar.hookDisplaynameChanged, displayname, oldDisplayname);
				}
			},
			enabled: {
				get: function get() {
					return context.mutableProperties.enabled;
				},
				set: function set(enabled) {
					var oldEnabled = context.mutableProperties.enabled;
					if (enabled === oldEnabled) {
						return;
					}
					context.mutableProperties.enabled = enabled;
					context.setUpdated('enabled');
					iface.emit(Calendar.hookEnabledChanged, enabled, oldEnabled);
				}
			},
			order: {
				get: function get() {
					return context.mutableProperties.order;
				},
				set: function set(order) {
					var oldOrder = context.mutableProperties.order;
					if (order === oldOrder) {
						return;
					}
					context.mutableProperties.order = order;
					context.setUpdated('order');
					iface.emit(Calendar.hookOrderChanged, order, oldOrder);
				}

			},
			components: {
				get: function get() {
					return context.components;
				}
			},
			url: {
				get: function get() {
					return context.url;
				}
			},
			downloadUrl: {
				get: function get() {
					var url = context.url;
					if (url.slice(url.length - 1) === '/') {
						url = url.slice(0, url.length - 1);
					}
					url += '?export';

					return url;
				},
				configurable: true
			},
			caldav: {
				get: function get() {
					return $window.location.origin + context.url;
				}
			},
			publicToken: {
				get: function get() {
					return context.publicToken;
				},
				set: function set(publicToken) {
					context.publicToken = publicToken;
				}
			},
			published: {
				get: function get() {
					return context.mutableProperties.published;
				},
				set: function set(published) {
					context.mutableProperties.published = published;
				}
			},
			publishable: {
				get: function get() {
					return context.publishable;
				}
			},
			fcEventSource: {
				get: function get() {
					return context.fcEventSource;
				}
			},
			shares: {
				get: function get() {
					return context.shares;
				}
			},
			tmpId: {
				get: function get() {
					return context.tmpId;
				}
			},
			warnings: {
				get: function get() {
					return context.warnings;
				}
			},
			owner: {
				get: function get() {
					return context.owner;
				}
			},
			ownerDisplayname: {
				get: function get() {
					return context.ownerDisplayname;
				}
			}
		});

		iface.hasUpdated = function () {
			return context.updatedProperties.length !== 0;
		};

		iface.getUpdated = function () {
			return context.updatedProperties;
		};

		iface.resetUpdated = function () {
			context.updatedProperties = [];
		};

		iface.addWarning = function (msg) {
			context.warnings.push(msg);
		};

		iface.hasWarnings = function () {
			return context.warnings.length > 0;
		};

		iface.resetWarnings = function () {
			context.warnings = [];
		};

		iface.toggleEnabled = function () {
			context.mutableProperties.enabled = !context.mutableProperties.enabled;
			context.setUpdated('enabled');
			iface.emit(Calendar.hookEnabledChanged, context.mutableProperties.enabled, !context.mutableProperties.enabled);
		};

		iface.isShared = function () {
			return context.shares.groups.length !== 0 || context.shares.users.length !== 0;
		};

		iface.isPublished = function () {
			return context.mutableProperties.published;
		};

		iface.isPublishable = function () {
			return context.publishable;
		};

		iface.isShareable = function () {
			return context.shareable;
		};

		iface.isRendering = function () {
			return context.fcEventSource.isRendering;
		};

		iface.isWritable = function () {
			return context.writable;
		};

		iface.arePropertiesWritable = function () {
			return context.writableProperties;
		};

		iface.eventsAccessibleViaCalDAV = function () {
			return true;
		};

		iface.refresh = function () {
		};

		iface.update = function () {
			return context.calendarService.update(iface);
		};

		iface.delete = function () {
			return context.calendarService.delete(iface);
		};

		iface.share = function (shareType, shareWith, writable, existingShare) {
			return context.calendarService.share(iface, shareType, shareWith, writable, existingShare);
		};

		iface.unshare = function (shareType, shareWith, writable, existingShare) {
			return context.calendarService.unshare(iface, shareType, shareWith, writable, existingShare);
		};

		iface.publish = function () {
			return context.calendarService.publish(iface);
		};

		iface.unpublish = function () {
			return context.calendarService.unpublish(iface);
		};

		Object.assign(iface, Hook(context));

		return iface;
	}

	Calendar.isCalendar = function (obj) {
		return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null && obj._isACalendarObject === true;
	};

	Calendar.hookFinishedRendering = 1;
	Calendar.hookColorChanged = 2;
	Calendar.hookDisplaynameChanged = 3;
	Calendar.hookEnabledChanged = 4;
	Calendar.hookOrderChanged = 5;

	return Calendar;
}]);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };


app.factory('FcEvent', ["SimpleEvent", function (SimpleEvent) {
	'use strict';


	function FcEvent(vevent, event, start, end) {
		var context = { vevent: vevent, event: event };
		context.iCalEvent = new ICAL.Event(event);

		var id = context.vevent.uri;
		if (event.hasProperty('recurrence-id')) {
			id += context.event.getFirstPropertyValue('recurrence-id').toICALString();
		}

		var allDay = start.icaltype === 'date' && end.icaltype === 'date';
		context.allDay = allDay;

		var iface = {
			_isAFcEventObject: true,
			id: id,
			allDay: allDay,
			start: start.toJSDate(),
			end: end.toJSDate(),
			repeating: context.iCalEvent.isRecurring(),
			className: ['fcCalendar-id-' + vevent.calendar.tmpId],
			editable: vevent.calendar.isWritable(),
			backgroundColor: vevent.calendar.color,
			borderColor: vevent.calendar.color,
			textColor: vevent.calendar.textColor,
			title: event.getFirstPropertyValue('summary')
		};

		Object.defineProperties(iface, {
			vevent: {
				get: function get() {
					return context.vevent;
				},
				enumerable: true
			},
			event: {
				get: function get() {
					return context.event;
				},
				enumerable: true
			},
			calendar: {
				get: function get() {
					return context.vevent.calendar;
				},
				enumerable: true
			}
		});

		iface.getSimpleEvent = function () {
			return SimpleEvent(context.event);
		};

		iface.drop = function (delta, isAllDay, timezone, defaultTimedEventMomentDuration, defaultAllDayEventMomentDuration) {
			delta = new ICAL.Duration().fromSeconds(delta.asSeconds());

			var timedDuration = new ICAL.Duration().fromSeconds(defaultTimedEventMomentDuration.asSeconds());
			var allDayDuration = new ICAL.Duration().fromSeconds(defaultAllDayEventMomentDuration.asSeconds());

			var dtstartProp = context.event.getFirstProperty('dtstart');
			var dtstart = dtstartProp.getFirstValue();
			dtstart.isDate = isAllDay;
			dtstart.addDuration(delta);
			dtstart.zone = isAllDay ? 'floating' : dtstart.zone;

			if (context.allDay && !isAllDay) {
				var timezoneObject = ICAL.TimezoneService.get(timezone);

				if (timezone === 'UTC') {
					timezone = 'Z';
				}

				dtstart.zone = timezoneObject;
				if (timezone !== 'Z') {
					dtstartProp.setParameter('tzid', timezone);

					if (context.event.parent) {
						context.event.parent.addSubcomponent(timezoneObject.component);
					}
				}
			}
			if (!context.allDay && isAllDay) {
				dtstartProp.removeParameter('tzid');
			}
			context.event.updatePropertyWithValue('dtstart', dtstart);

			if (context.allDay !== isAllDay) {
				if (!context.event.hasProperty('duration')) {
					var dtend = dtstart.clone();
					dtend.addDuration(isAllDay ? allDayDuration : timedDuration);
					var dtendProp = context.event.updatePropertyWithValue('dtend', dtend);

					var tzid = dtstartProp.getParameter('tzid');
					if (tzid) {
						dtendProp.setParameter('tzid', tzid);
					} else {
						dtendProp.removeParameter('tzid');
					}
				} else {
					context.event.updatePropertyWithValue('duration', isAllDay ? allDayDuration : timedDuration);
				}
			} else {
				if (context.event.hasProperty('dtend')) {
					var _dtend = context.event.getFirstPropertyValue('dtend');
					_dtend.addDuration(delta);
					context.event.updatePropertyWithValue('dtend', _dtend);
				}
			}

			context.allDay = isAllDay;
			context.vevent.touch();
		};

		iface.resize = function (delta) {
			delta = new ICAL.Duration().fromSeconds(delta.asSeconds());

			if (context.event.hasProperty('duration')) {
				var duration = context.event.getFirstPropertyValue('duration');
				duration.fromSeconds(delta.toSeconds() + duration.toSeconds());
				context.event.updatePropertyWithValue('duration', duration);
			} else if (context.event.hasProperty('dtend')) {
				var dtend = context.event.getFirstPropertyValue('dtend');
				dtend.addDuration(delta);
				context.event.updatePropertyWithValue('dtend', dtend);
			} else if (context.event.hasProperty('dtstart')) {
				var dtstart = event.getFirstProperty('dtstart');
				var _dtend2 = dtstart.getFirstValue().clone();
				_dtend2.addDuration(delta);

				var prop = context.event.addPropertyWithValue('dtend', _dtend2);

				var tzid = dtstart.getParameter('tzid');
				if (tzid) {
					prop.setParameter('tzid', tzid);
				}
			}

			context.vevent.touch();
		};

		iface.lock = function () {
			context.lock = true;
		};

		iface.unlock = function () {
			context.lock = false;
		};

		return iface;
	}

	FcEvent.isFcEvent = function (obj) {
		return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null && obj._isAFcEventObject === true;
	};

	return FcEvent;
}]);
'use strict';


app.factory('Hook', function () {
  'use strict';

  return function Hook(context) {
    context.hooks = {};
    var iface = {};

    iface.emit = function (identifier, newValue, oldValue) {
      if (Array.isArray(context.hooks[identifier])) {
        context.hooks[identifier].forEach(function (callback) {
          callback(newValue, oldValue);
        });
      }
    };

    iface.register = function (identifier, callback) {
      context.hooks[identifier] = context.hooks[identifier] || [];
      context.hooks[identifier].push(callback);
    };

    return iface;
  };
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };


app.factory('SimpleEvent', function () {
	'use strict';

	var defaults = {
		'summary': null,
		'location': null,
		'organizer': null,
		'class': null,
		'description': null,
		'status': null,
		'alarm': null,
		'attendee': null,
		'dtstart': null,
		'dtend': null,
		'repeating': null,
		'rdate': null,
		'rrule': null,
		'exdate': null
	};

	var attendeeParameters = ['role', 'rsvp', 'partstat', 'cutype', 'cn', 'delegated-from', 'delegated-to'];

	var organizerParameters = ['cn'];

	function getDtProperty(simple, propName) {
		if (simple.allDay) {
			simple[propName].parameters.zone = 'floating';
		}

		simple[propName].parameters.zone = simple[propName].parameters.zone || 'floating';

		if (simple[propName].parameters.zone !== 'floating' && !ICAL.TimezoneService.has(simple[propName].parameters.zone)) {
			throw new Error('Requested timezone not found (' + simple[propName].parameters.zone + ')');
		}

		var iCalTime = ICAL.Time.fromJSDate(simple[propName].value.toDate(), false);
		iCalTime.isDate = simple.allDay;

		if (simple[propName].parameters.zone !== 'floating') {
			iCalTime.zone = ICAL.TimezoneService.get(simple[propName].parameters.zone);
		}

		return iCalTime;
	}

	var simpleParser = {
		date: function date(data, vevent, key, parameters) {
			parameters = (parameters || []).concat(['tzid']);
			simpleParser._parseSingle(data, vevent, key, parameters, function (p) {
				var first = p.getFirstValue();
				return p.type === 'duration' ? first.toSeconds() : moment(first.toJSDate());
			});
		},
		dates: function dates(data, vevent, key, parameters) {
			parameters = (parameters || []).concat(['tzid']);
			simpleParser._parseMultiple(data, vevent, key, parameters, function (p) {
				var values = p.getValues(),
				    usableValues = [];

				values.forEach(function (value) {
					if (p.type === 'duration') {
						usableValues.push(value.toSeconds());
					} else {
						usableValues.push(moment(value.toJSDate()));
					}
				});

				return usableValues;
			});
		},
		string: function string(data, vevent, key, parameters) {
			simpleParser._parseSingle(data, vevent, key, parameters, function (p) {
				return p.isMultiValue ? p.getValues() : p.getFirstValue();
			});
		},
		strings: function strings(data, vevent, key, parameters) {
			simpleParser._parseMultiple(data, vevent, key, parameters, function (p) {
				return p.isMultiValue ? p.getValues() : p.getFirstValue();
			});
		},
		_parseSingle: function _parseSingle(data, vevent, key, parameters, valueParser) {
			var prop = vevent.getFirstProperty(key);
			if (!prop) {
				return;
			}

			data[key] = {
				parameters: simpleParser._parseParameters(prop, parameters),
				type: prop.type
			};

			if (prop.isMultiValue) {
				data[key].values = valueParser(prop);
			} else {
				data[key].value = valueParser(prop);
			}
		},
		_parseMultiple: function _parseMultiple(data, vevent, key, parameters, valueParser) {
			data[key] = data[key] || [];

			var properties = vevent.getAllProperties(key);
			var group = 0;

			properties.forEach(function (property) {
				var currentElement = {
					group: group,
					parameters: simpleParser._parseParameters(property, parameters),
					type: property.type
				};

				if (property.isMultiValue) {
					currentElement.values = valueParser(property);
				} else {
					currentElement.value = valueParser(property);
				}

				data[key].push(currentElement);
				property.setParameter('x-nc-group-id', group.toString());
				group++;
			});
		},
		_parseParameters: function _parseParameters(prop, para) {
			var parameters = {};

			if (!para) {
				return parameters;
			}

			para.forEach(function (p) {
				parameters[p] = prop.getParameter(p);
			});

			return parameters;
		}
	};

	var simpleReader = {
		date: function date(vevent, oldSimpleData, newSimpleData, key, parameters) {
			parameters = (parameters || []).concat(['tzid']);
			simpleReader._readSingle(vevent, oldSimpleData, newSimpleData, key, parameters, function (v, isMultiValue) {
				return v.type === 'duration' ? ICAL.Duration.fromSeconds(v.value) : ICAL.Time.fromJSDate(v.value.toDate());
			});
		},
		dates: function dates(vevent, oldSimpleData, newSimpleData, key, parameters) {
			parameters = (parameters || []).concat(['tzid']);
			simpleReader._readMultiple(vevent, oldSimpleData, newSimpleData, key, parameters, function (v, isMultiValue) {
				var values = [];

				v.values.forEach(function (value) {
					if (v.type === 'duration') {
						values.push(ICAL.Duration.fromSeconds(value));
					} else {
						values.push(ICAL.Time.fromJSDate(value.toDate()));
					}
				});

				return values;
			});
		},
		string: function string(vevent, oldSimpleData, newSimpleData, key, parameters) {
			simpleReader._readSingle(vevent, oldSimpleData, newSimpleData, key, parameters, function (v, isMultiValue) {
				return isMultiValue ? v.values : v.value;
			});
		},
		strings: function strings(vevent, oldSimpleData, newSimpleData, key, parameters) {
			simpleReader._readMultiple(vevent, oldSimpleData, newSimpleData, key, parameters, function (v, isMultiValue) {
				return isMultiValue ? v.values : v.value;
			});
		},
		_readSingle: function _readSingle(vevent, oldSimpleData, newSimpleData, key, parameters, valueReader) {
			if (!newSimpleData[key]) {
				return;
			}
			if (!newSimpleData[key].hasOwnProperty('value') && !newSimpleData[key].hasOwnProperty('values')) {
				return;
			}
			var isMultiValue = newSimpleData[key].hasOwnProperty('values');

			var prop = vevent.updatePropertyWithValue(key, valueReader(newSimpleData[key], isMultiValue));
			simpleReader._readParameters(prop, newSimpleData[key], parameters);
		},
		_readMultiple: function _readMultiple(vevent, oldSimpleData, newSimpleData, key, parameters, valueReader) {
			var oldGroups = [];
			var properties = void 0,
			    pKey = void 0,
			    groupId = void 0;

			oldSimpleData[key] = oldSimpleData[key] || [];
			oldSimpleData[key].forEach(function (e) {
				oldGroups.push(e.group);
			});

			newSimpleData[key] = newSimpleData[key] || [];
			newSimpleData[key].forEach(function (e) {
				var isMultiValue = e.hasOwnProperty('values');
				var value = valueReader(e, isMultiValue);

				if (oldGroups.indexOf(e.group) === -1) {
					var property = new ICAL.Property(key);
					simpleReader._setProperty(property, value, isMultiValue);
					simpleReader._readParameters(property, e, parameters);
					vevent.addProperty(property);
				} else {
					oldGroups.splice(oldGroups.indexOf(e.group), 1);

					properties = vevent.getAllProperties(key);
					for (pKey in properties) {
						if (!properties.hasOwnProperty(pKey)) {
							continue;
						}

						groupId = properties[pKey].getParameter('x-nc-group-id');
						if (groupId === null) {
							continue;
						}
						if (parseInt(groupId) === e.group) {
							simpleReader._setProperty(properties[pKey], value, isMultiValue);
							simpleReader._readParameters(properties[pKey], e, parameters);
						}
					}
				}
			});

			properties = vevent.getAllProperties(key);
			properties.forEach(function (property) {
				groupId = property.getParameter('x-nc-group-id');
				if (oldGroups.indexOf(parseInt(groupId)) !== -1) {
					vevent.removeProperty(property);
				}
				property.removeParameter('x-nc-group-id');
			});
		},
		_readParameters: function _readParameters(prop, simple, para) {
			if (!para) {
				return;
			}
			if (!simple.parameters) {
				return;
			}

			para.forEach(function (p) {
				if (simple.parameters[p]) {
					prop.setParameter(p, simple.parameters[p]);
				} else {
					prop.removeParameter(simple.parameters[p]);
				}
			});
		},
		_setProperty: function _setProperty(prop, value, isMultiValue) {
			if (isMultiValue) {
				prop.setValues(value);
			} else {
				prop.setValue(value);
			}
		}
	};

	var simpleProperties = {
		'summary': { parser: simpleParser.string, reader: simpleReader.string },
		'location': { parser: simpleParser.string, reader: simpleReader.string },
		'attendee': {
			parser: simpleParser.strings,
			reader: simpleReader.strings,
			parameters: attendeeParameters
		},
		'organizer': {
			parser: simpleParser.string,
			reader: simpleReader.string,
			parameters: organizerParameters
		},
		'class': { parser: simpleParser.string, reader: simpleReader.string },
		'description': {
			parser: simpleParser.string,
			reader: simpleReader.string
		},
		'status': { parser: simpleParser.string, reader: simpleReader.string }
	};

	var specificParser = {
		alarm: function alarm(data, vevent) {
			data.alarm = data.alarm || [];

			var alarms = vevent.getAllSubcomponents('valarm');
			var group = 0;
			alarms.forEach(function (alarm) {
				var alarmData = {
					group: group,
					action: {},
					trigger: {},
					repeat: {},
					duration: {},
					attendee: []
				};

				simpleParser.string(alarmData, alarm, 'action');
				simpleParser.date(alarmData, alarm, 'trigger');
				simpleParser.string(alarmData, alarm, 'repeat');
				simpleParser.date(alarmData, alarm, 'duration');
				simpleParser.strings(alarmData, alarm, 'attendee', attendeeParameters);


				if (alarmData.trigger.type === 'duration' && alarm.hasProperty('trigger')) {
					var trigger = alarm.getFirstProperty('trigger');
					var related = trigger.getParameter('related');
					if (related) {
						alarmData.trigger.related = related;
					} else {
						alarmData.trigger.related = 'start';
					}
				}

				data.alarm.push(alarmData);

				alarm.getFirstProperty('action').setParameter('x-nc-group-id', group.toString());
				group++;
			});
		},
		date: function date(data, vevent) {
			var dtstart = vevent.getFirstPropertyValue('dtstart');
			var dtend = void 0;

			if (vevent.hasProperty('dtend')) {
				dtend = vevent.getFirstPropertyValue('dtend');
			} else if (vevent.hasProperty('duration')) {
				dtend = dtstart.clone();
				dtend.addDuration(vevent.getFirstPropertyValue('duration'));
			} else {
				dtend = dtstart.clone();
			}

			data.dtstart = {
				parameters: {
					zone: dtstart.zone.toString()
				},
				value: moment({
					years: dtstart.year,
					months: dtstart.month - 1,
					date: dtstart.day,
					hours: dtstart.hour,
					minutes: dtstart.minute,
					seconds: dtstart.seconds
				})
			};
			data.dtend = {
				parameters: {
					zone: dtend.zone.toString()
				},
				value: moment({
					years: dtend.year,
					months: dtend.month - 1,
					date: dtend.day,
					hours: dtend.hour,
					minutes: dtend.minute,
					seconds: dtend.seconds
				})
			};
			data.allDay = dtstart.icaltype === 'date' && dtend.icaltype === 'date';
		},
		repeating: function repeating(data, vevent) {
			var iCalEvent = new ICAL.Event(vevent);

			data.repeating = iCalEvent.isRecurring();

			var rrule = vevent.getFirstPropertyValue('rrule');
			if (rrule) {
				data.rrule = {
					count: rrule.count,
					freq: rrule.freq,
					interval: rrule.interval,
					parameters: rrule.parts,
					until: null
				};

			} else {
				data.rrule = {
					freq: 'NONE'
				};
			}
		}
	};

	var specificReader = {
		alarm: function alarm(vevent, oldSimpleData, newSimpleData) {
			var components = {},
			    key = 'alarm';

			function getAlarmGroup(alarmData) {
				return alarmData.group;
			}

			oldSimpleData[key] = oldSimpleData[key] || [];
			var oldGroups = oldSimpleData[key].map(getAlarmGroup);

			newSimpleData[key] = newSimpleData[key] || [];
			var newGroups = newSimpleData[key].map(getAlarmGroup);

			var removedAlarms = oldGroups.filter(function (group) {
				return newGroups.indexOf(group) === -1;
			});

			vevent.getAllSubcomponents('valarm').forEach(function (alarm) {
				var group = alarm.getFirstProperty('action').getParameter('x-nc-group-id');
				components[group] = alarm;
			});

			removedAlarms.forEach(function (group) {
				if (components[group]) {
					vevent.removeSubcomponent(components[group]);
					delete components[group];
				}
			});

			newSimpleData[key].forEach(function (alarmData) {
				var valarm = void 0,
				    oldSimpleAlarmData = void 0;

				if (oldGroups.indexOf(alarmData.group) === -1) {
					valarm = new ICAL.Component('VALARM');
					vevent.addSubcomponent(valarm);
					oldSimpleAlarmData = {};
				} else {
					valarm = components[alarmData.group];
					oldSimpleAlarmData = oldSimpleData.alarm.find(function (alarm) {
						return alarm.group === alarmData.group;
					});
				}

				simpleReader.string(valarm, oldSimpleAlarmData, alarmData, 'action', []);
				simpleReader.date(valarm, oldSimpleAlarmData, alarmData, 'trigger', []);
				simpleReader.string(valarm, oldSimpleAlarmData, alarmData, 'repeat', []);
				simpleReader.date(valarm, oldSimpleAlarmData, alarmData, 'duration', []);
				simpleReader.strings(valarm, oldSimpleAlarmData, alarmData, 'attendee', attendeeParameters);

				valarm.getFirstProperty('action').removeParameter('x-nc-group-id');
			});
		},
		date: function date(vevent, oldSimpleData, newSimpleData) {
			vevent.removeAllProperties('dtstart');
			vevent.removeAllProperties('dtend');
			vevent.removeAllProperties('duration');

			if (newSimpleData.allDay) {
				newSimpleData.dtstart.parameters.zone = 'floating';
				newSimpleData.dtend.parameters.zone = 'floating';
			}

			newSimpleData.dtstart.parameters.zone = newSimpleData.dtstart.parameters.zone || 'floating';
			newSimpleData.dtend.parameters.zone = newSimpleData.dtend.parameters.zone || 'floating';

			if (newSimpleData.dtstart.parameters.zone !== 'floating' && !ICAL.TimezoneService.has(newSimpleData.dtstart.parameters.zone)) {
				throw new Error('Requested timezone not found (' + newSimpleData.dtstart.parameters.zone + ')');
			}
			if (newSimpleData.dtend.parameters.zone !== 'floating' && !ICAL.TimezoneService.has(newSimpleData.dtend.parameters.zone)) {
				throw new Error('Requested timezone not found (' + newSimpleData.dtend.parameters.zone + ')');
			}

			var start = ICAL.Time.fromJSDate(newSimpleData.dtstart.value.toDate(), false);
			start.isDate = newSimpleData.allDay;
			var end = ICAL.Time.fromJSDate(newSimpleData.dtend.value.toDate(), false);
			end.isDate = newSimpleData.allDay;

			var alreadyStoredTimezones = ['UTC'];
			var vtimezones = vevent.parent.getAllSubcomponents('vtimezone');
			vtimezones.forEach(function (vtimezone) {
				alreadyStoredTimezones.push(vtimezone.getFirstPropertyValue('tzid'));
			});

			var startProp = new ICAL.Property('dtstart', vevent);
			if (newSimpleData.dtstart.parameters.zone !== 'floating') {
				if (newSimpleData.dtstart.parameters.zone !== 'UTC') {
					startProp.setParameter('tzid', newSimpleData.dtstart.parameters.zone);
				}

				var startTz = ICAL.TimezoneService.get(newSimpleData.dtstart.parameters.zone);
				start.zone = startTz;
				if (alreadyStoredTimezones.indexOf(newSimpleData.dtstart.parameters.zone) === -1) {
					vevent.parent.addSubcomponent(startTz.component);
					alreadyStoredTimezones.push(newSimpleData.dtstart.parameters.zone);
				}
			}
			startProp.setValue(start);

			var endProp = new ICAL.Property('dtend', vevent);
			if (newSimpleData.dtend.parameters.zone !== 'floating') {
				if (newSimpleData.dtend.parameters.zone !== 'UTC') {
					endProp.setParameter('tzid', newSimpleData.dtend.parameters.zone);
				}

				var endTz = ICAL.TimezoneService.get(newSimpleData.dtend.parameters.zone);
				end.zone = endTz;
				if (alreadyStoredTimezones.indexOf(newSimpleData.dtend.parameters.zone) === -1) {
					vevent.parent.addSubcomponent(endTz.component);
				}
			}
			endProp.setValue(end);

			vevent.addProperty(startProp);
			vevent.addProperty(endProp);
		},
		repeating: function repeating(vevent, oldSimpleData, newSimpleData) {
			if (newSimpleData.rrule === null || newSimpleData.rrule.freq === 'NONE') {
				vevent.removeAllProperties('rdate');
				vevent.removeAllProperties('rrule');
				vevent.removeAllProperties('exdate');

				return;
			}

			if (newSimpleData.rrule.dontTouch) {
				return;
			}

			var params = {
				interval: newSimpleData.rrule.interval,
				freq: newSimpleData.rrule.freq
			};

			if (newSimpleData.rrule.count) {
				params.count = newSimpleData.rrule.count;
			}

			var rrule = new ICAL.Recur(params);
			vevent.updatePropertyWithValue('rrule', rrule);
		}
	};

	function SimpleEvent(event) {
		var context = {
			event: event,
			patched: false,
			oldProperties: {}
		};

		var iface = {
			_isASimpleEventObject: true
		};
		angular.extend(iface, defaults);

		context.generateOldProperties = function () {
			context.oldProperties = {};

			for (var key in defaults) {
				context.oldProperties[key] = angular.copy(iface[key]);
			}
		};

		iface.checkDtStartBeforeDtEnd = function () {
			var dtStart = getDtProperty(iface, 'dtstart');
			var dtEnd = getDtProperty(iface, 'dtend');

			return dtEnd.compare(dtStart) !== -1;
		};

		iface.patch = function () {
			if (context.patched) {
				throw new Error('SimpleEvent was already patched, patching not possible');
			}

			for (var simpleKey in simpleProperties) {
				var simpleProperty = simpleProperties[simpleKey];

				var reader = simpleProperty.reader;
				var parameters = simpleProperty.parameters;
				if (context.oldProperties[simpleKey] !== iface[simpleKey]) {
					if (iface[simpleKey] === null) {
						context.event.removeAllProperties(simpleKey);
					} else {
						reader(context.event, context.oldProperties, iface, simpleKey, parameters);
					}
				}
			}

			for (var specificKey in specificReader) {
				var _reader = specificReader[specificKey];
				_reader(context.event, context.oldProperties, iface);
			}

			context.patched = true;
		};

		for (var simpleKey in simpleProperties) {
			var simpleProperty = simpleProperties[simpleKey];

			var parser = simpleProperty.parser;
			var parameters = simpleProperty.parameters;
			if (context.event.hasProperty(simpleKey)) {
				parser(iface, context.event, simpleKey, parameters);
			}
		}

		for (var specificKey in specificParser) {
			var _parser = specificParser[specificKey];
			_parser(iface, context.event);
		}

		context.generateOldProperties();

		return iface;
	}

	SimpleEvent.isSimpleEvent = function (obj) {
		return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null && obj._isASimpleEventObject === true;
	};

	return SimpleEvent;
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

app.factory('SplittedICal', function () {
	'use strict';

	function SplittedICal(name, color) {
		var context = {
			name: name,
			color: color,
			vevents: [],
			vjournals: [],
			vtodos: []
		};
		var iface = {
			_isASplittedICalObject: true
		};

		Object.defineProperties(iface, {
			name: {
				get: function get() {
					return context.name;
				}
			},
			color: {
				get: function get() {
					return context.color;
				}
			},
			vevents: {
				get: function get() {
					return context.vevents;
				}
			},
			vjournals: {
				get: function get() {
					return context.vjournals;
				}
			},
			vtodos: {
				get: function get() {
					return context.vtodos;
				}
			},
			objects: {
				get: function get() {
					return [].concat(context.vevents).concat(context.vjournals).concat(context.vtodos);
				}
			}
		});

		iface.addObject = function (componentName, object) {
			switch (componentName) {
				case 'vevent':
					context.vevents.push(object);
					break;

				case 'vjournal':
					context.vjournals.push(object);
					break;

				case 'vtodo':
					context.vtodos.push(object);
					break;

				default:
					break;
			}
		};

		return iface;
	}

	SplittedICal.isSplittedICal = function (obj) {
		return obj instanceof SplittedICal || (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null && obj._isASplittedICalObject !== null;
	};

	return SplittedICal;
});
'use strict';


app.factory('Timezone', function () {
	'use strict';

	var timezone = function Timezone(data) {
		angular.extend(this, {
			_props: {}
		});

		if (data instanceof ICAL.Timezone) {
			this._props.jCal = data;
			this._props.name = data.tzid;
		} else if (typeof data === 'string') {
			var jCal = ICAL.parse(data);
			var components = new ICAL.Component(jCal);
			var iCalTimezone = null;
			if (components.name === 'vtimezone') {
				iCalTimezone = new ICAL.Timezone(components);
			} else {
				iCalTimezone = new ICAL.Timezone(components.getFirstSubcomponent('vtimezone'));
			}
			this._props.jCal = iCalTimezone;
			this._props.name = iCalTimezone.tzid;
		}
	};

	timezone.prototype = {
		get jCal() {
			return this._props.jCal;
		},
		get name() {
			return this._props.name;
		}
	};

	return timezone;
});
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }


app.factory('VEvent', ["TimezoneService", "FcEvent", "SimpleEvent", "ICalFactory", "StringUtility", function (TimezoneService, FcEvent, SimpleEvent, ICalFactory, StringUtility) {
	'use strict';


	function VEvent(calendar, comp, uri) {
		var etag = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

		var context = { calendar: calendar, comp: comp, uri: uri, etag: etag };
		var iface = {
			_isAVEventObject: true
		};

		if (!context.comp || !context.comp.jCal || context.comp.jCal.length === 0) {
			throw new TypeError('Given comp is not a valid calendar');
		}

		var vtimezones = comp.getAllSubcomponents('vtimezone');
		vtimezones.forEach(function (vtimezone) {
			var timezone = new ICAL.Timezone(vtimezone);
			ICAL.TimezoneService.register(timezone.tzid, timezone);
		});

		if (!uri) {
			var vevent = context.comp.getFirstSubcomponent('vevent');
			context.uri = vevent.getFirstPropertyValue('uid');
		}

		context.calculateDTEnd = function (vevent) {
			if (vevent.hasProperty('dtend')) {
				return vevent.getFirstPropertyValue('dtend');
			} else if (vevent.hasProperty('duration')) {
				var dtstart = vevent.getFirstPropertyValue('dtstart').clone();
				dtstart.addDuration(vevent.getFirstPropertyValue('duration'));

				return dtstart;
			} else {
				return vevent.getFirstPropertyValue('dtstart').clone();
			}
		};

		context.convertTz = function (dt, timezone) {
			if (context.needsTzConversion(dt) && timezone) {
				dt = dt.convertToZone(timezone);
			}

			return dt;
		};

		context.needsTzConversion = function (dt) {
			return dt.icaltype !== 'date' && dt.zone !== ICAL.Timezone.utcTimezone && dt.zone !== ICAL.Timezone.localTimezone;
		};

		context.getMissingEventTimezones = function () {
			var missingTimezones = [];
			var propertiesToSearch = ['dtstart', 'dtend'];
			var vevents = context.comp.getAllSubcomponents('vevent');
			vevents.forEach(function (vevent) {
				propertiesToSearch.forEach(function (propName) {
					if (vevent.hasProperty(propName)) {
						var prop = vevent.getFirstProperty(propName);
						var tzid = prop.getParameter('tzid');
						if (tzid && !ICAL.TimezoneService.has(tzid) && missingTimezones.indexOf(tzid) === -1) {
							missingTimezones.push(tzid);
						}
					}
				});
			});

			return missingTimezones;
		};

		Object.defineProperties(iface, {
			calendar: {
				get: function get() {
					return context.calendar;
				},
				set: function set(calendar) {
					context.calendar = calendar;
				}
			},
			comp: {
				get: function get() {
					return context.comp;
				}
			},
			data: {
				get: function get() {
					return context.comp.toString();
				}
			},
			etag: {
				get: function get() {
					return context.etag;
				},
				set: function set(etag) {
					context.etag = etag;
				}
			},
			uri: {
				get: function get() {
					return context.uri;
				}
			}
		});

		iface.getFcEvent = function (start, end, timezone) {
			return new Promise(function (resolve, reject) {
				var iCalStart = ICAL.Time.fromJSDate(start.toDate());
				var iCalEnd = ICAL.Time.fromJSDate(end.toDate());
				var fcEvents = [];

				var missingTimezones = context.getMissingEventTimezones();
				var errorSafeMissingTimezones = [];
				missingTimezones.forEach(function (missingTimezone) {
					var promise = TimezoneService.get(missingTimezone).then(function (tz) {
						return tz;
					}).catch(function (reason) {
						return null;
					});
					errorSafeMissingTimezones.push(promise);
				});

				Promise.all(errorSafeMissingTimezones).then(function (timezones) {
					timezones.forEach(function (timezone) {
						if (!timezone) {
							return;
						}

						var icalTimezone = new ICAL.Timezone(timezone.jCal);
						ICAL.TimezoneService.register(timezone.name, icalTimezone);
					});
				}).then(function () {
					var vevents = context.comp.getAllSubcomponents('vevent');
					var exceptions = vevents.filter(function (vevent) {
						return vevent.hasProperty('recurrence-id');
					});
					var vevent = vevents.find(function (vevent) {
						return !vevent.hasProperty('recurrence-id');
					});
					var iCalEvent = new ICAL.Event(vevent, { exceptions: exceptions });

					if (!vevent.hasProperty('dtstart')) {
						resolve([]);
					}

					var dtstartProp = vevent.getFirstProperty('dtstart');
					var rawDtstart = dtstartProp.getFirstValue('dtstart');
					var rawDtend = context.calculateDTEnd(vevent);

					if (iCalEvent.isRecurring()) {
						var iterator = new ICAL.RecurExpansion({
							component: vevent,
							dtstart: rawDtstart
						});

						var next = void 0;
						while (next = iterator.next()) {
							var occurrence = iCalEvent.getOccurrenceDetails(next);

							if (occurrence.endDate.compare(iCalStart) < 0) {
								continue;
							}
							if (occurrence.startDate.compare(iCalEnd) > 0) {
								break;
							}

							var dtstart = context.convertTz(occurrence.startDate, timezone.jCal);
							var dtend = context.convertTz(occurrence.endDate, timezone.jCal);
							var fcEvent = FcEvent(iface, occurrence.item.component, dtstart, dtend);

							fcEvents.push(fcEvent);
						}
					} else {
						var _dtstart = context.convertTz(rawDtstart, timezone.jCal);
						var _dtend = context.convertTz(rawDtend, timezone.jCal);
						var _fcEvent = FcEvent(iface, vevent, _dtstart, _dtend);

						fcEvents.push(_fcEvent);
					}

					resolve(fcEvents);
				});
			});
		};

		iface.getSimpleEvent = function (searchedRecurrenceId) {
			var vevents = context.comp.getAllSubcomponents('vevent');

			var veventsLength = vevents.length;
			for (var i = 0; i < veventsLength; i++) {
				var _vevent = vevents[i];
				var hasRecurrenceId = _vevent.hasProperty('recurrence-id');
				var recurrenceId = null;
				if (hasRecurrenceId) {
					recurrenceId = _vevent.getFirstPropertyValue('recurrence-id').toICALString();
				}

				if (!hasRecurrenceId && !searchedRecurrenceId || hasRecurrenceId && searchedRecurrenceId === recurrenceId) {
					return SimpleEvent(_vevent);
				}
			}

			throw new Error('Event not found');
		};

		iface.touch = function () {
			var vevent = context.comp.getFirstSubcomponent('vevent');
			vevent.updatePropertyWithValue('last-modified', ICAL.Time.now());
		};

		return iface;
	}

	VEvent.isVEvent = function (obj) {
		return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null && obj._isAVEventObject === true;
	};

	VEvent.sanDate = function (ics) {
		ics.split("\n").forEach(function (el, i) {

			var findTypes = ['DTSTART', 'DTEND'];
			var dateType = /[^:]*/.exec(el)[0];
			var icsDate = null;

			if (findTypes.indexOf(dateType) >= 0 && el.trim().substr(-3) === 'T::') {
				icsDate = el.replace(/[^0-9]/g, '');
				ics = ics.replace(el, dateType + ';VALUE=DATE:' + icsDate);
			}
		});

		return ics;
	};

	VEvent.sanNoDateValue = function (ics) {
		ics.split("\n").forEach(function (el, i) {

			if (el.indexOf(';VALUE=DATE') !== -1) {
				return;
			}

			var findTypes = ['DTSTART', 'DTEND'];

			var _el$split = el.split(':'),
			    _el$split2 = _slicedToArray(_el$split, 2),
			    dateTypePara = _el$split2[0],
			    dateValue = _el$split2[1];

			var _dateTypePara$split = dateTypePara.split(';'),
			    _dateTypePara$split2 = _toArray(_dateTypePara$split),
			    dateType = _dateTypePara$split2[0],
			    dateParameters = _dateTypePara$split2.slice(1);

			if (findTypes.indexOf(dateType) >= 0 && dateParameters.indexOf('VALUE=DATE') === -1 && dateValue.length === 8) {
				ics = ics.replace(el, dateTypePara + ';VALUE=DATE:' + dateValue);
			}
		});

		return ics;
	};

	VEvent.sanTrigger = function (ics) {
		var regex = /^TRIGGER:P$/gm;
		if (ics.match(regex)) {
			ics = ics.replace(regex, 'TRIGGER:P0D');
		}

		return ics;
	};

	VEvent.fromRawICS = function (calendar, ics, uri) {
		var etag = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';

		var comp = void 0;

		if (ics.search('T::') > 0) {
			ics = VEvent.sanDate(ics);
		}

		if (ics.search('TRIGGER:P') > 0) {
			ics = VEvent.sanTrigger(ics);
		}

		ics = VEvent.sanNoDateValue(ics);

		try {
			var jCal = ICAL.parse(ics);
			comp = new ICAL.Component(jCal);
		} catch (e) {
			console.log(e);
			throw new TypeError('given ics data was not valid');
		}

		return VEvent(calendar, comp, uri, etag);
	};

	VEvent.fromStartEnd = function (start, end, timezone) {
		var uid = StringUtility.uid();
		var comp = ICalFactory.newEvent(uid);
		var uri = StringUtility.uid('Nextcloud', 'ics');
		var vevent = VEvent(null, comp, uri);
		var simple = vevent.getSimpleEvent();

		simple.allDay = !start.hasTime() && !end.hasTime();
		simple.dtstart = {
			type: start.hasTime() ? 'datetime' : 'date',
			value: start,
			parameters: {
				zone: timezone
			}
		};
		simple.dtend = {
			type: end.hasTime() ? 'datetime' : 'date',
			value: end,
			parameters: {
				zone: timezone
			}
		};
		simple.patch();

		return vevent;
	};

	return VEvent;
}]);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();


app.factory('WebCal', ["$http", "Calendar", "VEvent", "TimezoneService", "WebCalService", "WebCalUtility", function ($http, Calendar, VEvent, TimezoneService, WebCalService, WebCalUtility) {
	'use strict';


	function WebCal(CalendarService, url, props) {
		var context = {
			calendarService: CalendarService,
			updatedProperties: [],
			storedUrl: props.href, 
			url: WebCalUtility.fixURL(props.href)
		};

		var iface = Calendar(CalendarService, url, props);
		iface._isAWebCalObject = true;

		context.setUpdated = function (property) {
			if (context.updatedProperties.indexOf(property) === -1) {
				context.updatedProperties.push(property);
			}
		};

		Object.defineProperties(iface, {
			downloadUrl: {
				get: function get() {
					return context.url;
				}
			},
			storedUrl: {
				get: function get() {
					return context.storedUrl;
				}
			}
		});

		iface.fcEventSource.events = function (start, end, timezone, callback) {
			var fcAPI = this;
			iface.fcEventSource.isRendering = true;
			iface.emit(Calendar.hookFinishedRendering);

			var allowDowngradeToHttp = !context.storedUrl.startsWith('https://');

			var TimezoneServicePromise = TimezoneService.get(timezone);
			var WebCalServicePromise = WebCalService.get(context.url, allowDowngradeToHttp);
			Promise.all([TimezoneServicePromise, WebCalServicePromise]).then(function (results) {
				var _results = _slicedToArray(results, 2),
				    tz = _results[0],
				    response = _results[1];

				var promises = [];
				var vevents = [];

				response.vevents.forEach(function (ics) {
					try {
						var vevent = VEvent.fromRawICS(iface, ics);
						var promise = vevent.getFcEvent(start, end, tz).then(function (vevent) {
							vevents = vevents.concat(vevent);
						}).catch(function (reason) {
							iface.addWarning(reason);
							console.log(event, reason);
						});

						promises.push(promise);
					} catch (e) {
						console.log(e);
					}
				});

				return Promise.all(promises).then(function () {
					callback(vevents);
					fcAPI.reportEventChange();

					iface.fcEventSource.isRendering = false;
					iface.emit(Calendar.hookFinishedRendering);
				});
			}).catch(function (reason) {
				if (reason === 'Unknown timezone' && timezone !== 'UTC') {
					var eventsFn = iface.fcEventSource.events.bind(fcAPI);
					eventsFn(start, end, 'UTC', callback);
				} else if (reason.redirect === true) {
					if (context.storedUrl === reason.new_url) {
						return Promise.reject('Fatal error. Redirected URL matched original URL. Aborting');
					}

					context.storedUrl = reason.new_url;
					context.url = reason.new_url;
					context.setUpdated('storedUrl');
					iface.update();
					var _eventsFn = iface.fcEventSource.events.bind(fcAPI);
					_eventsFn(start, end, timezone, callback);
				} else {
					iface.addWarning(reason);
					console.log(reason);
					iface.fcEventSource.isRendering = false;
					iface.emit(Calendar.hookFinishedRendering);
				}
			});
		};

		iface.eventsAccessibleViaCalDAV = function () {
			return false;
		};

		var parentGetUpdated = iface.getUpdated;
		iface.getUpdated = function () {
			var updated = parentGetUpdated();
			return updated.concat(context.updatedProperties);
		};

		var parentResetUpdated = iface.resetUpdated;
		iface.resetUpdated = function () {
			parentResetUpdated();
			context.updatedProperties = [];
		};

		iface.delete = function () {
			localStorage.removeItem(iface.storedUrl);
			return context.calendarService.delete(iface);
		};

		return iface;
	}

	WebCal.isWebCal = function (obj) {
		return (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && obj !== null && obj._isAWebCalObject === true;
	};

	return WebCal;
}]);
'use strict';

app.filter('calendarListFilter', ["CalendarListItem", function (CalendarListItem) {
  'use strict';

  return function (calendarListItems) {
    if (!Array.isArray(calendarListItems)) {
      return [];
    }

    return calendarListItems.filter(function (item) {
      if (!CalendarListItem.isCalendarListItem(item)) {
        return false;
      }
      return item.calendar.isWritable();
    });
  };
}]);
'use strict';

app.filter('subscriptionListFilter', ["CalendarListItem", function (CalendarListItem) {
  'use strict';

  return function (calendarListItems) {
    if (!Array.isArray(calendarListItems)) {
      return [];
    }

    return calendarListItems.filter(function (item) {
      if (!CalendarListItem.isCalendarListItem(item)) {
        return false;
      }
      return !item.calendar.isWritable();
    });
  };
}]);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };


app.filter('attendeeFilter', function () {
  'use strict';

  return function (attendee) {
    if ((typeof attendee === 'undefined' ? 'undefined' : _typeof(attendee)) !== 'object' || !attendee) {
      return '';
    } else if (_typeof(attendee.parameters) === 'object' && typeof attendee.parameters.cn === 'string') {
      return attendee.parameters.cn;
    } else if (typeof attendee.value === 'string' && attendee.value.startsWith('MAILTO:')) {
      return attendee.value.substr(7);
    } else {
      return attendee.value || '';
    }
  };
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

app.filter('attendeeNotOrganizerFilter', function () {
  'use strict';

  return function (attendees, organizer) {
    if (typeof organizer !== 'string' || organizer === '') {
      return Array.isArray(attendees) ? attendees : [];
    }

    if (!Array.isArray(attendees)) {
      return [];
    }

    var organizerValue = 'MAILTO:' + organizer;
    return attendees.filter(function (element) {
      if ((typeof element === 'undefined' ? 'undefined' : _typeof(element)) !== 'object') {
        return false;
      } else {
        return element.value !== organizerValue;
      }
    });
  };
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

app.filter('calendarFilter', function () {
  'use strict';

  return function (calendars) {
    if (!Array.isArray(calendars)) {
      return [];
    }

    return calendars.filter(function (element) {
      if ((typeof element === 'undefined' ? 'undefined' : _typeof(element)) !== 'object') {
        return false;
      } else {
        return element.isWritable();
      }
    });
  };
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

app.filter('calendarSelectorFilter', function () {
  'use strict';

  return function (calendars, calendar) {
    if (!Array.isArray(calendars)) {
      return [];
    }

    var options = calendars.filter(function (c) {
      return c.isWritable();
    });

    if ((typeof calendar === 'undefined' ? 'undefined' : _typeof(calendar)) !== 'object' || !calendar) {
      return options;
    }

    if (!calendar.isWritable()) {
      return [calendar];
    } else {
      if (options.indexOf(calendar) === -1) {
        options.push(calendar);
      }

      return options;
    }
  };
});
'use strict';

app.filter('datepickerFilter', function () {
	'use strict';

	return function (datetime, view) {
		if (!(datetime instanceof Date) || typeof view !== 'string') {
			return '';
		}

		switch (view) {
			case 'agendaDay':
				return moment(datetime).format('ll');

			case 'agendaWeek':
				return t('calendar', 'Week {number} of {year}', { number: moment(datetime).week(),
					year: moment(datetime).week() === 1 ? moment(datetime).add(1, 'week').year() : moment(datetime).year() });

			case 'month':
				return moment(datetime).week() === 1 ? moment(datetime).add(1, 'week').format('MMMM GGGG') : moment(datetime).format('MMMM GGGG');

			default:
				return '';
		}
	};
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

app.filter('importCalendarFilter', function () {
  'use strict';

  return function (calendars, file) {
    if (!Array.isArray(calendars) || (typeof file === 'undefined' ? 'undefined' : _typeof(file)) !== 'object' || !file || _typeof(file.splittedICal) !== 'object' || !file.splittedICal) {
      return [];
    }

    var events = file.splittedICal.vevents.length,
        journals = file.splittedICal.vjournals.length,
        todos = file.splittedICal.vtodos.length;

    return calendars.filter(function (calendar) {
      if (events !== 0 && !calendar.components.vevent) {
        return false;
      }
      if (journals !== 0 && !calendar.components.vjournal) {
        return false;
      }
      if (todos !== 0 && !calendar.components.vtodo) {
        return false;
      }

      return true;
    });
  };
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

app.filter('importErrorFilter', function () {
  'use strict';

  return function (file) {
    if ((typeof file === 'undefined' ? 'undefined' : _typeof(file)) !== 'object' || !file || typeof file.errors !== 'number') {
      return '';
    }

    switch (file.errors) {
      case 0:
        return t('calendar', 'Successfully imported');

      case 1:
        return t('calendar', 'Partially imported, 1 failure');

      default:
        return t('calendar', 'Partially imported, {n} failures', {
          n: file.errors
        });
    }
  };
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };


app.filter('simpleReminderDescription', function () {
	'use strict';

	var actionMapper = {
		AUDIO: t('calendar', 'Audio alarm'),
		DISPLAY: t('calendar', 'Pop-up'),
		EMAIL: t('calendar', 'E-Mail'),
		NONE: t('calendar', 'None')
	};

	function getActionName(alarm) {
		var name = alarm.action.value;
		if (name && actionMapper.hasOwnProperty(name)) {
			return actionMapper[name];
		} else {
			return name;
		}
	}

	return function (alarm) {
		if ((typeof alarm === 'undefined' ? 'undefined' : _typeof(alarm)) !== 'object' || !alarm || _typeof(alarm.trigger) !== 'object' || !alarm.trigger) {
			return '';
		}

		var relative = alarm.trigger.type === 'duration';
		var relatedToStart = alarm.trigger.related === 'start';
		if (relative) {
			var timeString = moment.duration(Math.abs(alarm.trigger.value), 'seconds').humanize();
			if (alarm.trigger.value < 0) {
				if (relatedToStart) {
					return t('calendar', '{type} {time} before the event starts', { type: getActionName(alarm), time: timeString });
				} else {
					return t('calendar', '{type} {time} before the event ends', { type: getActionName(alarm), time: timeString });
				}
			} else if (alarm.trigger.value > 0) {
				if (relatedToStart) {
					return t('calendar', '{type} {time} after the event starts', { type: getActionName(alarm), time: timeString });
				} else {
					return t('calendar', '{type} {time} after the event ends', { type: getActionName(alarm), time: timeString });
				}
			} else {
				if (relatedToStart) {
					return t('calendar', '{type} at the event\'s start', { type: getActionName(alarm) });
				} else {
					return t('calendar', '{type} at the event\'s end', { type: getActionName(alarm) });
				}
			}
		} else {
			if (alarm.editor && moment.isMoment(alarm.editor.absMoment)) {
				return t('calendar', '{type} at {time}', {
					type: getActionName(alarm),
					time: alarm.editor.absMoment.format('LLLL')
				});
			} else {
				return '';
			}
		}
	};
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };


app.filter('subscriptionFilter', function () {
  'use strict';

  return function (calendars) {
    if (!Array.isArray(calendars)) {
      return [];
    }

    return calendars.filter(function (element) {
      if ((typeof element === 'undefined' ? 'undefined' : _typeof(element)) !== 'object') {
        return false;
      } else {
        return !element.isWritable();
      }
    });
  };
});
'use strict';


app.filter('timezoneFilter', ['$filter', function ($filter) {
  'use strict';

  return function (timezone) {
    if (typeof timezone !== 'string') {
      return '';
    }

    timezone = timezone.split('_').join(' ');

    var elements = timezone.split('/');
    if (elements.length === 1) {
      return elements[0];
    } else {
      var continent = elements[0];
      var city = $filter('timezoneWithoutContinentFilter')(elements.slice(1).join('/'));

      return city + ' (' + continent + ')';
    }
  };
}]);
'use strict';


app.filter('timezoneWithoutContinentFilter', function () {
  'use strict';

  return function (timezone) {
    timezone = timezone.split('_').join(' ');
    timezone = timezone.replace('St ', 'St. ');

    return timezone.split('/').join(' - ');
  };
});
'use strict';


app.service('AutoCompletionService', ['$rootScope', '$http', function ($rootScope, $http) {
  'use strict';

  this.searchAttendee = function (name) {
    return $http.get($rootScope.baseUrl + 'autocompletion/attendee', {
      params: {
        search: name
      }
    }).then(function (response) {
      return response.data;
    });
  };

  this.searchLocation = function (address) {
    return $http.get($rootScope.baseUrl + 'autocompletion/location', {
      params: {
        location: address
      }
    }).then(function (response) {
      return response.data;
    });
  };
}]);
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();


app.service('CalendarService', ["DavClient", "StringUtility", "XMLUtility", "CalendarFactory", "isPublic", "constants", function (DavClient, StringUtility, XMLUtility, CalendarFactory, isPublic, constants) {
	'use strict';

	var context = {
		self: this,
		calendarHome: null,
		userPrincipal: null,
		usedURLs: []
	};
	var privateAPI = {};
	this.privateAPI = privateAPI;

	var PROPERTIES = ['{' + DavClient.NS_DAV + '}displayname', '{' + DavClient.NS_DAV + '}resourcetype', '{' + DavClient.NS_IETF + '}calendar-description', '{' + DavClient.NS_IETF + '}calendar-timezone', '{' + DavClient.NS_APPLE + '}calendar-order', '{' + DavClient.NS_APPLE + '}calendar-color', '{' + DavClient.NS_IETF + '}supported-calendar-component-set', '{' + DavClient.NS_CALENDARSERVER + '}publish-url', '{' + DavClient.NS_CALENDARSERVER + '}allowed-sharing-modes', '{' + DavClient.NS_OWNCLOUD + '}calendar-enabled', '{' + DavClient.NS_DAV + '}acl', '{' + DavClient.NS_DAV + '}owner', '{' + DavClient.NS_OWNCLOUD + '}invite', '{' + DavClient.NS_CALENDARSERVER + '}source', '{' + DavClient.NS_NEXTCLOUD + '}owner-displayname'];

	var CALENDAR_IDENTIFIER = '{' + DavClient.NS_IETF + '}calendar';
	var WEBCAL_IDENTIFIER = '{' + DavClient.NS_CALENDARSERVER + '}subscribed';

	var UPDATABLE_PROPERTIES = ['color', 'displayname', 'enabled', 'order', 'storedUrl'];

	var UPDATABLE_PROPERTIES_MAP = {
		color: [DavClient.NS_APPLE, 'a:calendar-color'],
		displayname: [DavClient.NS_DAV, 'd:displayname'],
		enabled: [DavClient.NS_OWNCLOUD, 'o:calendar-enabled'],
		order: [DavClient.NS_APPLE, 'a:calendar-order']
	};

	var SHARE_USER = constants.SHARE_TYPE_USER;
	var SHARE_GROUP = constants.SHARE_TYPE_GROUP;

	context.bootPromise = function () {
		if (isPublic) {
			return Promise.resolve(true);
		}

		var url = DavClient.buildUrl(OC.linkToRemoteBase('dav'));
		var properties = ['{' + DavClient.NS_DAV + '}current-user-principal'];
		var depth = 0;
		var headers = {
			'requesttoken': OC.requestToken
		};

		return DavClient.propFind(url, properties, depth, headers).then(function (response) {
			if (!DavClient.wasRequestSuccessful(response.status) || response.body.propStat.length < 1) {
				throw new Error('current-user-principal could not be determined');
			}

			var props = response.body.propStat[0].properties;
			context.userPrincipal = props['{' + DavClient.NS_DAV + '}current-user-principal'][0].textContent;

			var url = context.userPrincipal;
			var properties = ['{' + DavClient.NS_IETF + '}calendar-home-set'];
			var depth = 0;
			var headers = {
				'requesttoken': OC.requestToken
			};

			return DavClient.propFind(url, properties, depth, headers).then(function (response) {
				if (!DavClient.wasRequestSuccessful(response.status) || response.body.propStat.length < 1) {
					throw new Error('calendar-home-set could not be determind');
				}

				var props = response.body.propStat[0].properties;
				context.calendarHome = props['{' + DavClient.NS_IETF + '}calendar-home-set'][0].textContent;
			});
		});
	}();

	context.getResourceType = function (body) {
		var resourceTypes = body.propStat[0].properties['{' + DavClient.NS_DAV + '}resourcetype'];
		if (!resourceTypes) {
			return false;
		}

		var resourceType = resourceTypes.find(function (resourceType) {
			var name = DavClient.getNodesFullName(resourceType);
			return [CALENDAR_IDENTIFIER, WEBCAL_IDENTIFIER].indexOf(name) !== -1;
		});

		if (!resourceType) {
			return false;
		}

		return DavClient.getNodesFullName(resourceType);
	};

	context.getShareValue = function (shareType, shareWith) {
		if (shareType !== SHARE_USER && shareType !== SHARE_GROUP) {
			throw new Error('Unknown shareType given');
		}

		var hrefValue = void 0;
		if (shareType === SHARE_USER) {
			hrefValue = 'principal:principals/users/';
		} else {
			hrefValue = 'principal:principals/groups/';
		}
		hrefValue += shareWith;

		return hrefValue;
	};

	context.isURIAvailable = function (suggestedUri) {
		var uriToCheck = context.calendarHome + suggestedUri + '/';
		return context.usedURLs.indexOf(uriToCheck) === -1;
	};

	this.getAll = function () {
		return context.bootPromise.then(function () {
			var url = DavClient.buildUrl(context.calendarHome);
			var depth = 1;
			var headers = {
				'requesttoken': OC.requestToken
			};

			return DavClient.propFind(url, PROPERTIES, depth, headers).then(function (response) {
				if (!DavClient.wasRequestSuccessful(response.status)) {
					throw new Error('Loading calendars failed');
				}
				var calendars = [];

				response.body.forEach(function (body) {
					if (body.propStat.length < 1) {
						return;
					}

					context.usedURLs.push(body.href);

					var responseCode = DavClient.getResponseCodeFromHTTPResponse(body.propStat[0].status);
					if (!DavClient.wasRequestSuccessful(responseCode)) {
						return;
					}

					var resourceType = context.getResourceType(body);
					if (resourceType === CALENDAR_IDENTIFIER) {
						var calendar = CalendarFactory.calendar(privateAPI, body, context.userPrincipal);
						calendars.push(calendar);
					} else if (resourceType === WEBCAL_IDENTIFIER) {
						var webcal = CalendarFactory.webcal(privateAPI, body, context.userPrincipal);
						calendars.push(webcal);
					}
				});

				return calendars.filter(function (calendar) {
					return calendar.components.vevent === true;
				});
			});
		});
	};

	this.get = function (calendarUrl) {
		return context.bootPromise.then(function () {
			var url = DavClient.buildUrl(calendarUrl);
			var depth = 0;
			var headers = {
				'requesttoken': OC.requestToken
			};

			return DavClient.propFind(url, PROPERTIES, depth, headers).then(function (response) {
				var body = response.body;
				if (body.propStat.length < 1) {
					throw new Error('Loading requested calendar failed');
				}

				var responseCode = DavClient.getResponseCodeFromHTTPResponse(body.propStat[0].status);
				if (!DavClient.wasRequestSuccessful(responseCode)) {
					throw new Error('Loading requested calendar failed');
				}

				var resourceType = context.getResourceType(body);
				if (resourceType === CALENDAR_IDENTIFIER) {
					return CalendarFactory.calendar(privateAPI, body, context.userPrincipal);
				} else if (resourceType === WEBCAL_IDENTIFIER) {
					return CalendarFactory.webcal(privateAPI, body, context.userPrincipal);
				}
			}).then(function (calendar) {
				if (calendar.components.vevent === false) {
					throw new Error('Requested calendar exists, but does not qualify for storing events');
				}

				return calendar;
			});
		});
	};

	this.getPublicCalendar = function (token) {
		var urlPart = OC.linkToRemoteBase('dav') + '/public-calendars/' + token;

		var url = DavClient.buildUrl(urlPart);
		var depth = 0;
		var headers = {
			'requesttoken': OC.requestToken
		};

		return DavClient.propFind(url, PROPERTIES, depth, headers).then(function (response) {
			var body = response.body;
			if (body.propStat.length < 1) {
				throw new Error('Loading requested calendar failed');
			}

			var responseCode = DavClient.getResponseCodeFromHTTPResponse(body.propStat[0].status);
			if (!DavClient.wasRequestSuccessful(responseCode)) {
				throw new Error('Loading requested calendar failed');
			}

			return CalendarFactory.calendar(privateAPI, body, '', true);
		}).then(function (calendar) {
			if (calendar.components.vevent === false) {
				throw new Error('Requested calendar exists, but does not qualify for storing events');
			}

			return calendar;
		});
	};

	this.create = function (name, color) {
		var components = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ['vevent', 'vtodo'];

		return context.bootPromise.then(function () {
			var _XMLUtility$getRootSk = XMLUtility.getRootSkeleton([DavClient.NS_DAV, 'd:mkcol'], [DavClient.NS_DAV, 'd:set'], [DavClient.NS_DAV, 'd:prop']),
			    _XMLUtility$getRootSk2 = _slicedToArray(_XMLUtility$getRootSk, 2),
			    skeleton = _XMLUtility$getRootSk2[0],
			    dPropChildren = _XMLUtility$getRootSk2[1];

			dPropChildren.push({
				name: [DavClient.NS_DAV, 'd:resourcetype'],
				children: [{
					name: [DavClient.NS_DAV, 'd:collection']
				}, {
					name: [DavClient.NS_IETF, 'c:calendar']
				}]
			});
			dPropChildren.push({
				name: [DavClient.NS_DAV, 'd:displayname'],
				value: name
			});
			dPropChildren.push({
				name: [DavClient.NS_APPLE, 'a:calendar-color'],
				value: color
			});
			dPropChildren.push({
				name: [DavClient.NS_OWNCLOUD, 'o:calendar-enabled'],
				value: '1'
			});
			dPropChildren.push({
				name: [DavClient.NS_IETF, 'c:supported-calendar-component-set'],
				children: components.map(function (component) {
					return {
						name: [DavClient.NS_IETF, 'c:comp'],
						attributes: [['name', component.toUpperCase()]]
					};
				})
			});

			var method = 'MKCOL';
			var uri = StringUtility.uri(name, context.isURIAvailable);
			var url = context.calendarHome + uri + '/';
			var headers = {
				'Content-Type': 'application/xml; charset=utf-8',
				'requesttoken': OC.requestToken
			};
			var xml = XMLUtility.serialize(skeleton);

			return DavClient.request(method, url, headers, xml).then(function (response) {
				if (response.status !== 201) {
					throw new Error('Creating a calendar failed');
				}

				context.usedURLs.push(url);

				return context.self.get(url);
			});
		});
	};

	this.createWebCal = function (name, color, source) {
		return context.bootPromise.then(function () {
			var _XMLUtility$getRootSk3 = XMLUtility.getRootSkeleton([DavClient.NS_DAV, 'd:mkcol'], [DavClient.NS_DAV, 'd:set'], [DavClient.NS_DAV, 'd:prop']),
			    _XMLUtility$getRootSk4 = _slicedToArray(_XMLUtility$getRootSk3, 2),
			    skeleton = _XMLUtility$getRootSk4[0],
			    dPropChildren = _XMLUtility$getRootSk4[1];

			dPropChildren.push({
				name: [DavClient.NS_DAV, 'd:resourcetype'],
				children: [{
					name: [DavClient.NS_DAV, 'd:collection']
				}, {
					name: [DavClient.NS_CALENDARSERVER, 'cs:subscribed']
				}]
			});
			dPropChildren.push({
				name: [DavClient.NS_DAV, 'd:displayname'],
				value: name
			});
			dPropChildren.push({
				name: [DavClient.NS_APPLE, 'a:calendar-color'],
				value: color
			});
			dPropChildren.push({
				name: [DavClient.NS_OWNCLOUD, 'o:calendar-enabled'],
				value: '1'
			});
			dPropChildren.push({
				name: [DavClient.NS_CALENDARSERVER, 'cs:source'],
				children: [{
					name: [DavClient.NS_DAV, 'd:href'],
					value: source
				}]
			});

			var method = 'MKCOL';
			var uri = StringUtility.uri(name, context.isURIAvailable);
			var url = context.calendarHome + uri + '/';
			var headers = {
				'Content-Type': 'application/xml; charset=utf-8',
				'requesttoken': OC.requestToken
			};
			var xml = XMLUtility.serialize(skeleton);

			return DavClient.request(method, url, headers, xml).then(function (response) {
				if (response.status !== 201) {
					throw new Error('Creating a webcal subscription failed');
				}

				context.usedURLs.push(url);

				return context.self.get(url).then(function (webcal) {
					if (constants.needsWebCalWorkaround) {
						webcal.enabled = true;
						webcal.displayname = name;
						webcal.color = color;

						return webcal.update();
					} else {
						return webcal;
					}
				});
			});
		});
	};

	privateAPI.get = function (calendar) {
	};

	privateAPI.update = function (calendar) {
		var updatedProperties = calendar.getUpdated();
		if (updatedProperties.length === 0) {
			return Promise.resolve(calendar);
		}

		var _XMLUtility$getRootSk5 = XMLUtility.getRootSkeleton([DavClient.NS_DAV, 'd:propertyupdate'], [DavClient.NS_DAV, 'd:set'], [DavClient.NS_DAV, 'd:prop']),
		    _XMLUtility$getRootSk6 = _slicedToArray(_XMLUtility$getRootSk5, 2),
		    skeleton = _XMLUtility$getRootSk6[0],
		    dPropChildren = _XMLUtility$getRootSk6[1];

		updatedProperties.forEach(function (name) {
			if (UPDATABLE_PROPERTIES.indexOf(name) === -1) {
				return;
			}

			var value = calendar[name];
			if (name === 'enabled') {
				value = value ? '1' : '0';
			}

			if (name === 'storedUrl') {
				dPropChildren.push({
					name: [DavClient.NS_CALENDARSERVER, 'cs:source'],
					children: [{
						name: [DavClient.NS_DAV, 'd:href'],
						value: value
					}]
				});
			} else {
				dPropChildren.push({
					name: UPDATABLE_PROPERTIES_MAP[name],
					value: value
				});
			}
		});
		calendar.resetUpdated();

		var method = 'PROPPATCH';
		var url = calendar.url;
		var headers = {
			'Content-Type': 'application/xml; charset=utf-8',
			'requesttoken': OC.requestToken
		};
		var xml = XMLUtility.serialize(skeleton);

		return DavClient.request(method, url, headers, xml).then(function (response) {
			if (!DavClient.wasRequestSuccessful(response.status)) {
				throw new Error('Updating calendar failed');
			}

			return calendar;
		});
	};

	privateAPI.delete = function (calendar) {
		var method = 'DELETE';
		var url = calendar.url;
		var headers = {
			'requesttoken': OC.requestToken
		};

		return DavClient.request(method, url, headers).then(function (response) {
			if (!DavClient.wasRequestSuccessful(response.status)) {
				throw new Error('Deleting calendar failed');
			}

			var index = context.usedURLs.indexOf(url);
			context.usedURLs.splice(index, 1);
		});
	};

	privateAPI.share = function (calendar, shareType, shareWith, writable, existingShare) {
		var _XMLUtility$getRootSk7 = XMLUtility.getRootSkeleton([DavClient.NS_OWNCLOUD, 'o:share'], [DavClient.NS_OWNCLOUD, 'o:set']),
		    _XMLUtility$getRootSk8 = _slicedToArray(_XMLUtility$getRootSk7, 2),
		    skeleton = _XMLUtility$getRootSk8[0],
		    oSetChildren = _XMLUtility$getRootSk8[1];

		var hrefValue = context.getShareValue(shareType, shareWith);
		oSetChildren.push({
			name: [DavClient.NS_DAV, 'd:href'],
			value: hrefValue
		});
		oSetChildren.push({
			name: [DavClient.NS_OWNCLOUD, 'o:summary'],
			value: t('calendar', '{calendar} shared by {owner}', {
				calendar: calendar.displayname,
				owner: calendar.owner
			})
		});
		if (writable) {
			oSetChildren.push({
				name: [DavClient.NS_OWNCLOUD, 'o:read-write']
			});
		}

		var method = 'POST';
		var url = calendar.url;
		var headers = {
			'Content-Type': 'application/xml; charset=utf-8',
			'requesttoken': OC.requestToken
		};
		var xml = XMLUtility.serialize(skeleton);

		return DavClient.request(method, url, headers, xml).then(function (response) {
			if (!DavClient.wasRequestSuccessful(response.status)) {
				throw new Error('Sharing calendar failed');
			}

			if (existingShare) {
				return;
			}

			if (shareType === SHARE_USER) {
				calendar.shares.users.push({
					id: shareWith,
					displayname: shareWith,
					writable: writable
				});
			} else {
				calendar.shares.groups.push({
					id: shareWith,
					displayname: shareWith,
					writable: writable
				});
			}
		});
	};

	privateAPI.unshare = function (calendar, shareType, shareWith) {
		var _XMLUtility$getRootSk9 = XMLUtility.getRootSkeleton([DavClient.NS_OWNCLOUD, 'o:share'], [DavClient.NS_OWNCLOUD, 'o:remove']),
		    _XMLUtility$getRootSk10 = _slicedToArray(_XMLUtility$getRootSk9, 2),
		    skeleton = _XMLUtility$getRootSk10[0],
		    oRemoveChildren = _XMLUtility$getRootSk10[1];

		var hrefValue = context.getShareValue(shareType, shareWith);
		oRemoveChildren.push({
			name: [DavClient.NS_DAV, 'd:href'],
			value: hrefValue
		});

		var method = 'POST';
		var url = calendar.url;
		var headers = {
			'Content-Type': 'application/xml; charset=utf-8',
			'requesttoken': OC.requestToken
		};
		var xml = XMLUtility.serialize(skeleton);

		return DavClient.request(method, url, headers, xml).then(function (response) {
			if (!DavClient.wasRequestSuccessful(response.status)) {
				throw new Error('Sharing calendar failed');
			}

			if (shareType === SHARE_USER) {
				var index = calendar.shares.users.findIndex(function (user) {
					return user.id === shareWith;
				});
				calendar.shares.users.splice(index, 1);
			} else {
				var _index = calendar.shares.groups.findIndex(function (group) {
					return group.id === shareWith;
				});
				calendar.shares.groups.splice(_index, 1);
			}
		});
	};

	privateAPI.publish = function (calendar) {
		var _XMLUtility$getRootSk11 = XMLUtility.getRootSkeleton([DavClient.NS_CALENDARSERVER, 'cs:publish-calendar']),
		    _XMLUtility$getRootSk12 = _slicedToArray(_XMLUtility$getRootSk11, 1),
		    skeleton = _XMLUtility$getRootSk12[0];

		var method = 'POST';
		var url = calendar.url;
		var headers = {
			'Content-Type': 'application/xml; charset=utf-8',
			requesttoken: oc_requesttoken
		};
		var xml = XMLUtility.serialize(skeleton);

		return DavClient.request(method, url, headers, xml).then(function (response) {
			if (!DavClient.wasRequestSuccessful(response.status)) {
				return false;
			}

			return true;
		});
	};

	privateAPI.unpublish = function (calendar) {
		var _XMLUtility$getRootSk13 = XMLUtility.getRootSkeleton([DavClient.NS_CALENDARSERVER, 'cs:unpublish-calendar']),
		    _XMLUtility$getRootSk14 = _slicedToArray(_XMLUtility$getRootSk13, 1),
		    skeleton = _XMLUtility$getRootSk14[0];

		var method = 'POST';
		var url = calendar.url;
		var headers = {
			'Content-Type': 'application/xml; charset=utf-8',
			requesttoken: oc_requesttoken
		};
		var xml = XMLUtility.serialize(skeleton);

		return DavClient.request(method, url, headers, xml).then(function (response) {
			if (!DavClient.wasRequestSuccessful(response.status)) {
				return false;
			}

			return true;
		});
	};
}]);
'use strict';


app.service('DavClient', ["$window", function ($window) {
	'use strict';

	var client = new dav.Client({
		baseUrl: OC.linkToRemote('dav/calendars'),
		xmlNamespaces: {
			'DAV:': 'd',
			'urn:ietf:params:xml:ns:caldav': 'c',
			'http://apple.com/ns/ical/': 'aapl',
			'http://owncloud.org/ns': 'oc',
			'http://nextcloud.com/ns': 'nc',
			'http://calendarserver.org/ns/': 'cs'
		}
	});

	client.NS_DAV = 'DAV:';
	client.NS_IETF = 'urn:ietf:params:xml:ns:caldav';
	client.NS_APPLE = 'http://apple.com/ns/ical/';
	client.NS_OWNCLOUD = 'http://owncloud.org/ns';
	client.NS_NEXTCLOUD = 'http://nextcloud.com/ns';
	client.NS_CALENDARSERVER = 'http://calendarserver.org/ns/';

	client.buildUrl = function (path) {
		if (path.substr(0, 1) !== '/') {
			path = '/' + path;
		}

		return $window.location.origin + path;
	};

	client.getNodesFullName = function (node) {
		return '{' + node.namespaceURI + '}' + node.localName;
	};

	client.getResponseCodeFromHTTPResponse = function (t) {
		return parseInt(t.split(' ')[1]);
	};

	client.wasRequestSuccessful = function (status) {
		return status >= 200 && status <= 299;
	};

	return client;
}]);
'use strict';


app.service('EventsEditorDialogService', ["$uibModal", "constants", "settings", function ($uibModal, constants, settings) {
	'use strict';

	var EDITOR_POPOVER = 'eventspopovereditor.html';
	var EDITOR_SIDEBAR = 'eventssidebareditor.html';
	var REPEAT_QUESTION = ''; 

	var context = {
		fcEvent: null,
		promise: null,
		eventModal: null
	};

	context.cleanup = function () {
		context.fcEvent = null;
		context.promise = null;
		context.eventModal = null;
	};

	context.showPopover = function () {
		return angular.element(window).width() > 768;
	};

	context.positionPopover = function (position) {
		angular.element('#popover-container').css('display', 'none');
		angular.forEach(position, function (v) {
			angular.element('.modal').css(v.name, v.value);
		});
		angular.element('#popover-container').css('display', 'block');
	};

	context.openDialog = function (template, resolve, reject, unlock, position, scope, fcEvent, _simpleEvent, _calendar) {
		context.fcEvent = fcEvent;
		context.eventModal = $uibModal.open({
			appendTo: template === EDITOR_POPOVER ? angular.element('#popover-container') : angular.element('#app-content'),
			controller: 'EditorController',
			resolve: {
				vevent: function vevent() {
					return fcEvent.vevent;
				},
				simpleEvent: function simpleEvent() {
					return _simpleEvent;
				},
				calendar: function calendar() {
					return _calendar;
				},
				isNew: function isNew() {
					return fcEvent.vevent.etag === null || fcEvent.vevent.etag === '';
				},
				emailAddress: function emailAddress() {
					return constants.emailAddress;
				}
			},
			scope: scope,
			templateUrl: template,
			windowClass: template === EDITOR_POPOVER ? 'popover' : null
		});

		if (template === EDITOR_SIDEBAR) {
			angular.element('#app-content').addClass('with-app-sidebar');
		}

		context.eventModal.rendered.then(function () {
			return context.positionPopover(position);
		});
		context.eventModal.result.then(function (result) {
			if (result.action === 'proceed') {
				context.openDialog(EDITOR_SIDEBAR, resolve, reject, unlock, [], scope, fcEvent, _simpleEvent, result.calendar);
			} else {
				if (template === EDITOR_SIDEBAR) {
					angular.element('#app-content').removeClass('with-app-sidebar');
				}

				unlock();
				context.cleanup();
				resolve({
					calendar: result.calendar,
					vevent: result.vevent
				});
			}
		}).catch(function (reason) {
			if (template === EDITOR_SIDEBAR) {
				angular.element('#app-content').removeClass('with-app-sidebar');
			}

			if (reason !== 'superseded') {
				context.cleanup();
			}

			unlock();
			reject(reason);
		});
	};

	context.openRepeatQuestion = function () {
	};

	this.open = function (scope, fcEvent, calculatePosition, lock, unlock) {
		if (context.fcEvent === fcEvent) {
			return context.promise;
		}

		if (context.fcEvent) {
			context.eventModal.dismiss('superseded');
		}

		context.promise = new Promise(function (resolve, reject) {
			var position = calculatePosition();

			lock();

			var calendar = fcEvent.vevent ? fcEvent.vevent.calendar : null;
			var simpleEvent = fcEvent.getSimpleEvent();

			if (context.showPopover() && !settings.skipPopover) {
				context.openDialog(EDITOR_POPOVER, resolve, reject, unlock, position, scope, fcEvent, simpleEvent, calendar);
			} else {
				context.openDialog(EDITOR_SIDEBAR, resolve, reject, unlock, [], scope, fcEvent, simpleEvent, calendar);
			}
		});

		return context.promise;
	};

}]);
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();


app.service('HashService', ["$location", function ($location) {
	'use strict';

	var context = {
		hashId: null,
		parameters: new Map()
	};

	(function () {
		var hash = $location.url();

		if (!hash || hash === '') {
			return;
		}

		if (hash.startsWith('#')) {
			hash = hash.substr(1);
		}
		if (hash.startsWith('/')) {
			hash = hash.substr(1);
		}

		if (!hash.includes('?')) {
			return;
		}

		var questionMarkPosition = hash.indexOf('?');
		context.hashId = hash.substr(0, questionMarkPosition);

		var parameters = hash.substr(questionMarkPosition + 1);
		parameters.split('&').forEach(function (part) {
			var _part$split = part.split('='),
			    _part$split2 = _slicedToArray(_part$split, 2),
			    key = _part$split2[0],
			    value = _part$split2[1];

			context.parameters.set(key, decodeURIComponent(value));
		});
	})();

	this.runIfApplicable = function (id, callback) {
		if (id === context.hashId) {
			callback(context.parameters);
		}
	};
}]);
'use strict';


app.factory('is', function () {
  'use strict';

  return {
    loading: false
  };
});
'use strict';


app.service('MailerService', ['$rootScope', 'DavClient', function ($rootScope, DavClient) {
  'use strict';

  this.sendMail = function (dest, url, name) {
    var headers = {
      'Content-Type': 'application/json; charset=utf-8',
      requesttoken: oc_requesttoken
    };
    var mailBody = {
      'to': dest,
      'url': url,
      'name': name
    };
    return DavClient.request('POST', $rootScope.baseUrl + 'public/sendmail', headers, JSON.stringify(mailBody));
  };
}]);
'use strict';


app.service('SettingsService', ['$rootScope', '$http', function ($rootScope, $http) {
	'use strict';

	this.getView = function () {
		return $http({
			method: 'GET',
			url: $rootScope.baseUrl + 'config',
			params: { key: 'view' }
		}).then(function (response) {
			return response.data.value;
		});
	};

	this.setView = function (view) {
		return $http({
			method: 'POST',
			url: $rootScope.baseUrl + 'config',
			data: {
				key: 'view',
				value: view
			}
		}).then(function () {
			return true;
		});
	};

	this.getSkipPopover = function () {
		return $http({
			method: 'GET',
			url: $rootScope.baseUrl + 'config',
			params: { key: 'skipPopover' }
		}).then(function (response) {
			return response.data.value;
		});
	};

	this.setSkipPopover = function (value) {
		return $http({
			method: 'POST',
			url: $rootScope.baseUrl + 'config',
			data: {
				key: 'skipPopover',
				value: value
			}
		}).then(function () {
			return true;
		});
	};

	this.getShowWeekNr = function () {
		return $http({
			method: 'GET',
			url: $rootScope.baseUrl + 'config',
			params: { key: 'showWeekNr' }
		}).then(function (response) {
			return response.data.value;
		});
	};

	this.setShowWeekNr = function (value) {
		return $http({
			method: 'POST',
			url: $rootScope.baseUrl + 'config',
			data: {
				key: 'showWeekNr',
				value: value
			}
		}).then(function () {
			return true;
		});
	};

	this.passedFirstRun = function () {
		return $http({
			method: 'POST',
			url: $rootScope.baseUrl + 'config',
			data: {
				key: 'firstRun'
			}
		}).then(function () {
			return true;
		});
	};
}]);
'use strict';


app.service('TimezoneService', ["$rootScope", "$http", "Timezone", function ($rootScope, $http, Timezone) {
	'use strict';

	var context = {
		map: {},
		self: this,
		timezones: {},
		timezonesBeingLoaded: {}
	};

	context.map['Etc/UTC'] = 'UTC';

	context.timezones.UTC = new Timezone(ICAL.TimezoneService.get('UTC'));
	context.timezones.GMT = context.timezones.UTC;
	context.timezones.Z = context.timezones.UTC;
	context.timezones.FLOATING = new Timezone(ICAL.Timezone.localTimezone);

	var timezoneList = ['Africa\/Abidjan', 'Africa\/Accra', 'Africa\/Addis_Ababa', 'Africa\/Algiers', 'Africa\/Asmara', 'Africa\/Asmera', 'Africa\/Bamako', 'Africa\/Bangui', 'Africa\/Banjul', 'Africa\/Bissau', 'Africa\/Blantyre', 'Africa\/Brazzaville', 'Africa\/Bujumbura', 'Africa\/Cairo', 'Africa\/Casablanca', 'Africa\/Ceuta', 'Africa\/Conakry', 'Africa\/Dakar', 'Africa\/Dar_es_Salaam', 'Africa\/Djibouti', 'Africa\/Douala', 'Africa\/El_Aaiun', 'Africa\/Freetown', 'Africa\/Gaborone', 'Africa\/Harare', 'Africa\/Johannesburg', 'Africa\/Juba', 'Africa\/Kampala', 'Africa\/Khartoum', 'Africa\/Kigali', 'Africa\/Kinshasa', 'Africa\/Lagos', 'Africa\/Libreville', 'Africa\/Lome', 'Africa\/Luanda', 'Africa\/Lubumbashi', 'Africa\/Lusaka', 'Africa\/Malabo', 'Africa\/Maputo', 'Africa\/Maseru', 'Africa\/Mbabane', 'Africa\/Mogadishu', 'Africa\/Monrovia', 'Africa\/Nairobi', 'Africa\/Ndjamena', 'Africa\/Niamey', 'Africa\/Nouakchott', 'Africa\/Ouagadougou', 'Africa\/Porto-Novo', 'Africa\/Sao_Tome', 'Africa\/Timbuktu', 'Africa\/Tripoli', 'Africa\/Tunis', 'Africa\/Windhoek', 'America\/Adak', 'America\/Anchorage', 'America\/Anguilla', 'America\/Antigua', 'America\/Araguaina', 'America\/Argentina\/Buenos_Aires', 'America\/Argentina\/Catamarca', 'America\/Argentina\/ComodRivadavia', 'America\/Argentina\/Cordoba', 'America\/Argentina\/Jujuy', 'America\/Argentina\/La_Rioja', 'America\/Argentina\/Mendoza', 'America\/Argentina\/Rio_Gallegos', 'America\/Argentina\/Salta', 'America\/Argentina\/San_Juan', 'America\/Argentina\/San_Luis', 'America\/Argentina\/Tucuman', 'America\/Argentina\/Ushuaia', 'America\/Aruba', 'America\/Asuncion', 'America\/Atikokan', 'America\/Bahia', 'America\/Bahia_Banderas', 'America\/Barbados', 'America\/Belem', 'America\/Belize', 'America\/Blanc-Sablon', 'America\/Boa_Vista', 'America\/Bogota', 'America\/Boise', 'America\/Cambridge_Bay', 'America\/Campo_Grande', 'America\/Cancun', 'America\/Caracas', 'America\/Cayenne', 'America\/Cayman', 'America\/Chicago', 'America\/Chihuahua', 'America\/Costa_Rica', 'America\/Creston', 'America\/Cuiaba', 'America\/Curacao', 'America\/Danmarkshavn', 'America\/Dawson', 'America\/Dawson_Creek', 'America\/Denver', 'America\/Detroit', 'America\/Dominica', 'America\/Edmonton', 'America\/Eirunepe', 'America\/El_Salvador', 'America\/Fortaleza', 'America\/Glace_Bay', 'America\/Godthab', 'America\/Goose_Bay', 'America\/Grand_Turk', 'America\/Grenada', 'America\/Guadeloupe', 'America\/Guatemala', 'America\/Guayaquil', 'America\/Guyana', 'America\/Halifax', 'America\/Havana', 'America\/Hermosillo', 'America\/Indiana\/Indianapolis', 'America\/Indiana\/Knox', 'America\/Indiana\/Marengo', 'America\/Indiana\/Petersburg', 'America\/Indiana\/Tell_City', 'America\/Indiana\/Vevay', 'America\/Indiana\/Vincennes', 'America\/Indiana\/Winamac', 'America\/Inuvik', 'America\/Iqaluit', 'America\/Jamaica', 'America\/Juneau', 'America\/Kentucky\/Louisville', 'America\/Kentucky\/Monticello', 'America\/Kralendijk', 'America\/La_Paz', 'America\/Lima', 'America\/Los_Angeles', 'America\/Louisville', 'America\/Lower_Princes', 'America\/Maceio', 'America\/Managua', 'America\/Manaus', 'America\/Marigot', 'America\/Martinique', 'America\/Matamoros', 'America\/Mazatlan', 'America\/Menominee', 'America\/Merida', 'America\/Metlakatla', 'America\/Mexico_City', 'America\/Miquelon', 'America\/Moncton', 'America\/Monterrey', 'America\/Montevideo', 'America\/Montreal', 'America\/Montserrat', 'America\/Nassau', 'America\/New_York', 'America\/Nipigon', 'America\/Nome', 'America\/Noronha', 'America\/North_Dakota\/Beulah', 'America\/North_Dakota\/Center', 'America\/North_Dakota\/New_Salem', 'America\/Ojinaga', 'America\/Panama', 'America\/Pangnirtung', 'America\/Paramaribo', 'America\/Phoenix', 'America\/Port-au-Prince', 'America\/Port_of_Spain', 'America\/Porto_Velho', 'America\/Puerto_Rico', 'America\/Rainy_River', 'America\/Rankin_Inlet', 'America\/Recife', 'America\/Regina', 'America\/Resolute', 'America\/Rio_Branco', 'America\/Santa_Isabel', 'America\/Santarem', 'America\/Santiago', 'America\/Santo_Domingo', 'America\/Sao_Paulo', 'America\/Scoresbysund', 'America\/Shiprock', 'America\/Sitka', 'America\/St_Barthelemy', 'America\/St_Johns', 'America\/St_Kitts', 'America\/St_Lucia', 'America\/St_Thomas', 'America\/St_Vincent', 'America\/Swift_Current', 'America\/Tegucigalpa', 'America\/Thule', 'America\/Thunder_Bay', 'America\/Tijuana', 'America\/Toronto', 'America\/Tortola', 'America\/Vancouver', 'America\/Whitehorse', 'America\/Winnipeg', 'America\/Yakutat', 'America\/Yellowknife', 'Antarctica\/Casey', 'Antarctica\/Davis', 'Antarctica\/DumontDUrville', 'Antarctica\/Macquarie', 'Antarctica\/Mawson', 'Antarctica\/McMurdo', 'Antarctica\/Palmer', 'Antarctica\/Rothera', 'Antarctica\/South_Pole', 'Antarctica\/Syowa', 'Antarctica\/Vostok', 'Arctic\/Longyearbyen', 'Asia\/Aden', 'Asia\/Almaty', 'Asia\/Amman', 'Asia\/Anadyr', 'Asia\/Aqtau', 'Asia\/Aqtobe', 'Asia\/Ashgabat', 'Asia\/Baghdad', 'Asia\/Bahrain', 'Asia\/Baku', 'Asia\/Bangkok', 'Asia\/Beirut', 'Asia\/Bishkek', 'Asia\/Brunei', 'Asia\/Calcutta', 'Asia\/Choibalsan', 'Asia\/Chongqing', 'Asia\/Colombo', 'Asia\/Damascus', 'Asia\/Dhaka', 'Asia\/Dili', 'Asia\/Dubai', 'Asia\/Dushanbe', 'Asia\/Gaza', 'Asia\/Harbin', 'Asia\/Hebron', 'Asia\/Ho_Chi_Minh', 'Asia\/Hong_Kong', 'Asia\/Hovd', 'Asia\/Irkutsk', 'Asia\/Istanbul', 'Asia\/Jakarta', 'Asia\/Jayapura', 'Asia\/Jerusalem', 'Asia\/Kabul', 'Asia\/Kamchatka', 'Asia\/Karachi', 'Asia\/Kashgar', 'Asia\/Kathmandu', 'Asia\/Katmandu', 'Asia\/Khandyga', 'Asia\/Kolkata', 'Asia\/Krasnoyarsk', 'Asia\/Kuala_Lumpur', 'Asia\/Kuching', 'Asia\/Kuwait', 'Asia\/Macau', 'Asia\/Magadan', 'Asia\/Makassar', 'Asia\/Manila', 'Asia\/Muscat', 'Asia\/Nicosia', 'Asia\/Novokuznetsk', 'Asia\/Novosibirsk', 'Asia\/Omsk', 'Asia\/Oral', 'Asia\/Phnom_Penh', 'Asia\/Pontianak', 'Asia\/Pyongyang', 'Asia\/Qatar', 'Asia\/Qyzylorda', 'Asia\/Rangoon', 'Asia\/Riyadh', 'Asia\/Saigon', 'Asia\/Sakhalin', 'Asia\/Samarkand', 'Asia\/Seoul', 'Asia\/Shanghai', 'Asia\/Singapore', 'Asia\/Taipei', 'Asia\/Tashkent', 'Asia\/Tbilisi', 'Asia\/Tehran', 'Asia\/Thimphu', 'Asia\/Tokyo', 'Asia\/Ulaanbaatar', 'Asia\/Urumqi', 'Asia\/Ust-Nera', 'Asia\/Vientiane', 'Asia\/Vladivostok', 'Asia\/Yakutsk', 'Asia\/Yekaterinburg', 'Asia\/Yerevan', 'Atlantic\/Azores', 'Atlantic\/Bermuda', 'Atlantic\/Canary', 'Atlantic\/Cape_Verde', 'Atlantic\/Faeroe', 'Atlantic\/Faroe', 'Atlantic\/Jan_Mayen', 'Atlantic\/Madeira', 'Atlantic\/Reykjavik', 'Atlantic\/South_Georgia', 'Atlantic\/St_Helena', 'Atlantic\/Stanley', 'Australia\/Adelaide', 'Australia\/Brisbane', 'Australia\/Broken_Hill', 'Australia\/Currie', 'Australia\/Darwin', 'Australia\/Eucla', 'Australia\/Hobart', 'Australia\/Lindeman', 'Australia\/Lord_Howe', 'Australia\/Melbourne', 'Australia\/Perth', 'Australia\/Sydney', 'Europe\/Amsterdam', 'Europe\/Andorra', 'Europe\/Athens', 'Europe\/Belfast', 'Europe\/Belgrade', 'Europe\/Berlin', 'Europe\/Bratislava', 'Europe\/Brussels', 'Europe\/Bucharest', 'Europe\/Budapest', 'Europe\/Busingen', 'Europe\/Chisinau', 'Europe\/Copenhagen', 'Europe\/Dublin', 'Europe\/Gibraltar', 'Europe\/Guernsey', 'Europe\/Helsinki', 'Europe\/Isle_of_Man', 'Europe\/Istanbul', 'Europe\/Jersey', 'Europe\/Kaliningrad', 'Europe\/Kiev', 'Europe\/Lisbon', 'Europe\/Ljubljana', 'Europe\/London', 'Europe\/Luxembourg', 'Europe\/Madrid', 'Europe\/Malta', 'Europe\/Mariehamn', 'Europe\/Minsk', 'Europe\/Monaco', 'Europe\/Moscow', 'Europe\/Nicosia', 'Europe\/Oslo', 'Europe\/Paris', 'Europe\/Podgorica', 'Europe\/Prague', 'Europe\/Riga', 'Europe\/Rome', 'Europe\/Samara', 'Europe\/San_Marino', 'Europe\/Sarajevo', 'Europe\/Simferopol', 'Europe\/Skopje', 'Europe\/Sofia', 'Europe\/Stockholm', 'Europe\/Tallinn', 'Europe\/Tirane', 'Europe\/Uzhgorod', 'Europe\/Vaduz', 'Europe\/Vatican', 'Europe\/Vienna', 'Europe\/Vilnius', 'Europe\/Volgograd', 'Europe\/Warsaw', 'Europe\/Zagreb', 'Europe\/Zaporozhye', 'Europe\/Zurich', 'Indian\/Antananarivo', 'Indian\/Chagos', 'Indian\/Christmas', 'Indian\/Cocos', 'Indian\/Comoro', 'Indian\/Kerguelen', 'Indian\/Mahe', 'Indian\/Maldives', 'Indian\/Mauritius', 'Indian\/Mayotte', 'Indian\/Reunion', 'Pacific\/Apia', 'Pacific\/Auckland', 'Pacific\/Chatham', 'Pacific\/Chuuk', 'Pacific\/Easter', 'Pacific\/Efate', 'Pacific\/Enderbury', 'Pacific\/Fakaofo', 'Pacific\/Fiji', 'Pacific\/Funafuti', 'Pacific\/Galapagos', 'Pacific\/Gambier', 'Pacific\/Guadalcanal', 'Pacific\/Guam', 'Pacific\/Honolulu', 'Pacific\/Johnston', 'Pacific\/Kiritimati', 'Pacific\/Kosrae', 'Pacific\/Kwajalein', 'Pacific\/Majuro', 'Pacific\/Marquesas', 'Pacific\/Midway', 'Pacific\/Nauru', 'Pacific\/Niue', 'Pacific\/Norfolk', 'Pacific\/Noumea', 'Pacific\/Pago_Pago', 'Pacific\/Palau', 'Pacific\/Pitcairn', 'Pacific\/Pohnpei', 'Pacific\/Ponape', 'Pacific\/Port_Moresby', 'Pacific\/Rarotonga', 'Pacific\/Saipan', 'Pacific\/Tahiti', 'Pacific\/Tarawa', 'Pacific\/Tongatapu', 'Pacific\/Truk', 'Pacific\/Wake', 'Pacific\/Wallis', 'Pacific\/Yap'];

	var localeTimezoneList = ['UTC', 'GMT', 'Z'];

	context.knowsTimezone = function (tzid) {
		tzid = tzid.toUpperCase();

		var serverMatch = timezoneList.find(function (tzListItem) {
			return tzid === tzListItem.toUpperCase();
		});

		var localeMatch = localeTimezoneList.find(function (tzListItem) {
			return tzid === tzListItem.toUpperCase();
		});

		return serverMatch !== undefined || localeMatch !== undefined;
	};

	context.buildUrl = function (tzid) {
		return $rootScope.baseUrl + 'timezones/' + tzid + '.ics';
	};

	this.current = function () {
		var tz = jstz.determine();
		var tzname = tz ? tz.name() : 'UTC';

		if (context.map[tzname]) {
			tzname = context.map[tzname];
		}

		return tzname;
	};

	this.get = function (tzid) {
		tzid = tzid.toUpperCase();

		if (!context.knowsTimezone(tzid)) {
			return Promise.reject('Unknown timezone');
		}

		if (context.timezones[tzid]) {
			return Promise.resolve(context.timezones[tzid]);
		}

		if (context.timezonesBeingLoaded[tzid]) {
			return context.timezonesBeingLoaded[tzid];
		}

		context.timezonesBeingLoaded[tzid] = $http({
			method: 'GET',
			url: context.buildUrl(tzid)
		}).then(function (response) {
			var timezone = new Timezone(response.data);
			context.timezones[tzid] = timezone;
			delete context.timezonesBeingLoaded[tzid];

			return timezone;
		});

		return context.timezonesBeingLoaded[tzid];
	};

	this.listAll = function () {
		return Promise.resolve(timezoneList.concat(localeTimezoneList));
	};
}]);
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();


app.service('VEventService', ["DavClient", "StringUtility", "XMLUtility", "VEvent", function (DavClient, StringUtility, XMLUtility, VEvent) {
	'use strict';

	var context = {
		calendarDataPropName: '{' + DavClient.NS_IETF + '}calendar-data',
		eTagPropName: '{' + DavClient.NS_DAV + '}getetag',
		self: this
	};

	context.getEventUrl = function (event) {
		return event.calendar.url + event.uri;
	};

	context.getTimeRangeString = function (momentObject) {
		var utc = momentObject.utc();
		return utc.format('YYYYMMDD') + 'T' + utc.format('HHmmss') + 'Z';
	};

	this.getAll = function (calendar, start, end) {
		var _XMLUtility$getRootSk = XMLUtility.getRootSkeleton([DavClient.NS_IETF, 'c:calendar-query']),
		    _XMLUtility$getRootSk2 = _slicedToArray(_XMLUtility$getRootSk, 2),
		    skeleton = _XMLUtility$getRootSk2[0],
		    dPropChildren = _XMLUtility$getRootSk2[1];

		dPropChildren.push({
			name: [DavClient.NS_DAV, 'd:prop'],
			children: [{
				name: [DavClient.NS_DAV, 'd:getetag']
			}, {
				name: [DavClient.NS_IETF, 'c:calendar-data']
			}]
		});
		dPropChildren.push({
			name: [DavClient.NS_IETF, 'c:filter'],
			children: [{
				name: [DavClient.NS_IETF, 'c:comp-filter'],
				attributes: [['name', 'VCALENDAR']],
				children: [{
					name: [DavClient.NS_IETF, 'c:comp-filter'],
					attributes: [['name', 'VEVENT']],
					children: [{
						name: [DavClient.NS_IETF, 'c:time-range'],
						attributes: [['start', context.getTimeRangeString(start)], ['end', context.getTimeRangeString(end)]]
					}]
				}]
			}]
		});

		var url = calendar.url;
		var headers = {
			'Content-Type': 'application/xml; charset=utf-8',
			'Depth': 1,
			'requesttoken': OC.requestToken
		};
		var xml = XMLUtility.serialize(skeleton);

		return DavClient.request('REPORT', url, headers, xml).then(function (response) {
			if (!DavClient.wasRequestSuccessful(response.status)) {
				return Promise.reject(response.status);
			}

			var vevents = [];
			for (var key in response.body) {
				if (!response.body.hasOwnProperty(key)) {
					continue;
				}

				var obj = response.body[key];
				var props = obj.propStat[0].properties;
				var calendarData = props[context.calendarDataPropName];
				var etag = props[context.eTagPropName];
				var uri = obj.href.substr(obj.href.lastIndexOf('/') + 1);

				try {
					var vevent = VEvent.fromRawICS(calendar, calendarData, uri, etag);
					vevents.push(vevent);
				} catch (e) {
					console.log(e);
				}
			}

			return vevents;
		});
	};

	this.get = function (calendar, uri) {
		var url = calendar.url + uri;
		var headers = {
			'requesttoken': OC.requestToken
		};

		return DavClient.request('GET', url, headers, '').then(function (response) {
			if (!DavClient.wasRequestSuccessful(response.status)) {
				return Promise.reject(response.status);
			}

			var calendarData = response.body;
			var etag = response.xhr.getResponseHeader('ETag');

			try {
				return VEvent.fromRawICS(calendar, calendarData, uri, etag);
			} catch (e) {
				console.log(e);
				return Promise.reject(e);
			}
		});
	};

	this.create = function (calendar, data) {
		var returnEvent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

		var headers = {
			'Content-Type': 'text/calendar; charset=utf-8',
			'requesttoken': OC.requestToken
		};
		var uri = StringUtility.uid('Nextcloud', 'ics');
		var url = calendar.url + uri;

		return DavClient.request('PUT', url, headers, data).then(function (response) {
			if (!DavClient.wasRequestSuccessful(response.status)) {
				return Promise.reject(response.status);
			}

			if (returnEvent) {
				return context.self.get(calendar, uri);
			} else {
				return true;
			}
		});
	};

	this.update = function (event) {
		var url = context.getEventUrl(event);
		var headers = {
			'Content-Type': 'text/calendar; charset=utf-8',
			'If-Match': event.etag,
			'requesttoken': OC.requestToken
		};
		var payload = event.data;

		return DavClient.request('PUT', url, headers, payload).then(function (response) {
			if (!DavClient.wasRequestSuccessful(response.status)) {
				return Promise.reject(response.status);
			}

			event.etag = response.xhr.getResponseHeader('ETag');

			return true;
		});
	};

	this.delete = function (event) {
		var url = context.getEventUrl(event);
		var headers = {
			'If-Match': event.etag,
			'requesttoken': OC.requestToken
		};

		return DavClient.request('DELETE', url, headers, '').then(function (response) {
			if (DavClient.wasRequestSuccessful(response.status)) {
				return true;
			} else {
				return Promise.reject(response.status);
			}
		});
	};
}]);
'use strict';


app.service('WebCalService', ["$http", "ICalSplitterUtility", "WebCalUtility", "SplittedICal", function ($http, ICalSplitterUtility, WebCalUtility, SplittedICal) {
	'use strict';

	var self = this;
	var context = {
		cachedSplittedICals: {}
	};

	this.get = function (webcalUrl, allowDowngradeToHttp) {
		if (context.cachedSplittedICals.hasOwnProperty(webcalUrl)) {
			return Promise.resolve(context.cachedSplittedICals[webcalUrl]);
		}

		if (allowDowngradeToHttp === undefined) {
			allowDowngradeToHttp = WebCalUtility.allowDowngrade(webcalUrl);
		}

		webcalUrl = WebCalUtility.fixURL(webcalUrl);
		var url = WebCalUtility.buildProxyURL(webcalUrl);

		var localWebcal = JSON.parse(localStorage.getItem(webcalUrl));
		if (localWebcal && localWebcal.timestamp > new Date().getTime()) {
			return Promise.resolve(ICalSplitterUtility.split(localWebcal.value));
		}

		return $http.get(url).then(function (response) {
			var splitted = ICalSplitterUtility.split(response.data);

			if (!SplittedICal.isSplittedICal(splitted)) {
				return Promise.reject(t('calendar', 'Please enter a valid WebCal-URL'));
			}

			context.cachedSplittedICals[webcalUrl] = splitted;
			localStorage.setItem(webcalUrl, JSON.stringify({ value: response.data, timestamp: new Date().getTime() + 7200000 })); 

			return splitted;
		}).catch(function (e) {
			if (WebCalUtility.downgradePossible(webcalUrl, allowDowngradeToHttp)) {
				var httpUrl = WebCalUtility.downgradeURL(webcalUrl);

				return self.get(httpUrl, false).then(function (splitted) {
					context.cachedSplittedICals[webcalUrl] = splitted;
					return splitted;
				});
			}

			if (e.status === 422) {
				return Promise.reject({
					error: true,
					redirect: false,
					message: e.data.message
				});
			} else if (e.status === 400) {
				return Promise.reject({
					error: false,
					redirect: true,
					new_url: e.data.new_url
				});
			} else {
				return Promise.reject({
					error: true,
					redirect: false,
					message: t('calendar', 'Severe error in webcal proxy. Please contact administrator for more information.')
				});
			}
		});
	};
}]);
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();


app.service('ColorUtility', function () {
	'use strict';

	var self = this;

	this.colors = [];

	this.generateTextColorFromRGB = function (red, green, blue) {
		var brightness = (red * 299 + green * 587 + blue * 114) / 1000;
		return brightness > 130 ? '#000000' : '#FAFAFA';
	};

	this.extractRGBFromHexString = function (colorString) {
		var fallbackColor = {
			r: 255,
			g: 255,
			b: 255
		},
		    matchedString;

		if (typeof colorString !== 'string') {
			return fallbackColor;
		}

		switch (colorString.length) {
			case 4:
				matchedString = colorString.match(/^#([0-9a-f]{3})$/i);
				return Array.isArray(matchedString) && matchedString[1] ? {
					r: parseInt(matchedString[1].charAt(0), 16) * 0x11,
					g: parseInt(matchedString[1].charAt(1), 16) * 0x11,
					b: parseInt(matchedString[1].charAt(2), 16) * 0x11
				} : fallbackColor;

			case 7:
			case 9:
				var regex = new RegExp('^#([0-9a-f]{' + (colorString.length - 1) + '})$', 'i');
				matchedString = colorString.match(regex);
				return Array.isArray(matchedString) && matchedString[1] ? {
					r: parseInt(matchedString[1].substr(0, 2), 16),
					g: parseInt(matchedString[1].substr(2, 2), 16),
					b: parseInt(matchedString[1].substr(4, 2), 16)
				} : fallbackColor;

			default:
				return fallbackColor;
		}
	};

	this._ensureTwoDigits = function (str) {
		return str.length === 1 ? '0' + str : str;
	};

	this.rgbToHex = function (r, g, b) {
		if (Array.isArray(r)) {
			var _r = r;

			var _r2 = _slicedToArray(_r, 3);

			r = _r2[0];
			g = _r2[1];
			b = _r2[2];
		}

		return '#' + this._ensureTwoDigits(parseInt(r, 10).toString(16)) + this._ensureTwoDigits(parseInt(g, 10).toString(16)) + this._ensureTwoDigits(parseInt(b, 10).toString(16));
	};

	this._hslToRgb = function (h, s, l) {
		if (Array.isArray(h)) {
			var _h = h;

			var _h2 = _slicedToArray(_h, 3);

			h = _h2[0];
			s = _h2[1];
			l = _h2[2];
		}

		s /= 100;
		l /= 100;

		return hslToRgb(h, s, l);
	};

	this.randomColor = function () {
		if (typeof String.prototype.toHsl === 'function') {
			var hsl = Math.random().toString().toHsl();
			return self.rgbToHex(self._hslToRgb(hsl));
		} else {
			return self.colors[Math.floor(Math.random() * self.colors.length)];
		}
	};

	if (typeof String.prototype.toHsl === 'function') {
		var hashValues = ['15', '9', '4', 'b', '6', '11', '74', 'f', '57'];
		angular.forEach(hashValues, function (hashValue) {
			var hsl = hashValue.toHsl();
			self.colors.push(self.rgbToHex(self._hslToRgb(hsl)));
		});
	} else {
		this.colors = ['#31CC7C', '#317CCC', '#FF7A66', '#F1DB50', '#7C31CC', '#CC317C', '#3A3B3D', '#CACBCD'];
	}
});
'use strict';


app.service('ICalSplitterUtility', ["ICalFactory", "SplittedICal", function (ICalFactory, SplittedICal) {
	'use strict';

	var calendarColorIdentifier = 'x-apple-calendar-color';
	var calendarNameIdentifier = 'x-wr-calname';
	var componentNames = ['vevent', 'vjournal', 'vtodo'];

	this.split = function (iCalString) {
		var jcal = ICAL.parse(iCalString);
		var components = new ICAL.Component(jcal);

		var objects = {};
		var timezones = components.getAllSubcomponents('vtimezone');

		componentNames.forEach(function (componentName) {
			var vobjects = components.getAllSubcomponents(componentName);
			objects[componentName] = {};

			vobjects.forEach(function (vobject) {
				var uid = vobject.getFirstPropertyValue('uid');
				objects[componentName][uid] = objects[componentName][uid] || [];
				objects[componentName][uid].push(vobject);
			});
		});

		var name = components.getFirstPropertyValue(calendarNameIdentifier);
		var color = components.getFirstPropertyValue(calendarColorIdentifier);

		var split = SplittedICal(name, color);
		componentNames.forEach(function (componentName) {
			var _loop = function _loop(objectKey) {
				if (!objects[componentName].hasOwnProperty(objectKey)) {
					return 'continue';
				}

				var component = ICalFactory.new();
				timezones.forEach(function (timezone) {
					component.addSubcomponent(timezone);
				});
				objects[componentName][objectKey].forEach(function (object) {
					component.addSubcomponent(object);
				});
				split.addObject(componentName, component.toString());
			};

			for (var objectKey in objects[componentName]) {
				var _ret = _loop(objectKey);

				if (_ret === 'continue') continue;
			}
		});

		return split;
	};
}]);
'use strict';


app.service('PopoverPositioningUtility', ["$window", function ($window) {
	'use strict';

	var context = {
		popoverHeight: 300,
		popoverWidth: 450
	};

	Object.defineProperties(context, {
		headerHeight: {
			get: function get() {
				return angular.element('#header').height();
			}
		},
		navigationWidth: {
			get: function get() {
				return angular.element('#app-navigation').width();
			}
		},
		windowX: {
			get: function get() {
				return $window.innerWidth - context.navigationWidth;
			}
		},
		windowY: {
			get: function get() {
				return $window.innerHeight - context.headerHeight;
			}
		}
	});

	context.isAgendaDayView = function (view) {
		return view.name === 'agendaDay';
	};

	context.isAgendaView = function (view) {
		return view.name.startsWith('agenda');
	};

	context.isInTheUpperPart = function (top) {
		return (top - context.headerHeight) / context.windowY < 0.5;
	};

	context.isInTheLeftQuarter = function (left) {
		return (left - context.navigationWidth) / context.windowX < 0.25;
	};

	context.isInTheRightQuarter = function (left) {
		return (left - context.navigationWidth) / context.windowX > 0.75;
	};

	this.calculate = function (left, top, right, bottom, view) {
		var position = [],
		    eventWidth = right - left;

		if (context.isInTheUpperPart(top)) {
			if (context.isAgendaView(view)) {
				position.push({
					name: 'top',
					value: top - context.headerHeight + 30
				});
			} else {
				position.push({
					name: 'top',
					value: bottom - context.headerHeight + 20
				});
			}
		} else {
			position.push({
				name: 'top',
				value: top - context.headerHeight - context.popoverHeight - 20
			});
		}

		if (context.isAgendaDayView(view)) {
			position.push({
				name: 'left',
				value: left - context.popoverWidth / 2 - 20 + eventWidth / 2
			});
		} else {
			if (context.isInTheLeftQuarter(left)) {
				position.push({
					name: 'left',
					value: left - 20 + eventWidth / 2
				});
			} else if (context.isInTheRightQuarter(left)) {
				position.push({
					name: 'left',
					value: left - context.popoverWidth - 20 + eventWidth / 2
				});
			} else {
				position.push({
					name: 'left',
					value: left - context.popoverWidth / 2 - 20 + eventWidth / 2
				});
			}
		}

		return position;
	};

	this.calculateByTarget = function (target, view) {
		var clientRect = target.getClientRects()[0];

		var left = clientRect.left,
		    top = clientRect.top,
		    right = clientRect.right,
		    bottom = clientRect.bottom;

		return this.calculate(left, top, right, bottom, view);
	};
}]);
'use strict';

app.service('StringUtility', function () {
	'use strict';

	this.uid = function (prefix, suffix) {
		prefix = prefix || '';
		suffix = suffix || '';

		if (prefix !== '') {
			prefix += '-';
		}
		if (suffix !== '') {
			suffix = '.' + suffix;
		}

		return prefix + Math.random().toString(36).substr(2).toUpperCase() + Math.random().toString(36).substr(2).toUpperCase() + suffix;
	};

	this.uri = function (start, isAvailable) {
		start = start || '';

		var uri = start.toString().toLowerCase().replace(/\s+/g, '-') 
		.replace(/[^\w\-]+/g, '') 
		.replace(/\-\-+/g, '-') 
		.replace(/^-+/, '') 
		.replace(/-+$/, ''); 

		if (uri === '') {
			uri = '-';
		}

		if (isAvailable(uri)) {
			return uri;
		}

		if (uri.indexOf('-') === -1) {
			uri = uri + '-1';
			if (isAvailable(uri)) {
				return uri;
			}
		}

		do {
			var positionLastDash = uri.lastIndexOf('-');
			var firstPart = uri.substr(0, positionLastDash);
			var lastPart = uri.substr(positionLastDash + 1);

			if (lastPart.match(/^\d+$/)) {
				lastPart = parseInt(lastPart);
				lastPart++;

				uri = firstPart + '-' + lastPart;
			} else {
				uri = uri + '-1';
			}
		} while (isAvailable(uri) === false);

		return uri;
	};
});
'use strict';


app.service('WebCalUtility', ["$rootScope", function ($rootScope) {
	'use strict';


	this.allowDowngrade = function (url) {
		return !url.startsWith('https://');
	};

	this.buildProxyURL = function (url) {
		return $rootScope.baseUrl + 'proxy?url=' + encodeURIComponent(url);
	};

	this.downgradePossible = function (url, allowDowngradeToHttp) {
		return url.startsWith('https://') && allowDowngradeToHttp;
	};

	this.downgradeURL = function (url) {
		if (url.startsWith('https://')) {
			return 'http://' + url.substr(8);
		}
	};

	this.fixURL = function (url) {
		if (url.startsWith('http://') || url.startsWith('https://')) {
			return url;
		} else if (url.startsWith('webcal://')) {
			return 'https://' + url.substr(9);
		} else {
			return 'https://' + url;
		}
	};
}]);
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };


app.service('XMLUtility', function () {
	'use strict';

	var context = {};
	context.XMLify = function (xmlDoc, parent, json) {
		var element = xmlDoc.createElementNS(json.name[0], json.name[1]);

		json.attributes = json.attributes || [];
		json.attributes.forEach(function (a) {
			if (a.length === 2) {
				element.setAttribute(a[0], a[1]);
			} else {
				element.setAttributeNS(a[0], a[1], a[2]);
			}
		});

		if (json.value) {
			element.textContent = json.value;
		} else if (json.children) {
			for (var key in json.children) {
				if (json.children.hasOwnProperty(key)) {
					context.XMLify(xmlDoc, element, json.children[key]);
				}
			}
		}

		parent.appendChild(element);
	};

	var serializer = new XMLSerializer();

	this.getRootSkeleton = function () {
		if (arguments.length === 0) {
			return [{}, null];
		}

		var skeleton = {
			name: arguments[0],
			children: []
		};

		var childrenWrapper = skeleton.children;

		var args = Array.prototype.slice.call(arguments, 1);
		args.forEach(function (argument) {
			var level = {
				name: argument,
				children: []
			};
			childrenWrapper.push(level);
			childrenWrapper = level.children;
		});

		return [skeleton, childrenWrapper];
	};

	this.serialize = function (json) {
		json = json || {};
		if ((typeof json === 'undefined' ? 'undefined' : _typeof(json)) !== 'object' || !json.hasOwnProperty('name')) {
			return '';
		}

		var root = document.implementation.createDocument('', '', null);
		context.XMLify(root, root, json);

		return serializer.serializeToString(root);
	};
});
})(angular, jQuery, oc_requesttoken);