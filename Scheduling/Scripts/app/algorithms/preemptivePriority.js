(function (main) {
    var name = "Preemptive Priority"

    function prio() {
        var sorted = this.sort(function (x, y) {
            var arrive1 = Math.abs(x.queueArrival() - ko.utils.unwrapObservable(main.algorithms.counters.processCounter)),
                arrive2 = Math.abs(y.queueArrival() - ko.utils.unwrapObservable(main.algorithms.counters.processCounter));
            if (x.priority() != y.priority()) {
                return x.priority() >= y.priority() && arrive1 >= arrive2;
            } else {
                return x.queueArrival() >= y.queueArrival();
            }
        });
        console.dir(sorted.filter(function (i) { return i.lastProcessed > 0 }));
        var inQueue = sorted.filter(function (i) { return i.lastProcessed > 0 })[0];

        return {
            //nextJob: inQueue ? inQueue : sorted[0],
            nextJob: sorted[0],
            processedCollection: sorted
        };
    }

    main.algorithms.add(name, prio);
})(processScheduling);