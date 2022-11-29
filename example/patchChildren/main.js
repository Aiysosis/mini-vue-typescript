// vue app
import { App } from "./App.js";
import { createApp } from "../../lib/aiyso-vue.esm.js";

let rootContainer = document.getElementById("#app");
createApp(App).mount(rootContainer);
