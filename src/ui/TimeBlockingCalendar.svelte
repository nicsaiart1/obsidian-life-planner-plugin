<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Calendar, type EventInput, type EventApi, type DateSelectArg, type EventClickArg, type EventChangeArg, type DatesSetArg } from '@fullcalendar/core';
    import interactionPlugin from '@fullcalendar/interaction';
    import timeGridPlugin from '@fullcalendar/timegrid';
    import dayGridPlugin from '@fullcalendar/daygrid';

    // Import your core logic functions and TimeBlock interface
    import { getTimeBlocks, saveTimeBlock, deleteTimeBlock, type TimeBlock, initTimeBlocking } from '../modules/time-management/TimeBlockingPlanner';
    
    // If you need the App context from Obsidian:
    // import { getContext } from 'svelte';
    // import type { App } from 'obsidian';
    // const app = getContext<App>('app'); // This assumes 'app' is set in context by a parent component

    // Placeholder for App instance if not using Svelte context.
    // In a real plugin, this might be passed as a prop or set via a global service.
    // For now, our functions in TimeBlockingPlanner.ts are designed to work conceptually without it.
    // if (app) { initTimeBlocking(app); }


    let calendarEl: HTMLElement;
    let calendar: Calendar;
    let currentViewDates: string[] = []; // To store dates in the current view for fetching

    // Helper to convert TimeBlock to FullCalendar EventInput
    function toEventInput(block: TimeBlock): EventInput {
        return {
            id: block.id,
            title: block.title,
            start: block.startTime,
            end: block.endTime,
            allDay: block.allDay || false,
            extendedProps: { taskId: block.taskId, notes: block.notes }
        };
    }

    // Helper to convert FullCalendar event (or selection) to TimeBlock
    function fromEventApi(eventData: EventApi | DateSelectArg | EventChangeArg['event'], existingId?: string): TimeBlock {
        const id = existingId || (eventData as EventApi).id || Date.now().toString();
        let title = '';
        let start = '';
        let end = '';
        let allDay = false;
        let taskId: string | undefined = undefined;
        let notes: string | undefined = undefined;

        if ('title' in eventData) { // EventApi or EventChangeArg.event like structure
            title = eventData.title || '';
            start = eventData.startStr || '';
            end = eventData.endStr || '';
            allDay = eventData.allDay || false;
            taskId = eventData.extendedProps?.taskId;
            notes = eventData.extendedProps?.notes;
        } else if ('startStr' in eventData) { // DateSelectArg like structure
            start = eventData.startStr;
            end = eventData.endStr;
            allDay = eventData.allDay;
            // Title will be prompted for new events
        }
        
        return { id, title, startTime: start, endTime: end, allDay, taskId, notes };
    }
    
    // Generate a unique ID (simple version)
    function generateUniqueId(): string {
        return `tb-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
    }

    async function fetchEvents(fetchInfo: any, successCallback: (events: EventInput[]) => void, failureCallback: (error: any) => void) {
        try {
            const allBlocks: TimeBlock[] = [];
            // Iterate through each day in the current view range to fetch events
            // currentViewDates should be populated by the 'datesSet' callback
            for (const date of currentViewDates) {
                const blocksForDate = await getTimeBlocks(date /*, app */); 
                allBlocks.push(...blocksForDate);
            }
            successCallback(allBlocks.map(toEventInput));
        } catch (error) {
            console.error("Error fetching time blocks:", error);
            failureCallback(error);
        }
    }

    onMount(() => {
        // Note: FullCalendar's CSS (e.g., @fullcalendar/core/main.css) needs to be imported globally.
        // This might be done in main.ts or a global CSS file handled by your bundler.
        // Example: import '@fullcalendar/core/main.css'; (in a JS/TS file that allows CSS imports)

        calendar = new Calendar(calendarEl, {
            plugins: [interactionPlugin, timeGridPlugin, dayGridPlugin],
            initialView: 'timeGridWeek',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            editable: true,
            selectable: true,
            events: fetchEvents,

            datesSet: (dateInfo: DatesSetArg) => {
                // Populate currentViewDates for fetchEvents
                currentViewDates = [];
                let currentDate = new Date(dateInfo.start);
                const endDate = new Date(dateInfo.end);
                while(currentDate < endDate) {
                    currentViewDates.push(currentDate.toISOString().slice(0,10));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                // calendar.refetchEvents(); // Not strictly necessary if 'events' function re-evaluates, but good for clarity
            },

            select: async (selectionInfo: DateSelectArg) => {
                const title = prompt('Enter event title:');
                if (title) {
                    const newBlockData = fromEventApi(selectionInfo);
                    newBlockData.id = generateUniqueId(); // Assign a new unique ID
                    newBlockData.title = title; // Set the prompted title
                    
                    const date = selectionInfo.startStr.slice(0,10);
                    await saveTimeBlock(date, newBlockData /*, app */);
                    calendar.addEvent(toEventInput(newBlockData)); // Add event directly to calendar
                }
                calendar.unselect();
            },
            eventChange: async (changeInfo: EventChangeArg) => {
                if (!changeInfo.event.startStr) {
                    console.error("Event has no startStr, cannot save", changeInfo.event);
                    return;
                }
                const updatedBlock = fromEventApi(changeInfo.event, changeInfo.event.id);
                const date = changeInfo.event.startStr.slice(0,10);
                await saveTimeBlock(date, updatedBlock /*, app */);
                // Calendar updates optimistically, but a refetch can ensure consistency if needed.
                // calendar.refetchEvents(); 
            },
            eventClick: async (clickInfo: EventClickArg) => {
                if (!clickInfo.event.startStr) {
                    console.error("Event has no startStr, cannot delete", clickInfo.event);
                    return;
                }
                const action = prompt(`Event: ${clickInfo.event.title}\n\nActions: (d)elete, (e)dit title, or (c)ancel`, 'c');
                const eventId = clickInfo.event.id;
                const eventDate = clickInfo.event.startStr.slice(0,10);

                if (action === 'd' || action === 'delete') {
                    if (confirm(`Are you sure you want to delete event '${clickInfo.event.title}'?`)) {
                        await deleteTimeBlock(eventDate, eventId /*, app */);
                        const eventInCalendar = calendar.getEventById(eventId);
                        if(eventInCalendar) eventInCalendar.remove();
                    }
                } else if (action === 'e' || action === 'edit') {
                    const newTitle = prompt("Enter new title:", clickInfo.event.title);
                    if (newTitle && newTitle !== clickInfo.event.title) {
                        const updatedBlock = fromEventApi(clickInfo.event, eventId);
                        updatedBlock.title = newTitle;
                        await saveTimeBlock(eventDate, updatedBlock /*, app */);
                        // Update event in calendar
                        const eventInCalendar = calendar.getEventById(eventId);
                        if(eventInCalendar) {
                            eventInCalendar.setProp('title', newTitle);
                        }
                    }
                }
            }
        });
        calendar.render();
    });

    onDestroy(() => {
        if (calendar) {
            calendar.destroy();
        }
    });
</script>

<div bind:this={calendarEl} class="life-planner-calendar-container"></div>

<style>
    /* Ensure your container has some height, or FullCalendar might not be visible */
    .life-planner-calendar-container {
        min-height: 600px; /* Example height, adjust as needed */
        font-size: 0.9em; /* Smaller font size for calendar content */
    }

    /* 
      IMPORTANT: FullCalendar's own CSS must be loaded for it to display correctly.
      This is typically done by importing them in your main application script (e.g., main.ts if your bundler supports it)
      or by including them in a global CSS bundle.
      Example imports for a JS/TS file processed by a bundler like ESBuild/Webpack:
      import '@fullcalendar/core/main.css';
      import '@fullcalendar/daygrid/main.css';
      import '@fullcalendar/timegrid/main.css';
    */
</style>
