if (!db) {
 var db = {};
}
if (!db.calendar) {
 db.calendar = {};
}

db.calendar.IntervalPlotter = ( function($){

 return function(params){

  //Base day to work on. As we're only interested in time of day any day will do
  var BASE_DATE = new Date();

  params = $.extend({
   
  }, params || {});

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
	 if (calEvent === event) {
	  continue;
	 }
	 if (
	 (event.start >= calEvent.start && event.start <= calEvent.end) ||
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
   
   getBaseDate : function() {
	return BASE_DATE;
   },

   getCalendar : function() {
	if (params.getCalendar) {
	 return params.getCalendar();
	}
	return null;
   }
   
  }
  return self;
 };
}(jQuery) )