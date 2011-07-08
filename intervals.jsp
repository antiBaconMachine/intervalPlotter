<%@include file="/WEB-INF/themes/layouts/header.jsp" %>

<s:layout-render name="/WEB-INF/themes/admin/calendar/layouts/mainTabPanel.jsp" activeTab="intervalsTab">

	<s:layout-component name="pageSubTitle">
		<fmt:message key="calendarAdminIntervalsTabTitle" />
	</s:layout-component>

	<s:layout-component name="tabContent">

		<s:layout-render name="/WEB-INF/themes/layouts/messages.jsp" />

		<s:form action="${actionPath}/CalendarAdmin.action" id="intervalPlotter">

			<div class="action-panel" id="intervalPlotterHeader">
				<ul class="btn-container action-btns">
					<c:set var="viewsHash" value="{" />
					<c:forEach items="${actionBean.intervalScopes}" var="scope" varStatus="status" >
						<li>
							<a href="#" id="${scope}_Intervals" class="intervalSelector" 
								 style="display: ${status.first ? 'none' : 'block' }">
								<db:linkButton labelKey="calendarIntervals_${scope}" styleClass="" />
							</a>
						</li>
						<c:set var="hashEntry" value="${scope} : '#${scope}_Intervals'${status.last ? '' : ','}" />
						<c:set var="viewsHash" value="${viewsHash} ${hashEntry} " />
					</c:forEach>
					<c:set var="viewsHash" value="${viewsHash}}" />
				</ul>
			</div>	

			<div id='calendar'></div>

			<div class="action-panel">
				<ul class="btn-container action-btns">
					<li>
						<db:inputButton styleClass="Button_Ok">
							<fmt:message var="saveButtonLabel" key="saveButtonLabel" />
							<s:submit name="saveIntervals" id="saveIntervals" value="${saveButtonLabel}"/>
						</db:inputButton>
					</li>
				</ul>
			</div>
		</s:form>

		<s:layout-render name="/WEB-INF/themes/admin/calendar/layouts/intervalDialog.jsp" titleKey="newIntervalPromptTitle" saveId="saveInterval" id="addIntervalDialog"/>

		<s:layout-render name="/WEB-INF/themes/admin/calendar/layouts/intervalDialog.jsp" titleKey="editIntervalPromptTitle" saveId="updateInterval" id="editIntervalDialog">
			<s:layout-component name="denyButton">
				<li>
					<a href="#" id="deleteInterval">
						<db:linkButton labelKey="deleteButtonLabel" styleClass="Button_Delete" />
					</a>
				</li>
			</s:layout-component>
		</s:layout-render>

	</s:layout-component>

	<s:layout-component name="externalContent">
		<link rel="stylesheet" href="${resourcePath}/stylesheets/primary/fullcalendar.timetable.css" />
		<script type="text/javascript" src="${resourcePath}/javascript/jquery-ui-1.8.13.custom.min.js"></script>
		<script type="text/javascript" src="${resourcePath}/javascript/AjaxUtils.js"></script>
		<s:layout-render name="/WEB-INF/themes/ks1/calendar/layouts/calendarScripts.jsp" />
		<script type='text/javascript'>
	
			var calendar;
			var intervalPlotter;
			
			jQuery(document).ready(function() {
				var $ = jQuery;
				
				intervalPlotter = new db.calendar.IntervalPlotter({
					actionPath : "${actionPath}",
					user : "${actionBean.user.username}",
					intervals : ${actionBean.intervals},
					views :	${viewsHash},
					getCalendar : function() {
						return calendar;
					}
				});
				
				calendar = jQuery('#calendar').fullCalendar({
					defaultView: 'agendaDay',
					year: intervalPlotter.getBaseDate().getYear() + 1900,
					month: intervalPlotter.getBaseDate().getMonth(),
					date: intervalPlotter.getBaseDate().getDate(),
					header: {
						left: '',
						center: '',
						right: ''
					},
					events : intervalPlotter.getIntervals(),
					slotMinutes : 5,
					allDaySlot : false,
					editable: true,
					selectable: true,
					selectHelper: true,
					select: function(start, end, allDay) {
						db.log(db.LogLevel.INFO, "Calendar click %s %s", start,end);
						newIntervalPrompt.show(function(prompt){
							var titleElement = jQuery(prompt.element).find(".intervalTitle");
							var title = titleElement.val();
							if (title) {
								calendar.fullCalendar('renderEvent',
								{
									title: title,
									start: start,
									end: end,
									allDay: allDay
								},
								true // make the event "stick"
							);
							}
							titleElement.val("");
							calendar.fullCalendar('unselect');
						}, null, function(prompt){calendar.fullCalendar('unselect');});
					},
					eventClick: function(calEvent, jsEvent, view) {
						db.log(db.LogLevel.INFO, "Event clicked %o", calEvent);
						editIntervalPrompt.show(
						function(prompt) {
							var title = $(prompt.element).find(".intervalTitle").val();
							if (title) {
								calEvent.title = title;
								calendar.fullCalendar('updateEvent', calEvent);
							}
						},
						function(prompt) {
							calendar.fullCalendar('removeEvents', calEvent.id);
						},
						function(prompt) {

						}
					);
						$("#editIntervalDialog .intervalTitle").val(calEvent.title);
					},
					viewDisplay : function(view) {
						
						$("#intervalPlotter .fc-agenda-slots tr").each(function(view){
							var $tr = $(this);
							var $th = $tr.find("th");
							if (!$th.find("span").length) {
								$th.wrapInner($("<span/>"));
							}
						})
					},
					eventDrop : intervalPlotter.dropHandler,
					eventResize : intervalPlotter.resizeHandler
				});
				
				jQuery("#saveIntervals").click(intervalPlotter.saveIntervals);
				
			});
			
			
			
			var newIntervalPrompt = new db.Prompt({	
				
			},{
				consume : true,
				affirmButtonSelector : "#saveInterval",
				cancelButtonSelector : "#cancelInterval",
				contentId : "addIntervalDialogDiv"
			});
			var editIntervalPrompt = new db.Prompt({	
				
			},{
				consume : true,
				affirmButtonSelector : "#updateInterval",
				denyButtonSelector : "#deleteInterval",
				cancelButtonSelector : "#cancelInterval",
				contentId : "editIntervalDialogDiv"
			});

		</script>
	</s:layout-component>
</s:layout-render>