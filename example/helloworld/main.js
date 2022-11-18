export { renderer } from "../../runtime-core/renderer";

console.log("test");
renderer({ type: "hello world" }, document.getElementById("#app"));
