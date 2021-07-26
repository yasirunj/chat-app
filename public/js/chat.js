const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $pushToTalkButton = document.querySelector('#ptt-btn')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// Status
let talking = false

socket.on('message', (message) => {
    console.log(message)

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    }) 
    $messages.insertAdjacentHTML('beforeend', html)
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disables', 'disabled')

    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (message) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        console.log('The message was delivered!', message)
    })
})

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by the browser!')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location Shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

$pushToTalkButton.addEventListener('mousedown', (e) => {
    e.preventDefault()

    talking = true

    console.log('Talking...')

    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {

        var madiaRecorder = new MediaRecorder(stream);
        madiaRecorder.start();
    
        var audioChunks = [];
    
        madiaRecorder.addEventListener("dataavailable", function (event) {
          audioChunks.push(event.data);
        });
    
        madiaRecorder.addEventListener("stop", function () {
          var audioBlob = new Blob(audioChunks);
    
          audioChunks = [];
    
          var fileReader = new FileReader();
          fileReader.readAsDataURL(audioBlob);
          fileReader.onloadend = function () {
            //if (!userStatus.microphone || !userStatus.online) return;
            if (!talking) return;
    
            var base64String = fileReader.result;
            socket.emit("voice", base64String);
    
          };
    
          madiaRecorder.start();
    
    
          setTimeout(function () {
            madiaRecorder.stop();
          }, 1000);
        });
    
        setTimeout(function () {
          madiaRecorder.stop();
        }, 1000);
    });

})

$pushToTalkButton.addEventListener('mouseup', (e) => {
    e.preventDefault()

    talking = false

    console.log('Stopped!')
})

socket.on("send", function (data) {
    var audio = new Audio(data);
    audio.play();
});