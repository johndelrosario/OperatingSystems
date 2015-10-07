(function (main) {
    main.jobs = main.jobs || {};

    var jobCounter = 1,
        jobCollection = ko.observableArray([]),
        processedCollection = ko.observableArray([]);

    function job(cpuBurst, queueArrival, priority) {
        var self = this;

        this.id = ko.observable(jobCounter++);
        this.isProcessing = ko.observable(false);
        this.cpuBurst = ko.observable(cpuBurst || 0);
        this.queueArrival = ko.observable(queueArrival || 0);
        this.nextToQueue = ko.observable(false);
        this.inQueue = ko.observable(false);
        this.priority = ko.observable(priority || 0);
        this.startTime = 0;
        this.lastProcessed = 0;
        this.remainingBurst = cpuBurst;
        this.waitingTime = ko.observable(0);
        this.turnAroundTime = ko.observable(0);
        this.queued = false;
        this.color = "#" + Math.random().toString(16).slice(2, 8);

        self.cpuBurst.subscribe(function (val) {
            val = parseInt(val);
            if (typeof val === 'number' && val >= 0) {
                self.remainingBurst = val;
            } else {
                self.cpuBurst(0);
            }
        });
        self.queueArrival.subscribe(function (val) {
            val = parseInt(val);
            if (typeof val !== 'number' || val < 0) {
                self.queueArrival(0);
            }
        });
        self.priority.subscribe(function (val) {
            val = parseInt(val);
            if (typeof val !== 'number' || val < 0) {
                self.priority(0);
            }
        });


    }

    function addJob(cpuBurst, queueArrival, priority) {
        jobCollection.push(new job(cpuBurst, queueArrival, priority));
    }

    function removeJob(job) {
        jobCollection.remove(job);
        jobCounter = 0;
        var unwrappedCollection = ko.utils.unwrapObservable(jobCollection);
        for (i = 0; i < unwrappedCollection.length; i++) {
            unwrappedCollection[i].id(jobCounter);
            jobCounter++;
        }
    }

    main.jobs = {
        jobCollection: jobCollection,
        processedCollection: processedCollection,
        addJob: addJob,
        removeJob: removeJob
    }
})(processScheduling);