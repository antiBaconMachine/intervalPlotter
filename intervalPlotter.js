if (!db) {
	var db = {};
}
if (!db.calendar) {
	db.calendar = {};
}

db.calendar.IntervalPlotter = ( function($){
	
	//FullCalendar is buggy when dealing with absolute zero so we give it a years grace
	var BASE_DATE = ( function(){
		var d = new Date(0);
		d.setYear(1971);
		return d;
	}() );
	
	return function(params){
		params = $.extend({
			views : [
			"DAILY"
			]
		}, params || {});
		
		db.log(db.LogLevel.INFO, "intervalPlotter params: %o", params);
	
		var SECOND = 1000;
		var MINUTE = SECOND * 60;
		var HOUR = MINUTE * 60;
		var DAY = HOUR * 24;
		
		var DATE_FORMAT = "yyyy-MM-dd HH:mm:00";
	
		db.log(db.LogLevel.INFO, "Intervals : %o", params.intervals);
	
		/*Base dates to work on. Each interval view will be assigned a different day 
	 * starting from BASE_DATE. Day / timezone information is irrelevant so 
	 * this is entirely arbitrary 
	 */
		var baseDates = {};
		var i = 0;
		for (var k in params.views) {
			var date = new Date(BASE_DATE.getTime() + (i++ * DAY));
			baseDates[k] = date;
			baseDates[date.getDate()] = k;
			var btn = $(params.views[k]);
			btn.click(getIntervalScopeHandler(k, date, btn));
		}
		
		/*Build a click handler with which to change between different 
		 *interval scopes
		 */
		function getIntervalScopeHandler(key, date, btn) {
			return function(event) {
				db.log(db.LogLevel.INFO, "Changing interval set to %s", key);
				event.preventDefault();
				self.getCalendar().fullCalendar("gotoDate", date);
				$("#intervalPlotter .intervalSelector").show();
				btn.hide();
			}
		}
	
		/*Convert intervals into fullCalendar readable events
	 * Each scope is mapped to a different day
	 */
		var intervals = [];
		if (params.intervals) {
			$.each(params.intervals, function(i, e) {
				var baseDate = baseDates[e.scope];
				if (baseDate) {
					var start = normalise(baseDate, new Date(e.start));
					var end = normalise(baseDate, new Date(e.end));
					intervals.push({
						start : $.fullCalendar.formatDate(start, DATE_FORMAT),
						end : $.fullCalendar.formatDate(end, DATE_FORMAT),
						title : e.label,
						allDay : false,
						id : e.id
					})
				}
			});
		}
	
		function normalise(baseDate, date) {
			if ( Math.abs(baseDate.getTime() - date.getTime()) > DAY) {
				var newDate = new Date(baseDate);
				newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
				date = newDate;
			}
			return date;
		}

		var self = {

			resizeHandler : function(event, dayDelta, minuteDelta, revertFunc, jsEvent, ui, view) {
				return self.checkForOverlap(event, revertFunc);
			},

			dropHandler : function(event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view) {
				return self.checkForOverlap(event, revertFunc);
			},

			checkForOverlap : function(event, revertFunc) {
				var isOverlap = false;
				var events = self.getEvents();
				for (var i = events.length-1; i >= 0; i--) {
					var calEvent = events[i];
					if (calEvent === event || calEvent.scope !== event.scope) {
						continue;
					}
					if (
						(event.start >= calEvent.start && event.start < calEvent.end) ||
						(event.start < calEvent.start && event.end > calEvent.start)
						) {
						isOverlap = true;
						break;
					}
				}
				if (isOverlap) {
					console.info("overlap detected, reverting");
					revertFunc();
				}
			},
	 
			getEvents : function() {
				return self.getCalendar().fullCalendar("clientEvents");
			},
	 
			getJsonFriendlyIntervals : function() {
				var events = [];
				$.each(self.getEvents(), function(i, event) {
					var interval = {
						label : event.title,
						start : event.start.getTime(),
						end : event.end.getTime(),
						scope : self.getScope(event.start)
					};
					if (event.id) {
						interval.id = event.id;
					}
					events.push(interval);
				});
				return events;
			},

			getIntervalsObject : function() {
				return {
					action : "updateIntervals",
					owner : params.user,
					intervals : self.getJsonFriendlyIntervals()
				};
			},
	 
			saveIntervals : function(event) {
				event.preventDefault();
				$.ajax({
					url : params.actionPath + "/CalendarAdmin.action",
					type : "post",
					success : AjaxMessages.displayMessages,
					data : {
						_eventName : "saveIntervals",
						intervalJson : JSON.stringify(self.getIntervalsObject())
					}
				})
			},
   
			getBaseDate : function(view) {
				if (!view) {
					return BASE_DATE;
				}
				return baseDates[view];
			},

			getCalendar : function() {
				if (params.getCalendar) {
					return params.getCalendar();
				}
				return null;
			},
			
			getIntervals : function() {
				return intervals;
			},
			
			getScope : function(date) {
				return baseDates[date.getDate()] || null;
			}

		}
		return self;
	};
}(jQuery) )