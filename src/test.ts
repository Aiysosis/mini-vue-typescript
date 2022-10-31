let map = new Map<string, number>();
map.set("a", 1);
map.set("b", 2);
map.set("c", 3);

let obj = {
	foo: 1,
	bar: 2,
};

for (let val of map.values()) {
	console.log(val);
}

for (let key in obj) {
	console.log(key);
}
