# WebRTC Introduction

## 1. just play by youself

```
yarn dev
```

https://localhost:8080/

follow the numbers

0. start stream(s)
1. 👈 create offer
2. 👈 setLocalDescription, sendOffer
3. 👉 setRemoteDescription, createAnswer
4. 👉 setLocalDescription, sendAnswer

## 2. play over remote

```
yarn dev
yarn signaling
```

open 👈
https://localhost:8080/?manual=false&remote=true&role=send&stream=both

open 👉
https://localhost:8080/?manual=false&remote=true&role=recv&stream=both

`?remote=true` = use signaling server
`?role=send` = show only 👈
`?role=recv` = show only 👉

## Config

You can configure evreything via queryString as described aboth or open the `Config` panel at the top, but all it does is set the queryStrings.


 feature   | possible values           | description
 --------- | ------------------------- | -----------
`remote`   | `true` , `false`          | use signaling server over webSocket
`role`     | `send` , `recv` , `both`  | show 👈, 👉  or 👈 👉
`manual`   | `true` , `false`          | allow modifying the SDPs
`semantic` | `plan-b` , `unified-plan` | configure peerconnection