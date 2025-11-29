const WebSocket = require('ws');

const URL = 'ws://localhost:8080';

function makeClient(name) {
  const ws = new WebSocket(URL);
  ws.on('open', () => {
    console.log(`${name}: open`);
    ws.send(JSON.stringify({op:'LOGIN', user:name}) + '\n');
  });
  ws.on('message', (data) => {
    console.log(`${name} <-- ${data.toString()}`);
  });
  ws.on('close', () => console.log(`${name}: close`));
  ws.on('error', (e) => console.log(`${name}: error`, e.message));
  return ws;
}

(async ()=>{
  const a = makeClient('A');
  // wait for connect
  await new Promise(r => setTimeout(r, 300));
  a.send(JSON.stringify({op:'CREATE_ROOM', room_id:'T1'}) + '\n');

  const b = makeClient('B');
  await new Promise(r => setTimeout(r, 300));
  b.send(JSON.stringify({op:'JOIN_ROOM', room_id:'T1'}) + '\n');

  await new Promise(r => setTimeout(r, 300));
  console.log('A placing line H 0,0');
  a.send(JSON.stringify({op:'PLACE_LINE', x:0, y:0, orientation:'H'}) + '\n');

  await new Promise(r => setTimeout(r, 1000));
  process.exit(0);
})();
