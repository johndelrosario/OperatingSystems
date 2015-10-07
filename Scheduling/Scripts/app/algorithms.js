(function (main) {
    main.algorithms = main.algorithms || {};

    var algorithmId = 0,
        algorithmCollection = ko.observableArray([]),
        counters = {
            processCounter: ko.observable(0),
            waitingTimeCounter: ko.observable(0),
            turnAroundCounter: ko.observable(0),
            hasFinished: ko.observable(false)
        },
        settings = {
            hasStarted: ko.observable(false),
            isSimulationRunning: ko.observable(false),
            simulationInterval: ko.observable(1000),
            onInit: function (setting) {
                setting.hasStarted(true);
            }
        },
        selectedAlgorithm = ko.observable();

    function algorithm(id, name, functions) {
        this.id = id;
        this.name = name;
        this.functions = functions;
    }

    function add(name, callback) {
        algorithmCollection.push(new algorithm(algorithmId++, name, new processAlgorithm(callback)));
    };

    function processAlgorithm(orderFunction) {
        var self = this,
            simulateInterval;

        this.step = function () {
            settings.onInit(settings);
            var processedCollection = main.jobs.jobCollection().filter(function (i) {
                return i.remainingBurst > 0;
            }).sort(function (x, y) {
                return x.queueArrival() >= y.queueArrival();
            });
            var processedData = orderFunction.call(processedCollection),
                nextInQueue = processedData.nextJob,
                collectionLength = processedData.processedCollection.length;

            //if (typeof nextInQueue !== 'undefined' && parseInt(ko.utils.unwrapObservable(nextInQueue.queueArrival)) <= ko.utils.unwrapObservable(counters.processCounter)) {
            if(nextInQueue) {
                processedCollection = processedData.processedCollection;
                nextInQueue.isProcessing(true);
                nextInQueue.nextToQueue(false);
                nextInQueue.inQueue(true);
                nextInQueue.remainingBurst--;
                nextInQueue.lastProcessed = ko.utils.unwrapObservable(counters.processCounter);
                nextInQueue.startTime = nextInQueue.startTime || ko.utils.unwrapObservable(counters.processCounter);
                main.jobs.processedCollection.push(nextInQueue);
            } else {
                main.jobs.processedCollection.push("NA");
            }

            function clearNextToQueue() {
                for (i = 0; i < collectionLength; i++) {
                    processedCollection[i].nextToQueue(false);
                }
            }

            function determineNextToQueue(nonPrioCallback) {
                var isPriority = processScheduling.algorithms.selectedAlgorithm() == 2 || processScheduling.algorithms.selectedAlgorithm() == 3;
                if (isPriority) {
                    // First find greater priority
                    var nextPrio = processedCollection.filter(function (i) {
                        return i.queueArrival() <= ko.utils.unwrapObservable(counters.processCounter) && i.priority() <= nextInQueue.priority();
                    })[0];

                    if (!nextPrio || (nextPrio.id() == nextInQueue.id())) {
                        // Look for nearest available priority job
                        nextPrio = processedCollection.filter(function (i) {
                            return i.queueArrival() <= ko.utils.unwrapObservable(counters.processCounter) && i.priority() > nextInQueue.priority();
                        }).sort(function (x, y) {
                            return x.priority - y.priority;
                        })[0];
                    }

                    if (nextPrio && (nextPrio.id() != nextInQueue.id())) {
                        nextPrio.nextToQueue(true);
                    }
                } else {
                    if (nonPrioCallback) {
                        nonPrioCallback();
                    }
                }
            }

            clearNextToQueue();
            if (processedCollection[collectionLength - 1] &&
                processedCollection[collectionLength - 1].queueArrival() <= ko.utils.unwrapObservable(counters.processCounter) &&
                !ko.utils.unwrapObservable(processedCollection[collectionLength - 1].inQueue)) {
                determineNextToQueue(function () {
                    processedCollection.filter(function (i) {
                        return !ko.utils.unwrapObservable(i.inQueue);
                    })[0].nextToQueue(true);
                });
            } else if (processedCollection[0] && !ko.utils.unwrapObservable(processedCollection[0].inQueue)) {
                determineNextToQueue(function () {
                    processedCollection[0].nextToQueue(true);
                })
            } else {
                determineNextToQueue();
            }
            self.evalStep();

            if (nextInQueue) {
                nextInQueue.isProcessing(false);
            }
        };
        this.simulate = function () {
            settings.onInit(settings);
            if (!settings.isSimulationRunning()) {
                settings.isSimulationRunning(true);
            }
            simulateInterval = setInterval(function () {
                if (main.jobs.jobCollection().filter(function (i) { return i.remainingBurst > 0 }).length !== 0) {
                    self.step();
                } else {
                    self.stopSimulation();
                    settings.isSimulationRunning(false);
                    //self.evalStep();
                }
            }, ko.utils.unwrapObservable(settings.simulationInterval));
        };
        this.evalStep = function () {
            if (main.jobs.jobCollection().filter(function (i) { return i.remainingBurst > 0 }).length === 0) {
                counters.hasFinished(true);
            }
            counters.processCounter(ko.utils.unwrapObservable(counters.processCounter) + 1);
            var waitingTimeTotal = 0,
                turnAroundAveTotal = 0,
                jobCollectionRef = ko.utils.unwrapObservable(main.jobs.jobCollection);

            jobCollectionRef = jobCollectionRef.filter(function (i) { return ko.utils.unwrapObservable(i.cpuBurst) !== 0; });
            for (i = 0; i < jobCollectionRef.length; i++) {
                var ref = jobCollectionRef[i],
                    currentCounter = ko.utils.unwrapObservable(counters.processCounter),
                    isProcessing = ko.utils.unwrapObservable(ref.isProcessing);

                if (ref.lastProcessed == 0 &&
                        (currentCounter >= ref.queueArrival()) && !isProcessing) {
                    ref.waitingTime(currentCounter - ref.queueArrival());
                }

                if (!isProcessing || ref.remainingBurst === 0) {
                    ref.inQueue(false);
                }

                if (ref.queueArrival() <= currentCounter &&
                        ref.remainingBurst > 0) {
                    ref.turnAroundTime(currentCounter - ref.queueArrival());
                } else if (ref.lastProcessed === currentCounter - 1 &&
                        ref.lastProcessed !== 0) {
                    ref.turnAroundTime(ref.turnAroundTime() + 1);
                }

                waitingTimeTotal += ko.utils.unwrapObservable(ref.waitingTime);
                turnAroundAveTotal += ko.utils.unwrapObservable(ref.turnAroundTime);
            }

            counters.waitingTimeCounter(waitingTimeTotal / jobCollectionRef.length);
            counters.turnAroundCounter(turnAroundAveTotal / jobCollectionRef.length);

        };
        this.stopSimulation = function () {
            window.clearInterval(simulateInterval);
        };
    }

    function invokeStep() {
        var currentAlgorithm = algorithmCollection().filter(function (x) {
            return x.id === ko.utils.unwrapObservable(selectedAlgorithm);
        })[0];
        currentAlgorithm.functions.step();
    }

    function simulate() {
        var currentAlgorithm = algorithmCollection().filter(function (x) {
            return x.id === ko.utils.unwrapObservable(selectedAlgorithm);
        })[0];
        currentAlgorithm.functions.simulate();
    }

    function resetSimulation() {
        pauseSimulation();
        var jobCollectionRef = ko.utils.unwrapObservable(main.jobs.jobCollection);
        for (i = 0; i < jobCollectionRef.length; i++) {
            jobCollectionRef[i].remainingBurst = jobCollectionRef[i].cpuBurst();
            jobCollectionRef[i].lastProcessed = 0;
            jobCollectionRef[i].startTime = 0;
            jobCollectionRef[i].waitingTime(0);
            jobCollectionRef[i].turnAroundTime(0);
            jobCollectionRef[i].nextToQueue(false);
            jobCollectionRef[i].inQueue(false);
        }
        main.jobs.processedCollection([]);
        settings.hasStarted(false);
        counters.hasFinished(false);
        counters.processCounter(0);
        counters.waitingTimeCounter(0);
        counters.turnAroundCounter(0);
    }

    function pauseSimulation() {
        var currentAlgorithm = algorithmCollection().filter(function (x) {
            return x.id === ko.utils.unwrapObservable(selectedAlgorithm);
        })[0];
        currentAlgorithm.functions.stopSimulation();
        settings.isSimulationRunning(false);
    }

    main.algorithms = {
        add: add,
        collection: algorithmCollection,
        counters: counters,
        invokeStep: invokeStep,
        processCounter: counters.processCounter,
        resetSimulation: resetSimulation,
        settings: settings,
        simulate: simulate,
        pauseSimulation: pauseSimulation,
        selectedAlgorithm: selectedAlgorithm,
        waitingTimeCounter: counters.waitingTimeCounter,
        turnAroundCounter: counters.turnAroundCounter
    }
})(processScheduling);