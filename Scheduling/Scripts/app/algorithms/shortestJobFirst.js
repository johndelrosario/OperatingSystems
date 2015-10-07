(function (main) {
    var name = "Shortest Job First"

    function sjf() {
        var sortedByArrival = this.filter(function (i) {
            return i.queueArrival() <= ko.utils.unwrapObservable(main.algorithms.counters.processCounter)
        });
        var inQueue = sortedByArrival.filter(function (i) { return i.lastProcessed > 0 })[0]

        sortedByArrival.sort(function (x, y) {
            if (x.cpuBurst() == y.cpuBurst()) {
                return x.queueArrival() >= y.queueArrival();
            }
            return x.cpuBurst() >= y.cpuBurst()
        });

        return {
            nextJob: inQueue ? inQueue : sortedByArrival[0],
            processedCollection: sortedByArrival
        };
    }

    main.algorithms.add(name, sjf);
})(processScheduling);