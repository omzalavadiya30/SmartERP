const { EventEmitter } = require("node:events");
const events = new EventEmitter();
events.setMaxListeners(0);
function publish(id) {
  events.emit(id);
}
function subscribe(id, res) {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write(": connected\n\n");
  const update = () => res.write("data: refresh\n\n");
  events.on(id, update);
  // Periodic reconnect rechecks company membership and catches writes on other instances.
  const timer = setTimeout(() => res.end(), 30000);
  res.on("close", () => {
    clearTimeout(timer);
    events.off(id, update);
  });
}
module.exports = { publish, subscribe };
