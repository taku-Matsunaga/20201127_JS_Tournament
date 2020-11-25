const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const remoteVideos = document.getElementById('js-remote-streams');
  const roomId = document.getElementById('js-room-id');
  const roomMode = document.getElementById('js-room-mode');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const getRoomModeByHash = () => (location.hash === '#sfu' ? 'sfu' : 'mesh');

  roomMode.textContent = getRoomModeByHash();
  window.addEventListener(
    'hashchange',
    () => (roomMode.textContent = getRoomModeByHash())
  );

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

    // 自分をミュートにする
    // トラックを取り出す
    var videoTrackMe = localStream.getVideoTracks()[0];
    var audioTrackMe = localStream.getAudioTracks()[0];

    document.getElementById('mymuteBtn').addEventListener('click', muteOn);
    document.getElementById('myunmuteBtn').addEventListener('click', muteOff);

    function muteOn(){
      // muteする
      videoTrackMe.enabled = false;
      audioTrackMe.enabled = false;
      console.log('クリックしました');
    }

    function muteOff(){
      // unmuteする
      videoTrackMe.enabled = true
      audioTrackMe.enabled = true
      console.log('クリックしました');
    }

  // eslint-disable-next-line require-atomic-updates
  const peer = (window.peer = new Peer({


    // ここにAPI keyを入れてね★
    key: '1a50df5c-005b-4e50-be24-40dfabe6415c',
    debug: 3,
  }));

  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const room = peer.joinRoom(roomId.value, {
      mode: getRoomModeByHash(),
      stream: localStream,
    });

    room.once('open', () => {
      messages.textContent += '=== You joined ===\n';
    });
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined ===\n`;
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      const newVideo = document.createElement('video');
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      // mark peerId to find it later at peerLeave event
      newVideo.setAttribute('data-peer-id', stream.peerId);
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);

    // 相手をミュートにする
    // トラックを取り出す
    var videoTrack = stream.getVideoTracks()[0];
    var audioTrack = stream.getAudioTracks()[0];

    document.getElementById('muteBtn').addEventListener('click', muteOn)
    document.getElementById('unmuteBtn').addEventListener('click', muteOff)

    function muteOn(){
      // muteする
      videoTrack.enabled = false;
      audioTrack.enabled = false;
      console.log('クリックしました');
    }

    function muteOff(){
      // unmuteする
      videoTrack.enabled = true
      audioTrack.enabled = true
      console.log('クリックしました');
    }

    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
      messages.textContent += `${src}: ${data}\n`;
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left ===\n';
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    // sendTrigger.addEventListener('click', onClickSend);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    function onClickSend() {
      // Send message to all of the peers in the room via websocket
      room.send(localText.value);

      messages.textContent += `${peer.id}: ${localText.value}\n`;
      localText.value = '';


    }

    const anime = document.getElementById('anime');
    let animetext = 0;

    const animebtn = document.getElementById('animebtn');
    animebtn.addEventListener('click', animetion);
    function animetion() {
      animetext++;
      room.send(animetext);
    };

    function anime1() {
      anime.textContent += `${animetext}\n`;
      anime.style.backgroundColor = '#00ffff';
    };


    if (messages.textContent == 1) {
      anime.textContent += `${animetext}\n`;
      anime.style.backgroundColor = '#00ffff';
    };



  });

  peer.on('error', console.error);
})();