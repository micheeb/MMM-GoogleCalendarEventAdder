Module.register("MMM-GoogleCalendarEventAdder", {
    // Default module configuration
    defaults: {
        text: "Add event"
    },

    start: function () {
        Log.info("Starting module: " + this.name);
    },

    getStyles: function () {
        return ['MMM-GoogleCalendarEventAdder.css', 'https://use.fontawesome.com/releases/v5.15.3/css/all.css'];
    },

    createFormElement: function (element, attributes, properties) {
        let el = document.createElement(element);
        for (let attr in attributes) {
            el.setAttribute(attr, attributes[attr]);
        }
        for (let prop in properties) {
            el[prop] = properties[prop];
        }
        return el;
    },

    getDom: function () {
        let wrapper = document.createElement("div");

        // Assign the ID to the wrapper
        wrapper.id = "MMM-GoogleCalendarEventAdder";

        // If there's a message to show
        if (this.message) {
            var messageElem = document.createElement('div');
            messageElem.innerHTML = this.message;

            // Set the class based on the message type
            if (this.messageType === 'success') {
                messageElem.className = 'message success';
            } else if (this.messageType === 'error') {
                messageElem.className = 'message error';
            } else if (this.messageType === 'info') {
                messageElem.className = 'message info';
          }

            wrapper.appendChild(messageElem);

            // Clear the message after 5 seconds
            setTimeout(() => {
                this.message = null;
                this.messageType = null;
                this.updateDom();
            }, 5000);
        }

        // Create the form
        let form = this.createFormElement("form", { id: "eventForm" });
        form.style.display = "none"; // Hidden by default
        form.style.zIndex = "1000";

        // Create the "Add event" button
        let addButton = document.createElement("button");
        addButton.className = "add-event-button";
        addButton.innerHTML = '<i class="fas fa-plus"></i>';  // Removing "Add Event" text
        addButton.addEventListener("click", () => {
            this.openForm();
        });
        
        // Create header bar on form
        let headerBar = this.createFormElement("div", {class: "headerBar"});
        form.appendChild(headerBar);
        
        // Create a new container for form elements, excluding the header bar
        let formContentContainer = this.createFormElement("div", { class: "form-content-container" });
        
        // Create the event title field
        let titleContainer = this.createFormElement("div", {class: "form-group"});
        titleContainer.appendChild(this.createFormElement("label", {for: "eventTitle"}, {textContent: "Event Title:"}));
        titleContainer.appendChild(this.createFormElement("input", {id: "eventTitle", type: "text"}));
        formContentContainer.appendChild(titleContainer);

        // Create the all-day event checkbox
        let allDayContainer = this.createFormElement("div", {class: "form-group"});
        allDayContainer.appendChild(this.createFormElement("label", {for: "allDay"}, {textContent: "All-day event:"}));
        let allDayCheckbox = this.createFormElement("input", {id: "allDay", type: "checkbox"});
        allDayContainer.appendChild(allDayCheckbox);
        formContentContainer.appendChild(allDayContainer);
        
        // Create a container for both time fields
        let timeContainer = this.createFormElement("div", {class: "form-group time-container"});
        formContentContainer.appendChild(timeContainer);
        
        // Create the start time field
        let startContainer = this.createFormElement("div", {class: "form-group"});
        let startTimeLabel = this.createFormElement("label", {for: "startTime"}, {textContent: "Start Time: "});
        startContainer.appendChild(startTimeLabel);
        let startTimeInput = this.createFormElement("input", {id: "startTime", type: "datetime-local"});
        startContainer.appendChild(startTimeInput);
        timeContainer.appendChild(startContainer);

        allDayCheckbox.addEventListener('change', () => {
        if (allDayCheckbox.checked) {
            // If the checkbox is checked, change the inputs to "date" type
            startTimeInput.type = 'date';
            endTimeInput.type = 'date';
            // Hide the end time
            endContainer.style.display = 'none';
        } else {
            // If the checkbox is unchecked, change the inputs back to "datetime-local" type
            startTimeInput.type = 'datetime-local';
            endTimeInput.type = 'datetime-local';
            // Show the end time
            endContainer.style.display = 'block';
        }
        });

        // Create the end time field
        let endContainer = this.createFormElement("div", {class: "form-group"});
        endContainer.appendChild(this.createFormElement("label", {for: "endTime"}, {textContent: "End Date: "}));
        let endTimeInput = this.createFormElement("input", {id: "endTime", type: "datetime-local"});
        endContainer.appendChild(endTimeInput);
        timeContainer.appendChild(endContainer);

        // Hide end time by default
        endContainer.style.display = 'none';
        
        startTimeInput.addEventListener('change', () => {
        let startDate = new Date(startTimeInput.value);
        let endDate;
        if (allDayCheckbox.checked) {
            // If the event is all-day, the end date should be the same as the start date
            endDate = new Date(startDate.getTime());
        } else {
            // If the event is not all-day, the end date should be 30 minutes later
            endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
        }

        let year = endDate.getFullYear();
        let month = ("0" + (endDate.getMonth() + 1)).slice(-2);
        let day = ("0" + endDate.getDate()).slice(-2);
        if (allDayCheckbox.checked) {
            // If the event is all-day, only set the date
            endTimeInput.value = `${year}-${month}-${day}`;
        } else {
            // If the event is not all-day, set the date and time
            let hours = ("0" + endDate.getHours()).slice(-2);
            let minutes = ("0" + endDate.getMinutes()).slice(-2);
            endTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        });

        //Every time the start time is changed, the end time defaults to 30 min later
        startTimeInput.addEventListener('change', () => {
            let startDate = new Date(startTimeInput.value);
            let endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 minutes later
            let year = endDate.getFullYear();
            let month = ("0" + (endDate.getMonth() + 1)).slice(-2);
            let day = ("0" + endDate.getDate()).slice(-2);
            let hours = ("0" + endDate.getHours()).slice(-2);
            let minutes = ("0" + endDate.getMinutes()).slice(-2);
            endTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
          });

          // Hide/Show end time based on allday selection
            allDayCheckbox.addEventListener('change', () => {
                if (allDayCheckbox.checked) {
                    startTimeLabel.textContent = "Start Date: ";
                // If the checkbox is checked, hide the end time
                    endContainer.style.display = 'block';
                } else {
                    startTimeLabel.textContent = "Start Time: ";
                // If the checkbox is unchecked, show the end time
                    endContainer.style.display = 'none';
                }
            });
                
        formContentContainer.appendChild(timeContainer);  

        // Create the submit button
        let submitButton = this.createFormElement("button", {type: "submit", class: "btn"}, {textContent: "Submit"});
        submitButton.addEventListener("click", (event) => {
            event.preventDefault();  
            this.addEvent();
        });

        // Create a container for the submit button
        let submitButtonContainer = this.createFormElement("div", {class: "form-group submit-button-container"});
        submitButtonContainer.appendChild(submitButton);

        formContentContainer.appendChild(submitButtonContainer);  

        // Create the cancel button
        let cancelButton = this.createFormElement("button", {type: "cancel", class: "btn"}, {innerHTML: '<i class="fas fa-times"></i>'});
        cancelButton.addEventListener("click", (event) => {
            event.preventDefault();  
            this.closeForm();
        });

        formContentContainer.appendChild(cancelButton); 

        form.appendChild(formContentContainer);

        // Append the button and the form to the wrapper
        wrapper.appendChild(addButton);
        wrapper.appendChild(form);

        return wrapper;
    },

    openForm: function () {
        let form = document.getElementById("eventForm");
        let startTimeInput = document.getElementById("startTime");
        if (form) {
            form.style.display = "block";
            // If the start time input is empty, set it to the current date and time
            if (!startTimeInput.value) {
                let now = new Date();
                let year = now.getFullYear();
                let month = ("0" + (now.getMonth() + 1)).slice(-2);
                let day = ("0" + now.getDate()).slice(-2);
                let hours = ("0" + now.getHours()).slice(-2);
                let minutes = ("0" + now.getMinutes()).slice(-2);
                startTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
        }
    },
    

    closeForm: function () {
        let form = document.getElementById("eventForm");
        if (form) {
            form.style.display = "none";
            form.reset(); // Clear the input fields
        }
    },

    addEvent: function () {
        let eventTitle = document.getElementById("eventTitle").value;
        let startTime = document.getElementById("startTime").value;
        let endTime = document.getElementById("endTime").value;
        let allDay = document.getElementById("allDay").checked;
    
        if (allDay) {
            // Add the time to the end date
            endTime += "T23:59:59";
    
            let endDate = new Date(endTime);
            endDate.setDate(endDate.getDate() + 1);
    
            let year = endDate.getFullYear();
            let month = ("0" + (endDate.getMonth() + 1)).slice(-2);
            let day = ("0" + endDate.getDate()).slice(-2);
            endTime = `${year}-${month}-${day}`;
        }
    
        let payload = {
            eventTitle: eventTitle,
            startTime: startTime,
            endTime: endTime,
            allDay: allDay
        };
    
        this.sendSocketNotification("ADD_CALENDAR_EVENT", payload);
        this.closeForm();
        this.message = "Adding event...";
        this.messageType = "info";
        this.updateDom();
    },
    
    notificationReceived: function(notification, payload, sender) {
        // If the notification is BUTTON_CLICKED and the sender is the MMM-CalendarExt3 module
        if (notification === 'BUTTON_CLICKED' && sender.name === 'MMM-CalendarExt3') {
          // Open the form
          this.openForm();
          // Prepopulate the start date with the date from the payload
          let startTime = document.getElementById('startTime');
          if (startTime) {
            let date = new Date(payload.date);
            let year = date.getFullYear();
            let month = ("0" + (date.getMonth() + 1)).slice(-2);
            let day = ("0" + date.getDate()).slice(-2);
            let hours = ("0" + date.getHours()).slice(-2);
            let minutes = ("0" + date.getMinutes()).slice(-2);
            startTime.value = `${year}-${month}-${day}T${hours}:${minutes}`;
          }
        }
      },
      

    socketNotificationReceived: function (notification, payload) {
        if (notification === "EVENT_ADD_SUCCESS_MAIN") {
            this.showMessage('Event added!', 'success');

        } else if (notification === 'EVENT_ADD_FAILED') {
            this.showMessage('Event not added', 'error');
        }
    },

    showMessage: function (message, type) {
        this.message = message;
        this.messageType = type;
        this.updateDom(); // Update DOM immediately to show the message
    },
});
