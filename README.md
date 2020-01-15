# WS-MPEG-VIDEO-RELAY

Inspired by [JSMpeg's](https://github.com/phoboslab/jsmpeg/) websocket-relay.js	.

This one is an improved but internal version, secret key is removed, multiple stream can be served.

Please don't use it without firewall or nginx as reverse proxy. 

## Usage

### Start Relay

```
node relay.js [HTTP STREAM PORT] [WEBSOCKET PORT]
```


### Streaming from RTSP
```

URI=rtsp://192.168.0.2/s0
STREAM_NAME=stream1
STREAM_SERVER=http://192.168.0.3:8081

ffmpeg -fflags nobuffer  -rtsp_transport tcp  -i $URI  -vsync 0  -f mpegts  -codec:v mpeg1video  -b:v 1000k -bf 0  $STREAM_SERVER/$STREAM_NAME
```

### View

```
git clone https://github.com/phoboslab/jsmpeg.git
# deploy to http server

```

Edit view-stream.html and change url to `http://192.168.0.3:8082/stream1` and view in browser.


	