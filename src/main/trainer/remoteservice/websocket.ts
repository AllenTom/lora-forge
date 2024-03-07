import WebSocket from 'ws';
export type Message<T> = {
  type: string,
  message: string
  event: string
  id: string
  vars: T
}
export const websocketCallbacks: Array<((data: Message<any>) => void)> = [];
export const appendWsCallback = (callback: (data: Message<any>) => void) => {
  websocketCallbacks.push(callback);
};
export const removeWsCallback = (callback: (data: Message<any>) => void) => {
  websocketCallbacks.splice(websocketCallbacks.indexOf(callback), 1);
}
const ws = new WebSocket('ws://localhost:8000/ws');

ws.on('error', console.error);

ws.on('open', function open() {

});

ws.on('message', function message(data) {
  try {
    const parsed:Message<any> = JSON.parse(data.toString());
    websocketCallbacks.forEach(callback => callback(parsed));
  } catch (e) {
    console.log(e);
  }
});

