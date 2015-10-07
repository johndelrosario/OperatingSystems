(function (main) {
    var name = "First Come, First Serve"

    function fcfs() {
        var queue = this.sort(function (x, y) {
            if (x.queueArrival() == y.queueArrival()) {
                return (x.cpuBurst() >= y.cpuBurst());
            }
            return x.queueArrival() >= y.queueArrival();
        });

        var sortedByArrival = this.filter(function (i) {
            return i.queueArrival() <= ko.utils.unwrapObservable(main.algorithms.counters.processCounter);
        });

        return {
            nextJob: queue[0],
            processedCollection: sortedByArrival
        };
    }

    main.algorithms.add(name, fcfs);
})(processScheduling);