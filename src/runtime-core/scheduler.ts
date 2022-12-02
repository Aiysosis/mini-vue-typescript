const queue: Function[] = [];
let isFlushPending = false;

export function nextTick(fn?: (value: void) => void) {
	return fn ? Promise.resolve().then(fn) : Promise.resolve();
}

export function queueJobs(job: Function) {
	if (!queue.includes(job)) {
		queue.push(job);
	}

	queueFlush();
}
function queueFlush() {
	//只收集一次
	if (isFlushPending) return;
	isFlushPending = true;
	Promise.resolve().then(() => {
		isFlushPending = false;
		let job: Function;
		while ((job = queue.shift())) {
			job && job();
		}
	});
}
